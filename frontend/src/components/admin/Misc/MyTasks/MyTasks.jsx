/**** import common staff ***/
import React, {useEffect, useState} from "react";
import DataTableOverlay from "../../../utils/CrudComponents/DataTableOverlay"
import DialogOverlay from "../../../utils/CrudComponents/DialogOverlay"
import SidebarOverlay from "../../../utils/CrudComponents/SidebarOverlay"
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { TextField, IconButton, Checkbox, Chip } from "@mui/material";
import { DatePickerOverlay, SliderOverlay } from "../../../utils/CrudComponents/InputsOverlay";
import { MenuOverlay, PopoverOverlay, ProgressBarOverlay } from "../../../utils/CrudComponents/ComponentsOverlay";
import { filterTemplate } from "../../../utils/FilterTemplate";
import TableArrayInfo from "../../../utils/CrudComponents/TableArrayInfo";
import {TableArrayInfoExpansion} from "../../../utils/CrudComponents/TableArrayInfoExpansion";

/**** hooks ***/
import { useDataContext } from "../../../../DataContext";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from '@mui/material/styles';

/**** icons ***/
import {BiDotsVerticalRounded} from "react-icons/bi";
import {MdOutlineVisibility, MdOutlineDeleteOutline, MdOutlineModeEditOutline} from "react-icons/md";
import {BsFillPatchCheckFill} from 'react-icons/bs';
import {AiOutlineCloseCircle} from 'react-icons/ai';

/**** crud components ***/
import AddMyTask from "./AddMyTask";
import EditMyTask from "./EditMyTask";
import MyTaskDetail from "./MyTaskDetail";

/**** redux ***/
import { setAlert, setEditId, showDialog, showSidebar } from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import { useGetMyTasksQuery, useUpdateMyTaskMutation, useDeleteMyTaskMutation,  } from "../../../../features/main/mytasksApiSlice";

