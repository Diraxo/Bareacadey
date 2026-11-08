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
import FilePreview from "../../../utils/CrudComponents/FilePreview";

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
import AddEmployeeDocument from "./AddEmployeeDocument";
import EditEmployeeDocument from "./EditEmployeeDocument";
import EmployeeDocumentDetail from "./EmployeeDocumentDetail";

/**** redux ***/
import { setAlert, setEditId, showDialog, showSidebar } from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import { useGetEmployeeDocumentsQuery, useUpdateEmployeeDocumentMutation, useDeleteEmployeeDocumentMutation } from "../../../../features/main/employeedocumentsApiSlice";
import { useGetUsersQuery } from "../../../../features/user/usersApiSlice";
import { useGetEmployeeDocumentTypesQuery } from "../../../../features/main/employeeDocumentTypesApiSlice";

const EmployeeDocuments = ({parentId, name}) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const { setEditComponent, setChildOneDetailComponent } = useDataContext();
  const navigate = useNavigate();
  
  /* redux selectors */
  const employeeDocumentPermissions = useSelector(state=>state?.common?.permissions?.main?.employeeDocument);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const selectedCurrency = useSelector(state=>state.common.currency);
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  
  /* rtk query */
  const {
    data: employeeDocuments,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetEmployeeDocumentsQuery(parentId);
  const [updateEmployeeDocument, { isLoading: updateLoading }] = useUpdateEmployeeDocumentMutation();
  const [deleteEmployeeDocument, { isLoading: deleteLoading }] = useDeleteEmployeeDocumentMutation();
  
  const {data: users} = useGetUsersQuery();
  const {data: employeeDocumentTypes} = useGetEmployeeDocumentTypesQuery();
  
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
    const foundAddRoles = authPermissions.filter(role => employeeDocumentPermissions?.add?.includes(role))
    if (foundAddRoles.length > 0) {
      userAccessData = {...userAccessData, add: true}
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => employeeDocumentPermissions?.edit?.includes(role))
    if (foundEditRoles.length > 0) {
      userAccessData = {...userAccessData, edit: true}
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => employeeDocumentPermissions?.delete?.includes(role))
    if (foundDeleteRoles.length > 0) {
      userAccessData = {...userAccessData, delete: true}
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => employeeDocumentPermissions?.detail?.includes(role))
    if (foundDetailRoles.length > 0) {
      userAccessData = {...userAccessData, detail: true}
    }
    setUserAccess(()=>userAccessData);
  },[])
  
  const [allEmployeeDocuments, setAllEmployeeDocuments] = useState([]);
  const [addedByFilterOptions, setAddedByFilterOptions] = useState([]);
  const [updatedByFilterOptions, setUpdatedByFilterOptions] = useState([]);
  
  useEffect(()=>{
    if(employeeDocuments) {
      let allEmployeeDocumentsUpdated = [];
      let addedBy = [];
      let updatedBy = [];
      let addedByIds = [];
      let updatedByIds = [];
      employeeDocuments.map((employeeDocument) =>  {
        if(!addedByIds.includes(employeeDocument?.AddedByEmployeeDocument?.id)) {
          addedBy.push(employeeDocument?.AddedByEmployeeDocument);
          addedByIds.push(employeeDocument?.AddedByEmployeeDocument?.id);
        }
        if(!updatedByIds.includes(employeeDocument?.UpdatedByEmployeeDocument?.id)) {
          updatedBy.push(employeeDocument?.UpdatedByEmployeeDocument);
          updatedByIds.push(employeeDocument?.UpdatedByEmployeeDocument?.id);
        }
        let updatedEmployeeDocument = {
          ...employeeDocument,
          expiration_date: new Date(employeeDocument?.expiration_date),
          createdAt: new Date(employeeDocument?.createdAt),
          updatedAt: new Date(employeeDocument?.updatedAt),
        };
        allEmployeeDocumentsUpdated.push(updatedEmployeeDocument);
      });
      setAllEmployeeDocuments(prev => allEmployeeDocumentsUpdated);
      setAddedByFilterOptions(prev => addedBy);
      setUpdatedByFilterOptions(prev => updatedBy);
    }
  },[employeeDocuments])
  
  /*** filter ***/
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  let lsTitle = localStorage.getItem("all_employee_documents");
  
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
      first_name_target_0: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      type_target_1: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      description: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      expiration_date: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
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
    const data = await updateEmployeeDocument(fd).unwrap()
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
  
  /* Expiration  Date editor and formatter */
  const format_expiration_date = (value) => {
    return value.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  
  const expiration_date_editor = (options) => {
    if(!userAccess.edit) {
      return format_expiration_date(options.rowData[options.field]);
    }
    if(options.field==="expiration_date") {
      return (
        <Calendar value={options.value} onChange={(e) => {options.editorCallback(e.value);}}   dateFormat="mm/dd/yy" placeholder="/"  />
      );
    }
    return format_expiration_date(options.rowData[options.field]);
  }
  
  const expiration_date_filter = (options) => {
      return (
        <Calendar value={options.value} onChange={(e) => {options.filterCallback(e.value, options.index);}}   dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy"  />
      );
  }
  
  /* User Editor */
  const first_name_target_0_editor = (options) => {
    if(!userAccess.edit) {
      return options.rowData[options.field];
    }
    if(options.field==="first_name_target_0") {
      return (
        <Dropdown
          value={options?.rowData?.user_id}
          options={ users?.map((item)=>({id: item?.id, first_name: item?.full_name})) }
          optionLabel={ 'first_name' }
          optionValue='id'
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
          onChange={(e) => {
            if(options.rowData?.user_id != e.value) {
              const params = {
                rowData: options.rowData, 
                newValue: e.value, 
                field: 'user_id', 
              }
              onCellEditComplete(params);
            }
          }}
          placeholder="Select User"
        />
      );
    }
    return options.rowData[options.field];
  }
  
  /* EmployeeDocumentType Editor */
  const type_target_1_editor = (options) => {
    if(!userAccess.edit) {
      return options.rowData[options.field];
    }
    if(options.field==="type_target_1") {
      return (
        <Dropdown
          value={options?.rowData?.employeedocumenttype_id}
          options={ employeeDocumentTypes }
          optionLabel={ 'type' }
          optionValue='id'
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
          onChange={(e) => {
            if(options.rowData?.employeedocumenttype_id != e.value) {
              const params = {
                rowData: options.rowData, 
                newValue: e.value, 
                field: 'employeedocumenttype_id', 
              }
              onCellEditComplete(params);
            }
          }}
          placeholder="Select EmployeeDocumentType"
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
    dispatch(setEditId(rowData?.id??0))
    setChildOneDetailComponent(()=><EmployeeDocumentDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess.edit} users = {users} employeeDocumentTypes = {employeeDocumentTypes} />)
    navigate(location.pathname+"/detail", { state: { header: "EmployeeDocument Detail", subtitle: "All data related to this employee document",} })
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
        name: "Edit EmployeeDocument",
        icon: <MdOutlineModeEditOutline/>,
        onClick: (e)=>{
          let type = "dialog";
          let header = "Edit employee document information";
          let subtitle = "";
          let fullScreen = false;
          let position = "right";
          let width = "300px";
          let paddingX = "10px";
          if(type=="dialog") {
            dispatch(
              showDialog({
                header: header ? header : "Update EmployeeDocument",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                openDialog: true,
                editId: rowData?.id??0,
                disableDataTableWindows: true,
              })
            );
          } else if(type == "sidebar") {
            dispatch(
              showSidebar({
                header: header ? header : "Update EmployeeDocument",
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
            setEditComponent(()=><EditEmployeeDocument newPage={true} users = {users} employeeDocumentTypes = {employeeDocumentTypes} parentId={parentId} />)
            navigate(location.pathname+"/edit", { state: { header: "Edit EmployeeDocument", subtitle: "Please fill out the form below with the necessary information.",} })
          }
        }
      });
    }
    if(userAccess.delete) {
      mi.push({
        name: "Delete EmployeeDocument",
        icon: <MdOutlineDeleteOutline/>,
        closeOnClick: false,
        onClick: (e)=>{
          handleClickEl(e, rowData.id, )
        }
      });
    }
    return mi;
  }
  
  const [dialogInfoVisible, setDialogInfoVisible] = useState({
    show: false,
    data: []
  })
  let columns = [
    {
      field: "first_name_target_0",
      header: "Employee",
      type: "text",
      group: 2,
      filterField: "first_name_target_0",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by employee",
      frozen: false,
      editor: (options) => first_name_target_0_editor(options),
    },
    {
      field: "type_target_1",
      header: "Type",
      type: "text",
      group: 2,
      filterField: "type_target_1",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by type",
      frozen: false,
      editor: (options) => type_target_1_editor(options),
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
      field: "documents",
      header: "Documents",
      group: 2,
      style: { minWidth: "11rem" },
      filter: false,
      type: "custom",
      body: (rowData) => {
        const documentsList = rowData?.documents;
        if(documentsList?.length > 0) {
          return (
            <div className="flex gap-2">
            {
              documentsList?.map((documents, i)=>{
                return <FilePreview file={documents} key={documents?.filepath}/>  
              })
            }
            </div>
          )
        }
      },
    },
    {
      field: "expiration_date",
      header: "Expiration Date",
      group: 2,
      filterField: "expiration_date",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by expiration date",
      frozen: false,
      type: "date",
      body: (rowData) => {
        const month = 30 * 24 * 60 * 60 * 1000;
        const exp = rowData["expiration_date"]?.getTime()
        const today = new Date()?.getTime()
        return (
          <p style={{color:  (today > exp) ? 'red' : ((exp - today) < month) ? 'orange' : ''}}>
            {format_expiration_date(rowData["expiration_date"])}
          </p>
        )
      },
      filterElement: (options) => expiration_date_filter(options),
      editor: (options) => expiration_date_editor(options),
    },
    {
      header: "Added By",
      field: 'AddedByEmployeeDocument',
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
      field: 'UpdatedByEmployeeDocument',
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
  
  
  const employeeDocumentColumns = localStorage?.getItem("employeeDocumentColumns")
  const colsArray = employeeDocumentColumns ? employeeDocumentColumns.split(',') : ["first_name_target_0","type_target_1","description","documents","expiration_date","UpdatedByEmployeeDocument","createdAt","custom_actions"]
  const [visibleColumnsArray, setVisibleColumnsArray] = useState(colsArray);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [selection, setSelection] = useState([]);
  const [reloadDataTable, setReloadDataTable] = useState(false);
  
  useEffect(()=>{
    if(employeeDocumentColumns) {
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
      localStorage?.setItem('employeeDocumentColumns',visibleColumnsArray)
      setVisibleColumns(cols)
    }
    else {
      localStorage?.setItem('employeeDocumentColumns',visibleColumnsArray)
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
          const data = await deleteEmployeeDocument({ id: anchorEl?.id }).unwrap();
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
          anchorEl.name ? '"' + anchorEl.name + '"' : "this employeedocument"
        }?`}
      />
      
      {disableDataTableWindows &&
      <DialogOverlay>
        <EditEmployeeDocument
          users={users}
          employeeDocumentTypes={employeeDocumentTypes}
          
          parentId={parentId}
        />
      </DialogOverlay>}
      {disableDataTableWindows &&
      <SidebarOverlay>
        <EditEmployeeDocument
          users={users}
          employeeDocumentTypes={employeeDocumentTypes}
          
          parentId={parentId}
        />
      </SidebarOverlay>}
      
      <TableArrayInfo
        dialogVisible={dialogInfoVisible?.show??false}
        setDialogVisible={setDialogInfoVisible}
        data={dialogInfoVisible?.data}
      />
      
      <DataTableOverlay
        data={allEmployeeDocuments}
        columns={visibleColumns}
        dataKey="id"
        filters={filters}
        setFilters={setFilters}
        globalFilterValue={globalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        initFilters={initFilters}
        title={name ? '`'+name+'` Employee Documents' : 'All Employee Documents'}
        emptyMessage={"No Employee Documents Found"}
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
          header: "Register Employee Document",
          subtitle: "",
          fullScreen: false,
          component: (
            <AddEmployeeDocument
              users={users}
              employeeDocumentTypes={employeeDocumentTypes}
              
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
            <EditEmployeeDocument
              users={users}
              employeeDocumentTypes={employeeDocumentTypes}
              
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
      />
    </div>
  );
}

export default EmployeeDocuments;