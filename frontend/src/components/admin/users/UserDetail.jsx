import React,{ useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { setAlert, setEditId } from "../../../app/slices/commonSlice";
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, useMediaQuery } from '@mui/material';
import { TabOverlay, VerticalStepDetailOverlay } from "../../utils/CrudComponents/ComponentsOverlay";
import { useDataContext } from "../../../DataContext";
import EditUser from "./EditUser";
import { useGetUserQuery } from '../../../features/user/usersApiSlice';
import Loader from '../../utils/Loader';
import { FilterDetailColumns } from '../../utils/CrudComponents/UtilityFunctions';
import { BsFillPatchCheckFill } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { MdCached } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";


const UserDetail = ({ newPage=true, columns, id, editAccess, editItem=true, allowedFields, roles }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setEditComponent } = useDataContext();
  const md = useMediaQuery(theme.breakpoints.down("md"));
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  
  const {data: user} = useGetUserQuery(id);
  
  const [data, setData] = useState(null);
  
  useEffect(()=>{
    if(user) {
      let updatedUser = {
        ...user,
        createdAt: new Date(user?.createdAt),
        updatedAt: new Date(user?.updatedAt),
      };
      setData(updatedUser)
    }
  },[user])
  
  const [viewStyle, setViewStyle] = useState("vertical-step");
  
  const groups = [
    {
      id: 1,
      name: "Basic User Detail",
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
  
  return data && Object.keys(data)?.length > 0 ?
  (
    <div>
      <div className="w-full flex flex-wrap justify-between p-3 gap-2">
        <div>
          <p className="text-2xl">
            <span className="font-bold text-2xl">{}</span>{" "}
            User Detail
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        </div>
      </div>
      {editAccess && editItem && (
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
                <EditUser newPage={true} doubleHistoryBack={false} roles={roles}/>
              ));
              navigate(location.pathname + "/edit", {
                state: {
                  header: "Edit User",
                  subtitle: "",
                },
              });
            }}
          >
            Update
          </Button>
        </div>
      )}
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
      {viewStyle == "vertical-step" && <VerticalStepDetailOverlay options={options ?? []} groups={groups} elementHeaderStyle="half-line" /*half-line, default*/ />}
    </div>
  ) : (
    <div><Loader /></div>
  )
}

export default UserDetail;