/**** import common staff ***/
import React, {useEffect, useState} from "react";
import DataTableOverlay from "../../../utils/CrudComponents/DataTableOverlay"
import DialogOverlay from "../../../utils/CrudComponents/DialogOverlay"
import SidebarOverlay from "../../../utils/CrudComponents/SidebarOverlay"
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { TextField, IconButton, Checkbox, Chip } from "@mui/material";
import { MenuOverlay, PopoverOverlay, ProgressBarOverlay } from "../../../utils/CrudComponents/ComponentsOverlay";
import TableArrayInfo from "../../../utils/CrudComponents/TableArrayInfo";

/**** hooks ***/
import { useDataContext } from "../../../../DataContext";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from '@mui/material/styles';

/**** icons ***/
import {BiDotsVerticalRounded} from "react-icons/bi";

/**** crud components ***/
import AddContact from "./AddContact";
import EditContact from "./EditContact";
import ContactDetail from "./ContactDetail";

/**** redux ***/
import { setAlert, setEditId, showDialog, showSidebar } from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import { useGetContactsQuery, useUpdateContactMutation, useDeleteContactMutation } from "../../../../features/main/contactsApiSlice";

const Contacts = ({parentId, name}) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const { setEditComponent, setChildOneDetailComponent } = useDataContext();
  const navigate = useNavigate();
  
  /* redux selectors */
  const contactPermissions = useSelector(state=>state?.common?.permissions?.main?.contact);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const selectedCurrency = useSelector(state=>state.common.currency);
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  
  /* rtk query */
  const {
    data: contacts,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetContactsQuery(parentId);
  const [updateContact, { isLoading: updateLoading }] = useUpdateContactMutation();
  const [deleteContact, { isLoading: deleteLoading }] = useDeleteContactMutation();
  
  /* user access control */
  const [userAccess, setUserAccess] = useState({
    add: false,
    edit: false,
    delete: false,
    detail: false,
  });
  
  useEffect(()=>{
    let userAccessData = {add: false, edit: false, delete: false, detail: false};
    // //add permission check
    // const foundAddRoles = authPermissions.filter(role => contactPermissions?.add?.includes(role))
    // if (foundAddRoles.length > 0) {
    //   userAccessData = {...userAccessData, add: true}
    // }
    // //edit permission check
    // const foundEditRoles = authPermissions.filter(role => contactPermissions?.edit?.includes(role))
    // if (foundEditRoles.length > 0) {
    //   userAccessData = {...userAccessData, edit: true}
    // }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => contactPermissions?.delete?.includes(role))
    if (foundDeleteRoles.length > 0) {
      userAccessData = {...userAccessData, delete: true}
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => contactPermissions?.detail?.includes(role))
    if (foundDetailRoles.length > 0) {
      userAccessData = {...userAccessData, detail: true}
    }
    setUserAccess(()=>userAccessData);
  },[])
  
  const [allContacts, setAllContacts] = useState([]);
  
  useEffect(()=>{
    if(contacts) {
      let allContactsUpdated = [];
      contacts.map((contact) =>  {
        let updatedContact = {
          ...contact,
          createdAt: new Date(contact?.createdAt),
          updatedAt: new Date(contact?.updatedAt),
        };
        allContactsUpdated.push(updatedContact);
      });
      setAllContacts(prev => allContactsUpdated);
    }
  },[contacts])
  
  /*** filter ***/
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  let lsTitle = localStorage.getItem("all_contacts");
  
  const initFilters = (clear=false) => {
    setFilters({
      global: { value: lsTitle && !clear ? lsTitle : null, matchMode: FilterMatchMode.CONTAINS },
      createdAt: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      updatedAt: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      full_name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      company_name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      message: {
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
    const data = await updateContact(fd).unwrap()
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
      options.field==="full_name" || 
      options.field==="email" || 
      options.field==="phone" || 
      options.field==="company_name" || 
      options.field==="message"
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
    setChildOneDetailComponent(()=><ContactDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess.edit}  />)
    navigate(location.pathname+"/detail", { state: { header: "Contact Detail", subtitle: "All data related to this contact",} })
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
        name: "Edit Contact",
        icon: <MdOutlineModeEditOutline/>,
        onClick: (e)=>{
          let type = "dialog";
          let header = "Edit contact information";
          let subtitle = "";
          let fullScreen = false;
          let position = "right";
          let width = "300px";
          let paddingX = "10px";
          if(type=="dialog") {
            dispatch(
              showDialog({
                header: header ? header : "Update Contact",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                openDialog: true,
                editId: rowData?.id??0,
                disableDataTableWindows: true,
              })
            );
          } else if(type == "sidebar") {
            dispatch(
              showSidebar({
                header: header ? header : "Update Contact",
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
            setEditComponent(()=><EditContact newPage={true}  parentId={parentId} />)
            navigate(location.pathname+"/edit", { state: { header: "Edit Contact", subtitle: "Please fill out the form below with the necessary information.",} })
          }
        }
      });
    }
    if(userAccess.delete) {
      mi.push({
        name: "Delete Contact",
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
      label: "pending",
      header: "Pending",
      access: ["Contact Us"],
    },
    {
      label: "reached",
      header: "Reached",
      color: "green",
      access: ["Contact Us"],
    },
    {
      label: "archived",
      header: "Archived",
      color: "red",
      access: ["Contact Us"],
    },
  ]
  
  const [dialogInfoVisible, setDialogInfoVisible] = useState({
    show: false,
    data: []
  })
  let columns = [
    {
      field: "full_name",
      header: "Full Name",
      group: 2,
      filterField: "full_name",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by full name",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
    },
    {
      field: "email",
      header: "Email",
      group: 2,
      filterField: "email",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by email",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
    },
    {
      field: "phone",
      header: "Phone",
      group: 2,
      filterField: "phone",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by phone",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
    },
    {
      field: "company_name",
      header: "Company Name",
      group: 2,
      filterField: "company_name",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by company name",
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
      field: "message",
      header: "Message",
      group: 2,
      filterField: "message",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by message",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
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
  ];
  
  
  const contactColumns = localStorage?.getItem("contactColumns")
  const colsArray = contactColumns ? contactColumns.split(',') : ["full_name","email","phone","company_name","message"]
  const [visibleColumnsArray, setVisibleColumnsArray] = useState(colsArray);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [selection, setSelection] = useState([]);
  const [reloadDataTable, setReloadDataTable] = useState(false);
  
  useEffect(()=>{
    if(contactColumns) {
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
      localStorage?.setItem('contactColumns',visibleColumnsArray)
      setVisibleColumns(cols)
    }
    else {
      localStorage?.setItem('contactColumns',visibleColumnsArray)
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
          const data = await deleteContact({ id: anchorEl?.id }).unwrap();
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
          anchorEl.name ? '"' + anchorEl.name + '"' : "this contact"
        }?`}
      />
      
      {disableDataTableWindows &&
      <DialogOverlay>
        <EditContact
          
          parentId={parentId}
        />
      </DialogOverlay>}
      {disableDataTableWindows &&
      <SidebarOverlay>
        <EditContact
          
          parentId={parentId}
        />
      </SidebarOverlay>}
      
      <TableArrayInfo
        dialogVisible={dialogInfoVisible?.show??false}
        setDialogVisible={setDialogInfoVisible}
        data={dialogInfoVisible?.data}
      />
      
      <DataTableOverlay
        data={allContacts}
        columns={visibleColumns}
        dataKey="id"
        filters={filters}
        setFilters={setFilters}
        globalFilterValue={globalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        initFilters={initFilters}
        title={name ? '`'+name+'` Contacts' : 'All Contacts'}
        emptyMessage={"No Contacts Found"}
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
          header: "Register Contact",
          subtitle: "",
          fullScreen: false,
          component: (
            <AddContact
              
              parentId={parentId}
            />
          ),
        }}
        
        edit={{
          show: userAccess.edit,
          window: ["inline", "dialog"],
          header: "Edit contact information",
          subtitle: "",
          fullScreen: false,
          component: (
            <EditContact
              
              parentId={parentId}
            />
          ),
        }}
        sideBar={{ position: "right", width: "undefined", paddingX: "10px" }}
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

export default Contacts;