/**** import common staff ***/
import React, { useEffect, useState } from "react";
import DataTableOverlay from "../../../utils/CrudComponents/DataTableOverlay"
import DialogOverlay from "../../../utils/CrudComponents/DialogOverlay"
import SidebarOverlay from "../../../utils/CrudComponents/SidebarOverlay"
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { TextField, IconButton, Checkbox, Chip, Rating } from "@mui/material";
import { DatePickerOverlay, SliderOverlay } from "../../../utils/CrudComponents/InputsOverlay";
import { MenuOverlay, PopoverOverlay, ProgressBarOverlay } from "../../../utils/CrudComponents/ComponentsOverlay";
import { filterTemplate } from "../../../utils/FilterTemplate";
import TableArrayInfo from "../../../utils/CrudComponents/TableArrayInfo";
import { TableArrayInfoExpansion } from "../../../utils/CrudComponents/TableArrayInfoExpansion";
import FilePreview from "../../../utils/CrudComponents/FilePreview";

/**** hooks ***/
import { useDataContext } from "../../../../DataContext";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from '@mui/material/styles';

/**** icons ***/
import { BiDotsVerticalRounded } from "react-icons/bi";
import { MdOutlineVisibility, MdOutlineDeleteOutline, MdOutlineModeEditOutline } from "react-icons/md";
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { TbEdit } from "react-icons/tb";

/**** crud components ***/
import AddCourse from "./AddCourse";
import EditCourse from "./EditCourse";
import CourseDetail from "./CourseDetail";

/**** redux ***/
import { setAlert, setEditId, showDialog, showSidebar } from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import { useGetCoursesQuery, useUpdateCourseMutation, useDeleteCourseMutation } from "../../../../features/main/coursesApiSlice";
import { useGetCategoriesQuery } from "../../../../features/main/categoriesApiSlice";

import useMediaQuery from '@mui/material/useMediaQuery';
import Loader from "../../../utils/Loader";

