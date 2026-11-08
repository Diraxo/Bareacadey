/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Chapter = require('../models/Chapter')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
const { requireChapterAccess, requireParentCourseAccess, canManageCourse, visibleChapterWhere } = require("../services/courseAccess")
let Roles = require("../roles")

const fs = require('fs');
const {uploadFiles, deleteFile, storeMediaFile} = require("../middlewares/commonFileUploader")
const { UploadError, KINDS } = require("../middlewares/safeUpload")
const config = require("../config")

const Payment = require('../models/Payment')
const { coursesAreFree } = require('../services/freeCourses')
const Course = require('../models/Course')

/* ---------- one-file-at-a-time unit uploads ----------
 * A unit with dozens of videos cannot travel in a single request on shared hosting, so the web app creates the unit
 * and then sends each file as its own request. `upload_key` (made by the browser, kept on retries) makes a retry
 * idempotent: a file that was already saved is reported as saved instead of being stored twice. */
const UPLOAD_KEY = /^[A-Za-z0-9_-]{8,64}$/
const { withChapter, parseFiles } = require('../services/chapterFiles')
const removeTemp = (file) => { if (file?.tempFilePath) fs.unlink(file.tempFilePath, () => {}) }


/* persistent upload batches (must be registered before the '/:id' routes) */
route.use(require('./ChapterUploadBatches'))

route.get(['/', '/parent/:id'], verifyRoles(Roles?.chapter_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    if(id) {
      where.course_parent_id = id;
    }
    await Chapter.findAll({
      where: { [Sequelize.Op.and]: [where, await visibleChapterWhere(req.user)] },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByChapter",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByChapter",
        },
        {
          model: Course,
          attributes: [
            "id",
            "title",
          ],
        },
      ],
    }).then(async (chaptersList) => {
      let updatedChapters = []
      let recordUsersPP = {}
      await Promise.all(
        chaptersList.map(async (chapter) => {
          const recordAddedByLabel = "user"+chapter?.AddedByChapter?.upload_id
          const recordUpdatedByLabel = "user"+chapter?.UpdatedByChapter?.upload_id
          
          const upload_added_by = chapter?.AddedByChapter?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: chapter?.AddedByChapter?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = chapter?.UpdatedByChapter?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: chapter?.UpdatedByChapter?.upload_id },
            attributes: ["filepath"],
          }))
          
          if(!recordUsersPP[recordAddedByLabel]) {
            recordUsersPP[recordAddedByLabel] = upload_added_by
          }
          
          if(!recordUsersPP[recordUpdatedByLabel]) {
            recordUsersPP[recordUpdatedByLabel] = upload_updated_by
          }
          
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedChapters.push({
            ...chapter.toJSON(),
            added_user_name: chapter?.AddedByChapter?.full_name,
            updated_user_name: chapter?.UpdatedByChapter?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            chapter_files: chapter?.chapter_files ? JSON.parse(chapter?.chapter_files)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            course_parent_id_target: chapter?.Course ? chapter?.Course?.title : "-",
            AddedByChapter: {
              name: chapter?.AddedByChapter?.full_name,
              url: fullUrlAddedBy,
              id: chapter?.AddedByChapter?.id
            },
            UpdatedByChapter: {
              name: chapter?.UpdatedByChapter?.full_name,
              url: fullUrlUpdatedBy,
              id: chapter?.UpdatedByChapter?.id
            },
          });
        })
      );
      res.json(updatedChapters.sort((a, b) => a.id - b.id));
    });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       res.send({ error: true, message: e?.message });
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.post("/:id/files", verifyRoles(Roles?.chapter_saveRoles), requireChapterAccess((req) => req.params?.id), async (req, res) => {
  const file = Array.isArray(req.files?.chapter_file) ? req.files.chapter_file[0] : req.files?.chapter_file
  let stored = null
  try {
    const key = String(req.body?.upload_key || '')
    if (!UPLOAD_KEY.test(key)) return res.status(400).json({ error: true, message: 'Missing or invalid upload key' })
    if (!file) return res.status(400).json({ error: true, message: 'No file was uploaded' })
    const id = String(req.params.id)
    // a retry whose first answer was lost: answered from the list, nothing is stored
    const current = await Chapter.findOne({ where: { id }, attributes: ['id', 'chapter_files'] })
    if (!current) return res.status(404).json({ error: true, message: 'Unit not found' })
    const before = parseFiles(current.chapter_files)
    const known = before.find((item) => item?.upload_key === key)
    if (known) return res.json({ message: 'Already saved', duplicate: true, file: known, total: before.length })
    if (before.length >= config.upload.maxFilesPerUnit) {
      return res.status(409).json({ error: true, message: `This unit already holds the maximum of ${config.upload.maxFilesPerUnit} files` })
    }
    // the file is moved first (slow, outside the lock); only the list change happens under the chapter lock
    const entry = { ...(await storeMediaFile(file, before.length)), upload_key: key }
    stored = entry.filepath
    const outcome = await withChapter(id, async ({ chapter, files, transaction }) => {
      if (!chapter) return { gone: true }
      const again = files.find((item) => item?.upload_key === key)
      if (again) return { duplicate: again, total: files.length }
      if (files.length >= config.upload.maxFilesPerUnit) return { full: true }
      chapter.chapter_files = JSON.stringify([...files, entry])
      chapter.updated_by = req.user.id
      await chapter.save({ transaction })
      return { total: files.length + 1 }
    })
    if (outcome.gone) { await deleteFile(stored); stored = null; return res.status(404).json({ error: true, message: 'Unit not found' }) }
    if (outcome.full) { await deleteFile(stored); stored = null; return res.status(409).json({ error: true, message: `This unit already holds the maximum of ${config.upload.maxFilesPerUnit} files` }) }
    if (outcome.duplicate) { await deleteFile(stored); stored = null; return res.json({ message: 'Already saved', duplicate: true, file: outcome.duplicate, total: outcome.total }) }
    stored = null
    return res.json({ message: 'Uploaded', file: entry, total: outcome.total })
  } catch (e) {
    if (stored) await deleteFile(stored) // do not leave a file that no unit refers to
    if (e instanceof UploadError) return res.status(e.status || 400).json({ error: true, message: e.message })
    console.error('chapter file upload failed:', e?.message)
    return res.status(500).json({ error: true, message: 'The server could not save this file. Try again.' })
  } finally {
    removeTemp(file) // express-fileupload leaves the temp copy behind when the file was rejected
  }
});

