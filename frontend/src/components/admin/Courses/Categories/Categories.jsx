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
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import CategoryDetail from "./CategoryDetail";

/**** redux ***/
import { setAlert, setEditId, showDialog, showSidebar } from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import { useGetCategoriesQuery, useUpdateCategoryMutation, useDeleteCategoryMutation, useCategoriesReorderRowsMutation } from "../../../../features/main/categoriesApiSlice";

const Categories = ({parentId, name}) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const { setEditComponent, setChildOneDetailComponent } = useDataContext();
  const navigate = useNavigate();
  
  /* redux selectors */
  const categoryPermissions = useSelector(state=>state?.common?.permissions?.main?.category);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const selectedCurrency = useSelector(state=>state.common.currency);
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  
  /* rtk query */
  const {
    data: categories,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetCategoriesQuery(parentId);
  const [updateCategory, { isLoading: updateLoading }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleteLoading }] = useDeleteCategoryMutation();
  const [reorderRows] = useCategoriesReorderRowsMutation()
  
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
    const foundAddRoles = authPermissions.filter(role => categoryPermissions?.add?.includes(role))
    if (foundAddRoles.length > 0) {
      userAccessData = {...userAccessData, add: true}
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => categoryPermissions?.edit?.includes(role))
    if (foundEditRoles.length > 0) {
      userAccessData = {...userAccessData, edit: true}
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => categoryPermissions?.delete?.includes(role))
    if (foundDeleteRoles.length > 0) {
      userAccessData = {...userAccessData, delete: true}
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => categoryPermissions?.detail?.includes(role))
    if (foundDetailRoles.length > 0) {
      userAccessData = {...userAccessData, detail: true}
    }
    setUserAccess(()=>userAccessData);
  },[])
  
  const [allCategories, setAllCategories] = useState([]);
  const [addedByFilterOptions, setAddedByFilterOptions] = useState([]);
  const [updatedByFilterOptions, setUpdatedByFilterOptions] = useState([]);
  
  useEffect(()=>{
    if(categories) {
      let allCategoriesUpdated = [];
      let addedBy = [];
      let updatedBy = [];
      let addedByIds = [];
      let updatedByIds = [];
      categories?.map((category) =>  {
        if(!addedByIds.includes(category?.AddedByCategory?.id)) {
          addedBy.push(category?.AddedByCategory);
          addedByIds.push(category?.AddedByCategory?.id);
        }
        if(!updatedByIds.includes(category?.UpdatedByCategory?.id)) {
          updatedBy.push(category?.UpdatedByCategory);
          updatedByIds.push(category?.UpdatedByCategory?.id);
        }
        let updatedCategory = {
          ...category,
          createdAt: new Date(category?.createdAt),
          updatedAt: new Date(category?.updatedAt),
        };
        allCategoriesUpdated.push(updatedCategory);
      });
      setAllCategories(prev => allCategoriesUpdated);
      setAddedByFilterOptions(prev => addedBy);
      setUpdatedByFilterOptions(prev => updatedBy);
    }
  },[categories])
  
  /*** filter ***/
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  let lsTitle = localStorage.getItem("all_categories");
  
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
      name: {
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
    const data = await updateCategory(fd).unwrap()
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
      options.field==="name"
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
    setChildOneDetailComponent(()=><CategoryDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess?.edit} deleteAccess={userAccess?.delete}  editItem={checkRowEditable(rowData)}/>)
    navigate(location.pathname+"/detail", { state: { header: "Category Detail", subtitle: "All data related to this category",} })
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
        name: "Edit Category",
        icon: <TbEdit size={inline ? 21 : 19} />,
        onClick: (e)=>{
          let type = "sidebar";
          let header = "Edit category";
          let subtitle = "";
          let fullScreen = false;
          let position = "right";
          let width = "330px";
          let paddingX = "10px";
          if(type=="dialog") {
            dispatch(
              showDialog({
                header: header ? header : "Update Category",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                openDialog: true,
                editId: rowData?.id??0,
                disableDataTableWindows: true,
              })
            );
          } else if(type == "sidebar") {
            dispatch(
              showSidebar({
                header: header ? header : "Update Category",
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
            setEditComponent(()=><EditCategory newPage={true}  parentId={parentId} />)
            navigate(location.pathname+"/edit", { state: { header: "Edit Category", subtitle: "Please fill out the form below with the necessary information.",} })
          }
        }
      });
    }
    if(userAccess.delete) {
      mi.push({
        name: "Delete Category",
        icon: <MdOutlineDeleteOutline size={inline ? 22 : 20} />,
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
      field: "name",
      header: "Name",
      group: 2,
      filterField: "name",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by name",
      frozen: false,
      type: "text",
      editor: (options) => textEditor(options),
    },
    {
      header: "Added By",
      field: 'AddedByCategory',
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
      field: 'UpdatedByCategory',
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
  
  
  const categoryColumns = localStorage?.getItem("categoryColumns")
  const colsArray = categoryColumns ? categoryColumns.split(',') : ["name","custom_actions"]
  const [visibleColumnsArray, setVisibleColumnsArray] = useState(colsArray);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [selection, setSelection] = useState([]);
  const [reloadDataTable, setReloadDataTable] = useState(false);
  
  useEffect(()=>{
    if(categoryColumns) {
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
      localStorage?.setItem('categoryColumns',visibleColumnsArray)
      setVisibleColumns(cols)
    }
    else {
      localStorage?.setItem('categoryColumns',visibleColumnsArray)
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
          const data = await deleteCategory({ id: anchorEl?.id }).unwrap();
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
          anchorEl.name ? '"' + anchorEl.name + '"' : "this category"
        }?`}
      />
      
      {disableDataTableWindows &&
      <DialogOverlay>
        <EditCategory
          
          parentId={parentId}
        />
      </DialogOverlay>}
      {disableDataTableWindows &&
      <SidebarOverlay>
        <EditCategory
          
          parentId={parentId}
        />
      </SidebarOverlay>}
      
      <TableArrayInfo
        dialogVisible={dialogInfoVisible?.show??false}
        setDialogVisible={setDialogInfoVisible}
        data={dialogInfoVisible?.data}
      />
      
      <DataTableOverlay
        data={allCategories}
        columns={visibleColumns}
        dataKey="id"
        filters={filters}
        setFilters={setFilters}
        globalFilterValue={globalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        initFilters={initFilters}
        title={name ? '`'+name+'` Categories' : 'All Categories'}
        routeTitle="Category"
        emptyMessage={"No Categories Found"}
        scrollable={false}
        onSelectionChange={(e) => {
          if(allCategories?.length <= 0) {
            setSelection(e.value);
            return;
          }
          const selections = e.value;
          let filteredSelections = [];
          for (let i = 0; i < selections?.length; i++) {
            let selection = selections[i];
            let exists = allCategories?.some(item => item.id == selection.id);
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
          window: "sidebar",
          header: "Register Category",
          subtitle: "",
          fullScreen: false,
          component: (
            <AddCategory
              parentId={parentId}
            />
          ),
        }}
        
        edit={{
          show: userAccess.edit,
          window: ["inline", "sidebar"],
          header: "Edit Category",
          subtitle: "",
          fullScreen: false,
          component: (
            <EditCategory
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
        reorderableRows={userAccess.edit}
        reorderRowsCallback={async (e)=>{
          let ids = {}
          e?.value?.map((item, index)=>{
            ids[item?.id] = index+1;
          })
          if(Object.keys(ids)?.length > 0) {
            const result = await reorderRows(ids).unwrap();
            if (result.message === "Saved") {
              dispatch(
                setAlert({
                  openAlert: true,
                  severity: "success",
                  message: result?.message,
                  autoHideDuration: 5000,
                  vertical: "top",
                  horizontal: "right",
                })
              );
            } else if (result?.error) {
              dispatch(
                setAlert({
                  openAlert: true,
                  severity: "error",
                  message: result?.message,
                  autoHideDuration: 5000,
                  vertical: "top",
                  horizontal: "right",
                })
              );
            }
          }
        }}
      />
    </div>
  );
}

export default Categories;