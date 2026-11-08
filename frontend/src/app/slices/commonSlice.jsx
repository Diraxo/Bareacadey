import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  //alert variables
  openAlert: false,
  severity: "error",
  message: "",
  autoHideDuration: 5000,
  vertical: "top",
  horizontal: "right",

  //dialog variables
  openDialog: false,
  openSidebar: false,
  header: "",
  position: "right",
  subtitle: "Please fill out the form below with the necessary information.",
  widthSidebar: 350,
  paddingXSidebar: 10,
  fullScreen: false,
  oneSide: true,
  disableDataTableWindows: false,

  //edit
  editId: 0,
  bulkEditIds: [],
  childOneId: 0,
  childTwoId: 0,
  childThreeId: 0,
  childFourId: 0,
  childFiveId: 0,
  uploadProgress: 0,

  onlineUsers: [],

  //common
  showMenus: false,
  startingLocation: "",
  timeZone: "America/New_York",

  //permissions
  permissions: {
    common: {
      email: ["Email"],
      chat: ["Chat"],
      contactUs: ["Contact Us"],
      jobPost: ["Job Post"],
      myTask: ["My Tasks"],
      activities: ["Activities"],
      cloud: ["Cloud Documents"],
    },
    settings: {
      view: ["View Settings"],
    },
    user: {
      view: ["View Users"],
      detail: ["View Detail"],
      add: ["Add Users"],
      edit: ["Edit Users"],
      delete: ["Delete Users"],
    },
    role: {
      view: ["View Role"],
      add: ["Add Role"],
      edit: ["Edit Role"],
      delete: ["Delete Role"],
    },
    //MyTask Permissions
    myTask: {
      view: ["My Tasks"],
      detail: ["My Tasks"],
      add: ["My Tasks"],
      edit: ["My Tasks"],
      delete: ["My Tasks"],
    },
    main: {
      //EmployeeCategory Permissions
      employeeCategory: {
        view: ["Manage Employee Categories", "View Users", "User Detail"],
        detail: ["Manage Employee Categories", "View Users", "User Detail"],
        add: ["Manage Employee Categories"],
        edit: ["Manage Employee Categories"],
        delete: ["Manage Employee Categories"],
      },
      //EmployeePosition Permissions
      employeePosition: {
        view: ["View Users", "User Detail", "Manage Employee Positions"],
        detail: ["View Users", "User Detail", "Manage Employee Positions"],
        add: ["Manage Employee Positions"],
        edit: ["Manage Employee Positions"],
        delete: ["Manage Employee Positions"],
      },
      //Department Permissions
      department: {
        view: ["View Users", "User Detail", "Manage Employee Departments"],
        detail: ["View Users", "User Detail", "Manage Employee Departments"],
        add: ["Manage Employee Departments"],
        edit: ["Manage Employee Departments"],
        delete: ["Manage Employee Departments"],
      },

      //LandingPageContent Permissions
      landingPageContent: {
        view: ["Customize Landing Page", "Public Access"],
        detail: ["Customize Landing Page", "Public Access"],
        add: ["Customize Landing Page"],
        edit: ["Customize Landing Page"],
        delete: ["Customize Landing Page"],
      },
      //Service Permissions
      service: {
        view: ["Customize Landing Page", "Public Access"],
        detail: ["Customize Landing Page", "Public Access"],
        add: ["Customize Landing Page"],
        edit: ["Customize Landing Page"],
        delete: ["Customize Landing Page"],
      },
      //Faq Permissions
      faq: {
        view: ["Public Access", "Customize Landing Page"],
        detail: ["Public Access", "Customize Landing Page"],
        add: ["Customize Landing Page"],
        edit: ["Customize Landing Page"],
        delete: ["Customize Landing Page"],
      },

      //contact us permissions
      contact: {
        view: ["Contact Us"],
        detail: ["Contact Us"],
        add: ["Contact Us", "Public Access"],
        edit: ["Contact Us", "Public Access"],
        delete: ["Contact Us"],
      },

      //Course Permissions
      course: {
        view: ["Instructor", "Viewer"],
        detail: ["Instructor", "Viewer"],
        add: ["Instructor"],
        edit: ["Instructor"],
        delete: ["Instructor"],
      },
      //Chapter Permissions
      chapter: {
        view: ["Instructor", "Viewer"],
        detail: ["Instructor", "Viewer"],
        add: ["Instructor"],
        edit: ["Instructor"],
        delete: ["Instructor"],
      },
      //UserRating Permissions
      userRating: {
        view: ["Viewer", "Instructor"],
        detail: ["Viewer", "Instructor"],
        add: ["Viewer"],
        edit: ["Viewer"],
        delete: ["Viewer"],
      },
      //CorouselItem Permissions
      corouselItem: {
        view: ["Customize Homepage"],
        detail: ["Customize Homepage"],
        add: ["Customize Homepage"],
        edit: ["Customize Homepage"],
        delete: ["Customize Homepage"],
      },
      //Category Permissions
      category: {
        view: ["Manage Categories"],
        detail: ["Manage Categories"],
        add: ["Manage Categories"],
        edit: ["Manage Categories"],
        delete: ["Manage Categories"],
      },
      //Payment Permissions
      payment: {
        view: ["Viewer", "Instructor"],
        detail: ["Viewer", "Instructor"],
        add: ["Viewer"],
        edit: ["Viewer"],
        delete: ["Viewer"],
      },
      //Trending Permissions
      trending: {
        view: ["Customize Homepage"],
        detail: ["Customize Homepage"],
        add: ["Customize Homepage"],
        edit: ["Customize Homepage"],
        delete: ["Customize Homepage"],
      },
    },
  },

  //basic settings
  currency: "ETB",
  fractionDigit: false,
  defaultCountrycode: "+251",

  courseId: 0,
};

const commonSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    showDialog: (state, action) => {
      state.openDialog = true;
      state.openSidebar = false;
      state.header = action.payload.header;
      state.subtitle = action.payload.subtitle ?? "Please fill out the form below with the necessary information.";
      state.editId = action.payload.editId ?? 0;
      state.disableDataTableWindows = action?.payload?.disableDataTableWindows ?? false;
      state.fullScreen = action?.payload?.fullScreen ? action?.payload?.fullScreen : false;
    },
    hideDialog: (state) => {
      state.openDialog = false;
      state.fullScreen = false;
    },
    showSidebar: (state, action) => {
      state.openSidebar = true;
      state.openDialog = false;
      state.header = action.payload.header;
      state.position = action.payload.position ?? "right";
      state.subtitle = action.payload.subtitle ?? "Please fill out the form below with the necessary information.";
      state.widthSidebar = action.payload.width ?? 350;
      state.paddingXSidebar = action.payload.paddingX ?? 10;
      state.editId = action?.payload?.editId ?? 0;
      state.fullScreen = action?.payload?.fullScreen ?? false;
      state.disableDataTableWindows = action?.payload?.disableDataTableWindows ?? false;
    },
    hideSidebar: (state) => {
      state.openSidebar = false;
    },
    handleCloseAlert: (state, action) => {
      state.openAlert = false;
    },
    setEditId: (state, action) => {
      state.editId = action.payload ?? 0
    },
    setBulkEditIds: (state, action) => {
      state.bulkEditIds = action.payload ?? []
    },
    setAlert: (state, action) => {
      const { openAlert, severity, message, autoHideDuration, vertical, horizontal } = action.payload;
      if (openAlert) {
        state.openAlert = openAlert;
      }
      if (severity) {
        state.severity = severity;
      }
      if (message) {
        state.message = message;
      }
      if (autoHideDuration) {
        state.autoHideDuration = autoHideDuration;
      }
      if (vertical) {
        state.vertical = vertical;
      }
      if (horizontal) {
        state.horizontal = horizontal;
      }
    },
    setCurrency: (state, action) => {
      state.currency = action.payload;
    },
    setDefaultCountryCode: (state, action) => {
      state.defaultCountrycode = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },

    setShowMenus: (state, action) => {
      state.showMenus = action?.payload ?? false
    },

    setChildOne: (state, action) => {
      state.childOneId = action?.payload ?? 0
    },
    setChildTwo: (state, action) => {
      state.childTwoId = action?.payload ?? 0
    },
    setChildThree: (state, action) => {
      state.childThreeId = action?.payload ?? 0
    },
    setChildFour: (state, action) => {
      state.childFourId = action?.payload ?? 0
    },
    setChildFive: (state, action) => {
      state.childFiveId = action?.payload ?? 0
    },
    setStartingLocation: (state, action) => {
      state.startingLocation = action.payload ?? ""
    },
    setCourseID: (state, action) => {
      state.courseId = action?.payload ?? 0
    },
  },
});


export const {
  handleCloseAlert,
  setAlert,
  showDialog,
  hideDialog,
  showSidebar,
  hideSidebar,
  setEditId,
  setBulkEditIds,
  setCurrency,
  setDefaultCountryCode,
  setOnlineUsers,
  setUploadProgress,
  setShowMenus,
  setChildOne,
  setChildTwo,
  setChildThree,
  setChildFour,
  setChildFive,
  setStartingLocation,
  setCourseID
} = commonSlice.actions;
export default commonSlice.reducer;