/* Removing a file from a unit is its own deliberate operation. The chapter edit form never removes files by leaving
 * them out of what it sends (see PUT "/"), because a form opened earlier cannot know about files added since. */
route.delete("/:id/files", verifyRoles(Roles?.chapter_saveRoles), requireChapterAccess((req) => req.params?.id), async (req, res) => {
  try {
    const filepath = typeof req.body?.filepath === 'string' ? req.body.filepath : ''
    if (!filepath) return res.status(400).json({ error: true, message: 'filepath is required' })
    const outcome = await withChapter(req.params.id, async ({ chapter, files, transaction }) => {
      if (!chapter) return { gone: true }
      const target = files.find((item) => item?.filepath === filepath) // must belong to THIS unit's list
      if (!target) return { missing: true }
      chapter.chapter_files = JSON.stringify(files.filter((item) => item !== target))
      chapter.updated_by = req.user.id
      await chapter.save({ transaction })
      return { removed: target }
    })
    if (outcome.gone) return res.status(404).json({ error: true, message: 'Unit not found' })
    if (outcome.missing) return res.status(404).json({ error: true, message: 'That file is not part of this unit' })
    await deleteFile(outcome.removed.filepath) // after the list no longer refers to it
    return res.json({ message: 'File removed' })
  } catch (e) {
    console.error('chapter file removal failed:', e?.message)
    return res.status(500).json({ error: true, message: 'Something went wrong' })
  }
});

