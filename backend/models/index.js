/* Registers every Sequelize model and the associations between them.
 * Extracted verbatim from the former server.js so scripts and tests can load the
 * complete schema without starting the HTTP server. */
const User = require('./User')
const Permission = require('./Permission')
const Role = require('./Role')
const RolePermission = require('./RolePermission')
const UserPermission = require('./UserPermission')
const PermissionCategory = require('./PermissionCategory')
const Device = require('./Device')
const UserUpload = require('./UserUpload')
const Activity = require('./Activity')
const Notification = require('./Notification')
const CustomField = require('./CustomField')
const Config = require('./Config')
const Chat = require('./Chat')
const ChatUpload = require('./ChatUpload')
//#region default relationships

/*** relations ***/
Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'roles',
  allowNull: true,
});
User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'roles',
  allowNull: true,
})

UserUpload.hasOne(User, {
  foreignKey: 'upload_id',
  as: 'url'
});
User.belongsTo(UserUpload, {
  foreignKey: 'upload_id',
  as: 'url'
})

User.hasMany(Device, {
  foreignKey: 'user_id',
  as: 'devices',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Device.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'devices'
})

PermissionCategory.hasMany(Permission, {
  foreignKey: 'category_id',
});
Permission.belongsTo(PermissionCategory, {
  foreignKey: 'category_id',
})

User.belongsToMany(Permission, { through: UserPermission, foreignKey: 'user_id' });
Permission.belongsToMany(User, { through: UserPermission, foreignKey: 'permission_id' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id' });


//user
User.hasMany(User, {
  foreignKey: 'added_by',
})

User.hasMany(User, {
  foreignKey: 'updated_by',
})

//role
User.hasMany(Role, {
  foreignKey: 'added_by'
})

User.hasMany(Role, {
  foreignKey: 'updated_by'
})

//role permission
User.hasMany(RolePermission, {
  foreignKey: 'added_by'
})

//user permission
User.hasMany(UserPermission, {
  foreignKey: 'added_by'
})

//activity
User.hasMany(Activity, {
  foreignKey: 'added_by'
})
Activity.belongsTo(User, {
  foreignKey: 'added_by'
})

Role.hasMany(Role, {
  foreignKey: {
    name: 'parent',
    allowNull: true
  }
})





//notification
User.hasMany(Notification, {
  foreignKey: 'from',
  as: 'from'
})
User.hasMany(Notification, {
  foreignKey: 'to',
  as: 'to'
})

/* relation of chat model to others*/
//relation to User
User.hasMany(Chat, {
  foreignKey: "from",
  as: "From",
})
Chat.belongsTo(User, {
  foreignKey: "from",
  as: "From",
})

//relation to User
User.hasMany(Chat, {
  foreignKey: "to",
  as: "To",
})
Chat.belongsTo(User, {
  foreignKey: "to",
  as: "To",
})

//relation to ChatUpload
ChatUpload.hasMany(Chat, {
  foreignKey: "chatupload_id",
})
Chat.belongsTo(ChatUpload, {
  foreignKey: "chatupload_id",
})

//#endregion end of default relationships
const EmployeeCategory = require('./EmployeeCategory')
const EmployeePosition = require('./EmployeePosition')
const Department = require('./Department')
const LandingPageContent = require('./LandingPageContent')
const Service = require('./Service')
const Faq = require('./Faq')
const Contact = require('./Contact')
const MyTask = require('./MyTask')
//#region group relations

//#region Employee Settings group relations

//#region relation of employeecategory model to others ****/
//#region relation to user
User.hasMany(EmployeeCategory, {
  foreignKey: 'added_by',
  as: 'AddedByEmployeeCategory',
})
EmployeeCategory.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByEmployeeCategory',
})

User.hasMany(EmployeeCategory, {
  foreignKey: 'updated_by',
  as: 'UpdatedByEmployeeCategory',
})
EmployeeCategory.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByEmployeeCategory',
})
//#endregion

//#endregion end of relation of employeecategory model to others

//#region relation of employeeposition model to others ****/
//#region relation to user
User.hasMany(EmployeePosition, {
  foreignKey: 'added_by',
  as: 'AddedByEmployeePosition',
})
EmployeePosition.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByEmployeePosition',
})

User.hasMany(EmployeePosition, {
  foreignKey: 'updated_by',
  as: 'UpdatedByEmployeePosition',
})
EmployeePosition.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByEmployeePosition',
})
//#endregion

//#region relation to EmployeeCategory
EmployeeCategory.hasMany(EmployeePosition, {
  foreignKey: "employeecategory_id",
})
EmployeePosition.belongsTo(EmployeeCategory, {
  foreignKey: "employeecategory_id",
})
//#endregion

//#endregion end of relation of employeeposition model to others

//#region relation of department model to others ****/
//#region relation to user
User.hasMany(Department, {
  foreignKey: 'added_by',
  as: 'AddedByDepartment',
})
Department.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByDepartment',
})

User.hasMany(Department, {
  foreignKey: 'updated_by',
  as: 'UpdatedByDepartment',
})
Department.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByDepartment',
})
//#endregion

//#endregion end of relation of department model to others

//#endregion end of Employee Settings relations


//#region Landing Page Items group relations

//#region relation of landingpagecontent model to others ****/
//#region relation to user
User.hasMany(LandingPageContent, {
  foreignKey: 'added_by',
  as: 'AddedByLandingPageContent',
})
LandingPageContent.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByLandingPageContent',
})

