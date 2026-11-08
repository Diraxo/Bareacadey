import React, { useEffect, useState } from "react";

/**** crud components ***/
import AddMyTask from "./AddMyTask";
import EditMyTask from "./EditMyTask";
import MyTaskDetail from "./MyTaskDetail";

import { useDataContext } from "../../../../DataContext";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

/**** redux ***/
import {
  setAlert,
  setEditId,
  showDialog,
  showSidebar,
} from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import {
  useGetMyTasksQuery,
  useUpdateMyTaskMutation,
  useDeleteMyTaskMutation,
} from "../../../../features/main/myTasksApiSlice";
import CalendarOverlay from "../../../utils/Calendar/CalendarOverlay";
import DialogOverlay from "../../../utils/CrudComponents/DialogOverlay";

const MyTasksMain = ({ parentId }) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const { setEditComponent, setChildOneDetailComponent } = useDataContext();
  const navigate = useNavigate();

  /* redux selectors */
  const myTaskPermissions = useSelector(
    (state) => state?.common?.permissions?.myTask
  );
  const authPermissions = useSelector(
    (state) => state?.auth?.user?.permissions
  );
  const selectedCurrency = useSelector((state) => state.common.currency);
  const disableDataTableWindows = useSelector(
    (state) => state.common.disableDataTableWindows
  );

  /* rtk query */
  const {
    data: myTasks,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetMyTasksQuery(parentId);
  const [updateMyTask, { isLoading: updateLoading }] =
    useUpdateMyTaskMutation();
  const [deleteMyTask, { isLoading: deleteLoading }] =
    useDeleteMyTaskMutation();

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
          end: new Date(myTask?.end),
          st: new Date(myTask?.start),
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

  const [info, setInfo] = useState()
  
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

  const resizeCallback = async (id, start, end) => {
    if(!id || !start) return;
    const fd = {id: id, _start: start, _end: end};
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

  const detailClick = (rowData) => {
    dispatch(setEditId(rowData?.id??0))
    setChildOneDetailComponent(()=><MyTaskDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess.edit}  />)
    navigate(location.pathname+"/detail", { state: { header: "Task Detail", subtitle: "All data related to this my task",} })
  }

  return (
    <div>
      {disableDataTableWindows && (
        <DialogOverlay>
          <EditMyTask parentId={parentId} />
        </DialogOverlay>
      )}
      <CalendarOverlay
        data={allMyTasks}
        setInfo={setInfo}
        add={{
            show: userAccess.add,
            window: "dialog",
            header: "Register Task",
            subtitle: "",
            fullScreen: false,
            component: (
              <AddMyTask
                info={info}
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
          states={routeStates}
          resizeCallback={resizeCallback}
          detailClick={detailClick}
      />
    </div>
  );
};

export default MyTasksMain;
