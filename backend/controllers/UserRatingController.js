/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const UserRating = require('../models/UserRating')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const Course = require('../models/Course')
const Payment = require('../models/Payment')
const { isFreeCourse } = require('../services/freeCourses')
const sequelize = require('../database')


route.get(['/', '/parent/:id'], verifyRoles(Roles?.userrating_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await UserRating.findAll({
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
          as: "AddedByUserRating",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByUserRating",
        },
        {
          model: User,
          attributes: [
            "full_name",
          ],
        },
        {
          model: Course,
          attributes: [
            "title",
          ],
        },
      ],
    }).then(async (userratingsList) => {
      let updatedUserRatings = []
      let recordUsersPP = {}
      await Promise.all(
        userratingsList.map(async (userrating) => {
          const recordAddedByLabel = "user"+userrating?.AddedByUserRating?.upload_id
          const recordUpdatedByLabel = "user"+userrating?.UpdatedByUserRating?.upload_id
          
          const upload_added_by = userrating?.AddedByUserRating?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: userrating?.AddedByUserRating?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = userrating?.UpdatedByUserRating?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: userrating?.UpdatedByUserRating?.upload_id },
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
          updatedUserRatings.push({
            ...userrating.toJSON(),
            added_user_name: userrating?.AddedByUserRating?.full_name,
            updated_user_name: userrating?.UpdatedByUserRating?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            first_name_target_0: userrating?.User ? userrating?.User?.full_name : "-",
            title_target_1: userrating?.Course ? userrating?.Course?.title : "-",
            AddedByUserRating: {
              name: userrating?.AddedByUserRating?.full_name,
              url: fullUrlAddedBy,
              id: userrating?.AddedByUserRating?.id
            },
            UpdatedByUserRating: {
              name: userrating?.UpdatedByUserRating?.full_name,
              url: fullUrlUpdatedBy,
              id: userrating?.UpdatedByUserRating?.id
            },
          });
        })
      );
      res.json(updatedUserRatings.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.userrating_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await UserRating.findOne({
      where: { id: id },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByUserRating",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByUserRating",
        },
        {
          model: User,
          attributes: [
            "full_name",
          ],
        },
        {
          model: Course,
          attributes: [
            "title",
          ],
        },
      ],
    }).then(async (userrating) => {
          if(!userrating) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = userrating?.AddedByUserRating?.upload_id && await UserUpload.findOne({
            where: { id: userrating?.AddedByUserRating?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = userrating?.UpdatedByUserRating?.upload_id && await UserUpload.findOne({
            where: { id: userrating?.UpdatedByUserRating?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedUserRating = {
        ...userrating.toJSON(),
            added_user_name: userrating?.AddedByUserRating?.full_name,
            updated_user_name: userrating?.UpdatedByUserRating?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            first_name_target_0: userrating?.User?.full_name??"",
            title_target_1: userrating?.Course?.title??"",
            AddedByUserRating: {
              name: userrating?.AddedByUserRating?.full_name,
              url: fullUrlAddedBy,
              id: userrating?.AddedByUserRating?.id
            },
            UpdatedByUserRating: {
              name: userrating?.UpdatedByUserRating?.full_name,
              url: fullUrlUpdatedBy,
              id: userrating?.UpdatedByUserRating?.id
            },
      };
      res.json(updatedUserRating);
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

const MAX_COMMENT_LENGTH = 250 // the review forms cap the comment at 250 characters; the column holds 255

/* Per-process queue keyed by reviewer + course. The database row lock below is what protects several server
 * processes; this queue makes concurrent requests in one process run strictly one after another. */
const reviewQueues = new Map()
const serialized = (key, task) => {
  const run = (reviewQueues.get(key) || Promise.resolve()).catch(() => {}).then(task)
  const tail = run.catch(() => {})
  reviewQueues.set(key, tail)
  tail.then(() => { if (reviewQueues.get(key) === tail) reviewQueues.delete(key) })
  return run
}

class ReviewError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const parseCourseId = (value) => {
  const id = typeof value === 'number' ? value : typeof value === 'string' && /^\d{1,10}$/.test(value) ? Number(value) : NaN
  return Number.isSafeInteger(id) && id > 0 && id <= 2147483647 ? id : null
}

/* A reviewer is identified only by the verified token (req.user.id). Any `_user_id` in the body is ignored.
 * Reviewing a paid course needs a verified full-course purchase: a Payment row for this user and this course with paid = true
 * (the same test the course page uses for `course_pd`). Chapter payments carry a chapter_id and no course_id, so
 * they never match and do not allow reviewing the course. */
route.post("/", verifyRoles(Roles?.userrating_createRoles), async (req, res) => {
  try {
    const reviewerId = req.user?.id
    if (!Number.isSafeInteger(reviewerId) || reviewerId <= 0) {
      return res.status(401).json({ error: true, message: "You are not authorized!" })
    }
    const { _rating, _comment, _course_id } = req.body || {}

    const courseId = parseCourseId(_course_id)
    if (!courseId) return res.status(400).json({ error: true, message: "A valid course is required" })
    if (typeof _rating !== 'number' || !Number.isInteger(_rating) || _rating < 1 || _rating > 5) {
      return res.status(400).json({ error: true, message: "Rating must be a whole number from 1 to 5" })
    }
    if (_comment !== undefined && _comment !== null && typeof _comment !== 'string') {
      return res.status(400).json({ error: true, message: "Comment must be text" })
    }
    const comment = typeof _comment === 'string' ? _comment.trim() : ''
    if (comment.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: true, message: `Comment must be at most ${MAX_COMMENT_LENGTH} characters` })
    }

    const course = await Course.findOne({ where: { id: courseId }, attributes: ["id", "routeState", "main_price"] })
    if (!course) return res.status(404).json({ error: true, message: "Course not found" })
    if (course.routeState !== "published") {
      return res.status(403).json({ error: true, message: "This course is not open for reviews" })
    }

    // free courses (main_price <= 0, the same test the course page uses) have no payment to verify
    const isFree = isFreeCourse(course)
    if (!isFree) {
      const purchase = await Payment.findOne({
        where: { user_id: reviewerId, course_id: courseId, paid: true },
        attributes: ["id"],
      })
      if (!purchase) {
        return res.status(403).json({ error: true, message: "Only learners who purchased this course can review it" })
      }
    }

    // SQLite (tests only) has a single shared connection, so its transactions must not overlap at all
    const queueKey = sequelize.getDialect() === 'sqlite' ? 'sqlite' : `${reviewerId}:${courseId}`
    await serialized(queueKey, () => sequelize.transaction(async (transaction) => {
      // MySQL/InnoDB: lock the reviewer's own user row so a second server process waits here too
      if (sequelize.getDialect() === 'mysql') {
        await User.findOne({ where: { id: reviewerId }, attributes: ["id"], transaction, lock: transaction.LOCK.UPDATE })
      }
      const existing = await UserRating.findOne({
        where: { added_by: reviewerId, course_id: courseId },
        attributes: ["id"],
        transaction,
      })
      if (existing) throw new ReviewError(409, "You have already reviewed this course")
      await UserRating.create({
        rating: _rating,
        comment: comment || null,
        user_id: reviewerId,
        course_id: courseId,
        added_by: reviewerId,
        updated_by: reviewerId,
      }, { transaction })
    }))
    return res.json({ message: "Successfully Created" })
  } catch (e) {
    if (e instanceof ReviewError) return res.status(e.status).json({ error: true, message: e.message })
    console.error("Creating a rating failed:", e?.message)
    return res.status(500).json({ error: true, message: "Something went wrong" })
  }
});

route.put("/", verifyRoles(Roles?.userrating_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _rating,
      _comment,
      _user_id,
      _course_id,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const userrating = await UserRating.findOne({
      where: { id: id },
    })
    if(!userrating) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(userrating) {
      if(_rating != null) {
        userrating.rating = _rating;
      }
      if(_comment != null) {
        userrating.comment = _comment;
      }
      if(_user_id) {
        userrating.user_id = _user_id;
      }
      if(_course_id) {
        userrating.course_id = _course_id;
      }
      userrating.updated_by = req.user.id;
      await userrating.save();
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

route.delete("/", verifyRoles(Roles?.userrating_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const userrating = await UserRating.findOne({
      where: { id: id },
    })
    if(!userrating) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    UserRating.destroy({where: {id: id } });
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

module.exports = route