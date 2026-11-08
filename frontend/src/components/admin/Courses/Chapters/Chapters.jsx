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
import AddChapter from "./AddChapter";
import EditChapter from "./EditChapter";
import ChapterDetail from "./ChapterDetail";

/**** redux ***/
import { setAlert, setEditId, showDialog, showSidebar } from "../../../../app/slices/commonSlice";

/**** rtk query imports ***/
import { useGetChaptersQuery, useUpdateChapterMutation, useDeleteChapterMutation } from "../../../../features/main/chaptersApiSlice";
import { useGetCoursesQuery } from "../../../../features/main/coursesApiSlice";

const Chapters = ({parentId, name}) => {
  /* hooks */
  const dispatch = useDispatch();
  const theme = useTheme();
  const { setEditComponent, setChildTwoDetailComponent } = useDataContext();
  const navigate = useNavigate();
  
  /* redux selectors */
  const chapterPermissions = useSelector(state=>state?.common?.permissions?.main?.chapter);
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);
  const _userId = useSelector(state=>state?.auth?.user?.id)
  const selectedCurrency = useSelector(state=>state.common.currency);
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  
  /* rtk query */
  const {
    data: chapters,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetChaptersQuery(parentId);
  const [updateChapter, { isLoading: updateLoading }] = useUpdateChapterMutation();
  const [deleteChapter, { isLoading: deleteLoading }] = useDeleteChapterMutation();
  
  const {data: courses} = useGetCoursesQuery();

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
    const foundAddRoles = authPermissions.filter(role => chapterPermissions?.add?.includes(role))
    if (foundAddRoles.length > 0) {
      userAccessData = {...userAccessData, add: true}
    }
    //edit permission check
    const foundEditRoles = authPermissions.filter(role => chapterPermissions?.edit?.includes(role))
    if (foundEditRoles.length > 0) {
      userAccessData = {...userAccessData, edit: true}
    }
    //delete permission check
    const foundDeleteRoles = authPermissions.filter(role => chapterPermissions?.delete?.includes(role))
    if (foundDeleteRoles.length > 0) {
      userAccessData = {...userAccessData, delete: true}
    }
    //detail permission check
    const foundDetailRoles = authPermissions.filter(role => chapterPermissions?.detail?.includes(role))
    if (foundDetailRoles.length > 0) {
      userAccessData = {...userAccessData, detail: true}
    }
    setUserAccess(()=>userAccessData);
  },[])
  
  const [allChapters, setAllChapters] = useState([]);
  const [addedByFilterOptions, setAddedByFilterOptions] = useState([]);
  const [updatedByFilterOptions, setUpdatedByFilterOptions] = useState([]);
  
  useEffect(()=>{
    if(chapters) {
      let allChaptersUpdated = [];
      let addedBy = [];
      let updatedBy = [];
      let addedByIds = [];
      let updatedByIds = [];
      chapters?.map((chapter) =>  {
        if(!addedByIds.includes(chapter?.AddedByChapter?.id)) {
          addedBy.push(chapter?.AddedByChapter);
          addedByIds.push(chapter?.AddedByChapter?.id);
        }
        if(!updatedByIds.includes(chapter?.UpdatedByChapter?.id)) {
          updatedBy.push(chapter?.UpdatedByChapter);
          updatedByIds.push(chapter?.UpdatedByChapter?.id);
        }
        let updatedChapter = {
          ...chapter,
          createdAt: new Date(chapter?.createdAt),
          updatedAt: new Date(chapter?.updatedAt),
        };
        allChaptersUpdated.push(updatedChapter);
      });
      setAllChapters(prev => allChaptersUpdated);
      setAddedByFilterOptions(prev => addedBy);
      setUpdatedByFilterOptions(prev => updatedBy);
    }
  },[chapters])
  
  /*** filter ***/
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  let lsTitle = localStorage.getItem("all_chapters");
  
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
      course_parent_id_target: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      title: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      description: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
      },
      price: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      free_first_n_chapters: {
        operator: FilterOperator.AND,
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
    const data = await updateChapter(fd).unwrap()
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
    return (data?.added_by == _userId && data?.updated_by == _userId);
  }
  
  const textEditor = (options) => {
    if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return options.rowData[options.field];
    }
    if(
      options.field==="title" || 
      options.field==="description"
    ) {
      return <TextField value={options.value} onChange={(e) => {options.editorCallback(e.target.value);}} variant="standard"/>
    }
    
    return options.rowData[options.field];
  }
  
  const numberEditor = (options) => {
    if(!userAccess.edit || !checkRowEditable(options?.rowData)) {
      return new Intl.NumberFormat('en-US', { style: 'decimal'}).format(options.rowData[options.field])
    }
    if(
      options.field==="free_first_n_chapters"
    ) {
      return <InputNumber value={options.value} onChange={(e) => {options.editorCallback(e.value);}} />
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
      options.field==="price"
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
    setChildTwoDetailComponent(()=><ChapterDetail newPage={true} columns={columns} id={rowData?.id} editAccess={userAccess?.edit} deleteAccess={userAccess?.delete} courses = {courses}  editItem={checkRowEditable(rowData)}/>)
    navigate(location.pathname+"/detail", { state: { header: "Chapter Detail", subtitle: "All data related to this chapter",} })
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
        name: "Edit Chapter",
        icon: <TbEdit size={inline ? 21 : 19} />,
        onClick: (e)=>{
          let type = "dialog";
          let header = "Edit chapter";
          let subtitle = "";
          let fullScreen = false;
          let position = "right";
          let width = "330px";
          let paddingX = "10px";
          if(type=="dialog") {
            dispatch(
              showDialog({
                header: header ? header : "Update Chapter",
                subtitle: subtitle ?? "Please fill out the form below with the necessary information.",
                openDialog: true,
                editId: rowData?.id??0,
                disableDataTableWindows: true,
              })
            );
          } else if(type == "sidebar") {
            dispatch(
              showSidebar({
                header: header ? header : "Update Chapter",
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
            setEditComponent(()=><EditChapter newPage={true} courses = {courses}  parentId={parentId} />)
            navigate(location.pathname+"/edit", { state: { header: "Edit Chapter", subtitle: "Please fill out the form below with the necessary information.",} })
          }
        }
      });
    }
    if(userAccess.delete) {
      mi.push({
        name: "Delete Chapter",
        icon: <MdOutlineDeleteOutline size={inline ? 22 : 20} />,
        closeOnClick: false,
        onClick: (e)=>{
          handleClickEl(e, rowData.id, rowData['title'])
        }
      });
    }
    return mi;
  }
  
  
  const routeStates = [
    {
      label: "draft",
      header: "Draft",
      color: "red",
      access: [],
      set_access: [""],
    },
    {
      label: "published",
      header: "Published",
      color: "green",
      access: [],
      set_access: [""],
    },
  ]
  
  const parentTargetEditor = (options) => {
    if(!userAccess?.edit) {
      return options.rowData[options.field];
    }
    if(options.field==="course_parent_id_target") {
      return (
        <Dropdown
          value={options?.rowData?.course_parent_id}
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
            if(options.rowData?.course_parent_id != e.value) {
              const params = {
                rowData: options.rowData,
                newValue: e.value,
                field: 'course_parent_id',
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
  const [dialogInfoVisible, setDialogInfoVisible] = useState({
    show: false,
    data: []
  })
  let columns = [
    {
      field: "course_parent_id_target",
      header: "Course",
      type: "text",
      group: 2,
      filterField: "course_parent_id_target",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by title",
      frozen: false,
      editor: (options) => parentTargetEditor(options),
    },
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
      field: "free_first_n_chapters",
      header: "Free First n Chapters",
      group: 2,
      filterField: "free_first_n_chapters",
      style: { minWidth: "11rem" },
      filter: true,
      sortable: false,
      filterPlaceholder: "Filter by free first n chapters",
      frozen: false,
      type: "custom",
      dataType: "numeric",
      body: (rowData) => {
        return new Intl.NumberFormat('en-US', {
          style: 'decimal',
          minimumFractionDigits:  0,
          maximumFractionDigits: 4,
        }).format(rowData["free_first_n_chapters"])
      },
      filterElement: (options) => {
        return (
          <InputNumber
            value={options.value}
            onChange={(e) => options.filterCallback(e.value, options.index)}
            locale="en-US"
          />
        );
      },
      editor: (options) => numberEditor(options),
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
      field: "chapter_files",
      header: "Chapter Files",
      group: 2,
      style: { minWidth: "11rem" },
      filter: false,
      type: "custom",
      body: (rowData) => {
        const chapter_filesList = rowData?.chapter_files;
        if(chapter_filesList?.length > 0) {
          return (
            <div className="flex gap-2">
            {
              chapter_filesList?.map((chapter_files, i)=>{
                return <FilePreview file={chapter_files} key={chapter_files?.filepath}/>  
              })
            }
            </div>
          )
        }
      },
    },
    {
      header: "Added By",
      field: 'AddedByChapter',
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
      field: 'UpdatedByChapter',
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
            disabled={disabled}
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
  
  if(parentId) {
    columns = columns.filter(column => column.field != 'course_parent_id_target')
  }
  
  const chapterColumns = localStorage?.getItem("chapterColumns")
  const colsArray = chapterColumns ? chapterColumns.split(',') : ["course_parent_id_target","title","free_first_n_chapters","chapter_files","custom_actions"]
  const [visibleColumnsArray, setVisibleColumnsArray] = useState(colsArray);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [selection, setSelection] = useState([]);
  const [reloadDataTable, setReloadDataTable] = useState(false);
  
  useEffect(()=>{
    if(chapterColumns) {
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
      localStorage?.setItem('chapterColumns',visibleColumnsArray)
      setVisibleColumns(cols)
    }
    else {
      localStorage?.setItem('chapterColumns',visibleColumnsArray)
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
          const data = await deleteChapter({ id: anchorEl?.id }).unwrap();
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
          anchorEl.name ? '"' + anchorEl.name + '"' : "this chapter"
        }?`}
      />
      
      {disableDataTableWindows &&
      <DialogOverlay>
        <EditChapter
           courses = {courses}
          parentId={parentId}
        />
      </DialogOverlay>}
      {disableDataTableWindows &&
      <SidebarOverlay>
        <EditChapter
           courses = {courses}
          parentId={parentId}
        />
      </SidebarOverlay>}
      
      <TableArrayInfo
        dialogVisible={dialogInfoVisible?.show??false}
        setDialogVisible={setDialogInfoVisible}
        data={dialogInfoVisible?.data}
      />
      
      <DataTableOverlay
        data={allChapters}
        columns={visibleColumns}
        dataKey="id"
        filters={filters}
        setFilters={setFilters}
        globalFilterValue={globalFilterValue}
        setGlobalFilterValue={setGlobalFilterValue}
        initFilters={initFilters}
        title={name ? '`'+name+'` Chapters' : 'All Chapters'}
        routeTitle="Chapter"
        emptyMessage={"No Chapters Found"}
        scrollable={false}
        onSelectionChange={(e) => {
          if(allChapters?.length <= 0) {
            setSelection(e.value);
            return;
          }
          const selections = e.value;
          let filteredSelections = [];
          for (let i = 0; i < selections?.length; i++) {
            let selection = selections[i];
            let exists = allChapters?.some(item => item.id == selection.id);
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
          header: "Register Chapter",
          subtitle: "",
          fullScreen: false,
          component: (
            <AddChapter
              courses = {courses}
              parentId={parentId}
            />
          ),
        }}
        
        edit={{
          show: userAccess.edit,
          window: ["inline", "dialog"],
          header: "Edit Chapter",
          subtitle: "",
          fullScreen: false,
          component: (
            <EditChapter
              courses = {courses}
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
        routeStates={routeStates}
        selectableCallback={(data)=>checkRowEditable(data)}
      />
    </div>
  );
}

export default Chapters;