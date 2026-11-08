import React, { useEffect, useRef, useState } from 'react'
import GraphOverlay from '../../utils/Graph/GraphOverlay'
import { OverlayPanel } from 'primereact/overlaypanel'
import {useGetMainDashboardDataQuery} from '../../../features/auth/dashboardsApiSlice'
import Loader from '../../utils/Loader'

const NewDashboard = () => {

  const data_temp = [
    {id: 1, number_field: 12, routeState: "not_started", date: "2022-12-15"},
    {id: 14, number_field: 12, routeState: "in_progress", date: "2022-12-17"},
    {id: 1, number_field: 12, routeState: "not_started", date: "2023-01-15"},
    {id: 2, number_field: 34, routeState: "running", date: "2023-02-20"},
    {id: 3, number_field: 56, routeState: "completed", date: "2023-03-10"},
    {id: 4, number_field: 78, routeState: "running", date: "2023-04-05"},
    {id: 5, number_field: 12, routeState: "completed", date: "2023-05-01"},
    {id: 6, number_field: 34, routeState: "not_started", date: "2023-06-15"},
    {id: 7, number_field: 56, routeState: "running", date: "2023-07-20"},
    {id: 8, number_field: 78, routeState: "completed", date: "2023-08-10"},
    {id: 9, number_field: 12, routeState: "running", date: "2023-09-05"},
    {id: 10, number_field: 34, routeState: "completed", date: "2023-10-01"}
];
  
  
  const {
    data: mainDashboardDatas,
    isLoading: mainDashboardLoading,
  } = useGetMainDashboardDataQuery()

  const overview = mainDashboardDatas?.overview
  const payments = mainDashboardDatas?.allPayments;
  const coursesByCateogry = Object.entries((mainDashboardDatas?.coursesByCateogry || {})).map(([name, value]) => ({ name, value }));
  const [barData, setBarData] = useState([])

  const [allPayments, setAllPayments] = useState([])
  useEffect(()=>{
    if(payments?.length > 0) {
      const allP = []
      payments?.map((payment)=>{
        const paymentObject = {
          ...payment,
          updatedAt: new Date(payment?.updatedAt)
        }
        allP.push(paymentObject)
      })
      setAllPayments(()=>allP)
    }
    setBarData(()=>data_temp)
  },[payments])

  const overviewRef = useRef()
  const [overviewItems, setOverviewItems] = useState([])

  const itemContentForCounts = (data, index, titleColor, subTitleColor, semiDark) => {
    const {title, subtitle} = data;
    return (
      <div className='flex flex-col'>
        <p style={{color: subTitleColor}} className='truncate'>{subtitle}</p>
        <p style={{color: titleColor, fontSize: 25}} className='truncate'>{title}</p>
      </div>
    );
  }

    const graphData = {
        justifyContent: "start",
        items: [
          {
            type: "count",
            grid: {xs: 12},
            card: true,
            title: <p className='mt-2' style={{fontWeight: 400, fontSize: 18}}>Total Earnings Overview</p>,
            color: true,
            backgroundColor: '#31444a',
            titleColor: 'white',
            subtitleColor: 'rgba(255,255,255,.5)',
            borderRadius: 100,
            items: [
              {
                title: overview?.today??0,
                subtitle: "Today so far",
                // onClick: (e) => {
                //   setOverviewItems(dashboardDatas?.cdlExpiredDrivers??[])
                //   overviewRef?.current?.show(e);
                // },
                // icon: <MdOutlineDeleteOutline />,
                //  component: <div>12</div>, //use this to replace the above 3
                component: itemContentForCounts
              },
              {
                title: overview?.yesterday??0,
                subtitle: "Yesterday",
                // icon: <MdOutlineModeEditOutline />,
                // onClick: (e) => {
                //   setOverviewItems(dashboardDatas?.medicalExpiredDrivers??[])
                //   overviewRef?.current?.show(e);
                // }
                component: itemContentForCounts
              },
              {
                title: overview?.thisMonth??0,
                subtitle: "This month so far",
                // icon: <BiDotsVerticalRounded />
                // onClick: (e) => {
                //   setOverviewItems(dashboardDatas?.mvrRecordDateDrivers??[])
                //   overviewRef?.current?.show(e);
                // }
                component: itemContentForCounts
              },
              {
                title: overview?.thisYear??0,
                subtitle: "This Year",
                // onClick: (e) => {
                //   setOverviewItems(dashboardDatas?.chiExpDateDrivers??[])
                //   overviewRef?.current?.show(e);
                // }
                // icon: <AiFillAccountBook />
                component: itemContentForCounts
              },
              // {
              //   title: "234",
              //   subtitle: "Owner Operator Drivers",
              //   // icon: <AiFillAccountBook />
              // },
            
            ]
          },
          {
              title: "Courses payments",
              // subtitle: "This is the place to see overview of vehicles income and expenses of each month over the course of 2023",
              type: "bar",
              labelType: "date", //routestate, relation
              labelField: "date", //pickup_date
              relationItems: [], //use this for relation label type. eg categories, routeStates,...
              grid: {xs: 12, md: 8},
              card: true,
              // data: allPayments,
              // icon: <p>Icon</p>,
              data: barData,
              charts: [
                  {
                    type: "bar",
                    groupBy: "",
                    groupField: "routeState",
                    maxBarTickness: 10,
                    fill: false,
                    borderRadius: 30,
                    // tension:.2,
                    colorField: "color",
                    dataLabel: "number_field", //number field for calculating sum instead of count
                    backgroundColor: "#27b7ff", //this will be used if groupedBy is not routeState or relation or routeStates or relation doesn't have color field 
                    labelText: "Amount (ETB)", //use this if not using groupBy
                    mainData: [], //this will replace the main data
                    groupItems: [] //this is for those grouped by relation same as routeStates, groupItem.id == item[groupField]
                },
                //   {
                //     type: "bar",
                //     groupBy: "",
                //     groupField: "",
                //     maxBarTickness: 10,
                //     fill: false,
                //     borderRadius: 30,
                //     // tension:.2,
                //     colorField: "color",
                //     dataLabel: "amount", //number field for calculating sum instead of count
                //     backgroundColor: "#27b7ff", //this will be used if groupedBy is not routeState or relation or routeStates or relation doesn't have color field 
                //     labelText: "Amount (USD)", //use this if not using groupBy
                //     mainData: [], //this will replace the main data
                //     groupItems: [] //this is for those grouped by relation same as routeStates, groupItem.id == item[groupField]
                // },
              
              ]
          },
          {
            title: "Courses By Category",
            // subtitle: "This is a place to see the overall income, expenses and net income of the company.",
            type: "pie",
            labelType: "field",
            labelField: "name", //pickup_date
            grid: {xs: 12, md: 4},
            card: true,
            data: coursesByCateogry,
            // icon: <p>Icon</p>,
            charts: [
                {
                    type: "pie",
                    groupBy: "number",
                    fill: true,
                    groupField: "number",
                    colorField: "color",
                    dataLabel: "value", //number field for calculating sum instead of count
                    backgroundColor: "", //this will be used if groupedBy is not routeState or relation or routeStates or relation doesn't have color field 
                    labelText: "", //use this if not using groupBy
                    mainData: [], //this will replace the main data
                    groupItems: [] //this is for those grouped by relation same as routeStates, groupItem.id == item[groupField]
                },            
            ]
        }
        ]
    }

    // const emptyMessageComponent = (
    //     <div
    //       style={{
    //         display: "flex",
    //         justifyContent: "center",
    //         alignItems: "center",
    //         minHeight: 100,
    //       }}
    //     >
    //       <div
    //         className="text-white px-3 py-1 rounded-xl"
    //         style={{ backgroundColor: theme.palette.primary.dark, fontWeight: 700 }}
    //       >
    //         {emptyMessage}
    //       </div>
    //     </div>
    //   );

    // Sample data array
   
  
  // Sample routeStates array
  const routeStates_temp = [
      {field: "not_started", header: "Not Started", color: "red"},
      {field: "running", header: "Running", color: "blue"},
      {field: "completed", header: "Completed", color: "green"}
  ];

  return mainDashboardLoading ? <Loader /> : 
  (
    <div>
        <OverlayPanel ref={overviewRef} showCloseIcon dismissable={false}>
          <div className='flex flex-col gap-3'>
           {overviewItems?.map((oit, index)=>{
              return (
                <div key={index} className='font-bold font-2xl text-red-400'>{oit}</div>
              )
           })}
           {overviewItems?.length <= 0 && 
             <div className='text-xl'>No drivers</div>
           }
           </div>
        </OverlayPanel>
        <GraphOverlay 
            routeStates={[]}
            // emptyComponent={emptyMessageComponent}
            data={data_temp}
            chartData={graphData}
        />
    </div>
  )
}

export default NewDashboard