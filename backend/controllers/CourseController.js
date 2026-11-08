/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Course = require('../models/Course')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
const { requireCourseAccess, canManageAll, visibleCourseWhere } = require("../services/courseAccess")
const CourseInstructor = require("../models/CourseInstructor")
let Roles = require("../roles")

const {uploadFiles, deleteFile} = require("../middlewares/commonFileUploader")

const UserRating = require('../models/UserRating')
const Payment = require('../models/Payment')
const { coursesAreFree, FREE_FIELDS } = require('../services/freeCourses')
const Trending = require('../models/Trending')
const Category = require('../models/Category')
const Chapter = require('../models/Chapter')
const throwException = require('../middlewares/ThrowException.js')

const fs = require('fs');
const path = require('path');

const axios = require('axios');

const { Worker } = require('worker_threads');


route.get(['/', '/parent/:id'], verifyRoles(Roles?.course_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    const where = await visibleCourseWhere(req.user)
    await Course.findAll({
      where: where,
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByCourse",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByCourse",
        },
        {
          model: Category,
          attributes: [
            "name",
          ],
        },
      ],
    }).then(async (coursesList) => {
      let updatedCourses = []
      let recordUsersPP = {}

      await Promise.all(
        coursesList.map(async (course) => {
          const recordAddedByLabel = "user"+course?.AddedByCourse?.upload_id
          const recordUpdatedByLabel = "user"+course?.UpdatedByCourse?.upload_id
          const userRatings = await UserRating.findAll({
            where: {
              course_id: course?.id,
            }
          })
          const rating = (userRatings?.reduce((sum, current) => sum += current?.rating, 0) / userRatings?.length).toFixed(0);
          const upload_added_by = course?.AddedByCourse?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: course?.AddedByCourse?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = course?.UpdatedByCourse?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: course?.UpdatedByCourse?.upload_id },
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

          updatedCourses.push({
            ...course.toJSON(),
            added_user_name: course?.AddedByCourse?.full_name,
            updated_user_name: course?.UpdatedByCourse?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            thumbnail: course?.thumbnail ? JSON.parse(course?.thumbnail)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            introduction_video: course?.introduction_video ? JSON.parse(course?.introduction_video)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            pdf_files: course?.pdf_files ? JSON.parse(course?.pdf_files)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            name_target_5: course?.Category ? course?.Category?.name : "-",
            userRatings: userRatings,
            rating: rating,
            
            
            AddedByCourse: {
              name: course?.AddedByCourse?.full_name,
              url: fullUrlAddedBy,
              id: course?.AddedByCourse?.id
            },
            UpdatedByCourse: {
              name: course?.UpdatedByCourse?.full_name,
              url: fullUrlUpdatedBy,
              id: course?.UpdatedByCourse?.id
            },
          });
        })
      );
      res.json(updatedCourses.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.course_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    const chaptersCount = await Chapter.count({
      where: {
        course_parent_id: id
      }
    })
    
    await Course.findOne({
      where: { [Sequelize.Op.and]: [{ id: id }, await visibleCourseWhere(req.user)] },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByCourse",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByCourse",
        },
        {
          model: Category,
          attributes: [
            "name",
          ],
        },
      ],
    }).then(async (course) => {
          if(!course) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = course?.AddedByCourse?.upload_id && await UserUpload.findOne({
            where: { id: course?.AddedByCourse?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = course?.UpdatedByCourse?.upload_id && await UserUpload.findOne({
            where: { id: course?.UpdatedByCourse?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;

            const chapters = await Chapter.findAll({where: {
              course_parent_id: course?.id,
              routeState: "published"
            }})
      let updatedCourse = {
        ...course.toJSON(),
            added_user_name: course?.AddedByCourse?.full_name,
            updated_user_name: course?.UpdatedByCourse?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            localStorage: req.protocol + "://" + req.get("host"),
            name_target_5: course?.Category?.name??"",
            chaptersCount: chaptersCount,
            chapters: chapters?.map((chapter)=>{
              let updatedChapter = {
                ...chapter.toJSON(),
                    localStorage: req.protocol + "://" + req.get("host"),
                    chapter_files: chapter?.chapter_files ? JSON.parse(chapter?.chapter_files)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
              };
              return updatedChapter;
            }),
            // thumbnail: course?.thumbnail ? JSON.parse(course?.thumbnail)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            // introduction_video: course?.introduction_video ? JSON.parse(course?.introduction_video)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            routeState_reason: course?.routeState_reason ? JSON.parse(course?.routeState_reason) : {},
            AddedByCourse: {
              name: course?.AddedByCourse?.full_name,
              url: fullUrlAddedBy,
              id: course?.AddedByCourse?.id
            },
            UpdatedByCourse: {
              name: course?.UpdatedByCourse?.full_name,
              url: fullUrlUpdatedBy,
              id: course?.UpdatedByCourse?.id
            },
      };
      res.json(updatedCourse);
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

route.post("/", verifyRoles(Roles?.course_createRoles), async (req, res) => {
  try {
    const {
      _enable_discount,
      _discounted_price,
      _discount_percentage,
      _discount_start_date,
      _title,
      _description,
      _main_price,
      _tags,
      _discount_end_date,
      _category_id,
      _type,
    } = req.body;

    await uploadFiles('thumbnail', req, res)
    await uploadFiles('introduction_video', req, res)
    await uploadFiles('pdf_files', req, res)
    const course = await Course.create({
      ...(coursesAreFree() ? FREE_FIELDS : {
        enable_discount: _enable_discount,
        discounted_price: _discounted_price,
        discount_percentage: _discount_percentage,
        discount_start_date: _discount_start_date || null,
        main_price: _main_price,
        discount_end_date: _discount_end_date || null,
      }),
      title: _title,
      description: _description,
      tags: _tags,
      thumbnail: JSON.stringify((req['thumbnail']??[])),
      introduction_video: JSON.stringify((req['introduction_video']??[])),
      category_id: _category_id ? _category_id : null,
      type: _type,
      pdf_files: JSON.stringify((req['pdf_files']??[])),
      added_by: req.user.id,
      updated_by: req.user.id,
    })

    // the creator keeps managing what they created, even if they hold no other assignment
    await CourseInstructor.findOrCreate({ where: { course_id: course.id, user_id: req.user.id }, defaults: { assigned_by: req.user.id } })

    return res.json({ message: "Successfully Created" });
   } catch (e) {
     const delFiles = ["thumbnail","introduction_video","pdf_files"]
     throwException(e, req, res, delFiles); return;
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

route.put("/", verifyRoles(Roles?.course_saveRoles), requireCourseAccess((req) => req.body?.id), async (req, res) => {
  try {
    const {
      id,
      _enable_discount,
      _discounted_price,
      _discount_percentage,
      _discount_start_date,
      _title,
      _description,
      _main_price,
      _thumbnail,
      _introduction_video,
      _tags,
      _discount_end_date,
      _category_id,
      _type,
      _pdf_files,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const course = await Course.findOne({
      where: { id: id },
    })
    if(!course) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(course) {
      await uploadFiles('thumbnail', req, res)
      await uploadFiles('introduction_video', req, res)
      await uploadFiles('pdf_files', req, res)
      
      if(!coursesAreFree() && _enable_discount != null) {
        course.enable_discount = _enable_discount;
      }
      if(!coursesAreFree() && _discounted_price != null) {
        course.discounted_price = _discounted_price;
      }
      if(!coursesAreFree() && _discount_percentage != null) {
        course.discount_percentage = _discount_percentage;
      }
      if(!coursesAreFree() && _discount_start_date != null) {
        course.discount_start_date = _discount_start_date;
      }
      if(_title != null) {
        course.title = _title;
      }
      if(_description != null) {
        course.description = _description;
      }
      if(!coursesAreFree() && _main_price != null) {
        course.main_price = _main_price;
      }
      if(_type != null) {
        course.type = _type;
      }
      if(_pdf_files != null) {
        const pdf_files = course?.pdf_files ? JSON.parse(course?.pdf_files) : [];
        const _pdf_filesArray = _pdf_files ?  JSON.parse(_pdf_files) : [];
        const _pdf_filesArrayCleaned = _pdf_filesArray?.map((item)=>item?.filepath);
        pdf_files?.map((item)=>{
          if(!_pdf_filesArrayCleaned?.includes(item?.filepath)) {
            deleteFile(item?.filepath);
          }
        })
        
        course.pdf_files = JSON.stringify([..._pdf_filesArray, ...(req['pdf_files']??[])]);
      }
      if(_thumbnail != null) {
        const thumbnail = course?.thumbnail ? JSON.parse(course?.thumbnail) : [];
        const _thumbnailArray = _thumbnail ?  JSON.parse(_thumbnail) : [];
        const _thumbnailArrayCleaned = _thumbnailArray?.map((item)=>item?.filepath);
        thumbnail?.map((item)=>{
          if(!_thumbnailArrayCleaned?.includes(item?.filepath)) {
            deleteFile(item?.filepath);
          }
        })
        
        course.thumbnail = JSON.stringify([..._thumbnailArray, ...(req['thumbnail']??[])]);
      }
      if(_introduction_video != null) {
        const introduction_video = course?.introduction_video ? JSON.parse(course?.introduction_video) : [];
        const _introduction_videoArray = _introduction_video ?  JSON.parse(_introduction_video) : [];
        const _introduction_videoArrayCleaned = _introduction_videoArray?.map((item)=>item?.filepath);
        introduction_video?.map((item)=>{
          if(!_introduction_videoArrayCleaned?.includes(item?.filepath)) {
            deleteFile(item?.filepath);
          }
        })
        
        course.introduction_video = JSON.stringify([..._introduction_videoArray, ...(req['introduction_video']??[])]);
      }
      if(_tags != null) {
        course.tags = _tags;
      }
      if(!coursesAreFree() && _discount_end_date != null) {
        course.discount_end_date = _discount_end_date;
      }
      if(_category_id) {
        course.category_id = _category_id;
      }
      course.updated_by = req.user.id;
      await course.save();
    }
    return res.json({ message: "Successfully Updated" });
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

route.delete("/", verifyRoles(Roles?.course_destroyRoles), requireCourseAccess((req) => req.body?.id), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const course = await Course.findOne({
      where: { id: id },
    })
    if(!course) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    // const userRatings_title_41 = await UserRating.count({ where: {course_id: id } });
    // if(userRatings_title_41 > 0) {
    //   return res.json({error: true, message: `Delete userRatings related to this course first!`})
    // }

    // const payments_title_71 = await Payment.count({ where: {course_id: id } });
    // if(payments_title_71 > 0) {
    //   return res.json({error: true, message: `Delete payments related to this course first!`})
    // }

    if(await Chapter.count({ where: {course_parent_id: id }}) > 0) {
      return res.json({error: true, message: 'Delete related chapters first!'})
    }
    const thumbnail = course?.thumbnail ? JSON.parse(course?.thumbnail) : [];
    thumbnail?.map((item)=>{
      deleteFile(item?.filepath)
    })
    
    const introduction_video = course?.introduction_video ? JSON.parse(course?.introduction_video) : [];
    introduction_video?.map((item)=>{
      deleteFile(item?.filepath)
    })

    const pdf_files = course?.pdf_files ? JSON.parse(course?.pdf_files) : [];
    pdf_files?.map((item)=>{
      deleteFile(item?.filepath)
    })
    
    Course.destroy({where: {id: id } });
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

route.put("/routeState", verifyRoles(Roles?.course_saveRoles), requireCourseAccess((req) => req.body?.id), async (req, res) => {
  try {
    const {
      id,
      routeState,
      note
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const course = await Course.findOne({
      where: { id: id },
    })
    if(!course) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(course) {
      
      if(routeState != null) {
        course.routeState = routeState;
      }
      if(note != null) {
        let notes = (course?.routeState_reason != null) ? JSON.parse(course.routeState_reason) : "{}"
        let notesNew = (typeof notes == "string") ? JSON.parse(notes) : notes
        const user = await User.findOne({where: {id: req?.user?.id}})
        notesNew[routeState] = {note: note, date: new Date(), id: req?.user?.id, fullName: user?.full_name}
        course.routeState_reason = JSON.stringify(notesNew)
      }
      
      course.updated_by = req.user.id;
      await course.save();
    }
    return res.json({ message: "Successfully Updated" });
  } catch (e) {
     return res.json({error: true, message: "Something went wrong"})
   }
});


route.get('/converted_courses/list', async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { type: "Course", added_by: 1 },
      include: [
        {
          model: Chapter,
        },
      ],
    });

    const coursesWithStatus = await Promise.all(courses.map(async (course) => {
      let completedCount = 0;
      let inProgressCount = 0;
      let notStartedCount = 0;

      let introductionVideoStatus = 'Not Started';
      let introductionVideoPath = '';
      let introductionVideoName = '';
      let size = 0;

      if (course?.introduction_video) {
        const introVideo = JSON.parse(course?.introduction_video);
        const introFilePath = introVideo[0]?.filepath || '';
        size = introVideo[0]?.size;

        if (introFilePath) {
          introductionVideoPath = introFilePath;
          const baseFileName = path.basename(introFilePath);
          introductionVideoName = baseFileName || '';

          const videoDir = `./files/uploads/videos/${baseFileName}`;
          const successfullyConvertedPath = path.join(videoDir, 'successfully_converted');
          const transcodingStartedPath = path.join(videoDir, 'transcoding_started');

          if (fs.existsSync(successfullyConvertedPath)) {
            introductionVideoStatus = 'Completed';
            completedCount++;
          } else if (fs.existsSync(transcodingStartedPath)) {
            introductionVideoStatus = 'In Progress';
            inProgressCount++;
          } else {
            notStartedCount++;
          }
        }
      }

      const chaptersWithStatus = await Promise.all(course?.Chapters.map(async (chapter) => {
        let chapterCompletedCount = 0;
        let chapterInProgressCount = 0;
        let chapterNotStartedCount = 0;

        const chapterFiles = chapter.chapter_files ? JSON.parse(chapter.chapter_files) : [];

        const filesWithStatus = await Promise.all(chapterFiles.map(async (file) => {
          const filePath = file.filepath || '';
          let status = 'Not Started';

          if (filePath) {
            const fileName = path.basename(filePath);
            const videoDir = `./files/uploads/videos/${fileName}`;
            const successfullyConvertedPath = path.join(videoDir, 'successfully_converted');
            const transcodingStartedPath = path.join(videoDir, 'transcoding_started');

            if (fs.existsSync(successfullyConvertedPath)) {
              status = 'Completed';
              completedCount++;
              chapterCompletedCount++;
            } else if (fs.existsSync(transcodingStartedPath)) {
              status = 'In Progress';
              inProgressCount++;
              chapterInProgressCount++;
            } else {
              notStartedCount++;
              chapterNotStartedCount++;
            }
          }

          return {
            path: filePath,
            status,
            fileName: file.filename,
            size: file.size
          };
        }));

        return {
          title: chapter.title,
          files: filesWithStatus,
          overview: {
            completed: chapterCompletedCount,
            inProgress: chapterInProgressCount,
            notStarted: chapterNotStartedCount,
          },
        };
      }));

      const thumbnails = course?.thumbnail ? JSON.parse(course?.thumbnail)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [];
      return {
        title: course.title,
        img: thumbnails?.length > 0 ? thumbnails[0]?.filepath : "",
        introduction_video: {
          status: introductionVideoStatus,
          path: introductionVideoPath,
          fileName: introductionVideoName,
          size: size
        },
        chapters: chaptersWithStatus,
        overview: {
          completed: completedCount,
          inProgress: inProgressCount,
          notStarted: notStartedCount,
        },
      };
    }));

    return res.json(coursesWithStatus);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: true, message: 'Failed to fetch courses' });
  }
});


const convertToHls = async (fileName, filePath, fileSize) => {
  try {
      const worker = new Worker('./middlewares/worker.js');
      worker.postMessage({ fileName, filePath });
      worker.on('message', (message) => {
        console.log(message);
      });
      worker.on('error', (err) => {
        console.error('Worker error:', err);
      });
    
  } catch (e) {
    console.log('Something went wrong: ' + e.message);
    throw e;
  }
};

route.post('/convert_course/convert', async (req, res) => {
  try {
    // const {filePath} = req.body;
    // const fileName = path.basename(filePath);
    // const videoDir = `./files/uploads/videos/${fileName}`;
    // const fPath = path.join(__dirname, "./files/uploads/common/" + fileName);
    // const fileSize = fs.statSync(fPath).size; // Get the file size
    // const successfullyConvertedPath = path.join(videoDir, 'successfully_converted');
    // const transcodingStartedPath = path.join(videoDir, 'transcoding_started');

    // if (fs.existsSync(successfullyConvertedPath)) {
    //   return res.json({ error: true, message: "Already Existed" });
    // }

    // if (fs.existsSync(transcodingStartedPath)) {
    //   return res.json({ error: true, message: "Task In Progress" });
    // }

    // await convertToHls(fileName, fPath, fileSize);
    // return res.json({ message: "Task Started" });

    return res.json({error: true, message: "There is no enough memory for ffmpeg to run"})

  } catch (e) {
    return res.json({ error: true, message: e.message || "Something went wrong" });
  }
});

module.exports = route