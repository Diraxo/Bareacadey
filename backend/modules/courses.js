const User = require('../models/User')

//#region import Courses models 
const Course = require('../models/Course')
const Chapter = require('../models/Chapter')
const UserRating = require('../models/UserRating')
const CorouselItem = require('../models/CorouselItem')
const Category = require('../models/Category')
const Payment = require('../models/Payment')
const Trending = require('../models/Trending')
//#endregion


//#region Courses group relations

//#region relation of course model to others ****/
//#region relation to user
User.hasMany(Course, {
  foreignKey: 'added_by',
  as: 'AddedByCourse',
})
Course.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByCourse',
})

User.hasMany(Course, {
  foreignKey: 'updated_by',
  as: 'UpdatedByCourse',
})
Course.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByCourse',
})
//#endregion

//#region relation to Category
Category.hasMany(Course, {
  foreignKey: "category_id",
})
Course.belongsTo(Category, {
  foreignKey: "category_id",
})
//#endregion

//#endregion end of relation of course model to others

//#region relation of chapter model to others ****/
//#region relation to user
User.hasMany(Chapter, {
  foreignKey: 'added_by',
  as: 'AddedByChapter',
})
Chapter.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByChapter',
})

User.hasMany(Chapter, {
  foreignKey: 'updated_by',
  as: 'UpdatedByChapter',
})
Chapter.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByChapter',
})
//#endregion

//parent relation
Course.hasMany(Chapter, {
  foreignKey: "course_parent_id",
})
Chapter.belongsTo(Course, {
  foreignKey: "course_parent_id",
})

//#endregion end of relation of chapter model to others

//#region relation of userrating model to others ****/
//#region relation to user
User.hasMany(UserRating, {
  foreignKey: 'added_by',
  as: 'AddedByUserRating',
})
UserRating.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByUserRating',
})

User.hasMany(UserRating, {
  foreignKey: 'updated_by',
  as: 'UpdatedByUserRating',
})
UserRating.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByUserRating',
})
//#endregion

//#region relation to User
User.hasMany(UserRating, {
  foreignKey: "user_id",
})
UserRating.belongsTo(User, {
  foreignKey: "user_id",
})
//#endregion

//#region relation to Course
Course.hasMany(UserRating, {
  foreignKey: "course_id",
})
UserRating.belongsTo(Course, {
  foreignKey: "course_id",
})
//#endregion

//#endregion end of relation of userrating model to others

//#region relation of corouselitem model to others ****/
//#region relation to user
User.hasMany(CorouselItem, {
  foreignKey: 'added_by',
  as: 'AddedByCorouselItem',
})
CorouselItem.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByCorouselItem',
})

User.hasMany(CorouselItem, {
  foreignKey: 'updated_by',
  as: 'UpdatedByCorouselItem',
})
CorouselItem.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByCorouselItem',
})
//#endregion

//#endregion end of relation of corouselitem model to others

//#region relation of category model to others ****/
//#region relation to user
User.hasMany(Category, {
  foreignKey: 'added_by',
  as: 'AddedByCategory',
})
Category.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByCategory',
})

User.hasMany(Category, {
  foreignKey: 'updated_by',
  as: 'UpdatedByCategory',
})
Category.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByCategory',
})
//#endregion

//#endregion end of relation of category model to others

//#region relation of payment model to others ****/
//#region relation to user
User.hasMany(Payment, {
  foreignKey: 'added_by',
  as: 'AddedByPayment',
})
Payment.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByPayment',
})

User.hasMany(Payment, {
  foreignKey: 'updated_by',
  as: 'UpdatedByPayment',
})
Payment.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByPayment',
})
//#endregion

//#region relation to User
User.hasMany(Payment, {
  foreignKey: "user_id",
})
Payment.belongsTo(User, {
  foreignKey: "user_id",
})
//#endregion

//#region relation to Course
Course.hasMany(Payment, {
  foreignKey: "course_id",
})
Payment.belongsTo(Course, {
  foreignKey: "course_id",
})
//#endregion

//#region relation to Chapter
Chapter.hasMany(Payment, {
  foreignKey: "chapter_id",
})
Payment.belongsTo(Chapter, {
  foreignKey: "chapter_id",
})
//#endregion

//#endregion end of relation of payment model to others

//#region relation of trending model to others ****/
//#region relation to user
User.hasMany(Trending, {
  foreignKey: 'added_by',
  as: 'AddedByTrending',
})
Trending.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByTrending',
})

User.hasMany(Trending, {
  foreignKey: 'updated_by',
  as: 'UpdatedByTrending',
})
Trending.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByTrending',
})
//#endregion

//#region relation to Course
Course.belongsToMany(Trending, {
  through: "TrendingCourses",
  foreignKey: "course_id",
})
Trending.belongsToMany(Course, {
  through: "TrendingCourses",
  foreignKey: "trending_id",
})
//#endregion

//#endregion end of relation of trending model to others

//#endregion end of Courses relations




//#region import Courses controllers
const courseControllers = require('../controllers/CourseController')
const chapterControllers = require('../controllers/ChapterController')
const userRatingControllers = require('../controllers/UserRatingController')
const corouselItemControllers = require('../controllers/CorouselItemController')
const categoryControllers = require('../controllers/CategoryController')
const paymentControllers = require('../controllers/PaymentController')
const trendingControllers = require('../controllers/TrendingController')
//#endregion





//#region assign Courses routes to controllers
const assignRoutes = (app) => {
    app.use('/api/courses', courseControllers)
    app.use('/api/chapters', chapterControllers)
    app.use('/api/userratings', userRatingControllers)
    app.use('/api/corouselitems', corouselItemControllers)
    app.use('/api/categories', categoryControllers)
    app.use('/api/payments', paymentControllers)
    app.use('/api/trendings', trendingControllers)
};
//#endregion
module.exports = { assignRoutes };