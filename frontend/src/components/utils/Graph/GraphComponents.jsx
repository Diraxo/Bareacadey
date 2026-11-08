import React, {useState, useEffect} from "react";
import { Chart } from 'primereact/chart';
import { Card, Tooltip } from "@mui/material";
import { useRef } from "react";
import {useTheme} from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import DialogOverlay from "../CrudComponents/DialogOverlay";
import { showDialog } from "../../../app/slices/commonSlice";
import { OverlayPanel } from "primereact/overlaypanel";
import { useNavigate } from "react-router-dom";


export const GetChart = ({title="", subtitle="", datasets, labels, type="bar", card=true, maxBarTickness=20, width}) => {
    const [options, setOptions] = useState({});
    const [chartData, setChartData] = useState({});
    const theme = useTheme();

     const chType = type=="bar" ? "bar" :
                    type=="pie" ? "pie" :
                    type=="line" ? "line" : 
                    type=="polarArea" ? "polarArea" : 
                    type=="radar" ? "radar" : 
                    type=="stack" ? "bar" : 
                    type=="horizontal_bar" ? "bar" : 
                    type=="doughnut" ? "doughnut" : 
                    type=="mix" ? "line" : "bar";

    useEffect(() => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

       
        
        const barData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
                {
                    label: 'My First dataset',
                    backgroundColor: "#3f51b5",
                    borderColor: "#3f51b5",
                    data: [65, 59, 80, 81, 56, 55, 40],
                    borderRadius: 50,
                    maxBarThickness: maxBarTickness
                },
                {
                    label: 'My Second dataset',
                    backgroundColor: "#acb4df",
                    borderColor: "#acb4df",
                    data: [28, 48, 40, 19, 86, 27, 90],
                    borderRadius: 50,
                    maxBarThickness: maxBarTickness
                }
            ]
        };

        const barOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: { 
                        boxWidth: 14,
                        //fontColor: textColor
                    },
                    // position: "bottom",
                }
            },
            scales: {
                x: {
                    ticks: {
                        //color: textColorSecondary,
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        //color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };

        const pieData = {
            labels: ['A', 'B', 'C'],
            datasets: [
                {
                    data: [540, 325, 702],
                    backgroundColor: ["#4e5fbb", "#9c27b0", "#009688"],
                    hoverBackgroundColor: ["#5c6bc0", "#7e57c2", "#26a69a"]
                }
            ]
        };

        const pieOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 14,
                        color: textColor,
                        paddingBottom: 200,
                        usePointStyle: true,
                    }
                }
            },  
        };

        const lineData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
                {
                    label: 'First Dataset',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    fill: false,
                    backgroundColor: "#3f51b5",
                    borderColor: "#3f51b5",
                    tension: 0.4
                },
                {
                    label: 'Second Dataset',
                    data: [28, 48, 40, 19, 86, 27, 90],
                    fill: false,
                    backgroundColor: "#acb4df",
                    borderColor: "#acb4df",
                    tension: 0.4
                }
            ]
        };

        const lineOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 14,
                        //fontColor: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        //color: textColorSecondary
                    },
                    grid: {
                        // display: false,
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        //color: textColorSecondary
                    },
                    grid: {
                        // display: false,
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };

        const polarData = {
            datasets: [
                {
                    data: [11, 16, 7, 3],
                    backgroundColor: ["#4e5fbb", "#9c27b0", "#009688", "#ff9800"],
                    label: 'My dataset'
                }
            ],
            labels: ['Indigo', 'Purple', 'Teal', 'Orange']
        };

        const polarOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 14,
                        color: textColor,
                        padding: 10,
                    },
                }
            },
            scales: {
                r: {
                    grid: {
                        color: surfaceBorder
                    }
                }
            },
            layout: {
                // padding: 10 // add some padding to the layout
              }
        };

        const radarData = {
            labels: ['Eating', 'Drinking', 'Sleeping', 'Designing', 'Coding', 'Cycling', 'Running'],
            datasets: [
                {
                    label: 'My First dataset',
                    borderColor: "#5c6bc0",
                    pointBackgroundColor: "#5c6bc0",
                    pointBorderColor: "#5c6bc0",
                    pointHoverBackgroundColor: textColor,
                    pointHoverBorderColor: "#5c6bc0",
                    data: [65, 59, 90, 81, 56, 55, 40]
                },
                {
                    label: 'My Second dataset',
                    borderColor: "#7e57c2",
                    pointBackgroundColor: "#7e57c2",
                    pointBorderColor: "#7e57c2",
                    pointHoverBackgroundColor: textColor,
                    pointHoverBorderColor: "#7e57c2",
                    data: [28, 48, 40, 19, 96, 27, 100]
                }
            ]
        };

        const radarOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 14,
                        color: textColor,
                        padding: 10
                    }
                }
            },
            scales: {
                r: {
                    grid: {
                        //color: textColorSecondary
                    }
                }
            }
        };

        const stackData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
                {
                    type: 'bar',
                    label: 'Dataset 1',
                    backgroundColor: documentStyle.getPropertyValue('--blue-500'),
                    data: [50, 25, 12, 48, 90, 76, 42]
                },
                {
                    type: 'bar',
                    label: 'Dataset 2',
                    backgroundColor: documentStyle.getPropertyValue('--green-500'),
                    data: [21, 84, 24, 75, 37, 65, 34]
                },
                {
                    type: 'bar',
                    label: 'Dataset 3',
                    backgroundColor: documentStyle.getPropertyValue('--yellow-500'),
                    data: [41, 52, 24, 74, 23, 21, 32]
                }
            ]
        };

        const doughnutOptions = {
            cutout: '65%',
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 14,
                        color: textColor,
                        paddingBottom: 200
                    }
                }
            },         
        };

        const stackOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    labels: {
                        boxWidth: 14,
                        color: textColor,
                        paddingBottom: 100
                    }
                }
            },
            scales: {
                x: {
                    // display: false,
                    stacked: true,
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                        // display: false,
                    },
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                }
            }
        };

        const mixData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
                {
                    type: 'line',
                    label: 'Dataset 1',
                    borderColor: documentStyle.getPropertyValue('--blue-500'),
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    data: [50, 25, 12, 48, 56, 76, 42]
                },
                {
                    type: 'bar',
                    label: 'Dataset 2',
                    backgroundColor: documentStyle.getPropertyValue('--green-500'),
                    data: [21, 84, 24, 75, 37, 65, 34],
                    borderColor: 'white',
                    borderWidth: 2
                },
                {
                    type: 'bar',
                    label: 'Dataset 3',
                    backgroundColor: documentStyle.getPropertyValue('--orange-500'),
                    data: [41, 52, 24, 74, 23, 21, 32]
                }
            ]
        };

        const mixOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 14,
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                }
            }
        };
        

        const horizontarBarOptions = {
            indexAxis: 'y',
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 14,
                        fontColor: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    },

                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };

        const chData = { labels: labels??[], datasets: datasets??[] };
        const chOptions = type=="bar" ? barOptions :
                          type=="pie" ? pieOptions :
                          type=="line" ? lineOptions : 
                          type=="polarArea" ? polarOptions : 
                          type=="radar" ? radarOptions : 
                          type=="stack" ? stackOptions : 
                          type=="horizontal_bar" ? horizontarBarOptions : 
                          type=="doughnut" ? doughnutOptions : 
                          type=="mix" ? mixOptions : barOptions;

        setOptions({
            chOptions,
            // barOptions,
            // pieOptions,
            // lineOptions,
            // polarOptions,
            // radarOptions,
            // stackOptions,
            // mixOptions
        });
        setChartData({
            chData,
            // barData,
            // pieData,
            // lineData,
            // polarData,
            // radarData,
            // stackData,
            // mixData
        });
        // setChData(chData)
    }, [width, datasets, labels]);

    const chartRef = useRef()
    
    return (
        <div className={`${card ? "rounded-md border-2 p-1" : "rounded-md border p-1"} h-full`}>
            {/* bar chart data */}
            {card && 
              <Card className="h-full">
                <div className={`h-full`}>
                {(title || subtitle) && 
                    <div className="border-b py-3 pl-4">
                        <div className="font-bold text-xl truncate" style={{color: theme?.palette?.primary?.main}}>{title}</div>
                        <div className="text-md truncate" style={{color: theme?.palette?.secondary?.main}}>{subtitle}</div>
                    </div>}
                    <div className="p-3 h-full flex flex-col">
                      <Chart ref={chartRef} type={chType??"bar"} data={chartData?.chData} options={options?.chOptions} height={""} className="flex-1" style={{maxHeight: 400}}></Chart>
                    </div>
                </div>
              </Card>
            }
            {!card && 
                <div className={`h-full`}>
                    {(title || subtitle) && 
                    <div className="border-b py-3 pl-4">
                        <p className="font-bold text-xl truncate" style={{color: theme?.palette?.primary?.main}}>{title}</p>
                        <p className="text-md truncate" style={{color: theme?.palette?.secondary?.main}}>{subtitle}</p>
                    </div>}
                    <div className="p-3">
                        <Chart ref={chartRef} type={chType??"bar"} data={chartData?.chData} options={options?.chOptions}></Chart>
                    </div>
                </div>
            }
            
        </div>
    )
}

