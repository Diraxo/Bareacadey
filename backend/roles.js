module.exports = Object.freeze({
  //role: any signed-in user may read role names (the apps need them); changing roles needs the matching permission
  role_findAllRoles: ["Public Access"],
  role_createRoles: ["Add Role"],
  role_saveRoles: ["Edit Role"],
  role_destroyRoles: ["Delete Role"],

  //user: previously every signed-in account could list, create, edit and delete users and assign permissions
  user_findAllRoles: ["View Users"],
  user_findOneRoles: ["View Users", "View Detail"],
  user_createRoles: ["Add Users"],
  user_saveRoles: ["Edit Users"],
  user_destroyRoles: ["Delete Users"],

  //notifications (own list is readable by every signed-in user; creating them is an admin action)
  notification_findAllRoles: ["Public Access"],
  notification_createRoles: ["Edit Users"],
  notification_saveRoles: ["Edit Users"],

  //EmployeeCategory Permissions
  employeecategory_findAllRoles: [
    "Manage Employee Categories",
    "View Users",
    "User Detail",
  ],
  employeecategory_findOneRoles: [
    "Manage Employee Categories",
    "View Users",
    "User Detail",
  ],
  employeecategory_createRoles: ["Manage Employee Categories"],
  employeecategory_saveRoles: ["Manage Employee Categories"],
  employeecategory_destroyRoles: ["Manage Employee Categories"],

  //EmployeePosition Permissions
  employeeposition_findAllRoles: [
    "View Users",
    "User Detail",
    "Manage Employee Positions",
  ],
  employeeposition_findOneRoles: [
    "View Users",
    "User Detail",
    "Manage Employee Positions",
  ],
  employeeposition_createRoles: ["Manage Employee Positions"],
  employeeposition_saveRoles: ["Manage Employee Positions"],
  employeeposition_destroyRoles: ["Manage Employee Positions"],

  //Department Permissions
  department_findAllRoles: [
    "View Users",
    "User Detail",
    "Manage Employee Departments",
  ],
  department_findOneRoles: [
    "View Users",
    "User Detail",
    "Manage Employee Departments",
  ],
  department_createRoles: ["Manage Employee Departments"],
  department_saveRoles: ["Manage Employee Departments"],
  department_destroyRoles: ["Manage Employee Departments"],

  //system config: every signed-in user may read the public settings row; the full table and all writes are admin-only
  system_config_findAllRoles: ["Public Access"],
  system_config_saveRoles: ["Edit Users"],

  //activity log
  activity_findAllRoles: ["Activities"],

  //quiz content (teachers who can manage course content can manage quizzes)
  quiz_findAllRoles: ["Instructor"],
  quiz_findOneRoles: ["Instructor"],
  quiz_createRoles: ["Instructor"],
  quiz_saveRoles: ["Instructor"],
  quiz_destroyRoles: ["Instructor"],

  //MyTask Permissions
  mytask_findAllRoles: ["My Tasks"],
  mytask_findOneRoles: ["My Tasks"],
  mytask_createRoles: ["My Tasks"],
  mytask_saveRoles: ["My Tasks"],
  mytask_destroyRoles: ["My Tasks"],

  //LandingPageContent Permissions
  landingpagecontent_findAllRoles: ["Customize Landing Page", "Public Access"],
  landingpagecontent_findOneRoles: ["Customize Landing Page", "Public Access"],
  landingpagecontent_createRoles: ["Customize Landing Page"],
  landingpagecontent_saveRoles: ["Customize Landing Page"],
  landingpagecontent_destroyRoles: ["Customize Landing Page"],

  //Service Permissions
  service_findAllRoles: ["Customize Landing Page", "Public Access"],
  service_findOneRoles: ["Customize Landing Page", "Public Access"],
  service_createRoles: ["Customize Landing Page"],
  service_saveRoles: ["Customize Landing Page"],
  service_destroyRoles: ["Customize Landing Page"],

  //faqs
  faq_findAllRoles: ["Public Access", "Customize Landing Page"],
  faq_findOneRoles: ["Public Access", "Customize Landing Page"],
  faq_createRoles: ["Customize Landing Page"],
  faq_saveRoles: ["Customize Landing Page"],
  faq_destroyRoles: ["Customize Landing Page"],

  //Contact Permissions
  contact_findAllRoles: ["Contact Us"],
  contact_findOneRoles: ["Contact Us"],
  contact_createRoles: ["Contact Us", "Public Access"],
  contact_saveRoles: ["Contact Us"],
  contact_destroyRoles: ["Contact Us"],

  //Course Permissions
  course_findAllRoles: ["Instructor","Viewer"],
  course_findOneRoles: ["Instructor","Viewer"],
  course_createRoles: ["Instructor"],
  course_saveRoles: ["Instructor"],
  course_destroyRoles: ["Instructor"],

  //Chapter Permissions
  chapter_findAllRoles: ["Instructor","Viewer"],
  chapter_findOneRoles: ["Instructor","Viewer"],
  chapter_createRoles: ["Instructor"],
  chapter_saveRoles: ["Instructor"],
  chapter_destroyRoles: ["Instructor"],

  //UserRating Permissions
  userrating_findAllRoles: ["Viewer","Instructor"],
  userrating_findOneRoles: ["Viewer","Instructor"],
  //any signed-in user may submit a review; the controller requires a paid purchase of the course and uses req.user.id
  userrating_createRoles: ["Public Access"],
  userrating_saveRoles: ["Viewer"],
  userrating_destroyRoles: ["Viewer"],

  //CorouselItem Permissions
  corouselitem_findAllRoles: ["Customize Homepage","Viewer"],
  corouselitem_findOneRoles: ["Customize Homepage","Viewer"],
  corouselitem_createRoles: ["Customize Homepage"],
  corouselitem_saveRoles: ["Customize Homepage"],
  corouselitem_destroyRoles: ["Customize Homepage"],

  //Category Permissions
  category_findAllRoles: ["Manage Categories","Viewer"],
  category_findOneRoles: ["Manage Categories","Viewer"],
  category_createRoles: ["Manage Categories"],
  category_saveRoles: ["Manage Categories"],
  category_destroyRoles: ["Manage Categories"],

  //Payment Permissions
  payment_findAllRoles: ["Viewer","Instructor"],
  payment_findOneRoles: ["Viewer","Instructor"],
  payment_createRoles: ["Viewer"],
  payment_saveRoles: ["Viewer"],
  payment_destroyRoles: ["Viewer"],

  //Trending Permissions
  trending_findAllRoles: ["Viewer","Customize Homepage"],
  trending_findOneRoles: ["Viewer","Customize Homepage"],
  trending_createRoles: ["Customize Homepage"],
  trending_saveRoles: ["Customize Homepage"],
  trending_destroyRoles: ["Customize Homepage"],

});