route.get("/:id", verifyRoles(Roles?.chapter_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await Chapter.findOne({
      where: { [Sequelize.Op.and]: [{ id: id }, await visibleChapterWhere(req.user)] },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByChapter",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByChapter",
        },
        {
          model: Course,
          attributes: [
            "id",
            "title",
          ],
        },
      ],
    }).then(async (chapter) => {
          if(!chapter) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = chapter?.AddedByChapter?.upload_id && await UserUpload.findOne({
            where: { id: chapter?.AddedByChapter?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = chapter?.UpdatedByChapter?.upload_id && await UserUpload.findOne({
            where: { id: chapter?.UpdatedByChapter?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      
      let updatedChapter = {
        ...chapter.toJSON(),
            added_user_name: chapter?.AddedByChapter?.full_name,
            updated_user_name: chapter?.UpdatedByChapter?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            localStorage: req.protocol + "://" + req.get("host"),
            course_parent_id_target: chapter?.Course?.title??"",
            routeState_reason: chapter?.routeState_reason ? JSON.parse(chapter?.routeState_reason) : {},
            AddedByChapter: {
              name: chapter?.AddedByChapter?.full_name,
              url: fullUrlAddedBy,
              id: chapter?.AddedByChapter?.id
            },
            UpdatedByChapter: {
              name: chapter?.UpdatedByChapter?.full_name,
              url: fullUrlUpdatedBy,
              id: chapter?.UpdatedByChapter?.id
            },
      };
      res.json(updatedChapter);
    });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       res.send({ error: true, message: e?.message });
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.post("/", verifyRoles(Roles?.chapter_createRoles), requireParentCourseAccess, async (req, res) => {
  try {
    const {
      _title,
      _description,
      _price,
      _free_first_n_chapters,
      _course_parent_id,
    } = req.body;

    await uploadFiles('chapter_files', req, res)

    const chapter = await Chapter.create({
      title: _title,
      description: _description,
      price: coursesAreFree() ? 0 : _price,
      free_first_n_chapters: _free_first_n_chapters,
      chapter_files: JSON.stringify((req['chapter_files']??[])),
      course_parent_id: _course_parent_id,
      added_by: req.user.id,
      updated_by: req.user.id,
    })
    return res.json({ message: "Successfully Created", id: chapter.id });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       if(e?.message?.startsWith("Incorrect integer value:")) {
         return res.json({ error: true, message: "Select all fields first!" })
       } else {
         res.send({ error: true, message: e?.message });
       }
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

const readList = (raw) => { try { const v = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(v) ? v : [] } catch (e) { return [] } }

route.put("/", verifyRoles(Roles?.chapter_saveRoles), requireChapterAccess((req) => req.body?.id), async (req, res) => {
  let newlyStored = []
  try {
    const {
      id,
      _title,
      _description,
      _price,
      _free_first_n_chapters,
      _chapter_files,
      _removed_files,
      _course_parent_id,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    // new files are stored first (slow); the list itself is changed under the database lock the batch uploads use, so
    // an edit never overwrites a file list that is being appended to, in this or any other process
    await uploadFiles('chapter_files', req, res)
    newlyStored = (req['chapter_files'] ?? []).map((item) => item?.filepath)
    const removeRequested = new Set(readList(_removed_files).filter((p) => typeof p === 'string'))
    const outcome = await withChapter(id, async ({ chapter, files, transaction }) => {
      if(!chapter) return { gone: true }
      if(_title != null) chapter.title = _title;
      if(_description != null) chapter.description = _description;
      if(!coursesAreFree() && _price != null) chapter.price = _price;
      if(_free_first_n_chapters != null) chapter.free_first_n_chapters = _free_first_n_chapters;
      if(_course_parent_id) {
        // moving a chapter into another course needs access to that course as well
        if (String(_course_parent_id) !== String(chapter.course_parent_id) && !(await canManageCourse(req.user, _course_parent_id))) {
          return { denied: true }
        }
        chapter.course_parent_id = _course_parent_id;
      }
      let removed = []
      let keptOutOfForm = 0
      if (_chapter_files != null || removeRequested.size || req['chapter_files']?.length) {
        // The stored list is authoritative. The form's copy is a snapshot taken when it was opened: it can say how the
        // person ordered the files they saw, but never that a file is gone. Only files named in _removed_files are removed.
        removed = files.filter((item) => removeRequested.has(item?.filepath))
        const submitted = readList(_chapter_files).map((item) => item?.filepath)
        const rank = (item) => { const i = submitted.indexOf(item?.filepath); return i < 0 ? Number.MAX_SAFE_INTEGER : i }
        const remaining = files.filter((item) => !removeRequested.has(item?.filepath))
          .map((item, position) => ({ item, position }))
          .sort((a, b) => rank(a.item) - rank(b.item) || a.position - b.position)
          .map((x) => x.item)
        if (_chapter_files != null) keptOutOfForm = remaining.filter((item) => !submitted.includes(item?.filepath)).length
        chapter.chapter_files = JSON.stringify([...remaining, ...(req['chapter_files'] ?? [])]);
      }
      chapter.updated_by = req.user.id;
      await chapter.save({ transaction });
      return { removed, keptOutOfForm }
    })
    if (outcome.gone) { for (const p of newlyStored) await deleteFile(p); return res.json({error: true, message: 'You are not authorized!'}) }
    if (outcome.denied) { for (const p of newlyStored) await deleteFile(p); return res.status(401).json({ error: true, message: 'You are not assigned to this course' }) }
    newlyStored = []
    for (const item of outcome.removed) await deleteFile(item?.filepath) // after the list no longer refers to them
    return res.json({ message: "Successfully Updated", ...(outcome.keptOutOfForm ? { kept_files: outcome.keptOutOfForm } : {}) });
   } catch (e) {
     for (const p of newlyStored) await deleteFile(p) // stored but never listed
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       if(e?.message?.startsWith("Incorrect integer value:")) {
         return res.json({ error: true, message: "Select all fields first!" })
       } else {
         res.send({ error: true, message: e?.message });
       }
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.delete("/", verifyRoles(Roles?.chapter_destroyRoles), requireChapterAccess((req) => req.body?.id), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const chapter = await Chapter.findOne({
      where: { id: id },
    })
    if(!chapter) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    // const payments_title_72 = await Payment.count({ where: {chapter_id: id } });
    // if(payments_title_72 > 0) {
    //   return res.json({error: true, message: `Delete payments related to this chapter first!`})
    // }

    const chapter_files = chapter?.chapter_files ? JSON.parse(chapter?.chapter_files) : [];
    chapter_files?.map((item)=>{
      deleteFile(item?.filepath)
    })
    
    Chapter.destroy({where: {id: id } });
    return res.json({ message: "Successfully Deleted" });
  } catch (e) {
    if(e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if(e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({error: true, message: "Something went wrong"})
    }
  }
});

route.put("/routeState", verifyRoles(Roles?.chapter_saveRoles), requireChapterAccess((req) => req.body?.id), async (req, res) => {
  try {
    const {
      id,
      routeState,
      note
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const chapter = await Chapter.findOne({
      where: { id: id },
    })
    if(!chapter) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(chapter) {
      
      if(routeState != null) {
        chapter.routeState = routeState;
      }
      if(note != null) {
        let notes = (chapter?.routeState_reason != null) ? JSON.parse(chapter.routeState_reason) : "{}"
        let notesNew = (typeof notes == "string") ? JSON.parse(notes) : notes
        const user = await User.findOne({where: {id: req?.user?.id}})
        notesNew[routeState] = {note: note, date: new Date(), id: req?.user?.id, fullName: user?.full_name}
        chapter.routeState_reason = JSON.stringify(notesNew)
      }
      
      chapter.updated_by = req.user.id;
      await chapter.save();
    }
    return res.json({ message: "Successfully Updated" });
  } catch (e) {
     return res.json({error: true, message: "Something went wrong"})
   }
});

module.exports = route