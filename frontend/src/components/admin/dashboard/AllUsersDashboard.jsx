import { Grid } from '@mui/material';
import { Chart } from 'primereact/chart';
import React, { useContext, useEffect, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const ChartDemo = () => {
    const [options, setOptions] = useState({});
    const [data, setChartData] = useState({});

    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.down('xs'));
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const md = useMediaQuery(theme.breakpoints.down('md'));
    const lg = useMediaQuery(theme.breakpoints.down('lg'));
    const xl = useMediaQuery(theme.breakpoints.down('xl'));
    
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
                    data: [65, 59, 80, 81, 56, 55, 40]
                },
                {
                    label: 'My Second dataset',
                    backgroundColor: "#acb4df",
                    borderColor: "#acb4df",
                    data: [28, 48, 40, 19, 86, 27, 90]
                }
            ]
        };

        const barOptions = {
            plugins: {
                legend: {
                    labels: {
                        //fontColor: textColor
                    }
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
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        //color: textColor
                    }
                }
            }
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
            plugins: {
                legend: {
                    labels: {
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
                        color: surfaceBorder,
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
            plugins: {
                legend: {
                    labels: {
                        //color: textColor
                    }
                }
            },
            scales: {
                r: {
                    grid: {
                        color: surfaceBorder
                    }
                }
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
            plugins: {
                legend: {
                    labels: {
                        //fontColor: textColor
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

        setOptions({
            barOptions,
            pieOptions,
            lineOptions,
            polarOptions,
            radarOptions
        });
        setChartData({
            barData,
            pieData,
            lineData,
            polarData,
            radarData
        });
    }, [xs,sm,md,lg,xl]);

    return (
        <Grid container spacing={4}>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                <div className="card">
                    <h5>Linear Chart</h5>
                    <Chart type="line" data={data.lineData} options={options.lineOptions}></Chart>
                </div>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                <div className="card">
                    <h5>Bar Chart</h5>
                    <Chart type="bar" data={data.barData} options={options.barOptions}></Chart>
                </div>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                <div className="card flex flex-column align-items-center">
                    <h5 className="text-left w-full">Pie Chart</h5>
                    <Chart type="pie" data={data.pieData} options={options.pieOptions}></Chart>
                </div>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                <div className="card flex flex-column align-items-center">
                    <h5 className="text-left w-full">Doughnut Chart</h5>
                    <Chart type="doughnut" data={data.pieData} options={options.pieOptions}></Chart>
                </div>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                <div className="card flex flex-column align-items-center">
                    <h5 className="text-left w-full">Polar Area Chart</h5>
                    <Chart type="polarArea" data={data.polarData} options={options.polarOptions}></Chart>
                </div>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                <div className="card flex flex-column align-items-center">
                    <h5 className="text-left w-full">Radar Chart</h5>
                    <Chart type="radar" data={data.radarData} options={options.radarOptions}></Chart>
                </div>
            </Grid>
          </Grid>
    );
};

export default ChartDemo;
