import React, {useEffect, useState} from 'react'
import { useDeleteUserMutation, useGetUsersQuery } from '../../../features/user/usersApiSlice'
import { useLocation, useNavigate } from 'react-router-dom'
import DataTableOverlay from '../../utils/CrudComponents/DataTableOverlay'
import { BreadcrumbOverlay, ButtonOverlay, MenuOverlay, PopoverOverlay, ProgressBarOverlay } from '../../utils/CrudComponents/ComponentsOverlay';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode, FilterOperator } from "primereact/api";

import SchemaForm from '../../utils/CrudComponents/SchemaForm';
import { useSelector, useDispatch } from 'react-redux';

import {BiDotsVerticalRounded} from 'react-icons/bi';
import { Avatar, Button, Grid, IconButton, Tooltip } from '@mui/material';
import {MdOutlineVisibility, MdOutlineDeleteOutline, MdOutlineModeEditOutline} from 'react-icons/md';
import AddUser from './AddUser';
import EditUser from './EditUser';
import { useDataContext } from '../../../DataContext';
import { setAlert, setEditId } from '../../../app/slices/commonSlice';
import UserDetail from './UserDetail';

import {useTheme} from "@mui/material/styles";


import { useGetRolesQuery } from '../../../features/user/rolesApiSlice';
import Loader from '../../utils/Loader';

