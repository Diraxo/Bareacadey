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
import { TbEdit } from "react-icons/tb";

/**** crud components ***/
import AddPayment from "./AddPayment";
import EditPayment from "./EditPayment";
import PaymentDetail from "./PaymentDetail";

/**** redux ***/
import { setAlert, setEditId, showDialog, showSidebar } from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import { useGetPaymentsQuery, useUpdatePaymentMutation, useDeletePaymentMutation } from "../../../../features/main/paymentsApiSlice";
import { useGetUsersQuery } from "../../../../features/user/usersApiSlice";
import { useGetCoursesQuery } from "../../../../features/main/coursesApiSlice";
import { useGetChaptersQuery } from "../../../../features/main/chaptersApiSlice";

const Payments = ({parentId, name}) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const { setEditComponent, setChildOneDetailComponent } = useDataContext();
  const navigate = useNavigate();
  
  /* redux selectors */
  const paymentPermissions = useSelector(state=>state?.common?.permissions?.main?.payment);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const selectedCurrency = useSelector(state=>state.common.currency);
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  
  /* rtk query */
  const {
    data: payments,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetPaymentsQuery(parentId);
  const [updatePayment, { isLoading: updateLoading }] = useUpdatePaymentMutation();
  const [deletePayment, { isLoading: deleteLoading }] = useDeletePaymentMutation();
  
  const {data: users} = useGetUsersQuery();
  const {data: courses} = useGetCoursesQuery();
  const {data: chapters} = useGetChaptersQuery();
  
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
    const foundAddRoles = authPermissions.filter(role => paymentPermissions?.add?.includes(role))
    if (foundAddRoles.length > 0) {
      userAccessData = {...userAccessData, add: true}
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => paymentPermissions?.edit?.includes(role))
    if (foundEditRoles.length > 0) {
      userAccessData = {...userAccessData, edit: true}
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => paymentPermissions?.delete?.includes(role))
    if (foundDeleteRoles.length > 0) {
      userAccessData = {...userAccessData, delete: true}
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => paymentPermissions?.detail?.includes(role))
    if (foundDetailRoles.length > 0) {
      userAccessData = {...userAccessData, detail: true}
    }
    setUserAccess(()=>userAccessData);
  },[])
  
  const [allPayments, setAllPayments] = useState([]);
  const [addedByFilterOptions, setAddedByFilterOptions] = useState([]);
  const [updatedByFilterOptions, setUpdatedByFilterOptions] = useState([]);
  
  useEffect(()=>{
    if(payments) {
      let allPaymentsUpdated = [];
      let addedBy = [];
      let updatedBy = [];
      let addedByIds = [];
      let updatedByIds = [];
      payments?.map((payment) =>  {
        if(!addedByIds.includes(payment?.AddedByPayment?.id)) {
          addedBy.push(payment?.AddedByPayment);
          addedByIds.push(payment?.AddedByPayment?.id);
        }
        if(!updatedByIds.includes(payment?.UpdatedByPayment?.id)) {
          updatedBy.push(payment?.UpdatedByPayment);
          updatedByIds.push(payment?.UpdatedByPayment?.id);
        }
        let updatedPayment = {
          ...payment,
          createdAt: new Date(payment?.createdAt),
          updatedAt: new Date(payment?.updatedAt),
        };
        allPaymentsUpdated.push(updatedPayment);
      });
      setAllPayments(prev => allPaymentsUpdated);
      setAddedByFilterOptions(prev => addedBy);
      setUpdatedByFilterOptions(prev => updatedBy);
    }
  },[payments])
  
  /*** filter ***/
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  let lsTitle = localStorage.getItem("all_payments");
  
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
      title_target_1: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      title_target_2: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      amount: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      currency: {
        operator: FilterOperator.OR,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
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
    const data = await updatePayment(fd).unwrap()
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
  
  const checkRowEditable = (data) => {
    return true;
  }
  
  const textEditor = (options) => {
    if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return options.rowData[options.field];
    }
    return options.rowData[options.field];
  }
  
  const numberEditor = (options) => {
    if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return new Intl.NumberFormat('en-US', { style: 'decimal'}).format(options.rowData[options.field])
    }
    return new Intl.NumberFormat('en-US', { style: 'decimal'}).format(options.rowData[options.field])
  }
  
  const currencyEditor = (options) => {
    if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits:  2,
        maximumFractionDigits: 2,
      }).format(options.rowData[options.field])
    }
    if(
      options.field==="amount"
    ) {
      return <InputNumber value={options.value} onChange={(e) => {options.editorCallback(e.value);}}  mode="currency" currency={selectedCurrency} locale="en-US" />
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits:  2,
      maximumFractionDigits: 2,
    }).format(options.rowData[options.field])
  }
  
  /* User Editor */
  const first_name_target_0_editor = (options) => {
    if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return options.rowData[options.field];
    }
    if(options.field==="first_name_target_0") {
      return (
        <Dropdown
          value={options?.rowData?.user_id}
          options={ users }
          optionLabel={ 'full_name' }
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
  
  /* Course Editor */
  const title_target_1_editor = (options) => {
    if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return options.rowData[options.field];
    }
    if(options.field==="title_target_1") {
      return (
        <Dropdown
          value={options?.rowData?.course_id}
          options={ courses }
          optionLabel={ 'title' }
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
            if(options.rowData?.course_id != e.value) {
              const params = {
                rowData: options.rowData, 
                newValue: e.value, 
                field: 'course_id', 
              }
              onCellEditComplete(params);
            }
          }}
          placeholder="Select Course"
        />
      );
    }
    return options.rowData[options.field];
  }
  
  /* Chapter Editor */
  const title_target_2_editor = (options) => {
    if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return options.rowData[options.field];
    }
    if(options.field==="title_target_2") {
      return (
        <Dropdown
          value={options?.rowData?.chapter_id}
          options={ chapters }
          optionLabel={ 'title' }
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
            if(options.rowData?.chapter_id != e.value) {
              const params = {
                rowData: options.rowData, 
                newValue: e.value, 
                field: 'chapter_id', 
              }
              onCellEditComplete(params);
            }
          }}
          placeholder="Select Chapter"
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
    setChildOneDetailComponent(()=><PaymentDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess?.edit} deleteAccess={userAccess?.delete} users = {users} courses = {courses} chapters = {chapters} editItem={checkRowEditable(rowData)}/>)
    navigate(location.pathname+"/detail", { state: { header: "Payment Detail", subtitle: "All data related to this payment",} })
  }
  
  const loadMenuItem = (rowData, inline=false)=>{
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
        name: "Edit Payment",
        icon: <TbEdit size={inline ? 21 : 19} />,
        onClick: (e)=>{
          let type = "dialog";
          let header = "Edit payment";
          let subtitle = "";
          let fullScreen = false;
          let position = "right";
          let width = "330px";
          let paddingX = "10px";
          if(type=="dialog") {
            dispatch(
              showDialog({
                header: header ? header : "Update Payment",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                openDialog: true,
                editId: rowData?.id??0,
                disableDataTableWindows: true,
              })
            );
          } else if(type == "sidebar") {
            dispatch(
              showSidebar({
                header: header ? header : "Update Payment",
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
            setEditComponent(()=><EditPayment newPage={true} users = {users} courses = {courses} chapters = {chapters} parentId={parentId} />)
            navigate(location.pathname+"/edit", { state: { header: "Edit Payment", subtitle: "Please fill out the form below with the necessary information.",} })
          }
        }
      });
    }
    if(userAccess.delete) {
      mi.push({
        name: "Delete Payment",
        icon: <MdOutlineDeleteOutline size={inline ? 22 : 20} />,
        closeOnClick: false,
        onClick: (e)=>{
          handleClickEl(e, rowData.id, )
        }
      });
    }
    return mi;
  }
  
  const currencyOptions = [{name: "ETB", value: "ETB"}, {name: "USD", value: "USD"}]
  const [dialogInfoVisible, setDialogInfoVisible] = useState({
    show: false,
    data: []
  })
  let columns = [
    {
      field: "first_name_target_0",
      header: "User",
      type: "text",
      group: 1,
      filterField: "first_name_target_0",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by first name",
      frozen: false,
      editor: (options) => first_name_target_0_editor(options),
    },
    {
      field: "title_target_1",
      header: "Course",
      type: "text",
      group: 1,
      filterField: "title_target_1",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by title",
      frozen: false,
      editor: (options) => title_target_1_editor(options),
    },
    {
      field: "title_target_2",
      header: "Chapter",
      type: "text",
      group: 1,
      filterField: "title_target_2",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by title",
      frozen: false,
      editor: (options) => title_target_2_editor(options),
    },
    {
      field: "amount",
      header: "Amount",
      group: 1,
      filterField: "amount",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by amount",
      frozen: false,
      type: "custom",
      dataType: "numeric",
      body: (rowData) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: selectedCurrency,
          minimumFractionDigits:  2,
          maximumFractionDigits: 2,
        }).format(rowData["amount"])
      },
      filterElement: (options) => {
        return (
          <InputNumber
            value={options.value}
            onChange={(e) => options.filterCallback(e.value, options.index)}
            mode="currency"
            currency={selectedCurrency}
            locale="en-US"
          />
        );
      },
      editor: (options) => currencyEditor(options),
    },
    {
      field: "currency",
      header: "Currency",
      group: 1,
      filterField: "currency",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by currency",
      frozen: false,
      type: "status",
      nameLabel: "name",
      valueLabel: "value",
      colorLabel: "color",
      options: currencyOptions,
      editor: (options) => {
        if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
          return currencyOptions?.map((op, indx) => {
            if(op['value']==options.rowData['currency']) {
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
            options={ currencyOptions }
            optionLabel="name"
            optionValue="value"
            onChange={e => {
              if(options.rowData[options.field] == e.value) return;
              const params = {
                rowData: options.rowData,
                newValue: e.value,
                field: "currency"
              };
              onCellEditComplete(params);
            }}
            placeholder="Select currency"
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
      header: "Added By",
      field: 'AddedByPayment',
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
      field: 'UpdatedByPayment',
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
        const showStyle = "menu";
        const disabled = !checkRowEditable(rowData);
        return showStyle=="menu" ? (
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
        ) : !disabled ? (
          <div className='flex items-center justify-start'>
            {loadMenuItem(rowData, true)?.map((rd, ind)=>{
              return (
                <IconButton key={ind} onClick={rd?.onClick}>{rd?.icon}</IconButton>
              )
            })}
          </div>
        ) : <></>;
      },
    },
  ];
  
  
  const paymentColumns = localStorage?.getItem("paymentColumns")
  const colsArray = paymentColumns ? paymentColumns.split(',') : ["first_name_target_0","title_target_1","title_target_2","amount","currency"]
  const [visibleColumnsArray, setVisibleColumnsArray] = useState(colsArray);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [selection, setSelection] = useState([]);
  const [reloadDataTable, setReloadDataTable] = useState(false);
  
  useEffect(()=>{
    if(paymentColumns) {
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
      localStorage?.setItem('paymentColumns',visibleColumnsArray)
      setVisibleColumns(cols)
    }
    else {
      localStorage?.setItem('paymentColumns',visibleColumnsArray)
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
          const data = await deletePayment({ id: anchorEl?.id }).unwrap();
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
          anchorEl.name ? '"' + anchorEl.name + '"' : "this payment"
        }?`}
      />
      
      {disableDataTableWindows &&
      <DialogOverlay>
        <EditPayment
          users={users}
          courses={courses}
          chapters={chapters}
          
          parentId={parentId}
        />
      </DialogOverlay>}
      {disableDataTableWindows &&
      <SidebarOverlay>
        <EditPayment
          users={users}
          courses={courses}
          chapters={chapters}
          
          parentId={parentId}
        />
      </SidebarOverlay>}
      
      <TableArrayInfo
        dialogVisible={dialogInfoVisible?.show??false}
        setDialogVisible={setDialogInfoVisible}
        data={dialogInfoVisible?.data}
      />
      
      <DataTableOverlay
        data={allPayments}
        columns={visibleColumns}
        dataKey="id"
        filters={filters}
        setFilters={setFilters}
        globalFilterValue={globalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        initFilters={initFilters}
        title={name ? '`'+name+'` Payments' : 'All Payments'}
        routeTitle="Payment"
        emptyMessage={"No Payments Found"}
        scrollable={false}
        onSelectionChange={(e) => {
          if(allPayments?.length <= 0) {
            setSelection(e.value);
            return;
          }
          const selections = e.value;
          let filteredSelections = [];
          for (let i = 0; i < selections?.length; i++) {
            let selection = selections[i];
            let exists = allPayments?.some(item => item.id == selection.id);
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
          header: "Register Payment",
          subtitle: "",
          fullScreen: false,
          component: (
            <AddPayment
              users={users}
              courses={courses}
              chapters={chapters}
              parentId={parentId}
            />
          ),
        }}
        
        edit={{
          show: userAccess.edit,
          window: ["inline", "dialog"],
          header: "Edit Payment",
          subtitle: "",
          fullScreen: false,
          component: (
            <EditPayment
              users={users}
              courses={courses}
              chapters={chapters}
              parentId={parentId}
              bulk={true}
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
        selectableCallback={(data)=>checkRowEditable(data)}
      />
    </div>
  );
}

export default Payments;