import { Button, Card, CardContent, CardHeader, Grid, IconButton } from '@mui/material'
import React, {useState, useEffect} from 'react'
import Breadcrumb from '../shared/breadcrum'
import {useTheme} from '@mui/material/styles'
import { useDeleteRoleMutation, useGetMyRoleQuery, useGetRolesQuery, useGetUserRolesQuery } from '../../../features/user/rolesApiSlice'
import { OrganizationChart } from 'primereact/organizationchart';

import {BsPlusSquareDotted} from 'react-icons/bs';
import {MdModeEditOutline, MdOutlineDelete} from 'react-icons/md';
import {BiDotsVerticalRounded} from 'react-icons/bi';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import DialogOverlay from '../../utils/CrudComponents/DialogOverlay'
import { useDispatch, useSelector } from 'react-redux';
import { setAlert, showDialog, showSidebar } from '../../../app/slices/commonSlice'
import EditRole from './EditRole'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDataContext } from '../../../DataContext'

import { MenuOverlay, PopoverOverlay } from '../../utils/CrudComponents/ComponentsOverlay'
import SidebarOverlay from '../../utils/CrudComponents/SidebarOverlay'
import AddRole from './AddRole'

const Roles = () => {
  //basic utilitiy variables
  const theme = useTheme();
  const rolePermissions = useSelector(state=>state?.common?.permissions?.role)
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const {setNewComponent, setEditComponent, setDetailComponent, new: NewComponent} = useDataContext()


  //rtk query
  const [deleteRole, {isLoading: deleteLoading}] = useDeleteRoleMutation();
  const {data: myRole} = useGetMyRoleQuery()
  const {data:roles, isLoading, isError, error, refetch}  = useGetUserRolesQuery()

  //user access
  const [userAccess, setUserAccess] = useState({
    add: false,
    edit: false,
    delete: false,
  })


  useEffect(()=>{
    let userAccessData = {add: false, edit: false, delete: false}
    //add permission check
    const foundAddRoles = authPermissions.filter(role => rolePermissions.add.includes(role))
    if(foundAddRoles.length > 0) {
       userAccessData = {...userAccessData, add: true}
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => rolePermissions.edit.includes(role))
    if(foundEditRoles.length > 0) {
       userAccessData = {...userAccessData, edit: true}
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => rolePermissions.delete.includes(role))
    if(foundDeleteRoles.length > 0) {
       userAccessData = {...userAccessData, delete: true}
    }
    setUserAccess(userAccessData)
    
  },[])
  function unflatten(arr) {
    var tree = [],
    mappedArr = {},
    arrElem,
    mappedElem;

    for(var i = 0, len = arr.length; i < len; i++) {
      arrElem = arr[i];
      mappedArr[arrElem.id] = arrElem;
      mappedArr[arrElem.id]['children'] = [];
    }

    for (var id in mappedArr) {
      if (Object.prototype.hasOwnProperty.call(mappedArr, id)) {
        mappedElem = mappedArr[id];
        if (mappedElem.parentid) {
          const mId = mappedElem.parentid
          if(mappedArr[mId]) {
            mappedArr[mId]['children'].push(mappedElem);
          }
          else {
            tree.push(mappedElem);
          }
        }
        else {
          tree.push(mappedElem);
        }
      }
    }          
    return tree;
  }


  function createRoleHierarchy(roles) {
    let nodes = roles.map((role)=>{
      return {
        id: role.id,
        label: role.role, 
        parentid: role.parent, 
        expanded: true, 
        system: role.system, 
        users: role.users,
        color: role.color,
        className: `text-white rounded-lg p-0 border-none`,
        style: { backgroundColor: role.color, zIndex: 0 },
      }
    })
    return unflatten(nodes)
  }
  
  const [rolesHierarchy, setRolesHierarchy] = useState([
    {
      label:"root",
      expanded: true,
    }
  ])
  useEffect(()=>{
    if(roles) {
      const rls = createRoleHierarchy(roles)
      if(rls) {
      setRolesHierarchy([
        {
          label: "Company Roles",
          expanded: true,
          children: rls,
          first: true,
          className: 'rounded-lg border-2',
          style: {zIndex: 0}
        }
      ])
    }
    }
  },[roles])

  
  const nodeTemplate = (node) => {
    const colors = [
      "#008ff2",
      "#da0ae7",
      "#835e6a",
      "#7f79e8",
      "#c142d6",
      "#416b27",
      "#c94115",
      "#eb1bca",
      "#525b13",
    ];
    if(node.first) {
      return(
        <div className='flex flex-col items-center justify-center align-items-center rounded-lg'>
          <img src="/bare-logo.png" style={{width: 100, marginBottom: 5}} crossOrigin='anonymous'/>
          <span className="font-bold mb-2 text-xl">{node.label}</span>
        </div>
      )
    }
    else if(node?.users?.length === 1){
      return (
        <div className={`flex flex-column bg-[${node?.color}] p-3 rounded-lg text-white`} style={{backgroundColor: node?.color, minWidth: 220}}>
            <div className="flex flex-column align-items-center px-2 pt-2">
                    <div className='flex justify-start gap-2'>
                      <img alt={node.users[0].name} src={node.users[0].img_url??"/user.png"} crossOrigin='anonymous' className="mb-1 w-4rem h-4rem rounded-full" />
                      <div className='flex flex-col items-start'>
                        <span className="font-bold text-xl">{node.users[0].name}</span>
                        <span className='mb-1'>{node.label}</span>
                      </div>
                    </div>
              </div>
        </div>
      )
    }
    else if(node?.users?.length > 1) {
      return (
        <div className={`flex flex-column bg-[${node?.color}] items-start p-3 rounded-lg text-white`} style={{backgroundColor: node?.color, minWidth: 220}}>
            <span className='text-bold' style={{fontSize: 20, fontWeight: 'bold'}}>{node.label}</span>
            <div className="flex flex-col items-start border-l-2 px-2 -mt-1 ml-1 pt-3">
                    <div className='flex justify-start items-start flex-col gap-2'>
                       {
                        node?.users?.map((user, i)=>{
                          if(i > 9) return;
                          return <div key={i} className='flex items-center mb-1'><div style={{width: 20, height: 1.4, background: 'white', marginLeft: -8, marginTop: 3}}></div><Avatar src={user?.img_url??""}  sx={{width: 25, height: 25, ml: 1, backgroundColor: colors[i], color: 'white'}}>{user?.img_url ? "" : user?.name?.[0]}</Avatar><p style={{marginLeft: 3, fontSize: 14, fontWeight: 400}} className="truncate">{user?.name}</p></div>
                        })
                       }
                    </div>
              </div>
        </div>
      )
    }
    else {
      return (
          <div className={`flex flex-column p-3 rounded-lg text-white`} style={{backgroundColor: node?.color}}>
                <span className='text-lg text-bold'>{node.label}</span>
          </div>
      )
    }

    // return node.label;
};
const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
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

  const handleCloseAnchor = () => {
    setAnchorEl({
      ...anchorEl,
      anchor: null,
      name: null
    });
  };

  return (
      <div> 
        <DialogOverlay>
           <EditRole roles={roles||[]} myRole={myRole} />
        </DialogOverlay>
        <SidebarOverlay>
          <AddRole roles={roles||[]}  myRole={myRole}/>
        </SidebarOverlay>

        <PopoverOverlay
          anchorEl={anchorEl?.anchor??null}
          handleClose={handleCloseAnchor}
          headerTitle="Confirm Delete"
          okClick={async ()=>{
            const data = await deleteRole({id: anchorEl?.id}).unwrap()
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
          bodyTtile={`Are you sure you want to permanently remove role ${anchorEl.name? "\""+anchorEl.name+"\"" : "this role"}?`}
        />
        
        <Card>
            <CardHeader 
              title={<Breadcrumb />}
            />
            <CardContent>
                <p className='text-2xl'>All Roles</p>
                <p className='texl-sm mt-2 mb-1' style={{fontWeight: 400}}>A role is a predefined set of permissions that determines what a user can do in a system. Roles control access to different parts of the system and ensure that users only have access to what they need.</p>
            </CardContent>
        </Card>
        <Grid container spacing={5} style={{marginTop: theme.spacing(1)}}>

          <Grid item xs={12} sx={{}}>
              <div className="w-full border shadow-2 rounded-md px-2 py-8 overflow-x-auto" style={{backgroundColor: theme?.palette?.background?.paper}}>
                <OrganizationChart value={rolesHierarchy} nodeTemplate={nodeTemplate} />
              </div>
          </Grid>
          {roles && roles.map((role, index)=>{

            return (
            <Grid item xs={12} sm={6} lg={4} xl={3} key={index}>
                <Card className='border'>
                  <CardHeader
                     title={
                      <div className='flex justify-between'>
                        <p className='text-sm font-normal'>Total {role.users.length} users</p>
                        {/* <AvatarGroup max={3}>
                          {
                            role.users.map((user, ind)=>{
                              return (
                                <Avatar alt="Remy Sharp" src={user.img_url} sx={{ width: 32, height: 32, border: '2px solid red' }} key={ind}/>
                              )
                            })
                          }
                        </AvatarGroup> */}
                        {userAccess.delete && !role.system &&
                        <MenuOverlay
                           button={ <IconButton style={{marginRight: -10, marginTop: -10}}>
                              <BiDotsVerticalRounded size={22} />
                            </IconButton>}
                           sx={{
                            marginTop: 5,
                            ml: 3
                           }}
                           menuItems={
                            [
                              {
                                name: "Delete",
                                icon: <MdOutlineDelete/>,
                                onClick: (e)=>{
                                   handleClickEl(e, role?.id, role?.role)
                                }
                              }
                            ]
                           }
                        />
                        }
                      </div>
                   }
                  />
                  <CardContent>
                    <div className='flex justify-between'>
                     <div>
                        <p className='text-2xl'>{role.role}</p>
                        {userAccess.edit && 
                        <Button 
                         variant="outlined" 
                         size="small" 
                         sx={{ marginRight: 3.5, mt: 4 }} 
                         type="submit"
                         onClick={()=>{
                          dispatch(
                            showDialog({
                              header: "Edit Role",
                              openDialog: true,
                              editId: role.id??0
                            })
                          );
                        }}
                        >
                          Edit Roles
                        </Button>}
                     </div>
                     <div className='flex items-end'>
                        {/* <IconButton
                          onClick={()=>{
                            dispatch(
                              showDialog({
                                header: "Edit Role",
                                openDialog: true,
                                editId: role.id??0
                              })
                            );
                          }}
                        >
                          <MdModeEditOutline size={22}/>
                        </IconButton> */}
                        {/* {userAccess.delete && 
                        <IconButton>
                          <MdOutlineDelete  size={20}/>
                        </IconButton>} */}
                        <AvatarGroup
                         max={4}
                         sx={{
                          '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                          },
                          '& .MuiAvatarGroup-badge': {
                            width: 32,
                            height: 32,
                          },
                        }}
                        >
                          {
                            role.users.map((user, ind)=>{
                              return (
                                <Avatar alt="" src={user.img_url??"/user.png"} sx={{ width: 32, height: 32, border: '2px solid red' }} key={ind}/>
                              )
                            })
                          }
                        </AvatarGroup>
                     </div>
                    </div>
                  </CardContent>
                </Card>
            </Grid>
          )
           
          })}
          <Grid item xs={12}></Grid>
          {userAccess.add && 
          <Grid item key={'add'}>
                <Card>
                  <CardContent>
                    <div className="flex flex-col items-center hover:cursor-pointer" style={{padding: 13}}
                      onClick={()=>{
                        dispatch(
                          showSidebar({
                            header: "Add Role",
                            openDialog: true,
                          })
                        );
                        // setNewComponent(()=><EditRole/>)
                        // navigate(location.pathname+"/new", { state: { header: "Add Role", subtitle: "Please fill out the form below with the necessary information.",} })
                      }}
                    >
                      <BsPlusSquareDotted size={31}/>
                      <p className='mt-4 text-xl'>Add New Role</p>
                    </div>
                  </CardContent>
                </Card>
            </Grid>}

          
        </Grid>
    </div>
  )
}

export default Roles