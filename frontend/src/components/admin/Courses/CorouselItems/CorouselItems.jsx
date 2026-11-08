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
import { TbEdit } from "react-icons/tb";

/**** crud components ***/
import AddCorouselItem from "./AddCorouselItem";
import EditCorouselItem from "./EditCorouselItem";
import CorouselItemDetail from "./CorouselItemDetail";

/**** redux ***/
import { setAlert, setEditId, showDialog, showSidebar } from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import { useGetCorouselItemsQuery, useUpdateCorouselItemMutation, useDeleteCorouselItemMutation } from "../../../../features/main/corouselItemsApiSlice";
import Loader from "../../../utils/Loader";

const CorouselItems = ({parentId, name}) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const { setEditComponent, setChildOneDetailComponent } = useDataContext();
  const navigate = useNavigate();
  
  /* redux selectors */
  const corouselItemPermissions = useSelector(state=>state?.common?.permissions?.main?.corouselItem);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const selectedCurrency = useSelector(state=>state.common.currency);
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  
  /* rtk query */
  const {
    data: corouselItems,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetCorouselItemsQuery(parentId);
  const [updateCorouselItem, { isLoading: updateLoading }] = useUpdateCorouselItemMutation();
  const [deleteCorouselItem, { isLoading: deleteLoading }] = useDeleteCorouselItemMutation();
  
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
    const foundAddRoles = authPermissions.filter(role => corouselItemPermissions?.add?.includes(role))
    if (foundAddRoles.length > 0) {
      userAccessData = {...userAccessData, add: true}
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => corouselItemPermissions?.edit?.includes(role))
    if (foundEditRoles.length > 0) {
      userAccessData = {...userAccessData, edit: true}
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => corouselItemPermissions?.delete?.includes(role))
    if (foundDeleteRoles.length > 0) {
      userAccessData = {...userAccessData, delete: true}
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => corouselItemPermissions?.detail?.includes(role))
    if (foundDetailRoles.length > 0) {
      userAccessData = {...userAccessData, detail: true}
    }
    setUserAccess(()=>userAccessData);
  },[])
  
  const [allCorouselItems, setAllCorouselItems] = useState([]);
  const [addedByFilterOptions, setAddedByFilterOptions] = useState([]);
  const [updatedByFilterOptions, setUpdatedByFilterOptions] = useState([]);
  
  useEffect(()=>{
    if(corouselItems) {
      let allCorouselItemsUpdated = [];
      let addedBy = [];
      let updatedBy = [];
      let addedByIds = [];
      let updatedByIds = [];
      corouselItems?.map((corouselItem) =>  {
        if(!addedByIds.includes(corouselItem?.AddedByCorouselItem?.id)) {
          addedBy.push(corouselItem?.AddedByCorouselItem);
          addedByIds.push(corouselItem?.AddedByCorouselItem?.id);
        }
        if(!updatedByIds.includes(corouselItem?.UpdatedByCorouselItem?.id)) {
          updatedBy.push(corouselItem?.UpdatedByCorouselItem);
          updatedByIds.push(corouselItem?.UpdatedByCorouselItem?.id);
        }
        let updatedCorouselItem = {
          ...corouselItem,
          createdAt: new Date(corouselItem?.createdAt),
          updatedAt: new Date(corouselItem?.updatedAt),
        };
        allCorouselItemsUpdated.push(updatedCorouselItem);
      });
      setAllCorouselItems(prev => allCorouselItemsUpdated);
      setAddedByFilterOptions(prev => addedBy);
      setUpdatedByFilterOptions(prev => updatedBy);
    }
  },[corouselItems])
  
  /*** filter ***/
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  let lsTitle = localStorage.getItem("all_corousel_items");
  
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
      subtitle: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      enable_action_button: { value: null, matchMode: FilterMatchMode.EQUALS },
      action_button_type: {
        operator: FilterOperator.OR,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      action_message: {
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
    const data = await updateCorouselItem(fd).unwrap()
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
    if(
      options.field==="title" || 
      options.field==="subtitle" || 
      options.field==="action_message"
    ) {
      return <TextField value={options.value} onChange={(e) => {options.editorCallback(e.target.value);}} variant="standard"/>
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
    setChildOneDetailComponent(()=><CorouselItemDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess?.edit} deleteAccess={userAccess?.delete}  editItem={checkRowEditable(rowData)}/>)
    navigate(location.pathname+"/detail", { state: { header: "CorouselItem Detail", subtitle: "All data related to this corousel item",} })
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
        name: "Edit Corousel Item",
        icon: <TbEdit size={inline ? 21 : 19} />,
        onClick: (e)=>{
          let type = "dialog";
          let header = "Edit corousel item";
          let subtitle = "";
          let fullScreen = false;
          let position = "right";
          let width = "330px";
          let paddingX = "10px";
          if(type=="dialog") {
            dispatch(
              showDialog({
                header: header ? header : "Update CorouselItem",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                openDialog: true,
                editId: rowData?.id??0,
                disableDataTableWindows: true,
              })
            );
          } else if(type == "sidebar") {
            dispatch(
              showSidebar({
                header: header ? header : "Update CorouselItem",
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
            setEditComponent(()=><EditCorouselItem newPage={true}  parentId={parentId} />)
            navigate(location.pathname+"/edit", { state: { header: "Edit CorouselItem", subtitle: "Please fill out the form below with the necessary information.",} })
          }
        }
      });
    }
    if(userAccess.delete) {
      mi.push({
        name: "Delete Corousel Item",
        icon: <MdOutlineDeleteOutline size={inline ? 22 : 20} />,
        closeOnClick: false,
        onClick: (e)=>{
          handleClickEl(e, rowData.id, )
        }
      });
    }
    return mi;
  }
  
  const action_button_typeOptions = [{name: "Contact Us", value: "Contact Us"}, {name: "Register", value: "Register"}]
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
      field: "subtitle",
      header: "Subtitle",
      group: 2,
      filterField: "subtitle",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by subtitle",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
    },
    {
      field: "image",
      header: "Image",
      group: 2,
      style: { minWidth: "11rem" },
      filter: false,
      type: "custom",
      body: (rowData) => {
        const imageList = rowData?.image;
        if(imageList?.length > 0) {
          return (
            <div className="flex gap-2">
            {
              <FilePreview file={imageList[0]} key={imageList[0]?.filepath}/>  
            }
            </div>
          )
        }
      },
    },
    {
      field: "enable_action_button",
      header: "Enable Action Button",
      group: 2,
      filterField: "enable_action_button",
      style: { minWidth: "5rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by enable action button",
      frozen: false,
      type: "verified",
      dataType:"boolean",
      editor: (options) => {
        if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
          return (
            <div className="flex justify-center">
              {(options.rowData[options.field]) ? <BsFillPatchCheckFill size={20} color="#2b91f7"/> : <AiOutlineCloseCircle size={20} color="#ed4e84"/> }
            </div>
          )
        }
        return <div className="flex justify-center"><Checkbox onChange={(e) => options.editorCallback(e.target.checked)} checked={options.value??false} /></div>
      },
      headerLabel: "Filter by enable action button",
    },
    {
      field: "action_button_type",
      header: "Action Button Type",
      group: 2,
      filterField: "action_button_type",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by action button type",
      frozen: false,
      dependencies: {
        op: "&&",
        dependencies: {
          enable_action_button: {
            op: "==",
            value: true,
            valueType: "number",
            type: "value",
            formula: [],
          },
        },
      },
      type: "status",
      nameLabel: "name",
      valueLabel: "value",
      colorLabel: "color",
      options: action_button_typeOptions,
      editor: (options) => {
        if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
          return action_button_typeOptions?.map((op, indx) => {
            if(op['value']==options.rowData['action_button_type']) {
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
            options={ action_button_typeOptions }
            optionLabel="name"
            optionValue="value"
            onChange={e => {
              if(options.rowData[options.field] == e.value) return;
              const params = {
                rowData: options.rowData,
                newValue: e.value,
                field: "action_button_type"
              };
              onCellEditComplete(params);
            }}
            placeholder="Select action button type"
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
      field: "action_message",
      header: "Action Message",
      group: 2,
      filterField: "action_message",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by action message",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
    },
    {
      header: "Added By",
      field: 'AddedByCorouselItem',
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
      field: 'UpdatedByCorouselItem',
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
  
  
  const corouselItemColumns = localStorage?.getItem("corouselItemColumns")
  const colsArray = corouselItemColumns ? corouselItemColumns.split(',') : ["title","image","enable_action_button","action_button_type","action_message","custom_actions"]
  const [visibleColumnsArray, setVisibleColumnsArray] = useState(colsArray);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [selection, setSelection] = useState([]);
  const [reloadDataTable, setReloadDataTable] = useState(false);
  
  useEffect(()=>{
    if(corouselItemColumns) {
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
      localStorage?.setItem('corouselItemColumns',visibleColumnsArray)
      setVisibleColumns(cols)
    }
    else {
      localStorage?.setItem('corouselItemColumns',visibleColumnsArray)
      setVisibleColumns(columns)
    }
  },[visibleColumnsArray, userAccess, reloadDataTable])
  
  const [expandedRows, setExpandedRows] = useState(null);
  const [expandAllToggle, setExpandAllToggle] = useState(true);
  
  return isLoading ? <Loader /> : (
    <div>
      <PopoverOverlay
        anchorEl={anchorEl?.anchor ?? null}
        handleClose={handleClose}
        headerTitle="Confirm Delete"
        okClick={async () => {
          const data = await deleteCorouselItem({ id: anchorEl?.id }).unwrap();
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
          anchorEl.name ? '"' + anchorEl.name + '"' : "this corousel item"
        }?`}
      />
      
      {disableDataTableWindows &&
      <DialogOverlay>
        <EditCorouselItem
          
          parentId={parentId}
        />
      </DialogOverlay>}
      {disableDataTableWindows &&
      <SidebarOverlay>
        <EditCorouselItem
          
          parentId={parentId}
        />
      </SidebarOverlay>}
      
      <TableArrayInfo
        dialogVisible={dialogInfoVisible?.show??false}
        setDialogVisible={setDialogInfoVisible}
        data={dialogInfoVisible?.data}
      />
      
      <DataTableOverlay
        data={allCorouselItems}
        columns={visibleColumns}
        dataKey="id"
        filters={filters}
        setFilters={setFilters}
        globalFilterValue={globalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        initFilters={initFilters}
        title={name ? '`'+name+'` Corousel Items' : 'All Corousel Items'}
        routeTitle="Corousel Item"
        emptyMessage={"No Corousel Items Found"}
        scrollable={false}
        onSelectionChange={(e) => {
          if(allCorouselItems?.length <= 0) {
            setSelection(e.value);
            return;
          }
          const selections = e.value;
          let filteredSelections = [];
          for (let i = 0; i < selections?.length; i++) {
            let selection = selections[i];
            let exists = allCorouselItems?.some(item => item.id == selection.id);
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
          header: "Register Corousel Item",
          subtitle: "",
          fullScreen: false,
          component: (
            <AddCorouselItem
              parentId={parentId}
            />
          ),
        }}
        
        edit={{
          show: userAccess.edit,
          window: ["inline", "dialog"],
          header: "Edit Corousel Item",
          subtitle: "",
          fullScreen: false,
          component: (
            <EditCorouselItem
              parentId={parentId}
              bulk={true}
            />
          ),
        }}
        sideBar={{ position: "right", width: "330px", paddingX: "10px" }}
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

export default CorouselItems;