const Courses = ({ parentId, name }) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const xl = useMediaQuery(theme.breakpoints.down('xl'));

  const { setEditComponent, setChildOneDetailComponent } = useDataContext();
  const navigate = useNavigate();

  /* redux selectors */
  const coursePermissions = useSelector(state => state?.common?.permissions?.main?.course);
  const authPermissions = useSelector(state => state?.auth?.user?.permissions);
  const _userId = useSelector(state => state?.auth?.user?.id)
  const selectedCurrency = useSelector(state => state.common.currency);
  const disableDataTableWindows = useSelector(state => state.common.disableDataTableWindows);

  /* rtk query */
  const {
    data: courses,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetCoursesQuery(parentId);
  const [updateCourse, { isLoading: updateLoading }] = useUpdateCourseMutation();
  const [deleteCourse, { isLoading: deleteLoading }] = useDeleteCourseMutation();

  const { data: categories } = useGetCategoriesQuery();

  /* user access control */
  const [userAccess, setUserAccess] = useState({
    add: false,
    edit: false,
    delete: false,
    detail: false,
  });

  useEffect(() => {
    let userAccessData = { add: false, edit: false, delete: false, detail: false };
    //add permission check
    const foundAddRoles = authPermissions.filter(role => coursePermissions?.add?.includes(role))
    if (foundAddRoles.length > 0) {
      userAccessData = { ...userAccessData, add: true }
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => coursePermissions?.edit?.includes(role))
    if (foundEditRoles.length > 0) {
      userAccessData = { ...userAccessData, edit: true }
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => coursePermissions?.delete?.includes(role))
    if (foundDeleteRoles.length > 0) {
      userAccessData = { ...userAccessData, delete: true }
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => coursePermissions?.detail?.includes(role))
    if (foundDetailRoles.length > 0) {
      userAccessData = { ...userAccessData, detail: true }
    }
    setUserAccess(() => userAccessData);
  }, [])

  const [allCourses, setAllCourses] = useState([]);
  const [addedByFilterOptions, setAddedByFilterOptions] = useState([]);
  const [updatedByFilterOptions, setUpdatedByFilterOptions] = useState([]);

  useEffect(() => {
    if (courses) {
      let allCoursesUpdated = [];
      let addedBy = [];
      let updatedBy = [];
      let addedByIds = [];
      let updatedByIds = [];
      courses?.map((course) => {
        if (!addedByIds.includes(course?.AddedByCourse?.id)) {
          addedBy.push(course?.AddedByCourse);
          addedByIds.push(course?.AddedByCourse?.id);
        }
        if (!updatedByIds.includes(course?.UpdatedByCourse?.id)) {
          updatedBy.push(course?.UpdatedByCourse);
          updatedByIds.push(course?.UpdatedByCourse?.id);
        }
        let updatedCourse = {
          ...course,
          discount_start_date: course?.discount_start_date ? new Date(course?.discount_start_date) : "",
          discount_end_date: course?.discount_end_date ? new Date(course?.discount_end_date) : "",
          createdAt: new Date(course?.createdAt),
          updatedAt: new Date(course?.updatedAt),
        };
        allCoursesUpdated.push(updatedCourse);
      });
      setAllCourses(prev => allCoursesUpdated);
      setAddedByFilterOptions(prev => addedBy);
      setUpdatedByFilterOptions(prev => updatedBy);
    }
  }, [courses])

  /*** filter ***/
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  let lsTitle = localStorage.getItem("all_courses");

  const initFilters = (clear = false) => {
    setFilters({
      global: { value: lsTitle && !clear ? lsTitle : null, matchMode: FilterMatchMode.CONTAINS },
      added_user_name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      updated_user_name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      createdAt: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      updatedAt: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      enable_discount: { value: null, matchMode: FilterMatchMode.EQUALS },
      discounted_price: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      discount_percentage: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      discount_start_date: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      title: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      name_target_5: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      description: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      main_price: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      type: {
        operator: FilterOperator.OR,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      tags: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      discount_end_date: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
    });
    if (clear) {
      setGlobalFilterValue("");
    } else {
      setGlobalFilterValue(lsTitle ? lsTitle : "");
    }
  };

  const onCellEditComplete = async (e) => {
    let { rowData, newValue, field, originalEvent: event } = e;
    if (newValue == null || rowData[field] == newValue) return;
    const fd = { id: rowData.id, ['_' + field]: newValue };
    const data = await updateCourse(fd).unwrap()
    if (data.message === "Successfully Updated") {
      dispatch(setAlert(
        {
          openAlert: true,
          severity: "success",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right"
        }
      ));
    }
    else if (data?.message) {
      dispatch(setAlert(
        {
          openAlert: true,
          severity: "error",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right"
        }
      ));
    }
  }

  const checkRowEditable = (data) => {
    return (data?.added_by == _userId && data?.updated_by == _userId);
  }

  const textEditor = (options) => {
    if (!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return options.rowData[options.field];
    }
    if (
      options.field === "title" ||
      options.field === "description" ||
      options.field === "tags"
    ) {
      return <TextField value={options.value} onChange={(e) => { options.editorCallback(e.target.value); }} variant="standard" />
    }

    return options.rowData[options.field];
  }

  const numberEditor = (options) => {
    if (!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(options.rowData[options.field])
    }
    if (
      options.field === "discount_percentage"
    ) {
      return <InputNumber value={options.value} onChange={(e) => { options.editorCallback(e.value); }} />
    }

    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(options.rowData[options.field])
  }

  const currencyEditor = (options) => {
    if (!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(options.rowData[options.field])
    }
    if (
      options.field === "discounted_price" ||
      options.field === "main_price"
    ) {
      return <InputNumber value={options.value} onChange={(e) => { options.editorCallback(e.value); }} mode="currency" currency={selectedCurrency} locale="en-US" />
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(options.rowData[options.field])
  }

  /* Discount  Start  Date editor and formatter */
  const format_discount_start_date = (value) => {
    return !value ? "-" : new Date(value).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const discount_start_date_editor = (options) => {
    if (!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return format_discount_start_date(options.rowData[options.field]);
    }
    if (options.field === "discount_start_date") {
      return (
        <Calendar value={options.value} onChange={(e) => { options.editorCallback(e.value); }} dateFormat="mm/dd/yy" placeholder="/" />
      );
    }
    return format_discount_start_date(options.rowData[options.field]);
  }

  const discount_start_date_filter = (options) => {
    return (
      <Calendar value={options.value} onChange={(e) => { options.filterCallback(e.value, options.index); }} dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
    );
  }

  /* Discount  End  Date editor and formatter */
  const format_discount_end_date = (value) => {
    return !value ? "-" : new Date(value).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const discount_end_date_editor = (options) => {
    if (!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return format_discount_end_date(options.rowData[options.field]);
    }
    if (options.field === "discount_end_date") {
      return (
        <Calendar value={options.value} onChange={(e) => { options.editorCallback(e.value); }} dateFormat="mm/dd/yy" placeholder="/" />
      );
    }
    return format_discount_end_date(options.rowData[options.field]);
  }

  const discount_end_date_filter = (options) => {
    return (
      <Calendar value={options.value} onChange={(e) => { options.filterCallback(e.value, options.index); }} dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
    );
  }

  /* Category Editor */
  const name_target_5_editor = (options) => {
    if (!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return options.rowData[options.field];
    }
    if (options.field === "name_target_5") {
      return (
        <Dropdown
          value={options?.rowData?.category_id}
          options={categories}
          optionLabel={'name'}
          optionValue='id'
          filterTemplate={filterTemplate}
          emptyFilterMessage={
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 50,
            }}>
              <div className="px-4 py-1 rounded-md" style={{ fontWeight: 500, fontSize: 13 }}>No available options</div>
            </div>
          }
          onChange={(e) => {
            if (options.rowData?.category_id != e.value) {
              const params = {
                rowData: options.rowData,
                newValue: e.value,
                field: 'category_id',
              }
              onCellEditComplete(params);
            }
          }}
          placeholder="Select Category"
        />
      );
    }
    return options.rowData[options.field];
  }

  const [anchorEl, setAnchorEl] = useState({
    anchor: null,
    id: 0,
  });
  const handleClickEl = (event, id, name) => {
    setAnchorEl({
      anchor: event.currentTarget,
      id: id,
      name: name
    });
  }

  const handleClose = () => {
    setAnchorEl({
      ...anchorEl,
      anchor: null,
      name: null
    });
  }

  const detailClick = (rowData) => {
    dispatch(setEditId(rowData?.id ?? 0))
    setChildOneDetailComponent(() => <CourseDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess?.edit} deleteAccess={userAccess?.delete} categories={categories} editItem={checkRowEditable(rowData)} />)
    navigate(location.pathname + "/detail", { state: { header: "Course Detail", subtitle: "All data related to this course", } })
  }

  const loadMenuItem = (rowData, inline = false) => {
    let mi = [];
    /*
    if(userAccess.detail) {
      mi.push({
        name: "View Detail",
        icon: <MdOutlineVisibility/>,
        onClick: (e)=>{
          detailClick(rowData)
        }
      });
    }
    */
    if (userAccess.edit) {
      mi.push({
        name: "Edit Course",
        icon: <TbEdit size={inline ? 21 : 19} />,
        onClick: (e) => {
          let type = "dialog";
          let header = "Edit course";
          let subtitle = "";
          let fullScreen = false;
          let position = "right";
          let width = "330px";
          let paddingX = "10px";
          if (type == "dialog") {
            dispatch(
              showDialog({
                header: header ? header : "Update Course",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                openDialog: true,
                editId: rowData?.id ?? 0,
                disableDataTableWindows: true,
              })
            );
          } else if (type == "sidebar") {
            dispatch(
              showSidebar({
                header: header ? header : "Update Course",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                position: position,
                paddingX: paddingX,
                width: width,
                fullScreen: fullScreen,
                editId: rowData?.id ?? 0,
                disableDataTableWindows: true,
              })
            );
          } else {
            dispatch(setEditId(rowData?.id ?? 0))
            setEditComponent(() => <EditCourse newPage={true} categories={categories} parentId={parentId} />)
            navigate(location.pathname + "/edit", { state: { header: "Edit Course", subtitle: "Please fill out the form below with the necessary information.", } })
          }
        }
      });
    }
    if (userAccess.delete) {
      mi.push({
        name: "Delete Course",
        icon: <MdOutlineDeleteOutline size={inline ? 22 : 20} />,
        closeOnClick: false,
        onClick: (e) => {
          handleClickEl(e, rowData.id,)
        }
      });
    }
    return mi;
  }

  const typeOptions = [{name: "Regular Course", value: "course"}, {name: "Book", value: "book"}]

  const routeStates = [
    {
      label: "draft",
      header: "Draft",
      color: "red",
      access: [],
      set_access: [""],
    },
    {
      label: "published",
      header: "Published",
      color: "green",
      access: [],
      set_access: [""],
    },
  ]

  const [dialogInfoVisible, setDialogInfoVisible] = useState({
    show: false,
    data: []
  })
  let columns = [
    {
      field: "title",
      header: "Title",
      group: 2,
      filterField: "title",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by title",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
    },
    {
      field: "name_target_5",
      header: "Category",
      type: "text",
      group: 2,
      filterField: "name_target_5",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by name",
      frozen: false,
      editor: (options) => name_target_5_editor(options),
    },
    {
      field: "description",
      header: "Description",
      group: 2,
      filterField: "description",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by description",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
    },
    {
      field: "routeState",
      header: "Status",
      group: 1,
      style: { minWidth: "11rem" },
      type: "custom",
      body: (rowData) => {
        let name = ""
        let backgroundColor = theme?.palette?.primary?.main;
        routeStates?.map((routeState) => {
          if (routeState?.label == rowData?.routeState) {
            name = routeState?.header;
            if (routeState?.color) {
              backgroundColor = routeState?.color;
            }
          }
        })

        return (
          <span className={`customer-badge`}>
            <Chip
              sx={{
                height: 25,
                borderRadius: 1,
                color: backgroundColor ? 'white' : '',
                backgroundColor: backgroundColor,
              }}
              label={name}
            />
          </span>
        )
      },
    },
    {
      field: "thumbnail",
      header: "Thumbnail",
      group: 2,
      style: { minWidth: "11rem" },
      filter: false,
      type: "custom",
      body: (rowData) => {
        const thumbnailList = rowData?.thumbnail;
        if (thumbnailList?.length > 0) {
          return (
            <div className="flex gap-2">
              {
                  <FilePreview file={thumbnailList[0]} selectedIndex={0} allFiles={thumbnailList?.map((fl)=>({uri: fl?.filepath, fileName: fl?.filename, fileType: fl?.mimetype?.split("/").pop()}))} key={thumbnailList[0]?.filepath}/>  
              }
            </div>
          )
        }
      },
    },
    {
      field: "introduction_video",
      header: "Introduction Video",
      group: 2,
      style: { minWidth: "11rem" },
      filter: false,
      type: "custom",
      body: (rowData) => {
        const introduction_videoList = rowData?.introduction_video;
        if (introduction_videoList?.length > 0) {
          return (
            <div className="flex gap-2">
              {
                  <FilePreview file={introduction_videoList[0]} selectedIndex={0} allFiles={introduction_videoList?.map((fl)=>({uri: fl?.filepath, fileName: fl?.filename, fileType: fl?.mimetype?.split("/").pop()}))} key={introduction_videoList[0]?.filepath}/>  
              }
            </div>
          )
        }
      },
    },
    // {
    //   field: "tags",
    //   header: "Tags",
    //   group: 2,
    //   filterField: "tags",
    //   style: { minWidth: "11rem" },
    //   filter: true,
    //   sortable: false,
    //   filterPlaceholder: "Filter by tags",
    //   frozen: false,
    //   type: "text",
    //   editor: (options) => textEditor(options),
    // },
    {
      field: "type",
      header: "Type",
      group: 2,
      filterField: "type",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by type",
      frozen: false,
      type: "status",
      nameLabel: "name",
      valueLabel: "value",
      colorLabel: "color",
      options: typeOptions,
      editor: (options) => {
        if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
          return typeOptions?.map((op, indx) => {
            if(op['value']==options.rowData['type']) {
              return op['color'] ? (
                <span  className='customer-badge' key={indx}>
                  <Chip
                    sx={{
                      height: 25,
                      borderRadius: 1,
                      color: 'white',
                      backgroundColor: op['color'],
                    }}
                    label={op['name']}
                  />
                </span>
              ) : <span key={indx}>{op['name']}</span>;
            }
          })
        }
        return (
          <Dropdown
            value={options.value}
            options={ typeOptions }
            optionLabel="name"
            optionValue="value"
            onChange={e => {
              if(options.rowData[options.field] == e.value) return;
              const params = {
                rowData: options.rowData,
                newValue: e.value,
                field: "type"
              };
              onCellEditComplete(params);
            }}
            placeholder="Select type"
            filterTemplate={filterTemplate}
            emptyFilterMessage={
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 50,
              }}>
                <div className="px-4 py-1 rounded-md" style={{fontWeight: 500, fontSize: 13}}>No available options</div>
              </div>
            }
            itemTemplate={(option, index) => {
              return option["color"] ? (
                <span  className="customer-badge" key={index}>
                  <Chip
                    sx={{
                      height: 25,
                      borderRadius: 1,
                      color: option["color"] ? 'white' : '',
                      backgroundColor: option["color"]??"",
                    }}
                    label={option["name"]}
                  />
                </span>
              ) : <span key={index}>{option['name']}</span>;
            }}
          />
        );
      },
    },
    {
      field: "pdf_files",
      header: "PDF Files",
      group: 2,
      style: { minWidth: "11rem" },
      filter: false,
      dependencies: {
        op: "&&",
        dependencies: {
          type: {
            op: "==",
            value: "book",
            valueType: "string",
            type: "value",
            formula: [],
          },
        },
      },
      type: "custom",
      body: (rowData) => {
        const pdf_filesList = rowData?.pdf_files;
        if(pdf_filesList?.length > 0) {
          return (
            <div className="flex gap-2">
            {
              pdf_filesList?.map((pdf_files, i)=>{
                return <FilePreview file={pdf_files} selectedIndex={i} allFiles={pdf_filesList?.map((fl)=>({uri: fl?.filepath, fileName: fl?.filename, fileType: fl?.mimetype?.split("/").pop()}))} key={pdf_files?.filepath}/>  
              })
            }
            </div>
          )
        }
      },
    },
    {
      header: "Added By",
      field: 'AddedByCourse',
      group: 'userinfo',
      filterPlaceholder: "Search user",
      filterField: "added_user_name",
      style: { minWidth: "11rem" },
      nameLabel: "name",
      imgLabel: "url",
      type: "useralt",
      filter: true,
      rozen: false,
      options: { addedByFilterOptions }
    },
    {
      header: "Updated By",
      field: 'UpdatedByCourse',
      group: 'userinfo',
      filterPlaceholder: "Search user",
      filterField: "updated_user_name",
      style: { minWidth: "11rem" },
      nameLabel: "name",
      imgLabel: "url",
      type: "useralt",
      filter: true,
      rozen: false,
      options: { updatedByFilterOptions }
    },
    {
      field: "createdAt",
      header: "Created At",
      filterField: "createdAt",
      group: 'userinfo',
      filterPlaceholder: "Filter by date",
      style: { minWidth: "11rem" },
      type: "date",
      filter: true,
      frozen: false,
      body: (rowData) => {
        return rowData['createdAt']?.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
    },
    {
      field: "updatedAt",
      header: "Updated At",
      group: 'userinfo',
      filterField: "updatedAt",
      filterPlaceholder: "Filter by date",
      style: { minWidth: "11rem" },
      type: "date",
      filter: true,
      frozen: false,
      body: (rowData) => {
        return rowData['updatedAt']?.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }
    },
    (userAccess.edit || userAccess.delete) && {
      field: "custom_actions",
      header: "Actions",
      type: "custom",
      style: { minWidth: "3rem" },
      filter: false,
      frozen: false,

      body: (rowData) => {
        const showStyle = "menu";
        const disabled = !checkRowEditable(rowData);
        return showStyle == "menu" ? (
          <MenuOverlay
            button={
              <IconButton>
                <BiDotsVerticalRounded size={20} />
              </IconButton>
            }
            sx={{
              mt: 5,
            }}
            menuItems={loadMenuItem(rowData)}
            disabled={disabled}
          />
        ) : !disabled ? (
          <div className='flex items-center justify-start'>
            {loadMenuItem(rowData, true)?.map((rd, ind) => {
              return (
                <IconButton key={ind} onClick={rd?.onClick}>{rd?.icon}</IconButton>
              )
            })}
          </div>
        ) : <></>;
      },
    },
  ];


  const courseColumns = localStorage?.getItem("courseColumns")
  const colsArray = courseColumns ? courseColumns.split(',') : ["title", "name_target_5", "thumbnail", "introduction_video", "custom_actions"]
  const [visibleColumnsArray, setVisibleColumnsArray] = useState(colsArray);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [selection, setSelection] = useState([]);
  const [reloadDataTable, setReloadDataTable] = useState(false);

  useEffect(() => {
    if (courseColumns) {
      setTimeout(() => {
        setReloadDataTable(true);
      }, 600);
    }
  }, [])

  useEffect(() => {
    let cols = []
    columns.map((column) => {
      if (visibleColumnsArray?.includes(column?.field)) {
        cols.push(column)
      }
    })
    if (cols.length > 0) {
      localStorage?.setItem('courseColumns', visibleColumnsArray)
      setVisibleColumns(cols)
    }
    else {
      localStorage?.setItem('courseColumns', visibleColumnsArray)
      setVisibleColumns(columns)
    }
  }, [visibleColumnsArray, userAccess, reloadDataTable])

  const [expandedRows, setExpandedRows] = useState(null);
  const [expandAllToggle, setExpandAllToggle] = useState(true);

  const gridComponent = (course) => {
    const { id, title, thumbnail, name_target_5, Category, rating, userRatings } = course;
    let image = ""
    if (thumbnail?.length > 0) {
      image = thumbnail[0]?.filepath
    }
    return (
      <div>
        <div className='flex flex-col items-start justify-between pb-0 shadow-3 border rounded' style={{ minHeight: 320 }}>
          <div className='flex-1'>
            <div
              className="hover:cursor-pointer"
            >
              <div className='flex items-center justify-center' style={{ backgroundColor: '#e0dfe5' }}>
                <img src={image} alt="" className='rounded' style={{ objectFit: "fill", aspectRatio: '1080/720' }} />
              </div>
            </div>
          </div>
          <div className='p-2 w-full'>
            <div
              className="hover:cursor-pointer"
            >
              <p className={`text-lg pr-5 font-bold ${!xl ? "product_title" : "truncate"} mt-0`}>{title}</p>
            </div>
            <div className="flex gap-3 items-center mt-2">
              <Rating
                name="rating"
                value={parseFloat(rating) ?? 0}
                precision={0.5}
                className=""
                readOnly
              />
              <p className="text-lg">({userRatings?.length})</p>
            </div>
            <p className='text-md font-bold mt-1 w-fit my-2 py-1 bg-[#21aa68] text-white rounded-md px-2'>{name_target_5}</p>
          </div>
        </div>
      </div>
    )
  }

  return isLoading ? <Loader /> : (
    <div>
      <PopoverOverlay
        anchorEl={anchorEl?.anchor ?? null}
        handleClose={handleClose}
        headerTitle="Confirm Delete"
        okClick={async () => {
          const data = await deleteCourse({ id: anchorEl?.id }).unwrap();
          if (data.message === "Successfully Deleted") {
            dispatch(
              setAlert({
                openAlert: true,
                severity: "success",
                message: data?.message,
                autoHideDuration: 5000,
                vertical: "top",
                horizontal: "right",
              })
            );
          } else if (data.message ?? false) {
            dispatch(
              setAlert({
                openAlert: true,
                severity: "error",
                message: data?.message,
                autoHideDuration: 5000,
                vertical: "top",
                horizontal: "right",
              })
            );
          }
        }}
        bodyTitle={`Are you sure you want to permanently remove ${anchorEl.name ? '"' + anchorEl.name + '"' : "this course"
          }?`}
      />

      {disableDataTableWindows &&
        <DialogOverlay>
          <EditCourse
            categories={categories}

            parentId={parentId}
          />
        </DialogOverlay>}
      {disableDataTableWindows &&
        <SidebarOverlay>
          <EditCourse
            categories={categories}

            parentId={parentId}
          />
        </SidebarOverlay>}

      <TableArrayInfo
        dialogVisible={dialogInfoVisible?.show ?? false}
        setDialogVisible={setDialogInfoVisible}
        data={dialogInfoVisible?.data}
      />

      <DataTableOverlay
        data={allCourses}
        columns={visibleColumns}
        dataKey="id"
        filters={filters}
        setFilters={setFilters}
        globalFilterValue={globalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        initFilters={initFilters}
        title={name ? '`' + name + '` Courses' : 'All Courses'}
        routeTitle="Course"
        emptyMessage={"No Courses Found"}
        scrollable={false}
        onSelectionChange={(e) => {
          if (allCourses?.length <= 0) {
            setSelection(e.value);
            return;
          }
          const selections = e.value;
          let filteredSelections = [];
          for (let i = 0; i < selections?.length; i++) {
            let selection = selections[i];
            let exists = allCourses?.some(item => item.id == selection.id);
            if (exists) {
              filteredSelections.push(selection);
            }
          }
          setSelection(filteredSelections);
        }}
        showGridlines={true}
        selection={selection}
        selectionMode={null}
        enableSelectCheckbox={false}
        loading={isLoading}
        metaKeySelection={true}
        dragSelection={true}
        cellSelection={false}
        onCellEditComplete={onCellEditComplete}
        editMode="cell"
        showDelete={userAccess?.delete}
        add={{
          show: userAccess.add,
          window: "dialog",
          header: "Register Course",
          subtitle: "",
          fullScreen: false,
          component: (
            <AddCourse
              categories={categories}
              parentId={parentId}
            />
          ),
        }}

        edit={{
          show: userAccess.edit,
          window: ["inline", "dialog"],
          header: "Edit Course",
          subtitle: "",
          fullScreen: false,
          component: (
            <EditCourse
              categories={categories}
              parentId={parentId}
              bulk={true}
            />
          ),
        }}
        sideBar={{ position: "right", width: "330px", paddingX: "10px" }}
        //tableWidth="100%"
        visibleColumnsArray={visibleColumnsArray}
        setVisibleColumnsArray={setVisibleColumnsArray}
        allColumns={columns}
        detailClick={detailClick}
        editable={true}
        listView={0}
        routeStates={routeStates}
        selectableCallback={(data) => checkRowEditable(data)}
        gridComponent={gridComponent}
      />
    </div>
  );
}

export default Courses;