const MyTasks = ({parentId, name}) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const { setEditComponent, setChildOneDetailComponent } = useDataContext();
  const navigate = useNavigate();
  
  /* redux selectors */
  const myTaskPermissions = useSelector(state=>state?.common?.permissions?.main?.myTask);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const selectedCurrency = useSelector(state=>state.common.currency);
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  
  /* rtk query */
  const {
    data: myTasks,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetMyTasksQuery(parentId);
  const [updateMyTask, { isLoading: updateLoading }] = useUpdateMyTaskMutation();
  const [deleteMyTask, { isLoading: deleteLoading }] = useDeleteMyTaskMutation();
  
  /* user access control */
  const [userAccess, setUserAccess] = useState({
    add: false,
    edit: false,
    delete: false,
    detail: false,
  });
  
  useEffect(()=>{
    let userAccessData = {add: false, edit: false, delete: false, detail: false};
    //add permission check
    const foundAddRoles = authPermissions.filter(role => myTaskPermissions?.add?.includes(role))
    if (foundAddRoles.length > 0) {
      userAccessData = {...userAccessData, add: true}
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => myTaskPermissions?.edit?.includes(role))
    if (foundEditRoles.length > 0) {
      userAccessData = {...userAccessData, edit: true}
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => myTaskPermissions?.delete?.includes(role))
    if (foundDeleteRoles.length > 0) {
      userAccessData = {...userAccessData, delete: true}
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => myTaskPermissions?.detail?.includes(role))
    if (foundDetailRoles.length > 0) {
      userAccessData = {...userAccessData, detail: true}
    }
    setUserAccess(()=>userAccessData);
  },[])
  
  const [allMyTasks, setAllMyTasks] = useState([]);
  const [addedByFilterOptions, setAddedByFilterOptions] = useState([]);
  const [updatedByFilterOptions, setUpdatedByFilterOptions] = useState([]);
  
  useEffect(()=>{
    if(myTasks) {
      let allMyTasksUpdated = [];
      let addedBy = [];
      let updatedBy = [];
      let addedByIds = [];
      let updatedByIds = [];
      myTasks.map((myTask) =>  {
        if(!addedByIds.includes(myTask?.AddedByMyTask?.id)) {
          addedBy.push(myTask?.AddedByMyTask);
          addedByIds.push(myTask?.AddedByMyTask?.id);
        }
        if(!updatedByIds.includes(myTask?.UpdatedByMyTask?.id)) {
          updatedBy.push(myTask?.UpdatedByMyTask);
          updatedByIds.push(myTask?.UpdatedByMyTask?.id);
        }
        let updatedMyTask = {
          ...myTask,
          start: new Date(myTask?.start),
          end: new Date(myTask?.end),
          createdAt: new Date(myTask?.createdAt),
          updatedAt: new Date(myTask?.updatedAt),
        };
        allMyTasksUpdated.push(updatedMyTask);
      });
      setAllMyTasks(prev => allMyTasksUpdated);
      setAddedByFilterOptions(prev => addedBy);
      setUpdatedByFilterOptions(prev => updatedBy);
    }
  },[myTasks])
  
  /*** filter ***/
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  let lsTitle = localStorage.getItem("all_my_tasks");
  
  const initFilters = (clear=false) => {
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
      title: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      start: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      end: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      allDay: { value: null, matchMode: FilterMatchMode.EQUALS },
      description: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
    });
    if(clear) {
      setGlobalFilterValue("");
    } else {
      setGlobalFilterValue(lsTitle ? lsTitle : "");
    }
  };
  
  const onCellEditComplete = async (e) => {
    let { rowData, newValue, field, originalEvent: event } = e;
    if(newValue == null || rowData[field]==newValue) return;
    const fd = {id: rowData.id, ['_'+field]: newValue};
    const data = await updateMyTask(fd).unwrap()
    if(data.message==="Successfully Updated") {
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
    else if(data?.message) {
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
  
  const textEditor = (options) => {
    if(!userAccess.edit) {
      return options.rowData[options.field];
    }
    if(
      options.field==="title" || 
      options.field==="description"
    ) {
      return <TextField value={options.value} onChange={(e) => {options.editorCallback(e.target.value);}} variant="standard"/>
    }
    
    return options.rowData[options.field];
  }
  
  const numberEditor = (options) => {
    if(!userAccess.edit) {
      return new Intl.NumberFormat('en-US', { style: 'decimal'}).format(options.rowData[options.field])
    }
    return new Intl.NumberFormat('en-US', { style: 'decimal'}).format(options.rowData[options.field])
  }
  
  const currencyEditor = (options) => {
    if(!userAccess.edit) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits:  2,
        maximumFractionDigits: 2,
      }).format(options.rowData[options.field])
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits:  2,
      maximumFractionDigits: 2,
    }).format(options.rowData[options.field])
  }
  
  /* Start  Date editor and formatter */
  const format_start = (value) => {
    return value.toLocaleTimeString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: '2-digit', 
      minute: "2-digit",
    });
  }
  
  const start_editor = (options) => {
    if(!userAccess.edit) {
      return format_start(options.rowData[options.field]);
    }
    if(options.field==="start") {
      return (
        <Calendar value={options.value} onChange={(e) => {options.editorCallback(e.value);}} showTime hourFormat="12"  />
      );
    }
    return format_start(options.rowData[options.field]);
  }
  
  const start_filter = (options) => {
      return (
        <Calendar value={options.value} onChange={(e) => {options.filterCallback(e.value, options.index);}} showTime hourFormat="12"  />
      );
  }
  
  /* End  Date editor and formatter */
  const format_end = (value) => {
    return value.toLocaleTimeString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: '2-digit', 
      minute: "2-digit",
    });
  }
  
  const end_editor = (options) => {
    if(!userAccess.edit) {
      return format_end(options.rowData[options.field]);
    }
    if(options.field==="end") {
      return (
        <Calendar value={options.value} onChange={(e) => {options.editorCallback(e.value);}} showTime hourFormat="12"  />
      );
    }
    return format_end(options.rowData[options.field]);
  }
  
  const end_filter = (options) => {
      return (
        <Calendar value={options.value} onChange={(e) => {options.filterCallback(e.value, options.index);}} showTime hourFormat="12"  />
      );
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
    dispatch(setEditId(rowData?.id??0))
    setChildOneDetailComponent(()=><MyTaskDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess.edit}  />)
    navigate(location.pathname+"/detail", { state: { header: "MyTask Detail", subtitle: "All data related to this my task",} })
  }
  
  const loadMenuItem = (rowData)=>{
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
    if(userAccess.edit) {
      mi.push({
        name: "Edit MyTask",
        icon: <MdOutlineModeEditOutline/>,
        onClick: (e)=>{
          let type = "dialog";
          let header = "Edit my task information";
          let subtitle = "";
          let fullScreen = false;
          let position = "right";
          let width = "300px";
          let paddingX = "10px";
          if(type=="dialog") {
            dispatch(
              showDialog({
                header: header ? header : "Update MyTask",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                openDialog: true,
                editId: rowData?.id??0,
                disableDataTableWindows: true,
              })
            );
          } else if(type == "sidebar") {
            dispatch(
              showSidebar({
                header: header ? header : "Update MyTask",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                position: position,
                paddingX: paddingX,
                width: width,
                fullScreen: fullScreen,
                editId: rowData?.id??0,
                disableDataTableWindows: true,
              })
            );
          } else {
            dispatch(setEditId(rowData?.id??0))
            setEditComponent(()=><EditMyTask newPage={true}  parentId={parentId} />)
            navigate(location.pathname+"/edit", { state: { header: "Edit MyTask", subtitle: "Please fill out the form below with the necessary information.",} })
          }
        }
      });
    }
    if(userAccess.delete) {
      mi.push({
        name: "Delete MyTask",
        icon: <MdOutlineDeleteOutline/>,
        closeOnClick: false,
        onClick: (e)=>{
          handleClickEl(e, rowData.id, )
        }
      });
    }
    return mi;
  }
  
  
  const routeStates = [
    {
      label: "not_started",
      header: "Not Started",
      color: "#ef644a",
      access: [],
    },
    {
      label: "in_progress",
      header: "In Progress",
      color: "#01c7f8",
      access: [],
    },
    {
      label: "paused",
      header: "Paused",
      color: "#ffb400",
      access: [],
    },
    {
      label: "completed",
      header: "Completed",
      color: "#00cd74",
      access: [],
    },
    {
      label: "canceled",
      header: "Canceled",
      color: "#fd3183",
      access: [],
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
      field: "start",
      header: "Start Date",
      group: 2,
      filterField: "start",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by start date",
      frozen: false,
      type: "date",
      body: (rowData) => {
        return format_start(rowData["start"])
      },
      filterElement: (options) => start_filter(options),
      editor: (options) => start_editor(options),
    },
    {
      field: "end",
      header: "End Date",
      group: 2,
      filterField: "end",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by end date",
      frozen: false,
      type: "date",
      body: (rowData) => {
        return format_end(rowData["end"])
      },
      filterElement: (options) => end_filter(options),
      editor: (options) => end_editor(options),
    },
    {
      field: "allDay",
      header: "All Day",
      group: 2,
      filterField: "allDay",
      style: { minWidth: "5rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by all day",
      frozen: false,
      type: "verified",
      dataType:"boolean",
      editor: (options) => {
        if(!userAccess.edit) {
          return (
            <div className="flex justify-center">
              {(options.rowData[options.field]) ? <BsFillPatchCheckFill size={20} color="#2b91f7"/> : <AiOutlineCloseCircle size={20} color="#ed4e84"/> }
            </div>
          )
        }
        return <div className="flex justify-center"><Checkbox onChange={(e) => options.editorCallback(e.target.checked)} checked={options.value??false} /></div>
      },
      headerLabel: "Filter by all day",
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
        routeStates?.map((routeState)=>{
          if(routeState?.label == rowData?.routeState) {
            name = routeState?.header;
            if(routeState?.color) {
              backgroundColor = routeState?.color;
            }
          }
        })
        
        return (
          <span  className={`customer-badge`}>
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
      header: "Added By",
      field: 'AddedByMyTask',
      group: 'userinfo',
      filterPlaceholder: "Search user",
      filterField: "added_user_name",
      style: { minWidth: "11rem" },
      nameLabel: "name",
      imgLabel: "url",
      type: "useralt",
      filter: true,
      rozen:false,
      options: {addedByFilterOptions}
    },
    {
      header: "Updated By",
      field: 'UpdatedByMyTask',
      group: 'userinfo',
      filterPlaceholder: "Search user",
      filterField: "updated_user_name",
      style: { minWidth: "11rem" },
      nameLabel: "name",
      imgLabel: "url",
      type: "useralt",
      filter: true,
      rozen:false,
      options: {updatedByFilterOptions}
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
      frozen:false,
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
      frozen:false,
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
        return (
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
          />
        );
      },
    },
  ];
  
  
  const myTaskColumns = localStorage?.getItem("myTaskColumns")
  const colsArray = myTaskColumns ? myTaskColumns.split(',') : ["title","start","end","allDay","description","custom_actions"]
  const [visibleColumnsArray, setVisibleColumnsArray] = useState(colsArray);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [selection, setSelection] = useState([]);
  const [reloadDataTable, setReloadDataTable] = useState(false);
  
  useEffect(()=>{
    if(myTaskColumns) {
      setTimeout(() => {
        setReloadDataTable(true);
      }, 600);
    }
  },[])
  
  useEffect(()=>{
    let cols = []
    columns.map((column)=>{
      if(visibleColumnsArray?.includes(column?.field)) {
        cols.push(column)
      }
    })
    if(cols.length > 0) {
      localStorage?.setItem('myTaskColumns',visibleColumnsArray)
      setVisibleColumns(cols)
    }
    else {
      localStorage?.setItem('myTaskColumns',visibleColumnsArray)
      setVisibleColumns(columns)
    }
  },[visibleColumnsArray, userAccess, reloadDataTable])
  
  const [expandedRows, setExpandedRows] = useState(null);
  const [expandAllToggle, setExpandAllToggle] = useState(true);
  
  return (
    <div>
      <PopoverOverlay
        anchorEl={anchorEl?.anchor ?? null}
        handleClose={handleClose}
        headerTitle="Confirm Delete"
        okClick={async () => {
          const data = await deleteMyTask({ id: anchorEl?.id }).unwrap();
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
        bodyTitle={`Are you sure you want to permanently remove ${
          anchorEl.name ? '"' + anchorEl.name + '"' : "this mytask"
        }?`}
      />
      
      {disableDataTableWindows &&
      <DialogOverlay>
        <EditMyTask
          
          parentId={parentId}
        />
      </DialogOverlay>}
      {disableDataTableWindows &&
      <SidebarOverlay>
        <EditMyTask
          
          parentId={parentId}
        />
      </SidebarOverlay>}
      
      <TableArrayInfo
        dialogVisible={dialogInfoVisible?.show??false}
        setDialogVisible={setDialogInfoVisible}
        data={dialogInfoVisible?.data}
      />
      
      <DataTableOverlay
        data={allMyTasks}
        columns={visibleColumns}
        dataKey="id"
        filters={filters}
        setFilters={setFilters}
        globalFilterValue={globalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        initFilters={initFilters}
        title={name ? '`'+name+'` My Tasks' : 'All My Tasks'}
        emptyMessage={"No My Tasks Found"}
        scrollable={false}
        onSelectionChange={(e) => {
          setSelection(e.value);
        }}
        showGridlines={true}
        selection={selection}
        selectionMode={null}
        loading={isLoading}
        metaKeySelection={true}
        dragSelection={false}
        cellSelection={false}
        enableSelectCheckbox={false}
        onCellEditComplete={onCellEditComplete}
        editMode="cell"
        showDelete={true}
        add={{
          show: userAccess.add,
          window: "dialog",
          header: "Register My Task",
          subtitle: "",
          fullScreen: false,
          component: (
            <AddMyTask
              
              parentId={parentId}
            />
          ),
        }}
        
        edit={{
          show: userAccess.edit,
          window: ["inline", "dialog"],
          header: "",
          subtitle: "",
          fullScreen: false,
          component: (
            <EditMyTask
              
              parentId={parentId}
            />
          ),
        }}
        sideBar={{ position: "right", width: "300px", paddingX: "10px" }}
        //tableWidth="100%"
        visibleColumnsArray={visibleColumnsArray}
        setVisibleColumnsArray={setVisibleColumnsArray}
        allColumns={columns}
        detailClick={detailClick}
        editable={true}
        listView={0}
        routeStates={routeStates}
      />
    </div>
  );
}

export default MyTasks;