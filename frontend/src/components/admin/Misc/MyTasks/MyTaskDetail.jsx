import React,{ useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { setAlert, setEditId } from "../../../../app/slices/commonSlice";
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, useMediaQuery } from '@mui/material';
import { TabOverlay, VerticalStepDetailOverlay } from "../../../utils/CrudComponents/ComponentsOverlay";
import { useDataContext } from "../../../../DataContext";
import EditMyTask from "./EditMyTask";
import { useGetMyTaskQuery, useUpdateRouteStateMyTaskMutation } from '../../../../features/main/myTasksApiSlice';
import StateButton from '../../../utils/CrudComponents/StateButton';
import Loader from '../../../utils/Loader';
import { FilterDetailColumns } from '../../../utils/CrudComponents/UtilityFunctions';
import { BsFillPatchCheckFill } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { MdCached } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";

const MyTaskDetail = ({ columns, id, editAccess, allowedFields }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setEditComponent } = useDataContext();
  const md = useMediaQuery(theme.breakpoints.down("md"));
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  
  const {data: myTask} = useGetMyTaskQuery(id);
  const [updateRouteState, { isLoading: updateLoading }] = useUpdateRouteStateMyTaskMutation();
  
  const [data, setData] = useState(null);
  
  useEffect(()=>{
    if(myTask) {
      let updatedMyTask = {
        ...myTask,
        start: new Date(myTask?.start),
        end: new Date(myTask?.end),
        createdAt: new Date(myTask?.createdAt),
        updatedAt: new Date(myTask?.updatedAt),
      };
      setData(updatedMyTask)
    }
  },[myTask])
  
  const updateState = async (state) => {
  
    if(!state) return;
    const fd = {id: id, routeState: state};
    const data = await updateRouteState(fd).unwrap()
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
  
  const [viewStyle, setViewStyle] = useState("vertical-step");
  
  const groups = [
    {
      id: 2,
      name: "Task Detail",
    },
    {
      id: "userinfo",
      name: "Record Information",
    }
  ];
  
  const [filteredColumns, setFilteredColumns] = useState(columns)
  const [filteredGroups, setFilteredGroups] = useState(groups)
  
  useEffect(()=>{
    if(data && columns && groups) {
      const {newColumns, newGroups} = FilterDetailColumns(columns, groups, data)
      setFilteredColumns((prev) => newColumns);
      setFilteredGroups((prev) => newGroups);
    }
  },[data])
  
  const verifiedBodyTemplate = (rowData, nameLabel) => {
    return (
      <div className="flex justify-left">
        {rowData[nameLabel] ? (
          <BsFillPatchCheckFill size={20} color="#2b91f7" />
        ) : (
          <AiOutlineCloseCircle size={20} color="#ed4e84" />
        )}
      </div>
    );
  }
  
  const [options, setOptions] = useState([]);
  
  useEffect(() => {
    if(!data) return;
    let ops = [];
    filteredGroups?.map((group) => {
      let cols = [];
      filteredColumns?.map((column) => {
        if (column?.group != group?.id) return;
        cols.push(column);
      });
      if (cols?.length <= 0) return;
      const element = (
        <div className="mt-5 px-4" key={group?.id}>
          <table style={{ width: cols?.length < 7 || md ? "auto" : "100%" }}>
            <tbody>
              {(cols?.length < 7 || md) &&
                cols?.map((column, columnIndex) => {
                  let value = data[column?.field] ?? null;
                  return (
                    <tr key={"column" + columnIndex}>
                      <td style={{ paddingBottom: 20 }}>
                        <p className="text-[16px] font-bold truncate pr-6">{column?.header}</p>
                      </td>
                      <td width="30px"></td>
                      <td style={{ paddingBottom: 20 }}>
                        <div
                          className=""
                          style={{
                            fontSize: 16,
                            fontWeight: 500,
                            minWidth: 130,
                            color: theme?.palette?.secondary?.dark,
                          }}
                        >
                          {value != null &&
                            (value == true || value.toString() == "false")
                              ? verifiedBodyTemplate(data, column?.field)
                              : !value ? " - "
                              : column?.body
                              ? column.body(data) ?? " - "
                              : Object?.keys(data)?.map((key, index) => {
                                if (key == column?.field) {
                                  let user = [];
                                  if (
                                    column.group == "userinfo" &&
                                    (column?.header == "Added By" ||
                                      column?.header == "Updated By")
                                  ) {
                                    if (column?.header == "Added By") {
                                      user = column?.options?.addedByFilterOptions;
                                    } else {
                                      user = column?.options?.updatedByFilterOptions;
                                    }
                                    if (user) {
                                      return user[0]?.name ? (
                                        <div
                                          className="flex justify-start items-center"
                                          key={"user" + index}
                                        >
                                          <Avatar
                                            src={user[0]?.url}
                                            sx={{ width: 28, height: 28 }}
                                          >
                                            {!user[0]?.url
                                              ? user[0]?.name[0]
                                              : ""}
                                          </Avatar>
                                          <span
                                            style={{
                                              marginLeft: ".5em",
                                              verticalAlign: "middle",
                                            }}
                                          >
                                            {user[0]?.name ?? " - "}
                                          </span>
                                          
                                        </div>
                                      ) : (
                                        " - "
                                      );
                                    }
                                  }
                                  return column?.body
                                    ? column?.body(data)
                                    : data[key]
                                    ? data[key].toString()
                                    : " - ";
                                }
                              })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {cols?.length >= 7 && !md && (
                <tr>
                  <td width="50%">
                    <table>
                      <tbody>
                        {cols?.map((column, columnIndex) => {
                          if (columnIndex >= cols?.length / 2) return;
                          let value = data[column?.field] ?? null;
                          
                          return (
                            <tr key={"column" + columnIndex}>
                              <td style={{ paddingBottom: 20 }}>
                                <p className="text-[16px] font-bold truncate pr-6">{column?.header}</p>
                              </td>
                              <td width="30px"></td>
                              <td style={{ paddingBottom: 20 }}>
                                <div
                                  className=""
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 500,
                                    minWidth: 130,
                                    marginRight: 50,
                                    color: theme?.palette?.secondary?.dark,
                                  }}
                                >
                                  {value != null &&
                                  (value == true || value.toString() == "false")
                                    ? verifiedBodyTemplate(data, column?.field)
                                    : !value ? " - "
                                    : column?.body
                                    ? column.body(data) ?? " - "
                                    : Object?.keys(data)?.map((key, index) => {
                                      if (key == column?.field) {
                                        let user = [];
                                        if (
                                          column.group == "userinfo" &&
                                          (column?.header == "Added By" ||
                                            column?.header == "Updated By")
                                        ) {
                                          if (column?.header == "Added By") {
                                            user = column?.options?.addedByFilterOptions;
                                          } else {
                                            user = column?.options?.updatedByFilterOptions;
                                          }
                                          if (user) {
                                            return user[0]?.name ? (
                                              <div
                                                className="flex justify-start items-center"
                                                key={"user" + index}
                                              >
                                                <Avatar
                                                  src={user[0]?.url}
                                                  sx={{
                                                    width: 28,
                                                    height: 28,
                                                  }}
                                                >
                                                  {!user[0]?.url ? user[0]?.name[0] : ""}
                                                </Avatar>
                                                <span
                                                  style={{
                                                    marginLeft: ".5em",
                                                    verticalAlign: "middle",
                                                  }}
                                                >
                                                  {user[0]?.name ?? " - "}
                                                </span>
                                              </div>
                                            ) : (
                                              " - "
                                            );
                                          }
                                        }
                                        return column?.body
                                          ? column?.body(data)
                                          : data[key]
                                          ? data[key].toString()
                                          : " - ";
                                      }
                                    })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </td>
                  <td width="50%">
                    <table>
                      <tbody>
                        {cols?.map((column, columnIndex) => {
                          if (columnIndex < cols?.length / 2) return;
                          return (
                            <tr key={"column" + columnIndex}>
                              <td style={{ paddingBottom: 20 }}>
                                <p className="text-[16px] font-bold truncate pr-6">{column?.header}</p>
                              </td>
                              <td width="30px"></td>
                              <td style={{ paddingBottom: 20 }}>
                                <div
                                  className=""
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 500,
                                    minWidth: 130,
                                    color: theme?.palette?.secondary?.dark,
                                  }}
                                >
                                  {column?.body
                                    ? column.body(data) ?? " - "
                                    : Object?.keys(data)?.map((key, index) => {
                                      if (key == column?.field) {
                                        let user = [];
                                        if (
                                          column.group == "userinfo" &&
                                          (column?.header == "Added By" ||
                                            column?.header == "Updated By")
                                        ) {
                                          if (column?.header == "Added By") {
                                            user = column?.options?.addedByFilterOptions;
                                          } else {
                                            user =  column?.options?.updatedByFilterOptions;
                                          }
                                          if (user) {
                                            return user[0]?.name ? (
                                              <div
                                                className="flex justify-start items-center"
                                                key={"user" + index}
                                              >
                                                <Avatar
                                                  src={user[0]?.url}
                                                  sx={{
                                                    width: 28,
                                                    height: 28,
                                                  }}
                                                >
                                                  {!user[0]?.url ? user[0]?.name[0] : ""}
                                                </Avatar>
                                                <span
                                                  style={{
                                                    marginLeft: ".5em",
                                                    verticalAlign: "middle",
                                                  }}
                                                >
                                                  {user[0]?.name ?? " - "}
                                                </span>
                                              </div>
                                            ) : (
                                              " - "
                                            );
                                          }
                                        }
                                        return column?.body
                                          ? column?.body(data)
                                          : data[key]
                                          ? data[key].toString()
                                          : " - ";
                                      }
                                    })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
      ops.push({
        name: (
          <p
            style={{
              fontSize: 16,
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {group?.name}
          </p>
        ),
        element: element,
        nameNoStyle: group?.name,
        id: group?.id,
        parentId: group?.parentId,
      });
    });
    setOptions(ops);
  }, [md, data, filteredColumns, filteredGroups]);
  
  const routeStates = [
    {
      label: "not_started",
      header: "Not Started",
      color: "#ef644a",
    },
    {
      label: "in_progress",
      header: "In Progress",
      color: "#01c7f8",
    },
    {
      label: "paused",
      header: "Paused",
      color: "#ffb400",
    },
    {
      label: "completed",
      header: "Completed",
      color: "#00cd74",
    },
    {
      label: "canceled",
      header: "Canceled",
      color: "#fd3183",
    },
  ]
  
  const routeActions = [
    {
      name: "Start",
      color: "#01c7f8",
      show: ["not_started","paused","canceled"],
      access: [],
      onClick: ()=>{
        updateState("in_progress")
      }
    },
    {
      name: "Complete",
      color: "#00cd74",
      show: ["in_progress"],
      access: [],
      onClick: ()=>{
        updateState("completed")
      }
    },
    {
      name: "Pause",
      color: "#ffb400",
      show: ["in_progress"],
      access: [],
      onClick: ()=>{
        updateState("paused")
      }
    },
    {
      name: "Cancel",
      color: "#fd3183",
      show: ["in_progress"],
      access: [],
      onClick: ()=>{
        updateState("canceled")
      }
    },
    {
      name: "Reset To Progress",
      color: "#01c7f8",
      show: ["completed"],
      access: [],
      onClick: ()=>{
        updateState("in_progress")
      }
    },
  ]
  
  return data && Object.keys(data)?.length > 0 ?
  (
    <div>
      <div className="w-full flex flex-wrap justify-between p-3 gap-2">
        <div>
          <p className="text-2xl">
            <span className="font-bold text-2xl">{}</span>{" "}
            Task Detail
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        </div>
      </div>
      {editAccess && (
        <div
          className={`mx-4 ${
            viewStyle == "tab" ? "mb-3" : "mb-5"
          } flex justify-start gap-3 flex-wrap`}
        >
          <Button
            // variant="outlined"
            startIcon={<IoArrowBack />}
            color="secondary"
            size="medium"
            onClick={() => {
              navigate(
                location?.pathname?.slice(0,location?.pathname?.lastIndexOf("/"))
              );
            }}
          >
            Back
          </Button>
          <Button
            // variant="outlined"
            startIcon={<MdCached />}
            size="medium"
            onClick={() => {
              dispatch(setEditId(data?.id ?? 0));
              setEditComponent(() => (
                <EditMyTask newPage={true} doubleHistoryBack={false}  />
              ));
              navigate(location.pathname + "/edit", {
                state: {
                  header: "Edit My Task",
                  subtitle: "",
                },
              });
            }}
          >
            Update
          </Button>
        </div>
      )}
      <div
        className={`w-full border-t-2 border-b-2 ${
          theme?.palette?.mode == "dark" ? "border-gray-700" : ""
        } mb-4 ${
          !editAccess ? "mt-4" : ""
        } flex justify-between flex-wrap gap-3 items-center pl-4 pr-3`}
        style={{ minHeight: 50 }}
      >
        <div className="flex gap-3 flex-wrap items-center justify-start">
          {routeActions?.map((routeAction, index)=>{
            if(!routeAction?.show?.includes(data?.routeState)) return;
            let accessRights = [];
            if(routeAction?.access?.length > 0) {
              routeAction?.access?.map((acc)=>{
                if(authPermissions?.includes(acc)) {
                  accessRights.push(acc)
                }
              })
            }
            if(routeAction?.access?.length > 0 && accessRights?.length <= 0) return;
            return (
              <StateButton routeAction={routeAction} key={index} /> 
            )
          })}
        </div>
        <div
          className="flex flex-wrap items-center justify-end h-full"
          style={{ minHeight: 50 }}
        >
          {routeStates?.map((state, index) => {
            return (
              <div
                className="status-clip-path-container"
                style={{
                  minHeight: 50,
                  backgroundColor: theme?.palette?.mode == "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)",
                }}
                key={state?.label}
              >
                <div
                  className="flex items-center px-5 status-clip-path font-bold"
                  key={state?.label}
                  style={{
                    backgroundColor: data?.routeState == state?.label ? (state?.color ? state?.color : theme?.palette?.primary?.main) : theme?.palette?.background?.paper,
                    color: data?.routeState == state?.label ? "white" : "",
                  }}
                >
                  {state?.header}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {viewStyle == "tab" && <TabOverlay tabs={options ?? []} card={false} />}
      {viewStyle == "default" && (
        <div className="mt-4 mx-2">
          {options?.map((group, groupIndex) => {
            return (
              <div className="mb-6" key={"group" + groupIndex}>
                <p
                  className="border-b-2 pb-3"
                  style={{ fontSize: 21, marginBottom: 20, fontWeight: 700 }}
                >
                  {group?.nameNoStyle}
                </p>
                <div className="mt-5">{group?.element}</div>
              </div>
            );
          })}
        </div>
      )}
      {viewStyle == "vertical-step" && <VerticalStepDetailOverlay options={options ?? []} groups={groups} elementHeaderStyle="half-line" /*half-line*/ />}
    </div>
  ) : (
    <div><Loader /></div>
  )
}

export default MyTaskDetail;