export const DashboardStatistics = ({chart, style="default", card=false, width}) => {

    const theme = useTheme();
    const titleColor = chart?.titleColor;
    const subTitleColor = chart?.subtitleColor;
    const backgroundColor = chart?.backgroundColor;
    const semiDark = (backgroundColor && subTitleColor && titleColor) ? true : false;
    const borderRadius = chart?.borderRadius;
    const color = chart?.color ? theme?.palette?.primary?.main : theme?.palette?.secondary?.main
    return (
        <div className={`${card ? (("p-1"+!semiDark ? " border-2" : "")+(borderRadius ? "" : " rounded-md")) : "rounded-md borderf p-1f"} h-full`} style={semiDark ? {backgroundColor: backgroundColor, borderRadius: borderRadius && card ? borderRadius : ""}: {borderRadius: borderRadius && card ? borderRadius : ""}}>
            {/* bar chart data */}
            {card && 
              <Card className="h-ful"  style={semiDark ? {backgroundColor: backgroundColor}: {}}>
                {(chart?.title || chart?.subtitle) && 
                    <div className={`flex gap-2 pt-2 pb-2 pl-3 ${!semiDark ? "border-b" : ""}`}>
                        {chart?.icon && <div className={chart?.color ? "" : ""} style={{paddingTop: 3, color: semiDark ? titleColor : color}}>{chart?.icon}</div>}
                        <div className="">
                            <div className="font-bold text-lg truncate" style={{color: semiDark ? titleColor : color}}>{chart?.title}</div>
                            <div className="text-sm truncate" style={{color: semiDark ? subTitleColor : theme?.palette?.secondary?.main}}>{chart?.subtitle}</div>
                        </div>
                    </div>}
                <div className="p-3 h-full">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        {chart?.items?.map((item, index)=>{
                            return item?.component ? (
                                <div className={`flex-1 p-3 h-full rounded-md hover:cursor-pointer ${!semiDark ? "border-2" : ""}`} key={index}  onClick={item?.onClick && item?.onClick}>
                                    {item?.component(item, index, titleColor, subTitleColor, semiDark)}
                                </div>
                            ):(
                            <div className={`flex flex-1 justify-between h-full gap-2 p-3 rounded-md ${!semiDark ? "border-2" : ""}`} key={index}>
                                <div className="flex flex-col hover:cursor-pointer" onClick={item?.onClick && item?.onClick}>
                                    <p className="font-bold text-xl truncate" style={{color: semiDark ? titleColor : theme?.palette?.primary?.main}}>{item?.title}</p>
                                    <p className="text-md truncate" style={{color: semiDark ? subTitleColor : theme?.palette?.secondary?.main}}>{item?.subtitle}</p>
                                </div>
                                <div className="opacity-70" style={{color: semiDark ? titleColor : color}}>{item?.icon}</div>
                            </div>
                            )
                        })}
                       
                    </div>
                </div>
              </Card>
            }
            {!card && 
            <div className={card ? "p-3 h-full": "h-full"}>
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    {chart?.items?.map((item, index)=>{
                        return item?.component ? (
                            <div className={`flex-1 p-3 h-full rounded-md hover:cursor-pointer  ${!semiDark ? "border-2" : ""}`} key={index} onClick={item?.onClick && item?.onClick}>
                                {item?.component(item, index, titleColor, subTitleColor, semiDark)}
                            </div>
                        ):(
                        <div className={`flex flex-1 justify-between h-full gap-2 p-3 rounded-md  ${!semiDark ? "border-2" : ""}`} key={index}>
                            <div className="flex flex-col hover:cursor-pointer" onClick={item?.onClick && item?.onClick}>
                                <p className="font-bold text-xl truncate" style={{color: semiDark ? titleColor : theme?.palette?.primary?.main}}>{item?.title}</p>
                                <p className="text-md truncate" style={{color: semiDark ? subTitleColor : theme?.palette?.secondary?.main}}>{item?.subtitle}</p>
                            </div>
                            <div className="opacity-70" style={{color: semiDark ? titleColor : color}}>{item?.icon}</div>
                        </div>
                        )
                    })}
                   
                </div>
            </div>
            }
            
        </div>
    )
}

