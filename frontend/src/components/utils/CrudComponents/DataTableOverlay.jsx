import React, { useState, useEffect, useRef, useCallback } from "react";
// import { classNames } from "primereact/utils";
// import { FilterMatchMode, FilterOperator } from "primereact/api";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
// import { ProgressBar } from "primereact/progressbar";
import { OverlayPanel } from "primereact/overlaypanel";
import { Calendar } from "primereact/calendar";
import { MultiSelect } from "primereact/multiselect";
// import { Slider } from "primereact/slider";
// import { TriStateCheckbox } from "primereact/tristatecheckbox";
// import { Rating } from "primereact/rating";
import { InputText } from "primereact/inputtext";

import { RiFilterOffLine } from "react-icons/ri";
import { AiOutlineSearch, AiOutlineTable } from "react-icons/ai";
import {
  MdEdit,
  MdAddBox,
  MdDelete,
  MdClose,
  MdDeleteOutline,
  MdViewColumn,
  MdAdd,
  MdCalendarToday,
} from "react-icons/md";
import { TbDragDrop, TbEdit, TbList } from "react-icons/tb";
import { FaCheck, FaRegChartBar } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  setBulkEditIds,
  showDialog,
  showSidebar,
} from "../../../app/slices/commonSlice";
import DialogOverlay from "./DialogOverlay";
import SidebarOverlay from "./SidebarOverlay";

