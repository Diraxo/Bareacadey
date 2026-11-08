import React, {useEffect, useState} from 'react'
import { useGetActivitiesQuery } from '../../../features/user/activitiesApiSlice'
import DataTableOverlay from '../../utils/CrudComponents/DataTableOverlay'
import { BreadcrumbOverlay, MenuOverlay, PopoverOverlay, ProgressBarOverlay } from '../../utils/CrudComponents/ComponentsOverlay';
import { FilterMatchMode, FilterOperator } from "primereact/api";


const Activities = () => {
  const {
      data: activities,
      isLoading,
      isSuccess,
      isError,
      error,
  } = useGetActivitiesQuery()
 

  

  const [activityFilterOptions, setActivityFilterOptions] = useState([])
  const [allActivities, setAllActivities] = useState([])
 
  useEffect(()=>{
    if(activities) {
       let u = []
       let allU = []
       let ids = []
       activities.map((activity)=>{
         if(!ids.includes(activity.user.id)) {
           u.push(activity.user)
           ids.push(activity.user.id)
         }
          let act = {...activity, date: new Date(activity.date), activity: activity.activity}
          allU.push(act)
       })
       setAllActivities(acts=>allU)
       setActivityFilterOptions(u)
      }
    },[activities])

  /**** filter staff ****/

  //declar filter variables
  const [filters, setFilters] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const initFilters = () => {
    setFilters({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        type: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
        },
        full_name: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
        },
        activity: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
        },
        user: { value: "", matchMode: FilterMatchMode.IN },
        date: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
        },
        role: {
          operator: FilterOperator.AND,
          constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
        },
       
    });
    setGlobalFilterValue("");
  };

  /**** end of filter staff ****/
  
  
  const columns = [
    {
        header: "Full Name",
        field: 'user',
        filterPlaceholder: "Filter by avatar",
        filterField: "full_name",
        style: { minWidth: "12rem" },
        nameLabel: "name",
        imgLabel: "url",
        type: "useralt",
        filter: true,
        frozen:false,
        options: {activityFilterOptions}
        
    },
    {
        field: "type",
        header: "Action",
        filterField: "type",
        style: { minWidth: "4rem" },
        filterPlaceholder: "Filter by action",
        body: (rowData)=>{
            const type = rowData.type;
            return <div className={`customer-badge status-${type==="deleted" ? "unqualified" : type==="updated" ? "renewal" : "proposal"} flex items-center justify-center`}>{rowData.type}</div>
        },
        type: "text",
        filter: true,
        frozen:false,
        sortable: false
    },
    {
        field: "activity",
        header: "Activity",
        type: "text",
        filterField: "activity",
        style: { minWidth: "12rem" },
        filter: true,
        filterPlaceholder: "Filter by activity",
        frozen:false,
       // editor: (options) => textEditor(options)
    },
    {
        field: "role",
        header: "Role",
        type: "text",
        filterField: "role",
        style: { minWidth: "6rem" },
        body: (rowData)=>{
            const color = rowData.color;
            return <div className={`flex items-center justify-center`} style={{color:color}}>{rowData?.role}</div>
        },
        filter: true,
        filterPlaceholder: "Filter by role",
        frozen:false,
    },
    {
        field: "date",
        header: "Action Date",
        filterField: "date",
        filterPlaceholder: "Filter by date",
        style: { minWidth: "6rem" },
        type: "date",
        filter: true,
        frozen:false,
    },
  
  ]

  

  const [selectedValue,setSelectedValue] = useState([])
  
  const [selection, setSelection] = useState([])
  const [loading, setLoading] = useState(false)

  return (
    <div>
         <BreadcrumbOverlay
            title={"Activities"}
            enableClickActive={true}
            subtitle={"This is the place to see all activities under your controls"}
         />
        <div className='mt-3'></div>
        
        <DataTableOverlay
          data={allActivities}
          columns={columns}
          filters={filters}
          setFilters={setFilters}
          globalFilterValue={globalFilterValue}
          setGlobalFilterValue={setGlobalFilterValue}
          initFilters={initFilters}
          title="All Activities"
          emptyMessage={"No Acitvity Found"}
          scrollable={false}
          onSelectionChange={(e)=>{
            setSelection(e.value)
          }}
          showGridlines={true}
          selection={selection}
          selectionMode={null}//"single" || "multiple" || null
          loading={loading}
          metaKeySelection={true}
          dragSelection={false}
          cellSelection={false}
          enableSelectCheckbox={false}
          editMode="cell"
          showDelete={true}
          add={{show: false, window:"newpage", header:"Fill Out The Form", component: <></>}}
          edit={{show: false, window:["inline","sidebar"], header:"Edit user information", component: <></>}}
          sideBar={{position: "right", width: 400, paddingX: 0}}
        />
    </div>
  )
}

export default Activities;