export const DashboardShortcut = ({chart, style="default", card=false, width}) => {

    const theme = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
    const [show, setShow] = useState({
        show: false,
        component: <></>
    })

    const [overlayComponent, setOverlaycomponent] = useState()
    const opRef = useRef();

    return (
        <div className={`${card ? "rounded-md border-2 p-1" : "rounded-md border p-1"} h-full`}>
            {/* bar chart data */}
            {card && 
              <Card className="h-full">
                {(chart?.title || chart?.subtitle) && 
                    <div className="flex gap-2 border-b pt-2 pb-2 pl-3">
                        {chart?.icon && <div className={chart?.color ? "" : ""} style={{paddingTop: 3, color: chart?.color ? theme?.palette?.primary?.main : theme?.palette?.secondary?.main}}>{chart?.icon}</div>}
                        <div className="">
                            <p className="font-bold text-lg truncate" style={{color: chart?.color ? theme?.palette?.primary?.main : theme?.palette?.secondary?.main}}>{chart?.title}</p>
                            <p className="text-sm truncate" style={{color: theme?.palette?.secondary?.main}}>{chart?.subtitle}</p>
                        </div>
                    </div>}
                <div className="p-3">
                  
                    <div className="flex flex-wrap h-full  gap-3 items-centerf">
                        {chart?.items?.map((item, index)=>{
                            return item?.component ? (
                                <div 
                                  className="hover:cursor-pointer p-3 h-full rounded-md" key={index}
                                  onClick={(e)=>{
                                    if(item?.onClick) {
                                        item?.onClick();
                                    } else if(item?.modalComponent) {
                                        if(item?.type == "modal") {
                                            setShow((prev)=>({
                                                show: true,
                                                component: item?.modalComponent
                                            }))
                                            dispatch(
                                                showDialog({
                                                  header: item?.header??"",
                                                  openDialog: true,
                                                  fullScreen: item?.fullScreen ? true : false
                                                })
                                            );
                                        } else if(item?.type == "overlay") {
                                          setOverlaycomponent(item?.modalComponent)
                                          opRef?.current?.show(e)
                                        } else if(item?.type == "link" && item?.link) {
                                            navigate(item?.link)
                                        }
                                    }
                                  }}
                                >
                                    {item?.component}
                                </div>
                            ):(
                            <div
                              className="flex flex-col justify-center items-center h-full gap-2 hover:cursor-pointer" key={index}
                              onClick={(e)=>{
                                if(item?.onClick) {
                                    item?.onClick();
                                } else if(item?.modalComponent) {
                                    if(item?.type == "modal") {
                                        setShow((prev)=>({
                                            show: true,
                                            component: item?.modalComponent
                                        }))
                                        dispatch(
                                            showDialog({
                                              header: item?.header??"",
                                              openDialog: true,
                                              fullScreen: item?.fullScreen ? true : false
                                            })
                                        );
                                    } else if(item?.type == "overlay") {
                                      setOverlaycomponent(item?.modalComponent)
                                      opRef?.current?.show(e)
                                    } else if(item?.type == "link" && item?.link) {
                                        navigate(item?.link)
                                    }
                                }
                              }}
                            >
                                <div className="opacity-70 w-fit border p-3 rounded-full flex items-center justify-center" style={{borderColor: chart?.color ? theme?.palette?.primary?.main : ""}}>{item?.icon}</div>
                                <Tooltip title={item?.title}><p className="font-bold text-md text-center truncate" style={{color: chart?.color ? theme?.palette?.primary?.main : theme?.palette?.secondary?.main, maxWidth: 100}}>{item?.title}</p></Tooltip>
                            </div>
                            )
                        })}
                       
                    </div>
                </div>
              </Card>
            }
            {!card && 
            <div className={"h-full"}>
                {(chart?.title || chart?.subtitle) && 
                    <div className="flex gap-2 border-b pt-2 pb-2 pl-3">
                        {chart?.icon && <div className={chart?.color ? "" : ""} style={{paddingTop: 3, color: chart?.color ? theme?.palette?.primary?.main : theme?.palette?.secondary?.main}}>{chart?.icon}</div>}
                        <div className="">
                            <p className="font-bold text-lg truncate" style={{color: chart?.color ? theme?.palette?.primary?.main : theme?.palette?.secondary?.main}}>{chart?.title}</p>
                            <p className="text-sm truncate" style={{color: theme?.palette?.secondary?.main}}>{chart?.subtitle}</p>
                        </div>
                    </div>}
                <div className="flex p-3  flex-wrap gap-3 items-center">
                       {chart?.items?.map((item, index)=>{
                            return item?.component ? (
                                <div 
                                  className="p-3 h-full rounded-md" key={index}
                                  onClick={(e)=>{
                                    if(item?.onClick) {
                                        item?.onClick();
                                    } else if(item?.modalComponent) {
                                        if(item?.type == "modal") {
                                            setShow((prev)=>({
                                                show: true,
                                                component: item?.modalComponent
                                            }))
                                            dispatch(
                                                showDialog({
                                                  header: item?.header??"",
                                                  openDialog: true,
                                                  fullScreen: item?.fullScreen ? true : false
                                                })
                                            );
                                        } else if(item?.type == "overlay") {
                                          setOverlaycomponent(item?.modalComponent)
                                          opRef?.current?.show(e)
                                        } else if(item?.type == "link" && item?.link) {
                                            navigate(item?.link)
                                        }
                                    }
                                  }}
                                >
                                    {item?.component}
                                </div>
                            ):(
                            <div 
                              onClick={(e)=>{
                                if(item?.onClick) {
                                    item?.onClick();
                                } else if(item?.modalComponent) {
                                    if(item?.type == "modal") {
                                        setShow((prev)=>({
                                            show: true,
                                            component: item?.modalComponent
                                        }))
                                        dispatch(
                                            showDialog({
                                              header: item?.header??"",
                                              openDialog: true,
                                              fullScreen: item?.fullScreen ? true : false
                                            })
                                        );
                                    } else if(item?.type == "overlay") {
                                      setOverlaycomponent(item?.modalComponent)
                                      opRef?.current?.show(e)
                                    } else if(item?.type == "link" && item?.link) {
                                        navigate(item?.link)
                                    }
                                }
                              }}
                              className="flex flex-col justify-center items-center h-full gap-2 hover:cursor-pointer" key={index}
                            >
                                <div className="opacity-70 w-fit border p-3 rounded-full flex items-center justify-center" style={{borderColor: chart?.color ? theme?.palette?.primary?.main : ""}}>{item?.icon}</div>
                                <Tooltip title={item?.title}><p className="font-bold text-md truncate" style={{color: chart?.color ? theme?.palette?.primary?.main : theme?.palette?.secondary?.main, maxWidth: 100}}>{item?.title}</p></Tooltip>
                            </div>
                            )
                        })}
                   
                </div>
            </div>
            }

            {(show?.show && show?.component) && !disableDataTableWindows &&
            <DialogOverlay baseIndex={0}>
                {show?.show && show?.component}
            </DialogOverlay>}
            <OverlayPanel ref={opRef} showCloseIcon>
                {overlayComponent}
            </OverlayPanel>
        </div>
    )
}