//react icons import
import {
  BsFillPatchCheckFill,
  BsTable,
  BsGrid,
  BsFilePdfFill,
  BsFileExcelFill,
  BsFiletypeCsv,
} from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import {
  MdOutlineKeyboardArrowRight,
  MdOutlineKeyboardArrowDown,
} from "react-icons/md";
//mui components
import {
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Checkbox,
  Avatar,
  Chip,
  Grid,
  ButtonGroup,
  Divider,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

//my custom compoonents
import { CheckboxOverlay, DatePickerOverlay, SelectOverlay, SliderOverlay } from "./InputsOverlay";
import {
  ButtonOverlay,
  MenuOverlay,
  PickListOverlay,
  PopoverOverlay,
  ProgressBarOverlay,
} from "./ComponentsOverlay";

//react router dom
import { useNavigate, useLocation } from "react-router-dom";

//data context api
import { useDataContext } from "../../../DataContext";
import { filterTemplate } from "../FilterTemplate";

import { BiExport, BiImport } from "react-icons/bi";
import { LuImport } from "react-icons/lu";
import { BsViewList } from "react-icons/bs";

import * as xlsx from "xlsx";

import CalendarOverlay from "../Calendar/CalendarOverlay";
import KanbanOverlay from "../Kanban/KanbanOverlay";
import GraphOverlay from "../Graph/GraphOverlay";
import { IoFilter } from "react-icons/io5";
import AttendanceOverlay from "../Attendance/AttendanceOverlay";
import { LuClipboardCheck } from "react-icons/lu";

import { GoDotFill } from "react-icons/go";
import { Paginator } from "primereact/paginator";
import { Tag } from "primereact/tag";

const DataTableOverlay = ({
  data = [],
  columns = [],
  paginator = true,
  showGridlines = true,
  rows = 10,
  rowsPerPageOptions = [5, 10, 25, 50, 100, 500, 1000],
  dataKey = "id",
  loading = false,
  emptyMessage = "No data found.",
  selection = [],
  onSelectionChange = (e) => { },
  selectionMode = null,
  editMode = "row",
  onRowEditComplete = (e) => { },
  onCellEditComplete = (e) => { },
  scrollable = false,
  scrollHeight = "900px",
  scrolldirection = "both",
  enableSelectCheckbox = false,
  title = "",
  size,
  routeTitle,
  cellSelection = false,
  metaKeySelection = false,
  dragSelection = false,
  add = {
    show: false,
    window: "dialog",
    header: "Dialog Header",
    component: <></>,
  },
  edit = {
    show: false,
    window: ["inline", "sidebar"],
    header: "Sidebar Header",
    component: <></>,
  },
  sideBar = { position: "right", paddingX: 10, width: 350 },
  showDelete = false,
  deleteLabel,
  filters,
  setFilters,
  globalFilterValue,
  setGlobalFilterValue,
  initFilters = () => { },
  tableWidth = "100%",
  deleteOkClick = () => { },
  onRowClick,
  allColumns = [],
  visibleColumnsArray,
  setVisibleColumnsArray,
  listView = 0,
  listViewSpacing = 10,
  tabbed = true,
  expandedRows,
  setExpandedRows,
  expandAllToggle,
  setExpandAllToggle,
  onRowToggle = () => { },
  onRowExpand = () => { },
  onRowCollapse = () => { },
  rowExpansionTemplate,
  rowGroupMode = "rowspan",
  expandableRowGroups = false,
  rowGroupHeaderTemplate,
  rowGroupFooterTemplate,
  groupRowsBy,

  listStyleView = false,
  cardForListView = true,
  paddingForListView = 15,
  listStyleTitle = "Item",

  gridComponent,
  noGridCountRestriction = false,
  gridSpacing = 6,
  editable = false,
  disableEditButton = false,
  detailClick,

  kanbanComponent,
  kanbanDropCallback,

  enableExport = false,
  importCallback,
  importFilter = [],
  exportImportTemplate = false,
  defaultExportFields = [],
  otherImport = [],
  importArguments = { header: 1, range: 0 },

  routeStates = [],
  defaultState = "all_state_routes",
  rowClassName,

  dialogZIndex = -1,
  extraButtons = [],
  extraFilterButtons = [],

  selectableCallback = (data) => true,
  rowColorCallback = (data) => ({ show: false, classes: ["bg-blue-400", "text-white"], messages: [] }),
  reorderableRows = false,
  reorderRowsCallback,

  filteredViews = [],
  resizeCallback,
  infoCalendar,
  setInfoCalendar,

  setInfoAttendance,
  attendanceBorderSeparate = false,
  attendanceUsers = [],
  attendanceUsersField = [],
  attendanceMarkType = "present",
  attendanceShowOpposite = true,
  attendanceWeekends = ["sat", "sun"],
  attendanceHideDatesAFter = true,
  attendanceLeave = { leaveTypes: [], freePassValues: ["Working"], freePassField: "consider_as", attendanceLeaveField: "leavetype_id" },

  graphData,
  customComponent,


  customFilters = [],
  customSelectFilters = [],

  startDate,
  setStartDate,
  endDate,
  setEndDate,
  refetchFunction = () => { },
  enableDateSelector = false,

  footerTemplate=()=>{},

}) => {

  const allViews = ["table", "list", "grid", "calendar", "kanban", "graph", "custom", "attendance"];
  const allowedViews = allViews.filter((view) => !filteredViews.includes(view));


  // const [filters, setFilters] = useState(null);
  // const [globalFilterValue, setGlobalFilterValue] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    setNewComponent,
    setEditComponent,
    setDetailComponent,
    new: NewComponent,
  } = useDataContext();
  const currency = useSelector((state) => state.common.currency);
  const disableDataTableWindows = useSelector(
    (state) => state.common.disableDataTableWindows
  );
  const authPermissions = useSelector(state => state?.auth?.user?.permissions);

  const [importData, setImportData] = useState([]);
  const [importDataOthers, setImportDataOthers] = useState({ value: [], props: null });

  const dt = useRef(null);
  const importOverlayRef = useRef(null);
  const importOtherOverlayRef = useRef(null);
  const exportImportOP = useRef(null);
  const exportImportPickListOP = useRef(null);


  const rowWarningMessageRef = useRef(null);
  const [warningMessages, setWarningMessages] = useState([])

  let defaultSelectedFilters = {}
  customFilters?.map((cf, index) => {
    if (cf?.defaultSelected) {
      const label = "index-" + index
      defaultSelectedFilters[label] = true
    }
  })
  let titleFilters = title?.split(" ")?.join("_").toLowerCase() + "_custom_filters";
  let df =
    localStorage.getItem(titleFilters) != null
      ? localStorage.getItem(titleFilters)
      : null;

  const [selectedFilters, setSelectedFilters] = useState(df ? JSON.parse(df) : defaultSelectedFilters)

  const [importButtonEvent, setImportButtonEvent] = useState(null);


  let lsTitle = title?.split(" ")?.join("_").toLowerCase() + "_listview";
  const lView =
    localStorage.getItem(lsTitle) == 0 ||
      localStorage.getItem(lsTitle) == 1 ||
      localStorage.getItem(lsTitle) == 2 ||
      localStorage.getItem(lsTitle) == 3 ||
      localStorage.getItem(lsTitle) == 4 ||
      localStorage.getItem(lsTitle) == 5 ||
      localStorage.getItem(lsTitle) == 6 ||
      localStorage.getItem(lsTitle) == 7 ||
      localStorage.getItem(lsTitle) == 8
      ? localStorage.getItem(lsTitle)
      : listView;
  const [listViewToggle, setListViewToggle] = useState(lView);

  let titleEditable = title?.split(" ")?.join("_").toLowerCase() + "_editable";
  let isEditable =
    localStorage.getItem(titleEditable) != null
      ? localStorage.getItem(titleEditable)
      : editable;
  // isEditable = isEditable??false
  const [editableToggle, setEditableToggle] = useState(
    isEditable == "true" ? true : false
  );

  const [addOrEdit, setAddOrEdit] = useState({
    add: false,
    edit: false,
  });
  //clear filter
  const clearFilter = () => {
    let lsTitle = title?.split(" ")?.join("_").toLowerCase();
    localStorage.setItem(lsTitle, "");
    initFilters(true);

    let titleFilters = title?.split(" ")?.join("_").toLowerCase() + "_custom_filters";
    localStorage.setItem(titleFilters, JSON.stringify(defaultSelectedFilters));

    setSelectedFilters(() => defaultSelectedFilters)
  };
  //global filter value
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
    let lsTitle = title?.split(" ")?.join("_").toLowerCase();
    localStorage.setItem(lsTitle, value);
  };

  const [anchorEl, setAnchorEl] = useState({
    anchor: null,
    id: 0,
  });
  const handleClickEl = (event, id, name) => {
    setAnchorEl({
      anchor: event.currentTarget,
      id: id,
      name: name,
    });
  };
  const handleCloseAnchor = () => {
    setAnchorEl({
      ...anchorEl,
      anchor: null,
      name: null,
    });
  };

  const [anchorElColumns, setAnchorElColumns] = useState(null);

  const handleClickElColumns = (event) => {
    setAnchorElColumns(event.currentTarget);
  };

  const handleCloseAnchorColumns = () => {
    setAnchorElColumns(null);
  };

  const [anchorElExport, setAnchorElExport] = useState(null);

  const handleClickElExport = (event) => {
    setAnchorElExport(event.currentTarget);
  };

  const handleCloseAnchorExport = () => {
    setAnchorElExport(null);
  };

  const [selectedState, setSelectedState] = useState(defaultState);

  const format_date_date_range_selector = (value) => {
    return value.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  let startDateString = title?.split(" ")?.join("_").toLowerCase() + "start_date_selected"
  const endDateString = title?.split(" ")?.join("_").toLowerCase() + "end_date_selected"
  let sDate = localStorage.getItem(startDateString) ?? new Date().getTime() - 7 * 24 * 60 * 60 * 1000
  let eDate = localStorage.getItem(endDateString) ?? new Date().getTime()

  useEffect(() => {
    if (!enableDateSelector) return;
    if (sDate) {
      setStartDate(new Date(parseFloat(sDate)));
    }
    if (eDate) {
      setEndDate(new Date(parseFloat(eDate)));
    }
  }, [])
  // const [startDate, setStartDate] = useState(new Date(parseFloat(sDate)))
  // const [endDate, setEndDate] = useState(new Date(parseFloat(eDate)))


  function chooseBestLocationForDateSelector() {
    let locations = ["top_of_header", "next-to-clear", "right-of-title", "routeState"]
    let rightOfTitleButtonsCount = 0;
    if (enableExport) rightOfTitleButtonsCount++;
    if (importCallback != null) rightOfTitleButtonsCount++;
    if (edit?.show && !disableEditButton) rightOfTitleButtonsCount++;
    rightOfTitleButtonsCount += extraButtons.length ?? 0;
    rightOfTitleButtonsCount += otherImport.length ?? 0;

    let nextToClearButtonsCount = extraFilterButtons.length;

    let result = location[2];
    if (rightOfTitleButtonsCount > 2) {
      result = locations[1]
      if (nextToClearButtonsCount > 0 && routeStates.length >= 2) {
        if (routeStates.length <= 0) {
          result = locations[3]
        }
        else {
          result = locations[0];
        }
      }
    }
    return result;

  }
  const dateSelectorLocation = chooseBestLocationForDateSelector();

  const opDateRangeSelector = useRef(null)
  const dateRangeSelector = () => {
    return (
      <div className="">
        <p className={`border p-3  rounded-md ${dateSelectorLocation == "next-to-clear" ? "" : "shadow-2"} font-bold hover:cursor-pointer flex items-center`} style={{ height: dateSelectorLocation == "next-to-clear" ? 38 : "auto" }} onClick={(e) => opDateRangeSelector?.current.toggle(e)}>{format_date_date_range_selector(startDate) + " - " + format_date_date_range_selector(endDate)}</p>
        <OverlayPanel ref={opDateRangeSelector}>
          <div className="flex flex-col" style={{ maxWidth: 400 }}>
            <div className="flex">
              <DatePickerOverlay
                mui={false}
                value={startDate}
                // setValue={setStartDate}
                onChange={(date) => {
                  localStorage.setItem(startDateString, date.getTime())
                  setStartDate(() => date)
                }}
                borderRadius={0}
              />
              <DatePickerOverlay
                mui={false}
                value={endDate}
                // setValue={setEndDate}
                onChange={(date) => {
                  localStorage.setItem(endDateString, date.getTime())
                  setEndDate(() => date)
                }}
                borderRadius={0}
              />
            </div>
            <div>
              <ButtonOverlay
                text="Confirm"
                sx={{
                  width: '100%',
                  height: 40
                }}
                loading={loading}
                // loadingPosition="start"
                onClick={() => {
                  refetchFunction();
                  if (opDateRangeSelector?.current) {
                    opDateRangeSelector?.current.hide()
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Tag
                value="This Week"
                severity={"primary"}
                className="hover:cursor-pointer"
                onClick={() => {
                  const date = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
                  localStorage.setItem(startDateString, date.getTime())
                  localStorage.setItem(endDateString, new Date().getTime())
                  setStartDate(() => date)
                  setEndDate(() => new Date())
                }}
              />
              <Tag
                value="This Month"
                severity={"success"}
                className="hover:cursor-pointer"
                onClick={() => {
                  const date = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
                  localStorage.setItem(startDateString, date.getTime())
                  localStorage.setItem(endDateString, new Date().getTime())
                  setStartDate(() => date)
                  setEndDate(() => new Date())
                }}
              />
              <Tag
                value="This Year"
                severity={"warning"}
                className="hover:cursor-pointer"
                onClick={() => {
                  const date = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000)
                  localStorage.setItem(startDateString, date.getTime())
                  localStorage.setItem(endDateString, new Date().getTime())
                  setStartDate(() => date)
                  setEndDate(() => new Date())
                }}
              />
            </div>
          </div>
        </OverlayPanel>
      </div>

    )
  }

  const Header = () => {
    return (
      <div className="flex flex-col gap-2">
        {dateSelectorLocation == "top_of_header" && <div className="flex justify-start">
          {(enableDateSelector) && dateRangeSelector()}
        </div>}
        <div className="flex flex-wrap gap-3 justify-start md:justify-between mb-2 mt-1 items-end">
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2 items-center">
              {customFilters?.length > 0 &&
                <MenuOverlay
                  anchorHorizontal="left"
                  transformHorizontal="left"
                  arrow={false}
                  sx={{ minWidth: 200, marginTop: 4, border: theme?.palette?.mode == "light" ? '0.1px solid rgba(0,0,0,.3)' : '1px solid rgba(255,255,255,.1)' }}

                  button={
                    <div
                      className="border p-2 rounded cursor-pointer opacity-80"
                      style={{ borderColor: theme?.palette?.primary?.dark }}
                    >
                      <IoFilter color={theme?.palette?.primary?.light} />
                    </div>
                  }
                  closeOnClick={false}
                  menuItems={customFilters?.map((cf, index) => {
                    const label = "index-" + index
                    const selected = selectedFilters[label] ?? false
                    return {

                      name: <p className={selected ? "font-bold" : ""}>{cf?.name}</p>,
                      icon: selected ? <FaCheck size={13} /> : <span className="pr-3"></span>,

                      onClick: (e) => {
                        let titleFilters = title?.split(" ")?.join("_").toLowerCase() + "_custom_filters";
                        localStorage.setItem(titleFilters, JSON.stringify({ ...selectedFilters, [label]: ((!selectedFilters[label]) ? !selectedFilters[label] : false) }));
                        setSelectedFilters(() => ({ ...selectedFilters, [label]: ((!selectedFilters[label]) ? !selectedFilters[label] : false) }))
                      },
                      divider: cf?.divider && index < customFilters?.length - 1 ? true : false
                    }
                  })}
                />

              }
              <Button
                onClick={clearFilter}
                variant="outlined"
                style={{ height: 35 }}
                startIcon={<RiFilterOffLine />}
                sx={{
                  display: { xss: "none", xs: "none", sm: "flex" },
                }}
              >
                Clear
              </Button>

              {dateSelectorLocation == "next-to-clear" && <div className="">
                {(enableDateSelector) && dateRangeSelector()}
              </div>}

              <div className="flex flex-wrap gap-3 p-2 items-center -mb-2 mt-2"> {/** mb-2 -mt-2 */}
                {extraFilterButtons &&
                  extraFilterButtons?.map((extraFilterButton, index) => {
                    return <div key={index}>{extraFilterButton}</div>
                  })}
              </div>

            </div>
          </div>

          {!sm && dateSelectorLocation == "routeState" && <div className="">
            {(enableDateSelector) && dateRangeSelector()}
          </div>}

          {!sm && (
            <div>
              {routeStates?.length > 1 && (
                <div>
                  <ButtonGroup variant="outlined">
                    <Button
                      variant={
                        selectedState == "all_state_routes"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() => {
                        setSelectedState("all_state_routes");
                      }}
                      sx={
                        {
                          // borderRadius: 3
                        }
                      }
                    >
                      All
                    </Button>
                    {routeStates?.map((routeState) => {
                      if (routeState?.access?.length > 0) {
                        if (!routeState?.access?.some(item => authPermissions?.includes(item))) {
                          return;
                        }
                      }
                      return (
                        <Button
                          key={routeState?.label}
                          variant={
                            selectedState == routeState?.label
                              ? "contained"
                              : "outlined"
                          }
                          onClick={() => {
                            setSelectedState(routeState?.label);
                          }}
                          sx={{
                            // borderRadius: 3,
                            borderColor:
                              routeState?.color &&
                                selectedState != routeState?.label
                                ? routeState?.color
                                : "",
                            color:
                              routeState?.color &&
                                selectedState != routeState?.label
                                ? routeState?.color
                                : "",
                            backgroundColor:
                              routeState?.color &&
                                selectedState == routeState?.label
                                ? routeState?.color
                                : "",
                          }}
                        >
                          {routeState?.header}
                        </Button>
                      );
                    })}
                  </ButtonGroup>
                </div>
              )}
            </div>
          )}

          <div className="flex items-end justify-between gap-4 mr-2 ml-2 sm:ml-4 md:ml-0 w-full md:w-auto">
            <TextField
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              //label="Keyword Search"
              placeholder="Search"
              variant="standard"
              size="medium"
              sx={{
                width: { xss: 0, xs: 180, sm: 200 },
                display: { xss: "none", xs: "block" },
                "& .MuiInputBase-root": {
                  height: 40,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AiOutlineSearch />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <MdClose
                      onClick={() => {
                        const value = "";
                        let _filters = { ...filters };
                        _filters["global"].value = value;

                        setFilters(_filters);
                        setGlobalFilterValue(value);
                        let lsTitle = title?.split(" ")?.join("_").toLowerCase();
                        localStorage.setItem(lsTitle, value);
                      }}
                      size={15}
                      style={{ marginTop: 10 }}
                      className="text-gray-300 hover:text-gray-700 hover:cursor-pointer"
                    />
                  </InputAdornment>
                ),
              }}
            />
            <div
              style={{ marginBottom: 0 }}
              className={`flex ${edit.show && showDelete ? "gap-2" : "gap-3"
                } text-gray-700`}
            >
              <div className={`px-1 ${selection?.length > 0 || add.show ? "border" : ""} rounded flex flex-wrap justify-center items-center gap-2`}>
                {((selectionMode === "multiple" &&
                  enableSelectCheckbox &&
                  selection?.length > 0) ||
                  (selectionMode === "single" &&
                    enableSelectCheckbox &&
                    selection?.id)) &&
                  (showDelete ?? false) && (
                    <MdDeleteOutline
                      onClick={(e) => {
                        handleClickEl(
                          e,
                          selection?.id,
                          selection[deleteLabel] ? selection[deleteLabel] : null
                        );
                      }}
                      size={edit.show ? 26 : 28}
                      style={{ marginTop: edit.show ? 1 : 0 }}
                      className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                    />
                  )}
                {((selectionMode === "multiple" && selection?.length > 0) ||
                  (selectionMode === "single" && selection?.id)) &&
                  edit.show && (
                    <TbEdit
                      onClick={() => {
                        dispatch(
                          setBulkEditIds(selection?.map((sel) => sel?.id))
                        );
                        if (edit?.window?.includes("dialog")) {
                          dispatch(
                            showDialog({
                              header: edit.header ?? "",
                              openDialog: true,
                            })
                          );
                        } else if (edit?.window?.includes("sidebar")) {
                          dispatch(
                            showSidebar({
                              header: edit.header ?? "",
                              openDialog: false,
                              openSidebar: true,
                              position:
                                sideBar.position === "right"
                                  ? "right"
                                  : sideBar.position === "left"
                                    ? "left"
                                    : sideBar.position === "top"
                                      ? "top"
                                      : sideBar.position === "bottom"
                                        ? "bottom"
                                        : "right",
                              subtitle:
                                edit?.subtitle ??
                                "Please fill out the form below with the necessary information.",
                              paddingX: sideBar?.paddingX ?? 10,
                              width: sideBar?.width ?? 350,
                            })
                          );
                        } else if (edit?.window?.includes("newpage")) {
                          setEditComponent(() => edit.component);
                          navigate(location.pathname + "/edit", {
                            state: {
                              header: edit?.header,
                              subtitle:
                                edit?.subtitle ??
                                "Please fill out the form below with the necessary information.",
                            },
                          });
                        }
                        setAddOrEdit({ add: false, edit: true });
                      }}
                      size={26}
                      style={{ marginTop: 1, marginLeft: 3 }}
                      className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                    />
                  )}
                {(add.show ?? false) && (
                  <MdAddBox
                    onClick={() => {
                      if (add?.window === "dialog") {
                        dispatch(
                          showDialog({
                            header: add.header ?? "",
                            openDialog: true,
                            fullScreen: add?.fullScreen ?? false
                          })
                        );
                      } else if (add?.window === "sidebar") {
                        dispatch(
                          showSidebar({
                            header: add.header ?? "",
                            openDialog: true,
                            position:
                              sideBar.position === "right"
                                ? "right"
                                : sideBar.position === "left"
                                  ? "left"
                                  : sideBar.position === "top"
                                    ? "top"
                                    : sideBar.position === "bottom"
                                      ? "bottom"
                                      : "right",
                            subtitle:
                              add?.subtitle ??
                              "Please fill out the form below with the necessary information.",
                            paddingX: sideBar?.paddingX ?? 10,
                            width: sideBar?.width ?? 350,
                            fullScreen: add?.fullScreen ?? false
                          })
                        );
                      } else if (add?.window === "newpage") {
                        setNewComponent(() => add.component);
                        navigate(location.pathname + "/new", {
                          state: {
                            header: add?.header,
                            subtitle:
                              add?.subtitle ??
                              "Please fill out the form below with the necessary information.",
                          },
                        });
                      }
                      setAddOrEdit({ add: true, edit: false });
                    }}
                    size={27}
                    className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                  />
                )}
              </div>

              {/* {!groupRowsBy && ((listViewToggle == 2) || (listViewToggle == 1 && !gridComponent)) ? 
            <BsTable
                onClick={(e) => {
                  let lsTitle = title?.split(" ")?.join("_").toLowerCase()+"_listview";
                  let lvt = listViewToggle;
                  lvt = 0;
                  localStorage.setItem(lsTitle, lvt)
                  setListViewToggle(lvt)
                }}
                size={19}
                style={{ marginTop: 4.5}}
                
                className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
              />
              : (listViewToggle == 1 && gridComponent) ? 
              <BsGrid
                onClick={(e) => {
                  let lsTitle = title?.split(" ")?.join("_").toLowerCase()+"_listview";
                  let lvt = listViewToggle;
                  if(gridComponent) {
                      lvt = 2;
                  }
                  else {
                    lvt = 0;
                  }
                  localStorage.setItem(lsTitle, lvt)
                  setListViewToggle(lvt)
                }}
                size={20}
                style={{borderRadius: 0, marginTop: 4}}
                className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
              />
              :
              <TbList
                onClick={(e) => {
                  let lsTitle = title?.split(" ")?.join("_").toLowerCase()+"_listview";
                  let lvt = listViewToggle;
                  lvt = 1;
                  localStorage.setItem(lsTitle, lvt)
                  setListViewToggle(lvt)
                }}
                size={28}
                style={{borderRadius: 50}}
                className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
              />
            } */}
              {/*
            <ButtonGroup
              color="secondary"
              style={{ height: 26, borderRadius: 0, marginTop: 1 }}
            >
              <Button
                color={listViewToggle == 0 ? "primary" : "secondary"}
                variant={listViewToggle == 0 ? "contained" : "outlined"}
                style={{ padding: 0, borderRadius: 1 }}
                onClick={(e) => {
                  let lsTitle =
                    title?.split(" ")?.join("_").toLowerCase() + "_listview";
                  let lvt = listViewToggle;
                  lvt = 0;
                  localStorage.setItem(lsTitle, lvt);
                  setListViewToggle(lvt);
                }}
              >
                <BsTable
                  
                  size={17}
                  style={{ marginBottom: -2 }}
                  className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                />
              </Button>
              <Button
                color={listViewToggle == 1 ? "primary" : "secondary"}
                variant={listViewToggle == 1 ? "contained" : "outlined"}
                style={{ padding: 0, borderRadius: 1 }}
                onClick={(e) => {
                  let lsTitle =
                    title?.split(" ")?.join("_").toLowerCase() + "_listview";
                  let lvt = listViewToggle;
                  lvt = 1;
                  localStorage.setItem(lsTitle, lvt);
                  setListViewToggle(lvt);
                }}
              >
                <TbList
                  
                  size={24}
                  style={{ borderRadius: 50, marginBottom: -2 }}
                  className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                />
              </Button>
              <Button
                color={listViewToggle == 2 ? "primary" : "secondary"}
                variant={listViewToggle == 2 ? "contained" : "outlined"}
                style={{ padding: 0, borderRadius: 1 }}
                onClick={(e) => {
                  let lsTitle = title?.split(" ")?.join("_").toLowerCase()+"_listview";
                  let lvt = listViewToggle;
                  if(gridComponent) {
                      lvt = 2;
                  }
                  else {
                    lvt = 0;
                  }
                  localStorage.setItem(lsTitle, lvt)
                  setListViewToggle(lvt)
                }}
              >
                <BsGrid
                  size={17}
                  style={{ borderRadius: 0, marginBottom: -2 }}
                  className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                />
              </Button>
            </ButtonGroup>
            */}
              {
                <div className="flex items-center gap-2 border px-2 ml-1 rounded">
                  {allowedViews.includes("table") && (
                    <Tooltip title="Table View">
                      <div>
                        <BsTable
                          onClick={(e) => {
                            let lsTitle =
                              title?.split(" ")?.join("_").toLowerCase() + "_listview";
                            let lvt = listViewToggle;
                            lvt = 0;
                            localStorage.setItem(lsTitle, lvt);
                            setListViewToggle(lvt);
                          }}
                          size={18}
                          style={{
                            marginBottom: -2,
                            color:
                              listViewToggle == 0 ? theme?.palette?.primary?.dark : "",
                          }}
                          className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                        />
                      </div>
                    </Tooltip>
                  )}
                  {allowedViews.includes("list") && !groupRowsBy && (
                    <Tooltip title="List View">
                      <div>
                        <TbList
                          onClick={(e) => {
                            let lsTitle =
                              title?.split(" ")?.join("_").toLowerCase() + "_listview";
                            let lvt = listViewToggle;
                            lvt = 1;
                            localStorage.setItem(lsTitle, lvt);
                            setListViewToggle(lvt);
                          }}
                          size={25}
                          style={{
                            borderRadius: 50,
                            marginBottom: -2,
                            color:
                              listViewToggle == 1 ? theme?.palette?.primary?.dark : "",
                          }}
                          className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                        />
                      </div>
                    </Tooltip>
                  )}
                  {allowedViews.includes("grid") && gridComponent && (
                    <Tooltip title="Grid View">
                      <div>
                        <BsGrid
                          onClick={(e) => {
                            let lsTitle =
                              title?.split(" ")?.join("_").toLowerCase() + "_listview";
                            let lvt = listViewToggle;
                            if (gridComponent) {
                              lvt = 2;
                            } else {
                              lvt = 0;
                            }
                            localStorage.setItem(lsTitle, lvt);
                            setListViewToggle(lvt);
                          }}
                          size={19}
                          style={{
                            borderRadius: 0,
                            marginBottom: -2,
                            color:
                              listViewToggle == 2 ? theme?.palette?.primary?.dark : "",
                          }}
                          className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                        />
                      </div>
                    </Tooltip>
                  )}
                  {!sm && allowedViews.includes("kanban") && kanbanComponent && routeStates?.length > 0 && (
                    <Tooltip title="Kanban View">
                      <div>
                        <TbDragDrop
                          onClick={(e) => {
                            let lsTitle =
                              title?.split(" ")?.join("_").toLowerCase() + "_listview";
                            let lvt = listViewToggle;
                            if (kanbanComponent) {
                              lvt = 3;
                            } else {
                              lvt = 0;
                            }
                            localStorage.setItem(lsTitle, lvt);
                            setListViewToggle(lvt);
                          }}
                          size={22}
                          style={{
                            borderRadius: 0,
                            marginBottom: -2,
                            color:
                              listViewToggle == 3 ? theme?.palette?.primary?.dark : "",
                          }}
                          className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                        />
                      </div>
                    </Tooltip>
                  )}
                  {!sm && allowedViews.includes("calendar") && resizeCallback && (
                    <Tooltip title="Calendar View">
                      <div>
                        <MdCalendarToday
                          onClick={(e) => {
                            let lsTitle =
                              title?.split(" ")?.join("_").toLowerCase() + "_listview";
                            let lvt = listViewToggle;
                            // if (kanbanComponent) {
                            //   lvt = 3;
                            // } else {
                            //   lvt = 0;
                            // }
                            lvt = 5
                            localStorage.setItem(lsTitle, lvt);
                            setListViewToggle(lvt);
                          }}
                          size={20}
                          style={{
                            borderRadius: 0,
                            marginBottom: -1,
                            color:
                              listViewToggle == 5 ? theme?.palette?.primary?.dark : "",
                          }}
                          className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                        />
                      </div>
                    </Tooltip>
                  )}
                  {!sm && allowedViews.includes("attendance") && attendanceUsers?.length > 0 && attendanceUsersField?.length > 0 && (
                    <Tooltip title="Attendance View">
                      <div>

                        <LuClipboardCheck
                          onClick={(e) => {
                            let lsTitle =
                              title?.split(" ")?.join("_").toLowerCase() + "_listview";
                            let lvt = listViewToggle;
                            // if (kanbanComponent) {
                            //   lvt = 3;
                            // } else {
                            //   lvt = 0;
                            // }
                            lvt = 8
                            localStorage.setItem(lsTitle, lvt);
                            setListViewToggle(lvt);
                          }}
                          size={21}
                          style={{
                            borderRadius: 0,
                            marginBottom: -1,
                            color:
                              listViewToggle == 8 ? theme?.palette?.primary?.dark : "",
                          }}
                          className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                        />
                      </div>
                    </Tooltip>
                  )}
                  {allowedViews.includes("graph") && graphData && (
                    <Tooltip title="Graph View">
                      <div>
                        <FaRegChartBar
                          onClick={(e) => {
                            let lsTitle =
                              title?.split(" ")?.join("_").toLowerCase() + "_listview";
                            let lvt = listViewToggle;
                            // if (kanbanComponent) {
                            //   lvt = 3;
                            // } else {
                            //   lvt = 0;
                            // }
                            lvt = 6
                            localStorage.setItem(lsTitle, lvt);
                            setListViewToggle(lvt);
                          }}
                          size={20}
                          style={{
                            borderRadius: 0,
                            marginBottom: -1,
                            color:
                              listViewToggle == 6 ? theme?.palette?.primary?.dark : "",
                          }}
                          className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                        />
                      </div>
                    </Tooltip>
                  )}
                  {allowedViews.includes("custom") && customComponent && (
                    <Tooltip title="Custom View">
                      <div>
                        <BsViewList
                          onClick={(e) => {
                            let lsTitle =
                              title?.split(" ")?.join("_").toLowerCase() + "_listview";
                            let lvt = listViewToggle;
                            if (customComponent) {
                              lvt = 7;
                            } else {
                              lvt = 0;
                            }
                            localStorage.setItem(lsTitle, lvt);
                            setListViewToggle(lvt);
                          }}
                          size={19}
                          style={{
                            borderRadius: 0,
                            marginBottom: -2,
                            color:
                              listViewToggle == 7 ? theme?.palette?.primary?.dark : "",
                          }}
                          className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                        />
                      </div>
                    </Tooltip>
                  )}
                </div>
              }
              {visibleColumnsArray != null && ![2, 3, 5, 6, 8]?.includes(listViewToggle) && (
                <Tooltip title="Columns">
                  <div className="px-1 border rounded">
                    <MdViewColumn
                      onClick={(e) => {
                        handleClickElColumns(e);
                      }}
                      size={27}
                      style={{ borderRadius: 50 }}
                      className="hover:cursor-pointer dark:text-gray-400 hover:text-gray-500"
                    />
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**** filter button templates  ***/
  const filterClearTemplate = (options) => {
    return (
      <Button
        onClick={options.filterClearCallback}
        color="primary"
        variant="outlined"
        size="small"
        sx={{
          marginBottom: 1,
        }}
      >
        Clear
      </Button>
    );
  };

  const filterApplyTemplate = (options) => {
    return (
      <Button
        onClick={options.filterApplyCallback}
        color="primary"
        variant="contained"
        size="small"
        sx={{
          marginBottom: 1,
        }}
      >
        Apply
      </Button>
    );
  };
  /**** end of filter button templates ****/

  /**** user templates  ****/

  // const userBodyTemplate = (rowData) => {
  //   const representative = rowData.representative;
  //   return (
  //     <React.Fragment>
  //       <div className="flex justify-start items-center">
  //         <img
  //           alt={representative.name}
  //           src={`http://localhost:5173/src/pages/users/demo/images/avatar/${representative.image}`}
  //           onError={(e) =>
  //             (e.target.src =
  //               "https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png")
  //           }
  //           width={32}
  //           style={{ verticalAlign: "middle" }}
  //         />
  //         <span style={{ marginLeft: ".5em", verticalAlign: "middle" }}>
  //           {representative.name}
  //         </span>
  //       </div>
  //     </React.Fragment>
  //   );
  // };
  const userBodyTemplate = (rowData, filterField, nameLabel, imgLabel) => {
    const user = rowData[filterField];
    return (
      <React.Fragment>
        <div className="flex justify-start items-center">
          {/* <img
            alt={user[nameLabel]}
            // src={`http://localhost:5173/src/pages/users/demo/images/avatar/${representative.image}`}
            src={user[imgLabel]}
            onError={(e) =>
              (e.target.src =
                "https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png")
            }
            width={32}
            style={{ verticalAlign: "middle", borderRadius: '50%' }}
          /> */}
          <Avatar src={user[imgLabel]} sx={{ width: 34, height: 34 }} />
          <span style={{ marginLeft: ".5em", verticalAlign: "middle" }}>
            {user[nameLabel]}
          </span>
        </div>
      </React.Fragment>
    );
  };

  const userFilterTemplate = (
    options,
    label = "Person Picker",
    filterField,
    nameLabel,
    imgLabel,
    userFilterOptions
  ) => {
    return (
      <>
        <div className="mb-3 text-bold">{label}</div>
        <MultiSelect
          value={options.value}
          options={userFilterOptions.userFilterOptions}
          itemTemplate={(option) =>
            usersItemTemplate(option, nameLabel, imgLabel)
          }
          onChange={(e) => {
            options.filterCallback(e.value);
          }}
          filter
          filterTemplate={(options) => filterTemplate(options, true)}
          emptyFilterMessage={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 50,
              }}
            >
              <div
                className="px-4 py-1 rounded-md"
                style={{ fontWeight: 500, fontSize: 13 }}
              >
                No available options
              </div>
            </div>
          }
          optionLabel="name"
          placeholder="Any"
          className="p-column-filter"
        />
      </>
    );
  };

  const usersItemTemplate = (option, nameLabel, imgLabel) => {
    const name = option;
    return (
      <div className="p-multiselect-representative-option flex items-center justify-start">
        {/* <img
          alt={name[nameLabel]}
          src={name[imgLabel]}
          width={32}
          style={{ verticalAlign: "middle", borderRadius: '50%' }}
        /> */}
        <Avatar src={name[imgLabel]} sx={{ width: 29, height: 29 }} />
        <span style={{ marginLeft: ".5em", verticalAlign: "middle" }}>
          {name[nameLabel]}
        </span>
      </div>
    );
  };
  /**** end of user templates ****/

  /**** country templates   ****/
  const countryBodyTemplate = (
    rowData,
    nameLabel,
    label = "name",
    imgLabel = "img"
  ) => {
    return (
      <React.Fragment>
        <div className="flex justify-start items-center">
          {/* <img
            alt="flag"
            src={`http://localhost:5173/src/pages/users/demo/images/flag/flag_placeholder.png`}
            className={`flag flag-${rowData[country].code}`}
            width={30}
          /> */}
          <Avatar
            src={rowData[nameLabel]?.[imgLabel]}
            sx={{ width: 34, height: 34 }}
          />
          <span style={{ marginLeft: ".5em", verticalAlign: "middle" }}>
            {rowData[nameLabel]?.[label]}
          </span>
        </div>
      </React.Fragment>
    );
  };
  /**** end of country templates ****/

  /**** country templates   ****/
  const userAltBodyTemplate = (
    rowData,
    nameLabel,
    label = "name",
    imgLabel = "img"
  ) => {
    return (
      <React.Fragment>
        <div className="flex justify-start items-center">
          {/* <img
            alt="flag"
            src={`http://localhost:5173/src/pages/users/demo/images/flag/flag_placeholder.png`}
            className={`flag flag-${rowData[country].code}`}
            width={30}
          /> */}
          <Avatar
            src={rowData[nameLabel]?.[imgLabel]}
            sx={{ width: 34, height: 34 }}
          />
          <span style={{ marginLeft: ".5em", verticalAlign: "middle" }}>
            {rowData[nameLabel]?.[label]}
          </span>
        </div>
      </React.Fragment>
    );
  };
  /**** end of country templates ****/

  /**** date template ****/

  const dateBodyTemplate = (rowData, nameLabel = "date") => {
    return formatDate(rowData[nameLabel] ?? "");
  };

  const dateFilterTemplate = (options) => {
    return (
      <Calendar
        value={options.value}
        onChange={(e) => {
          let date = new Date(e.value);
          options.filterCallback(date);
        }}
        dateFormat="mm/dd/yy"
        placeholder="mm/dd/yyyy"
        mask="99/99/9999"
      />
    );
  };

  const formatDate = (value) => {
    return value.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  /**** end of date template  ****/

  /**** balance template  ****/

  const balanceBodyTemplate = (rowData) => {
    return formatCurrency(rowData.balance);
  };

  const balanceFilterTemplate = (options) => {
    return (
      <InputNumber
        value={options.value}
        onChange={(e) => options.filterCallback(e.value, options.index)}
        mode="currency"
        currency={currency}
        locale="en-US"
      />
    );
  };

  const formatCurrency = (value) => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: currency,
    });
  };

  /**** end of balance template ****/

  /**** status template  ****/

  const statusBodyTemplate = (
    rowData,
    nameLabel,
    options,
    optionNameLabel = "name",
    optionValueLabel = "value",
    optionColorLabel = "color",
    sx = {}
  ) => {
    return (
      <span>
        {options?.map((option, index) => {
          if (option[optionValueLabel] === rowData[nameLabel]) {
            return option[optionColorLabel] ? (
              <span
                className={`customer-badge status-${rowData[nameLabel]}`}
                key={index}
              >
                <Chip
                  key={index}
                  sx={{
                    height: 25,
                    borderRadius: 1,
                    color: "white",
                    backgroundColor: option[optionColorLabel] ?? "",
                    ...sx,
                  }}
                  label={option[optionNameLabel]}
                />
              </span>
            ) : (
              <span key={index}>{option[optionNameLabel]}</span>
            );
          }
        })}
        {/* {rowData[nameLabel]} */}
      </span>
    );
  };

  const statusFilterTemplate = (
    options,
    statusOptions,
    placeholder = "Select a status",
    optionNameLabel = "name",
    optionValueLabel = "value",
    optionColorLabel = "color",
    sx = {}
  ) => {
    return (
      <Dropdown
        value={options.value}
        options={statusOptions}
        onChange={(e) => {
          options.filterCallback(e.value, options.index);
        }}
        optionValue={optionValueLabel}
        optionLabel={optionNameLabel}
        itemTemplate={(option) =>
          statusItemTemplate(
            option,
            optionNameLabel,
            optionValueLabel,
            optionColorLabel,
            (sx = {})
          )
        }
        // placeholder={placeholder}
        className="p-column-filter"
        showClear
      />
    );
  };

  const statusItemTemplate = (
    option,
    optionNameLabel = "name",
    optionValueLabel = "value",
    optionColorLabel = "color",
    sx = {}
  ) => {
    return option[optionColorLabel] ? (
      <span className={`customer-badge`}>
        <Chip
          sx={{
            height: 25,
            borderRadius: 1,
            color: "white",
            backgroundColor: option[optionColorLabel] ?? "",
            ...sx,
          }}
          label={option[optionNameLabel]}
        />
      </span>
    ) : (
      <span>{option[optionNameLabel]}</span>
    );
  };

  /**** end of status template ****/

  /**** progress template ****/

  const progressBodyTemplate = (rowData, nameLabel) => {
    return (
      <ProgressBarOverlay
        value={rowData[nameLabel]}
        showValue={false}
        sx={{ height: ".5rem" }}
      />
    );
  };

  const progressFilterTemplate = (options, min = 0, max = 100, nameLabel) => {
    return (
      <React.Fragment>
        {/* <Slider
          value={options.value}
          onChange={(e) => options.filterCallback(e.value)}
          range
          min={min}
          max={max}
          className="m-3"
        ></Slider> */}
        <SliderOverlay
          type="pretty"
          value={options.value ?? [0, 100]}
          onChange={(event, newValue) => {
            options.filterCallback(newValue);
          }}
          min={min}
          max={max}
          sx={{ width: "90%", ml: "7px" }}
        />
        <div className="flex align-items-center justify-content-between px-2">
          <span>{options.value ? options.value[0] : min}</span>
          <span>{options.value ? options.value[1] : max}</span>
        </div>
      </React.Fragment>
    );
  };

  /**** end of progress template ****/

  /**** verified template  ****/

  const verifiedBodyTemplate = (rowData, nameLabel) => {
    return (
      <div className="flex justify-start pl-4">
        {rowData[nameLabel] ? (
          <BsFillPatchCheckFill size={20} color="#2b91f7" />
        ) : (
          <AiOutlineCloseCircle size={20} color="#ed4e84" />
        )}
      </div>
    );
  };

  const verifiedFilterTemplate = (options, label = "") => {
    return (
      <div>
        {label && <div className="mb-3 text-bold text-lg">{label}</div>}
        <Checkbox
          sx={{ "& .MuiSvgIcon-root": { fontSize: 25 } }}
          checked={options.value ?? false}
          onChange={(e) => options.filterCallback(e.target.checked)}
        />
      </div>
    );
  };

  /**** end of verified template ****/

  /*** editors  ****/

  const textEditor = (options) => {
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
      />
    );
  };



  const priceEditor = (options) => {
    return (
      <InputNumber
        value={options.value}
        onValueChange={(e) => options.editorCallback(e.value)}
        mode="currency"
        currency="USD"
        locale="en-US"
      />
    );
  };

  const cellEditor = (options) => {
    if (options.field === "price") return priceEditor(options);
    else return textEditor(options);
  };

  /**** end of editors ****/

  useEffect(() => {
    initFilters();
  }, []);

  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  const xs = useMediaQuery(theme.breakpoints.down("xs"));

  const emptyMessageComponent = (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 100,
      }}
    >
      <div
        className="text-white px-3 py-1 rounded-xl"
        style={{ backgroundColor: theme.palette.primary.dark, fontWeight: 700 }}
      >
        {emptyMessage}
      </div>
    </div>
  );


  const getRowWarningMessages = (data) => {
    const dt = rowColorCallback(data)
    let colorClasses = dt?.classes?.join(" ")
    return { show: dt?.show, classes: colorClasses, messages: dt?.messages ?? [] }
  }

  const getRowColorClasses = (data) => {
    let colorClasses = {}
    if (rowColorCallback(data)?.show) {
      rowColorCallback(data)?.classes?.map((cl) => {
        colorClasses[cl] = true
      })
    }
    return colorClasses
  }
  const rowClass = (data) => {
    return {
      card: listViewToggle == 1 ? true : false,
      "drop-shadow-sm": listViewToggle == 1 ? true : false,
      "hover:bg-gray-200":
        editableToggle || theme?.palette?.mode == "dark" ? false : true,
      "hover:bg-gray-700":
        editableToggle || theme?.palette?.mode == "light" ? false : true,
      "hover:cursor-pointer": editableToggle ? false : true,
      "hover:text-blue-400": editableToggle ? false : true,
      ...getRowColorClasses(data)
    };
  };

  const expandAllCallback = () => {
    setExpandAllToggle((prev) => !prev);

    if (expandAllToggle) {
      setExpandedRows((prev) => null);
    } else {
      let _expandedRows = {};

      data?.forEach((item) => {
        if (
          item?.tableArrayValuesExpandOnly?.every(
            (item) => item?.data?.length > 0
          )
        ) {
          _expandedRows[`${item?.id}`] = true;
        }
      });
      setExpandedRows((prev) => _expandedRows);
    }
  };

  function searchCallback(item) {
    for (let prop in item) {
      if (
        String(item[prop])
          .toLowerCase()
          .includes(globalFilterValue?.toLowerCase())
      ) {
        return true;
      }
    }
    return false;
  }

  const exportCSV = (selectionOnly) => {
    dt.current.exportCSV({ selectionOnly });
  };

  const exportColumns = columns?.map((col) => ({
    title: col.header,
    dataKey: col.field,
  }));
  const exportPdf = () => {
    import("jspdf").then((jsPDF) => {
      import("jspdf-autotable").then(() => {
        const doc = new jsPDF.default(0, 0);

        doc.autoTable(exportColumns, data);
        doc.save("products.pdf");
      });
    });
  };

  const exportExcel = () => {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAsExcelFile(excelBuffer, "data");
  };

  const handleBulkImport = (e) => {
    const reader = new FileReader();
    reader.readAsBinaryString(e.target.files[0]);
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = xlsx.read(data, { type: "binary", raw: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(sheet, importArguments);
      // const jsonData = parsedData
      // console.log(jsonData);
      const keys = jsonData[0];
      jsonData.shift();

      const parsedData = jsonData.map((row) => {
        const obj = {};
        keys.forEach((key, index) => {
          obj[key] = row[index];
        });
        return obj;
      });

      if (importButtonEvent) {
        importOverlayRef?.current?.toggle(importButtonEvent);
      }
      // console.log(parsedData);
      setImportData(parsedData);
    };
  };

  const handleBulkImportOther = (e, props) => {
    const shName = props?.sheet;
    const reader = new FileReader();
    reader.readAsBinaryString(e.target.files[0]);
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = xlsx.read(data, { type: "binary", raw: true });
      const sheetName = shName ?? workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName] ?? workbook.Sheets[workbook.SheetNames[0]];

      // const sheet = workbook.getWorksheet(sheet || 1);
      const parsedData = xlsx.utils.sheet_to_json(sheet);

      if (importButtonEvent) {
        importOtherOverlayRef?.current?.toggle(importButtonEvent);
      }
      setImportDataOthers({ value: parsedData, props: props });
    };
  };

  const saveAsExcelFile = (buffer, fileName) => {
    import("file-saver").then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        let EXCEL_EXTENSION = ".xlsx";
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(
          data,
          fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
        );
      }
    });
  };

  const [exportSource, setExportSource] = useState(
    columns
      ?.filter(
        (col) =>
          col?.field &&
          col?.field != "custom_actions" &&
          col?.header != "Added By" &&
          col?.header != "Updated By" &&
          col?.field != "createdAt" &&
          col?.field != "updatedAt" &&
          !defaultExportFields?.includes(col?.header) &&
          !(col?.type == "custom" && !col.editor)
      )
      ?.map((col) => col.header)
  );
  const [exportTarget, setExportTarget] = useState(defaultExportFields);

  const isSelectable = (data) => selectableCallback(data);
  const isRowSelectable = (event) =>
    event.data ? isSelectable(event.data) : true;


  function matchFilter(value, filter, obj) {
    // Get the type, field, operator and value from the filter object
    const { type, field, op, value: filterValue } = filter;
    // If the type is 'value', compare the value with the filter value using the operator
    if (type === 'value') {
      switch (op) {
        case '==':
          return value == filterValue;
        case '!=':
          return value != filterValue;
        case '>':
          return value > filterValue;
        case '<':
          return value < filterValue;
        case '>=':
          return value >= filterValue;
        case '<=':
          return value <= filterValue;
        default:
          return '==';
      }
    }

    if (type === 'reference') {
      const referValue = obj[filter?.value]
      switch (op) {
        case '==':
          return value == referValue;
        case '!=':
          return value != referValue;
        case '>':
          return value > referValue;
        case '<':
          return value < referValue;
        case '>=':
          return value >= referValue;
        case '<=':
          return value <= referValue;
        default:
          return value == referValue
      }
    }
    if (type === 'reference_number') {
      const referValue = obj[filter?.value];
      const difference = Math.abs(value - referValue);
      switch (op) {
        case '==':
          return difference < 1;
        case '!=':
          return difference >= 1;
        case '>':
          return value > referValue;
        case '<':
          return value < referValue;
        case '>=':
          return value >= referValue;
        case '<=':
          return value <= referValue;
        default:
          return '==';
      }
    }
    // If the type is 'date', convert the value and the filter value to dates and compare them using the operator
    if (type === 'date') {
      const dateValue = new Date(value);
      const dateFilterValue = new Date(filterValue);
      switch (op) {
        case '==':
          return dateValue.getTime() === dateFilterValue.getTime();
        case '!=':
          return dateValue.getTime() !== dateFilterValue.getTime();
        case '>':
          return dateValue.getTime() > dateFilterValue.getTime();
        case '<':
          return dateValue.getTime() < dateFilterValue.getTime();
        case '>=':
          return dateValue.getTime() >= dateFilterValue.getTime();
        case '<=':
          return dateValue.getTime() <= dateFilterValue.getTime();
        default:
          return '==';
      }
    }
    // If the type is not 'value' or 'date', return false
    return false;
  }

  function customFiltersCalculator(data) {
    const filteredCustomFilters = customFilters.filter((customFilter, index) => {
      const indexKey = `index-${index}`;
      return selectedFilters[indexKey] === true;
    });
    // if (filteredCustomFilters.length === 0) {
    //   return data;
    // }
    return data?.filter((obj) => {
      return filteredCustomFilters.every((customFilter) => {
        const { filter } = customFilter;
        return filter.every((condition) => {
          const { field, value } = condition;
          const objValue = obj[field]
          return matchFilter(objValue, condition, obj);
        });
      });
    });
  }

  function customSelectFiltersCalculator(data) {
    return data?.filter((obj) => {
      return customSelectFilters?.every((csf) => {
        const { field, value } = csf;
        return !value ? true : obj[field] == value
      });
    });
  }

  function filterData(data) {
    const dataFiltered = customFiltersCalculator(data)
    const customSelectFilteredData = customSelectFiltersCalculator(dataFiltered)
    return customSelectFilteredData;
  }

  const allFilteredData = (routeStates?.length > 0
    ? selectedState == "all_state_routes"
      ? filterData(data)?.filter(searchCallback)?.filter((item) =>
        routeStates.some(
          (state) => state.label == item.routeState
        )
      )
      : filterData(data)?.filter(searchCallback)?.filter((dt) => dt?.routeState == selectedState)
    : filterData(data)?.filter(searchCallback))


  //paginator
  const [first, setFirst] = useState(0);
  const [gridRows, setGridRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(allFilteredData?.length);

  const onPageChange = (event) => {
    setFirst(event.first);
    setGridRows(event.rows);
  };

  useEffect(() => {
    setTotalRecords(allFilteredData?.length)
  }, [allFilteredData])


  const [filteredData, setFilteredData] = useState(null);

  return (
    <div className="">
      {((add.show && addOrEdit.add && add.component) ||
        (edit.show && addOrEdit.edit && edit.component)) &&
        !disableDataTableWindows && (
          <DialogOverlay baseIndex={dialogZIndex}>
            {add.show && addOrEdit.add && add.component}
            {edit.show && addOrEdit.edit && edit.component}
          </DialogOverlay>
        )}
      {((add.show && addOrEdit.add && add.component) ||
        (edit.show && addOrEdit.edit && edit.component)) &&
        !disableDataTableWindows && (
          <SidebarOverlay>
            {add.show && addOrEdit.add && add.component}
            {edit.show && addOrEdit.edit && edit.component}
          </SidebarOverlay>
        )}

      <PopoverOverlay
        anchorEl={anchorEl?.anchor ?? null}
        handleClose={handleCloseAnchor}
        headerTitle="Confirm Delete"
        okClick={() => {
          deleteOkClick();
        }}
        bodyTitle={`Are you sure you want to permanently remove selected records?`}
      />
      {visibleColumnsArray != null && (
        <PopoverOverlay
          anchorEl={anchorElColumns}
          handleClose={handleCloseAnchorColumns}
          headerTitle="Columns"
          okClick={() => { }}
          showHeader={true}
          closeButton={false}
          showFooter={false}
          horizontalAnchor="right"
          horizontalTransform="right"
          sx={{ p: 4, pt: 2, maxWidth: 200 }}
          minWidth={100}
          // eslint-disable-next-line react/no-children-prop
          children={
            <Grid container>
              <Grid item xs={12}>
                <div className="flex gap-2">
                  <CheckboxOverlay
                    value={allColumns?.every((column) =>
                      visibleColumnsArray?.includes(column?.field)
                    )}
                    onChange={(e) => {
                      const value = e.target.checked;
                      if (value) {
                        let vca = [];
                        allColumns?.map((ac) => {
                          vca.push(ac?.field);
                        });
                        setVisibleColumnsArray(vca);
                      } else {
                        let vca = [];
                        setVisibleColumnsArray(vca);
                      }
                    }}
                    labelText={<p className="truncate">Select All</p>}
                  />
                </div>
              </Grid>
              {allColumns.map((column, index) => {
                if(column?.onlyDetail || !column?.header) return;
                return column?.field == "expander" ? (
                  <Grid item xs={12} key={index}>
                    <div className="flex gap-2">
                      <CheckboxOverlay
                        value={visibleColumnsArray?.includes(column?.field)}
                        onChange={(e) => {
                          const value = e.target.checked;
                          if (
                            value &&
                            column?.field &&
                            !visibleColumnsArray?.includes(column?.field)
                          ) {
                            let vca = [...visibleColumnsArray];
                            vca.push(column?.field);
                            setVisibleColumnsArray(vca);
                          } else if (
                            column?.field &&
                            visibleColumnsArray?.includes(column?.field)
                          ) {
                            let vca = visibleColumnsArray.filter(
                              (vc) => vc !== column?.field
                            );
                            setVisibleColumnsArray(vca);
                          }
                        }}
                        labelText={<p className="truncate">Expander</p>}
                      />
                    </div>
                  </Grid>
                ) : (
                  <Grid item xs={12} key={index}>
                    <div className="flex gap-2">
                      <CheckboxOverlay
                        value={visibleColumnsArray?.includes(column?.field)}
                        onChange={(e) => {
                          const value = e.target.checked;
                          if (
                            value &&
                            column?.field &&
                            !visibleColumnsArray?.includes(column?.field)
                          ) {
                            let vca = [...visibleColumnsArray];
                            vca.push(column?.field);
                            setVisibleColumnsArray(vca);
                          } else if (
                            column?.field &&
                            visibleColumnsArray?.includes(column?.field)
                          ) {
                            let vca = visibleColumnsArray.filter(
                              (vc) => vc !== column?.field
                            );
                            setVisibleColumnsArray(vca);
                          }
                        }}
                        labelText={<p className="truncate">{column?.header}</p>}
                      />
                    </div>
                  </Grid>
                );
              })}
            </Grid>
          }
        />
      )}

      {enableExport && (
        <PopoverOverlay
          anchorEl={anchorElExport}
          handleClose={handleCloseAnchorExport}
          headerTitle="Export To"
          okClick={() => { }}
          showHeader={false}
          closeButton={false}
          showFooter={false}
          horizontalAnchor="right"
          horizontalTransform="right"
          sx={{
            p: 4,
            pt: 4,
            maxWidth: 300,
            border: ".1px solid green",
            borderRadius: 2,
          }}
          minWidth={100}
          // eslint-disable-next-line react/no-children-prop
          children={
            <div className="flex flex-col gap-3 items-start">
              <Button
                startIcon={<BsFileExcelFill color="green" />}
                color="success"
                variant="outlined"
                onClick={exportExcel}
              >
                Export To Excel
              </Button>

              <Button
                startIcon={<BsFilePdfFill />}
                variant="outlined"
                onClick={exportPdf}
              >
                Export To Pdf
              </Button>

              <Button
                startIcon={<BsFiletypeCsv color="orange" />}
                color="warning"
                variant="outlined"
                onClick={() => exportCSV(false)}
              >
                Export To CSV
              </Button>
            </div>
          }
        />
      )}

      <OverlayPanel
        ref={rowWarningMessageRef}
        dismissable={true}
        // style={{ maxWidth: "100%", minWidth: 200, backgroundColor: 'green' }}
        className={`${warningMessages?.classes}`}
      >
        <div className={`flex flex-col gap-2 items-start`}>
          <div className="font-bold text-xl">Warnings</div>
          <div className="flex flex-col">
            {warningMessages?.messages?.map((msg, index) => {
              return (
                <div key={index} className={`w-full flex gap-2 items-center text-bold text-lg px-3 py-1 rounded`}>
                  <GoDotFill />
                  <p>{msg}</p>
                </div>
              )
            })}
          </div>
        </div>
      </OverlayPanel>

      <OverlayPanel
        ref={exportImportOP}
        dismissable={true}
        style={{ maxWidth: "100%", minWidth: 200 }}
      >
        <div className="flex flex-col gap-2 items-start">
          <div>
            <Button
              startIcon={<BsFileExcelFill color="green" />}
              color="success"
              // variant="outlined"
              onClick={(e) => {
                exportImportPickListOP?.current?.toggle(e);
              }}
            >
              Export Template
            </Button>
          </div>
          <div>
            <input
              accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,.numbers"
              style={{ display: "none" }}
              id="file-input"
              type="file"
              onChange={handleBulkImport}
            />
            <label htmlFor="file-input">
              <Button
                // variant="outlined"
                color="primary"
                component="span"
                startIcon={<LuImport fontWeight="bold" />}
                onClick={(e) => setImportButtonEvent(e)}
              >
                Bulk Import
              </Button>
            </label>
          </div>
        </div>
      </OverlayPanel>
      <OverlayPanel
        ref={exportImportPickListOP}
        showCloseIcon
        dismissable={false}
        style={{ maxWidth: "100%" }}
      >
        <PickListOverlay
          source={exportSource}
          setSource={setExportSource}
          target={exportTarget}
          setTarget={setExportTarget}
        />
        <div className="flex justify-end mt-4 pr-2">
          <Button
            variant="contained"
            onClick={() => {
              let data = exportTarget;
              const headerSheet = xlsx.utils.aoa_to_sheet([data]);
              const workbook = {
                Sheets: { data: headerSheet },
                SheetNames: ["data"],
              };
              const excelBuffer = xlsx.write(workbook, {
                bookType: "xlsx",
                type: "array",
              });
              exportImportPickListOP?.current?.hide();
              saveAsExcelFile(
                excelBuffer,
                (routeTitle ?? title) + " Import Template"
              );
            }}
            disabled={
              exportTarget?.length <= 0 ||
              !defaultExportFields.every((item) => exportTarget?.includes(item))
            }
          >
            Export
          </Button>
        </div>
      </OverlayPanel>

      <OverlayPanel
        ref={importOverlayRef}
        showCloseIcon
        dismissable={false}
        style={{ maxWidth: "100%" }}
      >
        {importData && importData?.length > 0 && (
          <div>
            <DataTable
              value={importData}
              // size="small"
              stripedRows={true}
              paginator={true}
              rows={10}
              // rowsPerPageOptions={[5, 10, 25, 50]}
              showGridlines
              scrollable={true}
              responsiveLayout="scroll"
            >
              {Object.keys(importData[0]).map((key) => {
                if (importFilter?.length > 0 && !importFilter.includes(key)) {
                  return;
                }
                return (
                  <Column
                    key={key}
                    field={key}
                    header={key}
                    style={{ minWidth: "15ch" }}
                  />
                );
              })}
            </DataTable>
            <div className="pb-2 pt-4 flex flex-wrap gap-2">
              <Button
                variant="contained"
                onClick={() => {
                  importCallback(importData);
                  importOverlayRef?.current?.toggle(importButtonEvent);
                }}
              >
                Import
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() =>
                  importOverlayRef?.current?.toggle(importButtonEvent)
                }
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </OverlayPanel>

      <OverlayPanel
        ref={importOtherOverlayRef}
        showCloseIcon
        dismissable={false}
        style={{ maxWidth: "100%" }}
      >
        {importDataOthers && importDataOthers?.value?.length > 0 && (
          <div>
            <DataTable
              value={importDataOthers?.value}
              // size="small"
              stripedRows={true}
              paginator={true}
              rows={10}
              showGridlines
              scrollable={true}
              responsiveLayout="scroll"
            >
              {Object.keys(importDataOthers?.value[0]).map((key) => {
                const importFilter = importDataOthers?.props?.importFilter;
                if (importFilter?.length > 0 && !importFilter.includes(key))
                  return;

                return (
                  <Column
                    key={key}
                    field={key}
                    header={key}
                    style={{ minWidth: "15ch" }}
                  />
                );
              })}
            </DataTable>
            <div className="pb-2 pt-4 flex flex-wrap gap-2">
              <Button
                variant="contained"
                onClick={() => {
                  if (!importDataOthers?.props?.importCallback) return;
                  importDataOthers?.props?.importCallback(importDataOthers?.value ?? []);
                  importOtherOverlayRef?.current?.toggle(importButtonEvent);
                }}
              >
                Import
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() =>
                  importOtherOverlayRef?.current?.toggle(importButtonEvent)
                }
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </OverlayPanel>

      {!listStyleView && (
        <div
          className="shadow-2"
          style={{
            width: tabbed ? "100%" : tableWidth,
            paddingLeft: "0%",
            marginTop: -3,
            backgroundColor: theme?.palette?.background?.paper,
            borderRadius: 5,
          }}
        >
          <div
            className="w-full p-5 shadow-2"
            style={{
              borderRadius: tabbed ? "0px 0px 5px 5px" : "",
              boxShadow: tabbed ? "none" : "",
            }}
          >
            <div className="flex flex-wrap justify-between">
              <h5 className="text-2xl mb-3">{title}</h5>

              <div className="flex flex-wrap gap-3 p-2 -mt-2 mb-2">

                {importCallback != null && !exportImportTemplate && (
                  <div>
                    <input
                      accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      style={{ display: "none" }}
                      id="file-input"
                      type="file"
                      onChange={handleBulkImport}
                    />
                    <label htmlFor="file-input">
                      <Button
                        variant="outlined"
                        color="primary"
                        component="span"
                        startIcon={<LuImport fontWeight="bold" />}
                        onClick={(e) => setImportButtonEvent(e)}
                      >
                        Bulk Import
                      </Button>
                    </label>
                  </div>
                )}
                {otherImport?.length > 0 &&
                  otherImport?.map((oim, index) => {
                    return (
                      <div key={index}>
                        <input
                          accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                          style={{ display: "none" }}
                          id={"file-input-import" + index}
                          type="file"
                          onChange={(e) => handleBulkImportOther(e, oim)}
                        />
                        <label htmlFor={"file-input-import" + index}>
                          <ButtonOverlay
                            text={oim?.text}
                            variant={oim?.variant ? oim?.variant : "outlined"}
                            component="span"
                            startIcon={oim?.useDefaultIcon ? <LuImport fontWeight="bold" /> : oim?.icon ? oim?.icon : ""}
                            onClick={setImportButtonEvent}
                          />

                        </label>
                      </div>
                    )
                  })
                }
                {importCallback != null && exportImportTemplate && (
                  <Button
                    variant="outlined"
                    color="primary"
                    component="span"
                    startIcon={<LuImport fontWeight="bold" />}
                    onClick={(e) => {
                      exportImportOP?.current?.toggle(e);
                    }}
                  >
                    Bulk Import
                  </Button>
                )}
                {enableExport && (
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      handleClickElExport(e);
                    }}
                    disabled={filterData(data)?.filter(searchCallback)?.length <= 0}
                    startIcon={<BiExport />}
                  >
                    Export
                  </Button>
                )}
                {extraButtons &&
                  extraButtons?.map((extraButton, index) => {
                    return <div key={index}>{extraButton}</div>;
                  })}
                {edit?.show && !disableEditButton && ['0', '1', 0, 1]?.includes(listViewToggle) && (
                  <Button
                    variant={editableToggle ? "contained" : "outlined"}
                    onClick={() => {
                      let titleEditable =
                        title?.split(" ")?.join("_").toLowerCase() +
                        "_editable";
                      localStorage.setItem(titleEditable, !editableToggle);
                      setEditableToggle(!editableToggle);
                    }}
                    startIcon={<MdEdit />}
                  >
                    Editable
                  </Button>
                )}
                {dateSelectorLocation == "right-of-title" && <div className="">
                  {(enableDateSelector) && dateRangeSelector()}
                </div>}
              </div>
            </div>
            {(listViewToggle == 0 || listViewToggle == 1) && (
              <DataTable
                value={
                  routeStates?.length > 0
                    ? selectedState == "all_state_routes"
                      ? filterData(data)?.filter((item) =>
                        routeStates.some(
                          (state) => state.label == item.routeState
                        )
                      )
                      : filterData(data)?.filter((dt) => dt?.routeState == selectedState)
                    : filterData(data)
                }
                paginator={paginator}
                showGridlines={
                  listViewToggle == 1 && !groupRowsBy ? false : showGridlines
                }
                rowClassName={(data) =>
                  rowClassName ? { ...rowClassName(data), ...getRowColorClasses(data) } : groupRowsBy ? getRowColorClasses(data) : rowClass(data)
                }
                // onRowMouseLeave={()=>{
                //   rowWarningMessageRef?.current?.hide()
                // }}
                onRowMouseEnter={(e) => {
                  const dt = rowColorCallback(e?.data)
                  if (dt?.show) {
                    const wd = getRowWarningMessages(e?.data)
                    if (!wd?.show || wd?.messages?.length <= 0) return;
                    setWarningMessages(wd)
                    rowWarningMessageRef?.current?.show(e?.originalEvent)
                  } else {
                    rowWarningMessageRef?.current?.hide()
                  }

                }}

                size={size}
                // stripedRows={true}
                tableStyle={
                  listViewToggle == 1 && !groupRowsBy
                    ? {
                      borderCollapse: "separate",
                      borderSpacing: `0px ${listViewSpacing}px`,
                      paddingLeft: 4,
                      paddingRight: 4,
                      backgroundColor: "rgba(0,0,0,.01)",
                    }
                    : {}
                }

                rows={rows}
                rowsPerPageOptions={rowsPerPageOptions}
                dataKey={dataKey}
                loading={loading}
                emptyMessage={emptyMessageComponent}
                selection={selection}
                onSelectionChange={onSelectionChange}
                selectionMode={
                  edit?.show || showDelete
                    ? selectionMode == "multiple"
                      ? "checkbox"
                      : selectionMode
                    : null
                }
                editMode={
                  edit?.window ?? "sidebar".includes("inline") ? editMode : null
                }
                onRowEditComplete={onRowEditComplete}
                scrollable={scrollable}
                scrollHeight={scrollHeight}
                ref={dt}
                // scrollDirection={scrolldirection}
                filterDisplay="menu"
                filters={filters}
                // responsiveLayout="scroll"
                header={Header}
                onValueChange={(data)=>setFilteredData(data)}
                footer={()=>footerTemplate(filteredData)}
                
                removableSort
                cellSelection={cellSelection}
                metaKeySelection={metaKeySelection}
                dragSelection={dragSelection && !reorderableRows}
                onRowClick={(e) => {
                  if (e.originalEvent.target.tagName != "TD") {
                    e.originalEvent.preventDefault();
                    return;
                  }
                  if (onRowClick) {
                    onRowClick(e);
                  } else if (!editableToggle) {
                    if (detailClick) {
                      detailClick(e?.data);
                    }
                  }
                }}

                stateStorage="local"
                stateKey={title}
                // resizableColumns
                // reorderableColumns
                expandedRows={expandedRows}
                onRowToggle={onRowToggle}
                onRowExpand={onRowExpand}
                onRowCollapse={onRowCollapse}
                expandableRowGroups={expandableRowGroups}
                rowExpansionTemplate={rowExpansionTemplate}
                rowGroupMode={rowGroupMode}
                groupRowsBy={groupRowsBy}
                rowGroupHeaderTemplate={rowGroupHeaderTemplate}
                rowGroupFooterTemplate={rowGroupFooterTemplate}
                // sortField="name_target_2" sortOrder={1}
                isDataSelectable={isRowSelectable}
                reorderableRows={reorderableRows}
                onRowReorder={reorderRowsCallback}
              >
                {/* <Column
                field="date"
                header="Date"
                //filter={true}
                
                // filterMatchMode={customFilterMatchMode}
              /> */}
                {reorderableRows && edit?.show && (
                  <Column rowReorder style={{ width: "3rem" }} />
                )}
                {(edit?.show || showDelete ? enableSelectCheckbox : false) && (
                  <Column
                    selectionMode={
                      edit?.show || showDelete ? selectionMode : null
                    }
                    style={{ width: "4rem", textAlign: "center" }}
                    headerStyle={{
                      width: "4rem",
                      paddingLeft: 18,
                      textAlign: "center",
                    }}
                  />
                )}

                {columns.map((column, index) => {
                  if (column?.onlyDetail) return;
                  switch (column.type) {
                    case "expander": {
                      return (
                        !groupRowsBy && (
                          <Column
                            key={index}
                            expander={column?.expander ?? false}
                            style={{ width: "5rem" }}
                            field={column?.field}
                            header={
                              <IconButton
                                onClick={() => {
                                  expandAllCallback();
                                }}
                              >
                                {expandAllToggle ? (
                                  <MdOutlineKeyboardArrowDown size={28} />
                                ) : (
                                  <MdOutlineKeyboardArrowRight size={28} />
                                )}
                              </IconButton>
                            }
                          />
                        )
                      );
                    }
                    case "progress":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header}
                            showFilterMatchModes={false}
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            body={(props) =>
                              column.body
                                ? column.body(props, column.field)
                                : progressBodyTemplate(props, column.field)
                            }
                            filter={column.filter ?? false}
                            filterElement={(props) =>
                              column.filterElement
                                ? column.filterElement(
                                  props,
                                  column.min ?? 0,
                                  column.max ?? 0,
                                  column.field
                                )
                                : progressFilterTemplate(
                                  props,
                                  column.min ?? 0,
                                  column.max ?? 100,
                                  column.field
                                )
                            }
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            sortable={column.sortable ?? false}
                            editor={editableToggle && column.editor}
                            onCellEditComplete={onCellEditComplete}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "text":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header}
                            showFilterMatchModes={false}
                            filterField={column.filterField ?? "name"}
                            filter={column.filter ?? false}
                            filterPlaceholder={
                              column.filterPlaceholder ?? "Filter by name"
                            }
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={column.body && column.body}
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            // editor={editableToggle && column.editor}
                            editor={editableToggle && column.editor}
                            onCellEditComplete={onCellEditComplete}
                            sortable={column.sortable ?? false}

                          // editor={(options) => textEditor(options)}
                          // editor={(options) => cellEditor(options)} onCellEditComplete={onCellEditComplete}
                          //editor={(options) => statusEditor(options)}
                          //editor={(options) => priceEditor(options)}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "country":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header}
                            showFilterMatchModes={false}
                            filterField={column.filterField ?? "country.name"}
                            filter={column.filter ?? false}
                            filterPlaceholder={
                              column.filterPlaceholder ?? "Filter by country"
                            }
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={(props) =>
                              column.body
                                ? column.body(props)
                                : countryBodyTemplate(
                                  props,
                                  column.field,
                                  column.nameLabel ?? "name",
                                  column.imgLabel ?? "url"
                                )
                            }
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            sortable={column.sortable ?? false}
                            editor={editableToggle && column.editor}
                            onCellEditComplete={onCellEditComplete}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "useralt":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header}
                            showFilterMatchModes={false}
                            filterField={column.filterField ?? "user"}
                            filter={column.filter ?? false}
                            filterPlaceholder={
                              column.filterPlaceholder ?? "Filter by user"
                            }
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={(props) =>
                              column.body
                                ? column.body(props)
                                : userAltBodyTemplate(
                                  props,
                                  column.field,
                                  column.nameLabel ?? "name",
                                  column.imgLabel ?? "url"
                                )
                            }
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            sortable={column.sortable ?? false}
                            editor={editableToggle && column.editor}
                            onCellEditComplete={onCellEditComplete}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "user":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header}
                            showFilterMatchModes={false}
                            filterField={column.filterField ?? "representative"}
                            filter={column.filter ?? false}
                            filterPlaceholder={
                              column.filterPlaceholder ?? "Filter by user"
                            }
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={(rowData) =>
                              column.body
                                ? column.body(rowData)
                                : userBodyTemplate(
                                  rowData,
                                  column.filterField,
                                  column.nameLabel ?? "name",
                                  column.imgLabel ?? "img"
                                )
                            }
                            filterElement={(props) =>
                              column.filterElement
                                ? column.filterElement(
                                  props,
                                  column.filterLabel ?? "User Picker",
                                  column.filterField,
                                  column.nameLabel ?? "name",
                                  column.imgLabel ?? "img"
                                )
                                : userFilterTemplate(
                                  props,
                                  column.filterLabel ?? "User Picker",
                                  column.filterField,
                                  column.nameLabel ?? "name",
                                  column.imgLabel ?? "img",
                                  column.options ?? []
                                )
                            }
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            sortable={column.sortable ?? false}
                            editor={editableToggle && column.editor}
                            onCellEditComplete={onCellEditComplete}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "date":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header}
                            showFilterMatchModes={true}
                            filterField={column.filterField ?? "date"}
                            filter={column.filter ?? false}
                            filterPlaceholder={
                              column.filterPlaceholder ?? "Filter by date"
                            }
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={(props) =>
                              column?.body
                                ? column.body(props)
                                : dateBodyTemplate(props, column.field)
                            }
                            filterElement={(props) =>
                              column.filterElement
                                ? column.filterElement(props)
                                : dateFilterTemplate(props)
                            }
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            dataType={column.dataType ?? "date"}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            sortable={column.sortable ?? false}
                            editor={editableToggle && column.editor}
                            onCellEditComplete={onCellEditComplete}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "status":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header}
                            showFilterMatchModes={true}
                            filterField={column.filterField ?? "status"}
                            filter={column.filter ?? false}
                            filterPlaceholder={
                              column.filterPlaceholder ?? "Filter by date"
                            }
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={(props) =>
                              column.body
                                ? column.body(props)
                                : statusBodyTemplate(
                                  props,
                                  column.field,
                                  column.options ?? [],
                                  column.nameLabel ?? "name",
                                  column.valueLabel ?? "value",
                                  column?.colorLabel ?? "color",
                                  column.sx
                                )
                            }
                            filterElement={(props) =>
                              column.filterElement
                                ? column.filterElement(
                                  props,
                                  column.options ?? []
                                )
                                : statusFilterTemplate(
                                  props,
                                  column.options ?? [],
                                  column?.placeholder ?? "Select a status",
                                  column?.nameLabel ?? "name",
                                  column?.valueLabel ?? "value",
                                  column?.colorLabel ?? "color",
                                  column.sx
                                )
                            }
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            editor={editableToggle && column.editor}
                            sortable={column.sortable ?? false}
                            onCellEditComplete={onCellEditComplete}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "money":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header ?? "Balance"}
                            showFilterMatchModes={true}
                            filterField={column.filterField ?? "balance"}
                            filter={column.filter ?? false}
                            filterPlaceholder={
                              column.filterPlaceholder ?? "Filter by balance"
                            }
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={column.body ?? balanceBodyTemplate}
                            filterElement={
                              column.filterElement ?? balanceFilterTemplate
                            }
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            dataType={column.dataType ?? "numeric"}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            // editor={editableToggle && column.editor??priceEditor}
                            editor={(options) => cellEditor(options)}
                            onCellEditComplete={onCellEditComplete}
                            sortable={column.sortable ?? false}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "verified":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header ?? "Verified"}
                            showFilterMatchModes={true}
                            filterField={column.filterField ?? "verified"}
                            filter={column.filter ?? false}
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={(props) =>
                              column.body
                                ? column.body(props, column.field)
                                : verifiedBodyTemplate(props, column.field)
                            }
                            filterElement={(props) =>
                              column.filterElement
                                ? column.filterElement(
                                  props,
                                  column.headerLabel
                                )
                                : verifiedFilterTemplate(
                                  props,
                                  column.headerLabel
                                )
                            }
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            dataType={column.dataType ?? "boolean"}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            sortable={column.sortable ?? false}
                            editor={editableToggle && column.editor}
                            onCellEditComplete={onCellEditComplete}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                    case "custom":
                      {
                        return (
                          <Column
                            key={index}
                            field={column.field}
                            header={column.header}
                            showFilterMatchModes={true}
                            filterField={column.filterField ?? ""}
                            filterPlaceholder={column.filterPlaceholder}
                            filter={column.filter ?? false}
                            style={column.style ?? { minWidth: "12rem" }}
                            filterMenuStyle={
                              column.filterMenuStyle ?? { width: "14rem" }
                            }
                            frozen={column.frozen ?? false}
                            alignFrozen={column.alignFrozen ?? "left"}
                            body={column.body}
                            filterElement={column.filterElement}
                            filterClear={filterClearTemplate}
                            filterApply={filterApplyTemplate}
                            filterHeader={column.filterHeader}
                            filterFooter={column.filterFooter}
                            filterFunction={column.filterFunction}
                            dataType={column.dataType}
                            align={column.align ?? "left"}
                            alignHeader={column.alignHeader ?? "left"}
                            sortable={column.sortable ?? false}
                            editor={editableToggle && column.editor}
                            onCellEditComplete={onCellEditComplete}
                          />
                        );
                      }
                      // eslint-disable-next-line no-unreachable
                      break;
                  }
                })}
                {editMode === "row" &&
                  (edit?.window ?? "sidebar".includes("inline")) && (
                    <Column
                      header="Actions"
                      rowEditor
                      headerStyle={{ width: "10%", minWidth: "8rem" }}
                      bodyStyle={{ textAlign: "center" }}
                    />
                  )}
              </DataTable>
            )}
            {listViewToggle == 2 && gridComponent && (
              <div className="px-4 mb-10 py-2 w-full border rounded-md">
                {Header()}
                <div className={`mt-4 border-t shadow-1g pt-3 pb-20`}>
                  <Grid
                    container
                    spacing={gridSpacing}
                    style={{ margin: "auto" }}
                  >
                    {allFilteredData?.slice(first, first + gridRows)?.map((item) => {
                      return noGridCountRestriction ? (
                        <Grid
                          item
                          key={item?.id}
                          className="hover:cursor-pointer"
                          onClick={() => {
                            if (detailClick) detailClick(item);
                          }}
                        >
                          {gridComponent(item)}
                        </Grid>
                      ) : (
                        <Grid
                          item
                          key={item?.id}
                          xs={12}
                          sm={12}
                          md={6}
                          lg={4}
                          xl={3}
                          className="hover:cursor-pointer"
                          onClick={() => {
                            if (detailClick) detailClick(item);
                          }}
                        >
                          {gridComponent(item)}
                        </Grid>
                      );
                    })}
                  </Grid>
                  {(routeStates?.length > 0
                    ? selectedState == "all_state_routes"
                      ? filterData(data)?.filter(searchCallback)?.filter((item) =>
                        routeStates.some(
                          (state) => state.label == item.routeState
                        )
                      )
                      : filterData(data)?.filter(searchCallback)?.filter((dt) => dt?.routeState == selectedState)
                    : filterData(data)?.filter(searchCallback))?.length <= 0 && (
                      <div>{emptyMessageComponent}</div>
                    )}
                </div>
                <Paginator
                  first={first}
                  rows={gridRows}
                  totalRecords={totalRecords}
                  onPageChange={onPageChange}
                  rowsPerPageOptions={rowsPerPageOptions}
                />
              </div>
            )}
            {allowedViews.includes("calendar") && listViewToggle == 5 && (
              <div className="px-4 py-2 w-full border rounded-md ">
                {Header()}
                <Divider style={{ marginTop: 20 }} />
                <div style={{ marginTop: 50 }}>
                  <CalendarOverlay
                    data={
                      routeStates?.length > 0
                        ? selectedState == "all_state_routes"
                          ? filterData(data)?.filter(searchCallback)?.filter((item) =>
                            routeStates.some(
                              (state) => state.label == item.routeState
                            )
                          )
                          : filterData(data)?.filter(searchCallback)?.filter((dt) => dt?.routeState == selectedState)
                        : filterData(data)?.filter(searchCallback)
                    }
                    setInfo={setInfoCalendar}
                    add={add?.window == "newpage" ? { ...add, window: "dialog", fullScreen: true } : { ...add }}
                    edit={edit?.window?.includes("newpage") ? { ...edit, window: ["inline", "sidebar"], fullScreen: true } : { ...edit }}
                    sideBar={sideBar}
                    states={routeStates}
                    resizeCallback={resizeCallback}
                    detailClick={detailClick}
                  // addNewPage={addNewPage}
                  />
                </div>
              </div>
            )}
            {allowedViews.includes("kanban") && kanbanComponent && routeStates?.length > 0 && listViewToggle == 3 &&
              <div className="px-4 py-2 w-full border rounded-md ">
                {Header()}
                <Divider style={{ marginTop: 20 }} />
                <div style={{ marginTop: 50 }} className="shadow-2 p-4">
                  <KanbanOverlay
                    routeStates={routeStates}
                    kanbanComponent={kanbanComponent}
                    emptyComponent={emptyMessageComponent}
                    data={
                      routeStates?.length > 0
                        ? selectedState == "all_state_routes"
                          ? filterData(data)?.filter(searchCallback)?.filter((item) =>
                            routeStates.some(
                              (state) => state.label == item.routeState
                            )
                          )
                          : filterData(data)?.filter(searchCallback)?.filter((dt) => dt?.routeState == selectedState)
                        : filterData(data)?.filter(searchCallback)
                    }
                    kanbanDropCallback={kanbanDropCallback}
                  />
                </div>
              </div>
            }
            {allowedViews.includes("graph") && graphData && listViewToggle == 6 &&
              <div className="px-4 py-2 w-full border rounded-md">
                {Header()}
                <Divider style={{ marginTop: 20 }} />
                <div style={{ marginTop: 50 }} className="">
                  <GraphOverlay
                    routeStates={routeStates}
                    // kanbanComponent={kanbanComponent}
                    emptyComponent={emptyMessageComponent}
                    data={
                      routeStates?.length > 0
                        ? selectedState == "all_state_routes"
                          ? filterData(data)?.filter(searchCallback)?.filter((item) =>
                            routeStates.some(
                              (state) => state.label == item.routeState
                            )
                          )
                          : filterData(data)?.filter(searchCallback)?.filter((dt) => dt?.routeState == selectedState)
                        : filterData(data)?.filter(searchCallback)
                    }
                    chartData={graphData}
                  />
                </div>
              </div>
            }
            {
              allowedViews.includes("custom") && customComponent && listViewToggle == 7 &&
              <div className="px-4 py-2 w-full border rounded-md ">
                {Header()}
                <Divider style={{ marginTop: 20 }} />
                <div style={{ marginTop: 20 }} className="">
                  {customComponent(routeStates?.length > 0
                    ? selectedState == "all_state_routes"
                      ? filterData(data)?.filter(searchCallback)?.filter((item) =>
                        routeStates.some(
                          (state) => state.label == item.routeState
                        )
                      )
                      : filterData(data)?.filter(searchCallback)?.filter((dt) => dt?.routeState == selectedState)
                    : filterData(data)?.filter(searchCallback), columns, routeStates, customFilters, selectedFilters)}
                  {(routeStates?.length > 0
                    ? selectedState == "all_state_routes"
                      ? filterData(data)?.filter(searchCallback)?.filter((item) =>
                        routeStates.some(
                          (state) => state.label == item.routeState
                        )
                      )
                      : filterData(data)?.filter(searchCallback)?.filter((dt) => dt?.routeState == selectedState)
                    : filterData(data)?.filter(searchCallback))?.length <= 0 && (
                      <div>{emptyMessageComponent}</div>
                    )}
                </div>
              </div>
            }
            {allowedViews.includes("attendance") && listViewToggle == 8 && (
              <div className="px-4 py-2 w-full border rounded-md ">
                {Header()}
                <Divider style={{ marginTop: 20 }} />
                <div style={{ marginTop: 0 }}>
                  <AttendanceOverlay
                    users={attendanceUsers}
                    usersField={attendanceUsersField}
                    attendances={
                      routeStates?.length > 0
                        ? selectedState == "all_state_routes"
                          ? filterData(data)?.filter((item) =>
                            routeStates.some(
                              (state) => state.label == item.routeState
                            )
                          )
                          : filterData(data)?.filter((dt) => dt?.routeState == selectedState)
                        : filterData(data)
                    }
                    searchText={globalFilterValue}
                    setInfo={setInfoAttendance}
                    add={add?.window == "newpage" ? { ...add, window: "dialog", fullScreen: true } : { ...add }}
                    edit={edit?.window?.includes("newpage") ? { ...edit, window: ["inline", "sidebar"], fullScreen: true } : { ...edit }}
                    sideBar={sideBar}
                    states={routeStates}
                    detailClick={detailClick}
                    borderSeparate={attendanceBorderSeparate}
                    markType={attendanceMarkType}
                    showOposite={attendanceShowOpposite}
                    weekends={attendanceWeekends}
                    hideDatesAfter={attendanceHideDatesAFter}
                    leave={attendanceLeave}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {listStyleView && (
        <div className={`rounded shadow-2 p-2`}>
          <DataTable
            value={
              routeStates?.length > 0
                ? selectedState == "all_state_routes"
                  ? filterData(data)?.filter((item) =>
                    routeStates.some(
                      (state) => state.label == item.routeState
                    )
                  )
                  : filterData(data)?.filter((dt) => dt?.routeState == selectedState)
                : filterData(data)
            }
            // paginator={paginator}
            rowClassName={(data) =>
              rowClassName ? { ...rowClassName(data), ...getRowColorClasses(data) } : groupRowsBy ? getRowColorClasses(data) : rowClass(data)
            }

            // rowClassName={groupRowsBy ? "" : rowClassName}
            //size="large"
            // stripedRows={true}
            rowEditorCancelIcon={<p>fd</p>}
            tableStyle={
              listViewToggle == 1 && !groupRowsBy
                ? {
                  borderCollapse: "separate",
                  borderSpacing: `0px ${listViewSpacing}px`,
                  paddingLeft: 4,
                  paddingRight: 4,
                }
                : cardForListView
                  ? {
                    padding: paddingForListView,
                    backgroundColor: theme?.palette?.background?.paper,
                    borderCollapse: "separate",
                  }
                  : {}
            }
            rows={rows}
            dataKey={dataKey}
            loading={loading}
            emptyMessage={emptyMessageComponent}
            selection={selection}
            onSelectionChange={onSelectionChange}
            selectionMode={
              edit?.show || showDelete
                ? selectionMode == "multiple"
                  ? "checkbox"
                  : selectionMode
                : null
            }
            editMode={
              edit?.window ?? "sidebar".includes("inline") ? editMode : null
            }
            onRowEditComplete={onRowEditComplete}
            scrollable={scrollable}
            scrollHeight={scrollHeight}
            ref={dt}
            // scrollDirection={scrolldirection}
            filterDisplay=""
            filters={filters}
            responsiveLayout="scroll"
            // header={Header}
            onValueChange={(data)=>setFilteredData(data)}
            footer={()=>footerTemplate()}
            removableSort
            cellSelection={cellSelection}
            metaKeySelection={metaKeySelection}
            dragSelection={dragSelection && !reorderableRows}
            onRowClick={(e) => {
              if (e.originalEvent.target.tagName != "TD") {
                e.originalEvent.preventDefault();
                return;
              }
              if (onRowClick) {
                onRowClick(e);
              } else if (!editableToggle) {
                detailClick(e?.data);
              }
            }}
            stateStorage="local"
            stateKey={"light_" + title}
            // resizableColumns
            // reorderableColumns
            expandedRows={expandedRows}
            onRowToggle={onRowToggle}
            onRowExpand={onRowExpand}
            onRowCollapse={onRowCollapse}
            expandableRowGroups={expandableRowGroups}
            rowExpansionTemplate={rowExpansionTemplate}
            rowGroupMode={rowGroupMode}
            groupRowsBy={groupRowsBy}
            rowGroupHeaderTemplate={rowGroupHeaderTemplate}
            rowGroupFooterTemplate={rowGroupFooterTemplate}
            // sortField="name_target_2" sortOrder={1}

            isDataSelectable={isRowSelectable}
            reorderableRows={reorderableRows}
            onRowReorder={reorderRowsCallback}
          >
            {/* <Column
                field="date"
                header="Date"
                //filter={true}
                
                // filterMatchMode={customFilterMatchMode}
              /> */}

            {reorderableRows && edit?.show && (
              <Column rowReorder style={{ width: "3rem" }} />
            )}
            {(edit?.show || showDelete ? enableSelectCheckbox : false) && (
              <Column
                selectionMode={edit?.show || showDelete ? selectionMode : null}
                style={{ width: "4rem", textAlign: "center" }}
                headerStyle={{
                  width: "4rem",
                  paddingLeft: 18,
                  textAlign: "center",
                }}
              />
            )}

            {columns.map((column, index) => {
              if (column?.onlyDetail) return;
              switch (column.type) {
                case "expander": {
                  return (
                    !groupRowsBy && (
                      <Column
                        key={index}
                        expander={column?.expander ?? false}
                        style={{ width: "5rem" }}
                        field={column?.field}
                        header={
                          <IconButton
                            onClick={() => {
                              expandAllCallback();
                            }}
                          >
                            {expandAllToggle ? (
                              <MdOutlineKeyboardArrowDown size={28} />
                            ) : (
                              <MdOutlineKeyboardArrowRight size={28} />
                            )}
                          </IconButton>
                        }
                      />
                    )
                  );
                }
                case "progress":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header}
                        showFilterMatchModes={false}
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        body={(props) =>
                          column.body
                            ? column.body(props, column.field)
                            : progressBodyTemplate(props, column.field)
                        }
                        filter={column.filter ?? false}
                        filterElement={(props) =>
                          column.filterElement
                            ? column.filterElement(
                              props,
                              column.min ?? 0,
                              column.max ?? 0,
                              column.field
                            )
                            : progressFilterTemplate(
                              props,
                              column.min ?? 0,
                              column.max ?? 100,
                              column.field
                            )
                        }
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        sortable={column.sortable ?? false}
                        editor={editableToggle && column.editor}
                        onCellEditComplete={onCellEditComplete}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "text":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header}
                        showFilterMatchModes={false}
                        filterField={column.filterField ?? "name"}
                        filter={column.filter ?? false}
                        filterPlaceholder={
                          column.filterPlaceholder ?? "Filter by name"
                        }
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={column.body && column.body}
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        // editor={editableToggle && column.editor}
                        editor={editableToggle && column.editor}
                        onCellEditComplete={onCellEditComplete}
                        sortable={column.sortable ?? false}

                      // editor={(options) => textEditor(options)}
                      // editor={(options) => cellEditor(options)} onCellEditComplete={onCellEditComplete}
                      //editor={(options) => statusEditor(options)}
                      //editor={(options) => priceEditor(options)}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "country":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header}
                        showFilterMatchModes={false}
                        filterField={column.filterField ?? "country.name"}
                        filter={column.filter ?? false}
                        filterPlaceholder={
                          column.filterPlaceholder ?? "Filter by country"
                        }
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={(props) =>
                          column.body
                            ? column.body(props)
                            : countryBodyTemplate(
                              props,
                              column.field,
                              column.nameLabel ?? "name",
                              column.imgLabel ?? "url"
                            )
                        }
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        sortable={column.sortable ?? false}
                        editor={editableToggle && column.editor}
                        onCellEditComplete={onCellEditComplete}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "useralt":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header}
                        showFilterMatchModes={false}
                        filterField={column.filterField ?? "user"}
                        filter={column.filter ?? false}
                        filterPlaceholder={
                          column.filterPlaceholder ?? "Filter by user"
                        }
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={(props) =>
                          column.body
                            ? column.body(props)
                            : userAltBodyTemplate(
                              props,
                              column.field,
                              column.nameLabel ?? "name",
                              column.imgLabel ?? "url"
                            )
                        }
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        sortable={column.sortable ?? false}
                        editor={editableToggle && column.editor}
                        onCellEditComplete={onCellEditComplete}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "user":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header}
                        showFilterMatchModes={false}
                        filterField={column.filterField ?? "representative"}
                        filter={column.filter ?? false}
                        filterPlaceholder={
                          column.filterPlaceholder ?? "Filter by user"
                        }
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={(rowData) =>
                          column.body
                            ? column.body(rowData)
                            : userBodyTemplate(
                              rowData,
                              column.filterField,
                              column.nameLabel ?? "name",
                              column.imgLabel ?? "img"
                            )
                        }
                        filterElement={(props) =>
                          column.filterElement
                            ? column.filterElement(
                              props,
                              column.filterLabel ?? "User Picker",
                              column.filterField,
                              column.nameLabel ?? "name",
                              column.imgLabel ?? "img"
                            )
                            : userFilterTemplate(
                              props,
                              column.filterLabel ?? "User Picker",
                              column.filterField,
                              column.nameLabel ?? "name",
                              column.imgLabel ?? "img",
                              column.options ?? []
                            )
                        }
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        sortable={column.sortable ?? false}
                        editor={editableToggle && column.editor}
                        onCellEditComplete={onCellEditComplete}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "date":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header}
                        showFilterMatchModes={true}
                        filterField={column.filterField ?? "date"}
                        filter={column.filter ?? false}
                        filterPlaceholder={
                          column.filterPlaceholder ?? "Filter by date"
                        }
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={(props) =>
                          column?.body
                            ? column.body(props)
                            : dateBodyTemplate(props, column.field)
                        }
                        filterElement={(props) =>
                          column.filterElement
                            ? column.filterElement(props)
                            : dateFilterTemplate(props)
                        }
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        dataType={column.dataType ?? "date"}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        sortable={column.sortable ?? false}
                        editor={editableToggle && column.editor}
                        onCellEditComplete={onCellEditComplete}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "status":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header}
                        showFilterMatchModes={true}
                        filterField={column.filterField ?? "status"}
                        filter={column.filter ?? false}
                        filterPlaceholder={
                          column.filterPlaceholder ?? "Filter by date"
                        }
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={(props) =>
                          column.body
                            ? column.body(props)
                            : statusBodyTemplate(
                              props,
                              column.field,
                              column.options ?? [],
                              column.nameLabel ?? "name",
                              column.valueLabel ?? "value",
                              column?.colorLabel ?? "color",
                              column.sx
                            )
                        }
                        filterElement={(props) =>
                          column.filterElement
                            ? column.filterElement(props, column.options ?? [])
                            : statusFilterTemplate(
                              props,
                              column.options ?? [],
                              column?.placeholder ?? "Select a status",
                              column?.nameLabel ?? "name",
                              column?.valueLabel ?? "value",
                              column?.colorLabel ?? "color",
                              column.sx
                            )
                        }
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        editor={editableToggle && column.editor}
                        sortable={column.sortable ?? false}
                        onCellEditComplete={onCellEditComplete}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "money":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header ?? "Balance"}
                        showFilterMatchModes={true}
                        filterField={column.filterField ?? "balance"}
                        filter={column.filter ?? false}
                        filterPlaceholder={
                          column.filterPlaceholder ?? "Filter by balance"
                        }
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={column.body ?? balanceBodyTemplate}
                        filterElement={
                          column.filterElement ?? balanceFilterTemplate
                        }
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        dataType={column.dataType ?? "numeric"}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        // editor={editableToggle && column.editor??priceEditor}
                        editor={(options) => cellEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        sortable={column.sortable ?? false}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "verified":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header ?? "Verified"}
                        showFilterMatchModes={true}
                        filterField={column.filterField ?? "verified"}
                        filter={column.filter ?? false}
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={(props) =>
                          column.body
                            ? column.body(props, column.field)
                            : verifiedBodyTemplate(props, column.field)
                        }
                        filterElement={(props) =>
                          column.filterElement
                            ? column.filterElement(props, column.headerLabel)
                            : verifiedFilterTemplate(props, column.headerLabel)
                        }
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        dataType={column.dataType ?? "boolean"}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        sortable={column.sortable ?? false}
                        editor={editableToggle && column.editor}
                        onCellEditComplete={onCellEditComplete}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
                case "custom":
                  {
                    return (
                      <Column
                        key={index}
                        field={column.field}
                        header={column.header}
                        showFilterMatchModes={true}
                        filterField={column.filterField ?? ""}
                        filterPlaceholder={column.filterPlaceholder}
                        filter={column.filter ?? false}
                        style={column.style ?? { minWidth: "12rem" }}
                        filterMenuStyle={
                          column.filterMenuStyle ?? { width: "14rem" }
                        }
                        frozen={column.frozen ?? false}
                        alignFrozen={column.alignFrozen ?? "left"}
                        body={column.body}
                        filterElement={column.filterElement}
                        filterClear={filterClearTemplate}
                        filterApply={filterApplyTemplate}
                        filterHeader={column.filterHeader}
                        filterFooter={column.filterFooter}
                        filterFunction={column.filterFunction}
                        dataType={column.dataType}
                        align={column.align ?? "left"}
                        alignHeader={column.alignHeader ?? "left"}
                        sortable={column.sortable ?? false}
                        editor={editableToggle && column.editor}
                        onCellEditComplete={onCellEditComplete}
                      />
                    );
                  }
                  // eslint-disable-next-line no-unreachable
                  break;
              }
            })}
            {editMode === "row" && edit?.window?.includes("inline") && (
              <Column
                header="Actions"
                rowEditor
                headerStyle={{ width: "10%", minWidth: "8rem" }}
                bodyStyle={{ textAlign: "center" }}
              />
            )}
          </DataTable>
          {add?.show && (
            <div
              className="w-full flex items-center px-2"
              style={{
                minHeight: 60,
                background: theme?.palette?.background?.paper,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<MdAdd fontWeight={700} fontSize={23} />}
                size="medium"
                onClick={() => {
                  if (add?.window === "dialog") {
                    dispatch(
                      showDialog({
                        header: add.header ?? "",
                        openDialog: true,
                      })
                    );
                  } else if (add?.window === "sidebar") {
                    dispatch(
                      showSidebar({
                        header: add.header ?? "",
                        openDialog: true,
                        position:
                          sideBar.position === "right"
                            ? "right"
                            : sideBar.position === "left"
                              ? "left"
                              : sideBar.position === "top"
                                ? "top"
                                : sideBar.position === "bottom"
                                  ? "bottom"
                                  : "right",
                        subtitle:
                          add?.subtitle ??
                          "Please fill out the form below with the necessary information.",
                        paddingX: sideBar?.paddingX ?? 10,
                        width: sideBar?.width ?? 350,
                      })
                    );
                  } else if (add?.window === "newpage") {
                    setNewComponent(() => add.component);
                    navigate(location.pathname + "/new", {
                      state: {
                        header: add?.header,
                        subtitle:
                          add?.subtitle ??
                          "Please fill out the form below with the necessary information.",
                      },
                    });
                  }
                  setAddOrEdit({ add: true, edit: false });
                }}
              >
                Add {listStyleTitle}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTableOverlay;