User.hasMany(LandingPageContent, {
  foreignKey: 'updated_by',
  as: 'UpdatedByLandingPageContent',
})
LandingPageContent.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByLandingPageContent',
})
//#endregion

//#endregion end of relation of landingpagecontent model to others

//#region relation of service model to others ****/
//#region relation to user
User.hasMany(Service, {
  foreignKey: 'added_by',
  as: 'AddedByService',
})
Service.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByService',
})

User.hasMany(Service, {
  foreignKey: 'updated_by',
  as: 'UpdatedByService',
})
Service.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByService',
})
//#endregion

//#endregion end of relation of service model to others

/*** faq relations ***/
//relation to user
User.hasMany(Faq, {
  foreignKey: 'added_by',
  as: 'AddedByFaq',
})
Faq.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByFaq',
})

User.hasMany(Faq, {
  foreignKey: 'updated_by',
  as: 'UpdatedByFaq',
})
Faq.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByFaq',
})



//#endregion end of Landing Page Items relations


//#region Communication group relations

//#endregion end of Communication relations

//#region Misc group relations

//#region relation of mytask model to others ****/
//#region relation to user
User.hasMany(MyTask, {
  foreignKey: 'added_by',
  as: 'AddedByMyTask',
})
MyTask.belongsTo(User, {
  foreignKey: 'added_by',
  as: 'AddedByMyTask',
})

User.hasMany(MyTask, {
  foreignKey: 'updated_by',
  as: 'UpdatedByMyTask',
})
MyTask.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'UpdatedByMyTask',
})
//#endregion

//#endregion end of relation of mytask model to others

//#endregion end of Misc relations




//#endregion
//#region other common relations

/* relation of user model to others*/
//relation to EmployeeCategory
EmployeeCategory.hasMany(User, {
  foreignKey: "employeecategory_id",
})
User.belongsTo(EmployeeCategory, {
  foreignKey: "employeecategory_id",
})

//relation to EmployeePosition
EmployeePosition.hasMany(User, {
  foreignKey: "employeeposition_id",
})
User.belongsTo(EmployeePosition, {
  foreignKey: "employeeposition_id",
})

//relation to Department
Department.hasMany(User, {
  foreignKey: "department_id",
  as: "MainDepartment",
})
User.belongsTo(Department, {
  foreignKey: "department_id",
  as: "MainDepartment",
})

//relation to Department
Department.belongsToMany(User, {
  through: "UserVisibleDepartments",
  foreignKey: "department_visiblility_id",
  as: "VisibleDepartment",
})
User.belongsToMany(Department, {
  through: "UserVisibleDepartments",
  foreignKey: "user_id",
  as: "VisibleDepartment",
})

//#endregion

// Quiz models (rebuilt from the contract the mobile app expects; original PHP schema was not available)
const QuizCategory = require('./QuizCategory')
const QuizTitle = require('./QuizTitle')
const Quiz = require('./Quiz')
const QuizQuestion = require('./QuizQuestion')
const QuizAnswer = require('./QuizAnswer')

QuizCategory.hasMany(Quiz, { foreignKey: 'category_id', onDelete: 'SET NULL' })
Quiz.belongsTo(QuizCategory, { foreignKey: 'category_id' })
Quiz.hasMany(QuizQuestion, { foreignKey: 'quiz_id', as: 'questions', onDelete: 'CASCADE' })
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quiz_id' })
QuizQuestion.hasMany(QuizAnswer, { foreignKey: 'question_id', as: 'answers', onDelete: 'CASCADE' })
QuizAnswer.belongsTo(QuizQuestion, { foreignKey: 'question_id' })
User.hasMany(Quiz, { foreignKey: 'added_by', as: 'AddedByQuiz' })
Quiz.belongsTo(User, { foreignKey: 'added_by', as: 'AddedByQuiz' })

// Course/payment/rating models and their associations
require('../modules/courses')

const Course = require('./Course')
const Chapter = require('./Chapter')
const Payment = require('./Payment')
const UserRating = require('./UserRating')
const CorouselItem = require('./CorouselItem')
const Category = require('./Category')
const Trending = require('./Trending')

// Instructor approval workflow and explicit course assignments
const InstructorRequest = require('./InstructorRequest')
const CourseInstructor = require('./CourseInstructor')
User.hasMany(InstructorRequest, { foreignKey: 'user_id', as: 'instructorRequests', onDelete: 'CASCADE' })
InstructorRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
InstructorRequest.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer', constraints: false })
Course.belongsToMany(User, { through: CourseInstructor, foreignKey: 'course_id', otherKey: 'user_id', as: 'instructors' })
User.belongsToMany(Course, { through: CourseInstructor, foreignKey: 'user_id', otherKey: 'course_id', as: 'assignedCourses' })
CourseInstructor.belongsTo(Course, { foreignKey: 'course_id' })
CourseInstructor.belongsTo(User, { foreignKey: 'user_id' })
CourseInstructor.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner', constraints: false })

const { UploadBatch, UploadBatchFile } = require('./UploadBatch')
const RefreshSession = require('./RefreshSession')

module.exports = { RefreshSession, UploadBatch, UploadBatchFile, InstructorRequest, CourseInstructor, Course, Chapter, Payment, UserRating, CorouselItem, Category, Trending, QuizCategory, QuizTitle, Quiz, QuizQuestion, QuizAnswer, User, Permission, Role, RolePermission, UserPermission, PermissionCategory, Device, UserUpload, Activity, Notification, CustomField, Config, Chat, ChatUpload, EmployeeCategory, EmployeePosition, Department, LandingPageContent, Service, Faq, Contact, MyTask }
