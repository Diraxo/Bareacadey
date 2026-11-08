/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Service = require('../../models/Service')
const User = require('../../models/User.js')
const UserUpload = require('../../models/UserUpload')
const verifyRoles = require("../../middlewares/verifyRoles")
let Roles = require("../../roles")
const Faq = require('../../models/Faq')
const LandingPageContent = require('../../models/LandingPageContent')
const Trending = require('../../models/Trending.js')
const Course = require('../../models/Course.js')
const Category = require('../../models/Category.js')
const CorouselItem = require('../../models/CorouselItem.js')
const Chapter = require('../../models/Chapter.js')
const UserRating = require('../../models/UserRating.js')
const Payment = require('../../models/Payment.js')
const { coursesAreFree, asFree, asFreeChapter } = require('../../services/freeCourses')
const verifyJwt = require('../../middlewares/verifyJWT.js')
const { respondToVerification, callbackLimiter } = require('./OpenPublicController')
const Config = require('../../models/Config.js')
require('../../config/loadEnv')

route.get("/services/", verifyRoles(Roles?.service_findAllRoles), async (req, res) => {
  try {
    await Service.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByService",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByService",
        },
      ],
    }).then(async (servicesList) => {
      let updatedServices = []
      await Promise.all(
        servicesList.map(async (service) => {
          const upload_added_by = service?.AddedByService?.upload_id && await UserUpload.findOne({
            where: { id: service?.AddedByService?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = service?.UpdatedByService?.upload_id && await UserUpload.findOne({
            where: { id: service?.UpdatedByService?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedServices.push({
            ...service.toJSON(),
            added_user_name: service?.AddedByService?.full_name,
            updated_user_name: service?.UpdatedByService?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            images: service?.images ? JSON.parse(service?.images)?.map((item) => ({ ...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null })) : [],
            AddedByService: {
              name: service?.AddedByService?.full_name,
              url: fullUrlAddedBy,
              id: service?.AddedByService?.id
            },
            UpdatedByService: {
              name: service?.UpdatedByService?.full_name,
              url: fullUrlUpdatedBy,
              id: service?.UpdatedByService?.id
            },
          });
        })
      );
      res.json(updatedServices.sort((a, b) => a.id - b.id));
    });
  } catch (e) {
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

route.get("/services/:id", verifyRoles(Roles?.service_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await Service.findOne({
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
          as: "AddedByService",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByService",
        },
      ],
    }).then(async (service) => {
      if (!service) {
        return res.json({ error: true, message: 'You are not authorized!' })
      }
      const upload_added_by = service?.AddedByService?.upload_id && await UserUpload.findOne({
        where: { id: service?.AddedByService?.upload_id },
        attributes: ["filepath"],
      })
      const upload_updated_by = service?.UpdatedByService?.upload_id && await UserUpload.findOne({
        where: { id: service?.UpdatedByService?.upload_id },
        attributes: ["filepath"],
      })
      var fullUrlAddedBy = upload_added_by?.filepath
        ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
        : null;
      var fullUrlUpdatedBy = upload_updated_by?.filepath
        ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
        : null;
      let updatedService = {
        ...service.toJSON(),
        added_user_name: service?.AddedByService?.full_name,
        updated_user_name: service?.UpdatedByService?.full_name,
        added_user_url: fullUrlAddedBy,
        updated_user_url: fullUrlUpdatedBy,
        localStorage: req.protocol + "://" + req.get("host"),
        AddedByService: {
          name: service?.AddedByService?.full_name,
          url: fullUrlAddedBy,
          id: service?.AddedByService?.id
        },
        UpdatedByService: {
          name: service?.UpdatedByService?.full_name,
          url: fullUrlUpdatedBy,
          id: service?.UpdatedByService?.id
        },
      };
      res.json(updatedService);
    });
  } catch (e) {
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

route.get("/faqs", async (req, res) => {
  try {
    await Faq.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByFaq",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByFaq",
        },
      ],
    }).then(async (faqsList) => {
      let updatedFaqs = []
      await Promise.all(
        faqsList.map(async (faq) => {
          const upload_added_by = faq?.AddedByFaq?.upload_id && await UserUpload.findOne({
            where: { id: faq?.AddedByFaq?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = faq?.UpdatedByFaq?.upload_id && await UserUpload.findOne({
            where: { id: faq?.UpdatedByFaq?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedFaqs.push({
            ...faq.toJSON(),
            added_user_name: faq?.AddedByFaq?.full_name,
            updated_user_name: faq?.UpdatedByFaq?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByFaq: {
              name: faq?.AddedByFaq?.full_name,
              url: fullUrlAddedBy,
              id: faq?.AddedByFaq?.id
            },
            UpdatedByFaq: {
              name: faq?.UpdatedByFaq?.full_name,
              url: fullUrlUpdatedBy,
              id: faq?.UpdatedByFaq?.id
            },
          });
        })
      );
      res.json(updatedFaqs.sort((a, b) => a.id - b.id));
    });
  } catch (e) {
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

route.get("/landing_page_contents", async (req, res) => {
  try {
    await LandingPageContent.findAll().then(async (landingpagecontentsList) => {
      let updatedLandingPageContents = []
      await Promise.all(
        landingpagecontentsList.map(async (landingpagecontent) => {

          updatedLandingPageContents.push({
            ...landingpagecontent.toJSON(),
            hero_image: landingpagecontent?.hero_image ? JSON.parse(landingpagecontent?.hero_image)?.map((item) => ({ ...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null })) : [],
          });
        })
      );
      res.json(updatedLandingPageContents.sort((a, b) => a.id - b.id));
    });
  } catch (e) {
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

route.get("/dashboard", async (req, res) => {
  try {

    return res.json({ message: "Dashboard" })

  } catch (e) {
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

route.get('/categories', async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await Category.findAll({
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
          as: "AddedByCategory",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByCategory",
        },
      ],
    }).then(async (categoriesList) => {
      let updatedCategories = []
      let recordUsersPP = {}
      await Promise.all(
        categoriesList.map(async (category) => {
          const recordAddedByLabel = "user" + category?.AddedByCategory?.upload_id
          const recordUpdatedByLabel = "user" + category?.UpdatedByCategory?.upload_id

          const upload_added_by = category?.AddedByCategory?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: category?.AddedByCategory?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = category?.UpdatedByCategory?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: category?.UpdatedByCategory?.upload_id },
            attributes: ["filepath"],
          }))

          if (!recordUsersPP[recordAddedByLabel]) {
            recordUsersPP[recordAddedByLabel] = upload_added_by
          }

          if (!recordUsersPP[recordUpdatedByLabel]) {
            recordUsersPP[recordUpdatedByLabel] = upload_updated_by
          }

          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          const coursesCount = await Course.count({ where: {category_id: category?.id, routeState: "published" } });
          updatedCategories.push({
            ...category.toJSON(),
            added_user_name: category?.AddedByCategory?.full_name,
            updated_user_name: category?.UpdatedByCategory?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            coursesCount: coursesCount,
            AddedByCategory: {
              name: category?.AddedByCategory?.full_name,
              url: fullUrlAddedBy,
              id: category?.AddedByCategory?.id
            },
            UpdatedByCategory: {
              name: category?.UpdatedByCategory?.full_name,
              url: fullUrlUpdatedBy,
              id: category?.UpdatedByCategory?.id
            },
          });
        })
      );
      res.json(updatedCategories.sort((a, b) => a?.rowDragIndex - b?.rowDragIndex));
    });
  } catch (e) {
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

route.get('/courses/:id', async (req, res) => {
  try {
    const user_id = req?.params?.id || ""
    const config = await Config.findOne({where: {id: 4}})
    const jsonObject = JSON.parse(config?.config);
    const usdToBirr = jsonObject?.usdToBirr;

    await Course.findAll({
      where: { routeState: "published" },
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
          const recordAddedByLabel = "user" + course?.AddedByCourse?.upload_id
          const recordUpdatedByLabel = "user" + course?.UpdatedByCourse?.upload_id
          
          const userRatings = await UserRating.findAll({
            where: {
              course_id: course?.id,
            },
          })
          

          const rating = (userRatings?.reduce((sum, current) => sum += current?.rating, 0) / userRatings?.length);
          const upload_added_by = course?.AddedByCourse?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: course?.AddedByCourse?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = course?.UpdatedByCourse?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: course?.UpdatedByCourse?.upload_id },
            attributes: ["filepath"],
          }))

          if (!recordUsersPP[recordAddedByLabel]) {
            recordUsersPP[recordAddedByLabel] = upload_added_by
          }

          if (!recordUsersPP[recordUpdatedByLabel]) {
            recordUsersPP[recordUpdatedByLabel] = upload_updated_by
          }

          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          const payments = await Payment.findAll({
            where: {
              course_id: course?.id,
              user_id: user_id ?? "",
              paid: true
            }
          })
          // how many learners have paid for this course; the apps use it to list the most popular first
          const enrolled_count = await Payment.count({ where: { course_id: course?.id, paid: true } })
          updatedCourses.push({
            ...asFree(course.toJSON()),
            added_user_name: course?.AddedByCourse?.full_name,
            updated_user_name: course?.UpdatedByCourse?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            thumbnail: course?.thumbnail ? JSON.parse(course?.thumbnail)?.map((item) => ({ ...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null })) : [],
            enrolled_count: enrolled_count,
            introduction_video: course?.introduction_video ? JSON.parse(course?.introduction_video)?.map((item) => ({ ...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null })) : [],
            name_target_5: course?.Category ? course?.Category?.name : "-",
            userRatings: userRatings,
            main_price_usd: (coursesAreFree() ? 0 : course?.main_price / usdToBirr).toFixed(2),
            usdToBirr: usdToBirr,
            rating: rating || 0,
            // free courses: a signed-in student already has access (no payment record is needed)
            course_pd: coursesAreFree() ? !!user_id : payments?.length > 0,
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
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

route.get(["/course/:id", "/course/:id/user/:userId"], async (req, res) => {
  try {
    const id = req?.params?.id;
    const user_id = req.params?.userId || "";
    
    const config = await Config.findOne({where: {id: 4}})
    const jsonObject = JSON.parse(config?.config);
    const usdToBirr = jsonObject?.usdToBirr;

    const chaptersCount = await Chapter.count({
      where: {
        course_parent_id: id
      }
    })

    await Course.findOne({
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
      if (!course) {
        return res.json({ error: true, message: 'You are not authorized!' })
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

      const chapters = await Chapter.findAll({
        where: {
          course_parent_id: course?.id,
          routeState: "published"
        }
      })

      const coursePayments = await Payment.findAll({
        where: {
          course_id: id,
          user_id: user_id,
          paid: true
        }
      })
      const updatedChapters = []
      await Promise.all(
        chapters?.sort((a,b)=>a.id-b.id)?.map(async (chapter) => {
          const chapterPayments = coursePayments?.length > 0 ? [] : await Payment.findAll({where: {
            chapter_id: chapter?.id,
            user_id: user_id,
            paid: true
          }})
          let updatedChapter = {
            ...asFreeChapter(chapter.toJSON()),
            localStorage: req.protocol + "://" + req.get("host"),
            chapter_files: chapter?.chapter_files ? JSON.parse(chapter?.chapter_files)?.map((item) => ({ ...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null })) : [],
            chapter_pd: coursesAreFree() || course?.main_price <= 0 || coursePayments?.length > 0 || chapterPayments?.length > 0,
            chapter_price_usd: (coursesAreFree() ? 0 : chapter?.price / usdToBirr).toFixed(2),
            usdToBirr: usdToBirr
          };
          updatedChapters.push(updatedChapter);
        }),
      )

      const userRatings = await UserRating.findAll({
        where: {
          course_id: course?.id,
        },
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
      })
      let updatedUserRatings = []
      let recordUsersPPUserRatings = {}
      await Promise.all(
        userRatings.map(async (userrating) => {
          const recordAddedByLabel = "user"+userrating?.AddedByUserRating?.upload_id
          const recordUpdatedByLabel = "user"+userrating?.UpdatedByUserRating?.upload_id
          
          const upload_added_by = userrating?.AddedByUserRating?.upload_id && (recordUsersPPUserRatings[recordAddedByLabel] ? recordUsersPPUserRatings[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: userrating?.AddedByUserRating?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = userrating?.UpdatedByUserRating?.upload_id && (recordUsersPPUserRatings[recordUpdatedByLabel] ? recordUsersPPUserRatings[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: userrating?.UpdatedByUserRating?.upload_id },
            attributes: ["filepath"],
          }))
          
          if(!recordUsersPPUserRatings[recordAddedByLabel]) {
            recordUsersPPUserRatings[recordAddedByLabel] = upload_added_by
          }
          
          if(!recordUsersPPUserRatings[recordUpdatedByLabel]) {
            recordUsersPPUserRatings[recordUpdatedByLabel] = upload_updated_by
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
      
      const rating = (userRatings?.reduce((sum, current) => sum += current?.rating, 0) / userRatings?.length);
      let updatedCourse = {
        ...asFree(course.toJSON()),
        added_user_name: course?.AddedByCourse?.full_name,
        updated_user_name: course?.UpdatedByCourse?.full_name,
        added_user_url: fullUrlAddedBy,
        updated_user_url: fullUrlUpdatedBy,
        localStorage: req.protocol + "://" + req.get("host"),
        name_target_5: course?.Category?.name ?? "",
        chaptersCount: chaptersCount,
        pdf_files: course?.pdf_files ? JSON.parse(course?.pdf_files)?.map((item)=>({ ...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null })) : [],
        course_pd: coursesAreFree() ? !!user_id : coursePayments?.length > 0,
        chapters: updatedChapters,
        rating: rating || 0,
        userRatings: updatedUserRatings, 
        main_price_usd: (coursesAreFree() ? 0 : course?.main_price / usdToBirr).toFixed(2),
        usdToBirr: usdToBirr,
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
      return res.json(updatedCourse);
    });
  } catch (e) {
    console.log(e)
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

route.get('/trendings', async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await Trending.findAll({
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
          as: "AddedByTrending",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByTrending",
        },
        {
          model: Course,
          attributes: [
            "id",
            "title",
          ],
          through: { attributes: [] },
        },
      ],
    }).then(async (trendingsList) => {
      let updatedTrendings = []
      let recordUsersPP = {}
      await Promise.all(
        trendingsList.map(async (trending) => {
          const recordAddedByLabel = "user" + trending?.AddedByTrending?.upload_id
          const recordUpdatedByLabel = "user" + trending?.UpdatedByTrending?.upload_id

          const upload_added_by = trending?.AddedByTrending?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: trending?.AddedByTrending?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = trending?.UpdatedByTrending?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: trending?.UpdatedByTrending?.upload_id },
            attributes: ["filepath"],
          }))

          if (!recordUsersPP[recordAddedByLabel]) {
            recordUsersPP[recordAddedByLabel] = upload_added_by
          }

          if (!recordUsersPP[recordUpdatedByLabel]) {
            recordUsersPP[recordUpdatedByLabel] = upload_updated_by
          }

          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedTrendings.push({
            ...trending.toJSON(),
            added_user_name: trending?.AddedByTrending?.full_name,
            updated_user_name: trending?.UpdatedByTrending?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            title_mtm_target_1: trending?.Courses?.map((item) => item['title'])?.join(', '),
            AddedByTrending: {
              name: trending?.AddedByTrending?.full_name,
              url: fullUrlAddedBy,
              id: trending?.AddedByTrending?.id
            },
            UpdatedByTrending: {
              name: trending?.UpdatedByTrending?.full_name,
              url: fullUrlUpdatedBy,
              id: trending?.UpdatedByTrending?.id
            },
          });
        })
      );
      res.json(updatedTrendings.sort((a, b) => a.id - b.id));
    });
  } catch (e) {
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

/* Public slider list. Newest slide first (there is no separate order column, so the id is the publication order), and
 * only the slide itself: no admin names or avatars, no per-row lookups, so the answer is one query. `updatedAt` lets
 * the apps tell a replaced slide from an unchanged one. */
route.get('/corouselitems', async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host")
    const rows = await CorouselItem.findAll({ order: [['id', 'DESC']] })
    const parseImages = (value) => {
      try {
        const list = value ? JSON.parse(value) : []
        return Array.isArray(list) ? list.filter((item) => item?.filepath).map((item) => ({ ...item, filepath: host + item.filepath })) : []
      } catch (e) {
        return []
      }
    }
    return res.json(rows.map((row) => ({ ...row.toJSON(), image: parseImages(row.image) })))
  } catch (e) {
    if (e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if (e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({ error: true, message: "Something went wrong" })
    }
  }
});

// legacy duplicate of /api/open_public/verify-payment: same verified handler, no separate logic
route.get("/verify-payment/:id", callbackLimiter, respondToVerification)

route.get("/get-currency", async (req, res) => {
  try {
    const config = await Config.findOne({where: {id: 4}})
    if(config) {
      const jsonObject = JSON.parse(config?.config);
      return res.json({amount: jsonObject.usdToBirr});
    }
    return res.json({error: true, message: "Config not found"})
  } catch(e) {
    return res.status(500).json({error: true, message: "Something went wrong"})
  }
})

route.post("/update-currency", verifyJwt, async (req, res) => {
  try {
    if(req.user.id != 1) return res.json({error: true, message: "You are not authorized"})
    const amount = Number(req.body.amount);
    if(!Number.isFinite(amount) || amount <= 0) return res.status(400).json({error: true, message: "Invalid amount"})
    const config = await Config.findOne({where: {id: 4}})
    if(config) {
      const jsonObject = JSON.parse(config?.config);
      jsonObject.usdToBirr = amount;
      config.config = JSON.stringify(jsonObject)
      await config.save();
      return res.json({message: "Successfully Updated"})
    }
    return res.json({error: true, message: "Config not found"})
  } catch(e) {
    return res.status(500).json({error: true, message: "Something went wrong"})
  }
})

module.exports = route