const Users = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {setEditComponent, setDetailComponent, new: NewComponent, setChildOneDetailComponent} = useDataContext()
  
  const location = useLocation()
  useEffect(()=>{
    if(location?.pathname == "/admin/main") {
      navigate('/admin/main/users')
    }
  },[])
  const theme = useTheme()
  
  const {
      data: users,
      isLoading,
      isSuccess,
      isError,
      error,
      refetch
  } = useGetUsersQuery()

  const {data: roles, isLoading: rolesLoading} = useGetRolesQuery();
  
  const currency = useSelector(state=>state.common.currency)
  const userPermissions = useSelector(state=>state?.common?.permissions?.user)
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions)
  
  const [deleteUser, {isLoading: deleteLoading}] = useDeleteUserMutation();
  const [userAccess, setUserAccess] = useState({
    add: false,
    edit: false,
    delete: false,
    detail: false,
  })

  useEffect(()=>{
    let userAccessData = {add: false, edit: false, delete: false}
    //add permission check
    const foundAddRoles = authPermissions.filter(role => userPermissions?.add?.includes(role))
    if(foundAddRoles.length > 0) {
       userAccessData = {...userAccessData, add: true}
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => userPermissions?.detail?.includes(role))
    if(foundDetailRoles.length > 0) {
       userAccessData = {...userAccessData, detail: true}
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => userPermissions?.edit?.includes(role))
    if(foundEditRoles.length > 0) {
       userAccessData = {...userAccessData, edit: true}
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => userPermissions?.delete?.includes(role))
    if(foundDeleteRoles.length > 0) {
       userAccessData = {...userAccessData, delete: true}
    }
    setUserAccess(()=>userAccessData)

  },[])

  // const detailClick = (rowData) => {
  //   if(rowData?.id == 1) return;
  //   dispatch(setEditId(rowData.id??4))
  //   setEditComponent(()=><EditUser employeeCategories={employeeCategories} employeePositions={employeePositions} departments={departments} />)
  //   navigate(location.pathname+"/edit", { state: { header: "Edit User", subtitle: "Please fill out the form below with the necessary information.",} })
  // }

  // const detailClick = (rowData) => {
  //   dispatch(setEditId(rowData?.id??0))
  //   setChildOneDetailComponent(()=><UserDetail newPage={true} columns={columns} data={rowData} editAccess={userAccess.edit} />)
  //   navigate(location.pathname+"/detail", { state: { header: "User Detail", subtitle: "All data related to this user",} })
  // }

  const detailClick = (rowData) => {
    dispatch(setEditId(rowData?.id??0))
    let updatedColumns = columns
    let newFullName = {   
        field: "full_name",
        header: "Full Name",
        type: "text",
        filterField: "full_name",
        style: { minWidth: "12rem" },
        body: (rowData) => {
          return (
            <div className="flex justify-start items-center">
              <Avatar src={rowData?.img_url} sx={{ width: 34, height: 34 }} />
              <span style={{ marginLeft: ".5em", verticalAlign: "middle" }}>
                {rowData?.full_name}
              </span>
            </div>
          )
        },
        filter: true,
        filterPlaceholder: "Filter by name",
        frozen:false,
        group: 1,
    } 
    updatedColumns.splice(0, 1, newFullName);
    setChildOneDetailComponent(()=><UserDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess.edit && rowData?.id != 1} roles = {roles} editItem={true}/>)
    navigate(location.pathname+"/detail", { state: { header: "User Detail", subtitle: "All data related to this user",} })
  }


  const loadMenuItem = (rowData)=>{
    let mi = [];
    if(userAccess.detail) {
      mi.push({
        name: "View Detail",
        icon: <MdOutlineVisibility/>,
        onClick: (e)=>{
          detailClick(rowData)
        }
      })
    }
    if(userAccess.edit) {
      mi.push({
        name: "Edit User",
        icon: <MdOutlineModeEditOutline/>,
        onClick: ()=>{
            dispatch(setEditId(rowData.id??4))
            setEditComponent(()=><EditUser />)
            navigate(location.pathname+"/edit", { state: { header: "Edit User", subtitle: "Please fill out the form below with the necessary information.",} })
        }
      })
    }
    if(userAccess.delete) {
      mi.push({
          name: "Delete User",
          icon: <MdOutlineDeleteOutline/>,
          closeOnClick: false,
          onClick: (e)=>{
            handleClickEl(e, rowData.id, rowData?.full_name)
          }
      })
    }
   return mi;
  }

  const [userFilterOptions, setUserFilterOptions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  useEffect(()=>{
    if(users) {
       let u = []
       let allU = []
       users.map((user)=>{
          u.push(user.user)
          let usr = {...user, date_of_birth: new Date(user.date_of_birth)}
          allU.push(usr)
       })
       setAllUsers(users=>allU)
       setUserFilterOptions(u)
      }
    },[users])

  /**** filter staff ****/

  //declar filter variables
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const initFilters = () => {
    setFilters({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        full_name: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
        },
        email: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
        },
        username: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
        },
        user: { value: "", matchMode: FilterMatchMode.IN },
        date_of_birth: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
        },
        confirmed: { value: null, matchMode: FilterMatchMode.EQUALS },
        active: {
          operator: FilterOperator.OR,
          constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        role: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
        },
    });
    setGlobalFilterValue("");
  };

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
  };

  const handleClose = () => {
    setAnchorEl({
      ...anchorEl,
      anchor: null,
      name: null
    });
  };


  /**** end of filter staff ****/
  
  
  const columns = [
    // {
    //     field: "first_name",
    //     header: "First Name",
    //     type: "text",
    //     filterField: "first_name",
    //     style: { minWidth: "12rem" },
    //     filter: true,
    //     filterPlaceholder: "Filter by name",
    //     frozen:false,
    //     // editor: (options) => textEditor(options)
    // },
    // {
    //     field: "last_name",
    //     header: "Last Name",
    //     filterPlaceholder: "Filter by lastname",
    //     filterField: "last_name",
    //     style: { minWidth: "12rem" },
    //     type: "text",
    //     filter: true,
    //     frozen:false,
    // },
    {
        header: "Full Name",
        filterPlaceholder: "Filter by avatar",
        filterField: "user",
        style: { minWidth: "12rem" },
        nameLabel: "name",
        imgLabel: "url",
        type: "user",
        filter: true,
        frozen:false,
        options: {userFilterOptions},
        group: 1,
    },
    {
        field: "username",
        header: "Username",
        filterField: "username",
        style: { minWidth: "12rem" },
        filterPlaceholder: "Filter by username",
        type: "text",
        filter: true,
        frozen:false,
        sortable: false,
        group: 1,
    },
    {
        field: "email",
        header: "Email",
        type: "text",
        filterField: "email",
        style: { minWidth: "12rem" },
        filter: true,
        filterPlaceholder: "Filter by email",
        frozen:false,
        group: 1,
       // editor: (options) => textEditor(options)
    },
    {
        field: "role",
        header: "Role",
        type: "text",
        filterField: "role",
        style: { minWidth: "12rem" },
        filter: true,
        filterPlaceholder: "Filter by role",
        frozen:false,
        group: 1,
    },
    // {
    //     field: "date_of_birth",
    //     header: "Birth Date",
    //     filterField: "date_of_birth",
    //     filterPlaceholder: "Filter by birth date",
    //     style: { minWidth: "10rem" },
    //     type: "date",
    //     filter: true,
    //     frozen:false,
    // },
    
    {
        field: "confirmed",
        header: "Confirmed",
        filterField: "confirmed",
        style: { minWidth: "10rem" },
        type: "verified",
        dataType:"boolean",
        filter: true,
        frozen:false,
        group: 1,
    },
    {
        field: "active",
        header: "Status",
        filterField: "active",
        options: [{name: "Active", value: true, color: 'green'}, {name: "InActive", value: false, color: '#fe2123'}],
        style: { minWidth: "10rem" },
        type: "status",
        filter: true,
        frozen:false,
        dataType:"boolean",
        headerLabel: "Filter Verified",
        group: 1,
        // editor: (options) => statusEditor(options)
    },
   
    (userAccess.detail || userAccess.edit || userAccess.delete) && {
        field: "custom",
        header: "Actions",
        type: "custom",
        style: { minWidth: "3rem" },
        filter: false,
        frozen: false,
        
        body: (rowData)=>{
            return rowData?.id ==1 ? (<></>) : (
               <MenuOverlay
                   button={
                    <IconButton>
                       <BiDotsVerticalRounded size={20}/>
                    </IconButton>
                  }
                  sx={{
                    mt: 5
                  }}
                  menuItems={loadMenuItem(rowData)}
               />
            )
        },
    }
    /*
    {
        field: "confirmed",
        header: "Confirmed",
        filterField: "confirmed",
        style: { minWidth: "10rem" },
        type: "verified",
        filter: true,
        frozen:false,
        dataType:"boolean",
        headerLabel: "Filter Verified"
    },*/
   
    // {
    //     field: "custom",
    //     header: "Custom",
    //     type: "progress",
    //     style: { minWidth: "12rem" },
    //     filter: true,
    //     frozen: false,
        
    //     body: (rowData)=>{
    //         return (
    //            <ProgressBarOverlay
    //             value={rowData.activity}
    //             showValue={false}
    //             sx={{height: ".5rem"}}
    //            />
    //         )
    //     },
    //     filterElement: (options, min, max)=>{
    //         return <React.Fragment>
    //             <SliderOverlay
    //                 type='pretty'
    //                 value={options.value??[0,100]}
    //                 onChange={(event,newValue) => {options.filterCallback(newValue);}}
    //                 min={min}
    //                 max={max}
    //                 sx={{width: 'calc(90%)', ml: "7px"}}
    //             />
    //             <div className="flex align-items-center justify-content-between px-2">
    //             <span>{options.value ? options.value[0] : min}</span>
    //             <span>{options.value ? options.value[1] : max}</span>
    //             </div>
    //         </React.Fragment>
    //     },
    // }
  ]

  const onRowEditComplete = (e) => {
      let _users = [...users];
      let { newData, index } = e;

      _users[index] = newData;

      //update user to server
      // setUsers(_users);
  };

  const onCellEditComplete = (e) => {
      let { rowData, newValue, field, originalEvent: event } = e;

      switch (field) {
          case 'quantity':
          case 'price':
              if (isPositiveInteger(newValue)) rowData[field] = newValue;
              else event.preventDefault();
              break;

          default:
              if (newValue.trim().length > 0) rowData[field] = newValue;
              else event.preventDefault();
              break;
      }
  };

  const textEditor = (options) => {
      return <InputText type="text" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
  };

  const statusEditor = (options) => {
      return (
          <Dropdown
              value={options.value}
              options={statuses}
              onChange={(e) => options.editorCallback(e.value)}
              placeholder="Select a Status"
              itemTemplate={(option) => {
                  return <Tag value={option} severity={getSeverity(option)}></Tag>;
              }}
          />
      );
  };

  const priceEditor = (options) => {
      return <InputNumber value={options.value} onValueChange={(e) => options.editorCallback(e.value)} mode="currency" currency={currency} locale="en-US" />;
  };

  const [selectedValue,setSelectedValue] = useState([])
  
  const [selection, setSelection] = useState([])
  const [loading, setLoading] = useState(false)
  
  const gridComponent = (rowData) => {
    return (
      <div className="shadow-2 border-2 p-3 mt-1 mb-2 rounded-md h-full" style={{maxWidth: 300}}>
        <Grid container spacing={2}>
          <Grid item>
            <Avatar
              src={rowData?.img_url}
              sx={{
                width:100,
                height: 100,
              }}
            />
          </Grid>
          <Grid item>
            {/* </Box> */}
            <Grid
              container
              spacing={2}
              justifyContent="center"
              style={{ marginLeft: 2 }}
            >
              <Grid item xs={12}>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <p className="font-bold">Name:</p>
                    <p
                      className="font-bold"
                      style={{
                        color: theme.palette.primary.main,
                      }}
                    >
                      {rowData?.user?.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <p className="font-bold">Role:</p>
                    <p
                      className="font-bold"
                      style={{
                        color: theme.palette.primary.main,
                      }}
                    >
                      {rowData?.role}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <p className="font-bold">Email:</p>
                    <p
                      className="font-bold"
                      style={{
                        color: theme.palette.primary.main,
                      }}
                    >
                      {rowData?.email}
                    </p>
                  </div>
                </div>
              </Grid>
              <Grid item xs={12}>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <p className="font-bold">Status:</p>
                    <div
                      className="font-bold text-white px-2 py-0 rounded-md"
                      style={{
                        backgroundColor: rowData?.active ? "green" : "red",
                      }}
                    >
                      {rowData?.active ? "Active" : "Inactive"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <p className="font-bold">Gender:</p>
                    <p
                      className="font-bold"
                      style={{
                        color: theme.palette.primary.main,
                      }}
                    >
                      {rowData?.gender}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <p className="font-bold">Phone:</p>
                    <p
                      className="font-bold"
                      style={{
                        color: theme.palette.primary.main,
                      }}
                    >
                      {rowData?.phone}
                    </p>
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>
          {/* {JSON.stringify(vehicle)} */}
        </Grid>
      </div>
    );
  };

  return (isLoading || rolesLoading) ? <Loader /> : (
    <div>
         <BreadcrumbOverlay
            title={"Users"}
            enableClickActive={true}
            subtitle={"This is the place to manage all users including drivers, clients and others"}
         />
        <div className='mt-3'></div>
        <PopoverOverlay
          anchorEl={anchorEl?.anchor??null}
          handleClose={handleClose}
          headerTitle="Confirm Delete"
          okClick={async ()=>{
            const data = await deleteUser({id: anchorEl?.id}).unwrap()
            if(data.message==="Successfully Deleted") {
              dispatch(setAlert(
                {
                  openAlert: true,
                  severity: "success",
                  message: data?.message,
                  autoHideDuration: 5000,
                  vertical: "top",
                  horizontal: "right"
                }
              ))
            }
            else if(data.message??false) {
              dispatch(setAlert(
                {
                  openAlert: true,
                  severity: "error",
                  message: data?.message,
                  autoHideDuration: 5000,
                  vertical: "top",
                  horizontal: "right"
                }
              ))
            }
          }}
          bodyTitle={`Are you sure you want to permanently remove ${anchorEl.name? "\""+anchorEl.name+"\"" : "this user"}?`}
          // children = {
          //   <div>
          //      <p><span>Are you sure</span>{`, you want to delete ${anchorEl.name??"user"}?`}</p>
          //      <div className='flex'>

          //      </div>
          //   </div>
          // }
        />
        <DataTableOverlay
          data={allUsers}
          columns={columns}
          filters={filters}
          setFilters={setFilters}
          globalFilterValue={globalFilterValue}
          setGlobalFilterValue={setGlobalFilterValue}
          initFilters={initFilters}
          title="All Users"
          emptyMessage={"No User Found"}
          scrollable={false}
          onSelectionChange={(e)=>{
            setSelection(e.value)
          }}
          showGridlines={false}
          selection={selection}
          selectionMode={null}//"single" || "multiple" || null
          loading={isLoading}
          metaKeySelection={true}
          dragSelection={false}
          cellSelection={false}
          enableSelectCheckbox={false}
          editMode="cell"
          onRowEditComplete={onRowEditComplete}
          onCellEditComplete={onCellEditComplete}
          showDelete={true}
          add={{show: userAccess.add, window:"newpage", header:"Fill Out The Form", component: <AddUser />}}
          edit={{show: userAccess.edit && false, window:["inline","sidebar"], header:"Edit user information", component: <EditUser />}}
          sideBar={{position: "right", width: 400, paddingX: 0}}
          listView={true}
          listViewSpacing={12}
          tabbed={false}
          gridComponent={gridComponent}
          noGridCountRestriction={true}
          gridSpacing={8}
          detailClick={detailClick}
        />
    </div>
  )
}

export default Users;