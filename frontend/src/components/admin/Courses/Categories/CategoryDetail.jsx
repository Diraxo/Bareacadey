import React,{ useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { setAlert, setEditId } from "../../../../app/slices/commonSlice";
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Tooltip, useMediaQuery } from '@mui/material';
import { MenuOverlay, PopoverOverlay, TabOverlay, VerticalStepDetailOverlay, TitleHeaderOverlay } from "../../../utils/CrudComponents/ComponentsOverlay";
import { useDataContext } from "../../../../DataContext";
import EditCategory from "./EditCategory";
import { useGetCategoryQuery, useDeleteCategoryMutation,  } from '../../../../features/main/categoriesApiSlice';
import Loader from '../../../utils/Loader';
import { FilterDetailColumns } from '../../../utils/CrudComponents/UtilityFunctions';
import { BsFillPatchCheckFill } from "react-icons/bs";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { MdCached, MdDeleteOutline, MdPrint } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import { IoIosOptions } from "react-icons/io";
import { Print } from '../../../utils/Print';

const CategoryDetail = ({ newPage=true, columns, id, editAccess=false, deleteAccess=false, editItem=true, allowedFields }) => {
  /* hooks */
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setEditComponent } = useDataContext();
  const md = useMediaQuery(theme.breakpoints.down("md"));
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  
  const printRef = useRef()
  
  const {data: category} = useGetCategoryQuery(id);
  const [deleteCategory, { isLoading: deleteLoading }] = useDeleteCategoryMutation();
  
  const [data, setData] = useState(null);
  
  useEffect(()=>{
    if(category) {
      let updatedCategory = {
        ...category,
        createdAt: new Date(category?.createdAt),
        updatedAt: new Date(category?.updatedAt),
      };
      setData(updatedCategory)
    }
  },[category])
  
  const [viewStyle, setViewStyle] = useState("default");
  
  const groups = [
    {
      id: 2,
      name: "Category Detail",
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
                              ? column?.useBody ? column?.body(data) : verifiedBodyTemplate(data, column?.field)
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
                                    ? column?.useBody ? column?.body(data) : verifiedBodyTemplate(data, column?.field)
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
  
  return (
    <div>
      <Print component={<VerticalStepDetailOverlay options={options ?? []} groups={groups} elementHeaderStyle="half-line" print={true} />} ref={printRef} />
      <PopoverOverlay
        anchorEl={anchorEl?.anchor ?? null}
        handleClose={handleClose}
        headerTitle="Confirm Delete"
        okClick={async () => {
          const data = await deleteCategory({ id: anchorEl?.id }).unwrap();
          if (data?.message === "Successfully Deleted") {
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
            navigate(
              location?.pathname?.slice(0,location?.pathname?.lastIndexOf("/"))
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
          anchorEl.name ? '"' + anchorEl.name + '"' : "this category"
        }?`}
      />
      
      {data && Object.keys(data)?.length > 0 ?
      (
        <div>
          <div className="w-full flex flex-wrap justify-between p-3 gap-2">
            <div>
              <p className="text-2xl font-bold">
                <span className="font-bold text-2xl">{}</span>{" "}
                Category Detail
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end flex-1">
            </div>
          </div>
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
            <MenuOverlay
              button={
                <Button
                  variant="outlined"
                  startIcon={<IoIosOptions size={18}/>}
                  size="medium"
                >
                  Options
                </Button>
              }
              sx={{
                mt: 6,
              }}
              menuItems={[
                {
                  name: "Update",
                  icon: <MdCached size={19} />,
                  onClick: () => {
                    dispatch(setEditId(data?.id ?? 0));
                    setEditComponent(() => (
                      <EditCategory newPage={true} doubleHistoryBack={false}  />
                    ));
                    navigate(location.pathname + "/edit", {
                      state: {
                        header: "Edit Category",
                        subtitle: "",
                      },
                    });
                  },
                  divider: !deleteAccess,
                  hide: !editAccess,
                },
                {
                  name: "Delete",
                  icon: <MdDeleteOutline size={19} />,
                  closeOnClick: false,
                  onClick: (e)=>{
                    handleClickEl(e, data?.id, )
                  },
                  divider: true,
                  hide: !deleteAccess
                },
                {
                  name: "Print/Export",
                  icon: <MdPrint size={19} />,
                  onClick: (e)=>{
                    printRef?.current?.handlePrint()
                  }
                },
              ]}
            />
          </div>
          {viewStyle == "tab" && <TabOverlay tabs={options ?? []} card={false}  />}
          {viewStyle == "default" && (
            <div className="mt-4 mx-2">
              {options?.map((group, groupIndex) => {
                return (
                  <div className="mb-6" key={"group" + groupIndex}>
                    <p
                      className="p-2 pl-3 rounded bg-[#323a41] text-white font-bold"
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
          {viewStyle == "default_styled" && (
            <div className="mt-6 mx-2">
              {options?.map((group, groupIndex) => {
                return (
                  <div className="mb-6" key={"group" + groupIndex}>
                    <TitleHeaderOverlay name={group?.nameNoStyle}/>
                    <div className="mt-5">{group?.element}</div>
                  </div>
                );
              })}
            </div>
          )}
          {viewStyle == "vertical-step" && <VerticalStepDetailOverlay options={options ?? []} groups={groups} elementHeaderStyle="default" /*half-line*/ />}
        </div>
      ) : (
        <div><Loader /></div>
      )
      }
    </div>
  )
}

export default CategoryDetail;