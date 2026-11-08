import { Grid } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { GetCharts } from './GraphFunctions';

const GraphOverlay = ({routeStates, chartData, data=[]}) => {
    
    const types = ["bar","bar_horizontal","line","stack","pie","doughnut","radar","polar","mix"]
    //charts = [{type: "mix", baseType: "routeState", baseField: "routeState", dataType: ""}]
    const theme = useTheme();
    
    function getMonthsBetween(date1, date2) {
        let yearDiff = date2.getFullYear() - date1.getFullYear();
        let monthDiff = date2.getMonth() - date1.getMonth();
        return yearDiff * 12 + monthDiff;
      }
  

    // Sample data array
    const data_temp = [
        {id: 1, number_field: 12, routeState: "not_started", date: "2022-12-15"},
        {id: 14, number_field: 12, routeState: "in_progress", date: "2022-12-15"},
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
    
    // Sample routeStates array
    const routeStates_temp = [
        {field: "not_started", header: "Not Started", color: "red"},
        {field: "running", header: "Running", color: "blue"},
        {field: "completed", header: "Completed", color: "green"}
    ];

    

    return (
        <div className='pb-4'>
            <Grid container spacing={4} justifyContent={chartData?.justifyContent}>
                {chartData?.items?.map((chart, index)=>{
                  if(chart?.hide) return;
                    return (
                        <Grid item key={index} {...chart?.grid} >
                            <GetCharts 
                              chart={chart}
                              mainData={data || data_temp /*data_temp*/}
                              routeStates={routeStates}
                            />
                        </Grid>
                    )
                })}
            </Grid>
        </div>
    )
    /*
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
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                <div className="card flex flex-column align-items-center">
                    <h5 className="text-left w-full">Stack Chart</h5>
                    <Chart type="bar" style={{width: '100%'}} data={data.stackData} options={options.stackOptions}></Chart>
                </div>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                <div className="card flex flex-column align-items-center">
                    <h5 className="text-left w-full">Combo Chart</h5>
                    <Chart type="line" style={{width: '100%'}} data={data.mixData} options={options.mixOptions}></Chart>
                </div>
            </Grid>
          </Grid>
    );
    */
};

export default GraphOverlay;




function getMonthsBetween(date1, date2) {
    let yearDiff = date2.getFullYear() - date1.getFullYear();
    let monthDiff = date2.getMonth() - date1.getMonth();
    return yearDiff * 12 + monthDiff;
  }


function getGraphData(data, routeStates, groupBy, groupField, md) {
    // Initialize an empty object to store the result
    let result = {label: [], data: []};
  
    // Check the groupBy value and handle different cases
    if (groupBy === "routeState") {
      // Loop through the routeStates array and count the number of data items that match each field
      for (let state of routeStates) {
        let count = 0;
        for (let item of data) {
          if (item[groupField] === state.field) {
            count++;
          }
        }
        // Push the field and the count to the result arrays
        result.label.push(state.field);
        result.data.push(count);
      }
    } else if (groupBy === "date") {
      // Convert the date strings to Date objects and find the minimum and maximum dates
      let minDate = new Date(Math.min(...data.map(item => Date.parse(item[groupField]))));
      let maxDate = new Date(Math.max(...data.map(item => Date.parse(item[groupField]))));
  
      
      // Get the number of months between the minimum and maximum dates
      let months = getMonthsBetween(minDate, maxDate);
  
      // Loop through the months and create labels in the format of "Month Year"
      for (let i = 0; i <= months; i++) {
        let date = new Date(minDate.getFullYear(), minDate.getMonth() + i);
        let label = date.toLocaleString("default", {month: "long"}) + " " + date.getFullYear();
        result.label.push(label);
      }
  
      // Loop through the data array and count the number of items that fall into each month
      for (let label of result.label) {
        let count = 0;
        for (let item of data) {
          let date = new Date(item[groupField]);
          let itemLabel = date.toLocaleString("default", {month: "long"}) + " " + date.getFullYear();
          if (itemLabel === label) {
            count++;
          }
        }
        // Push the count to the result data array
        result.data.push(count);
      }
    } else if (groupBy === "number") {
      // Loop through the data array and get the unique values of the groupField
      let values = [...new Set(data.map(item => item[groupField]))];
  
      // Sort the values in ascending order
      values.sort((a, b) => a - b);
  
      // Push the values to the result label array
      result.label = values;
  
      // Loop through the values and count the number of data items that match each value
      for (let value of values) {
        let count = 0;
        for (let item of data) {
          if (item[groupField] === value) {
            count++;
          }
        }
        // Push the count to the result data array
        result.data.push(count);
      }
    } else {
      // If the groupBy value is invalid, throw an error
      throw new Error("Invalid groupBy value");
    }
  
    // We also need to modify the date format for the labels to show only the month name for the dominant year, and the month name and the year for the other years
    // We also need to check if the total number of labels is more than 12, or if the md variable is true, then use the short form of the month name instead of the full name
    // We can create a helper function to format the date labels
    function formatDateLabels(labels) {
      // Initialize an empty array to store the formatted labels
      let formattedLabels = [];
  
      // Get the dominant year from the labels by finding the most frequent year
      let years = labels.map(label => label.split(" ")[1]); // Get the year part of each label
      let dominantYear = years.sort((a, b) => years.filter(v => v === a).length - years.filter(v => v === b).length).pop(); // Get the most frequent year
  
      // Loop through the labels and format them according to the dominant year and the md variable
      for (let label of labels) {
        let [month, year] = label.split(" "); // Get the month and year parts of each label
        if (year === dominantYear) {
          // If the year is the dominant year, omit the year part
          formattedLabels.push(month);
        } else {
          // If the year is not the dominant year, keep the year part
          formattedLabels.push(label);
        }
        if (labels.length > 12 || md) {
          // If the total number of labels is more than 12, or if the md variable is true, use the short form of the month name
          formattedLabels = formattedLabels.map(label => label.slice(0, 3)); // Slice the first three characters of each label
          if (year !== dominantYear) {
            // If the year is not the dominant year, add the year part after the short month name
            formattedLabels[formattedLabels.length - 1] = formattedLabels[formattedLabels.length - 1] + " " + year;
          }
        }
      }
      // Return the formatted labels array
      return formattedLabels;
    }
  
    // Call the helper function to format the date labels for the result object
    result.label = formatDateLabels(result.label);
  
    // Return the result object
    return result;
}

function getGraphData1(data, routeStates, groupBy, groupField, chartType, md) {
    // Initialize an empty object to store the result
    let result = {labels: [], datasets: []};
  
    // Check the chartType value and handle different cases
    if (chartType === "pie" || chartType === "doughnut") {
      // For pie or doughnut charts, we only need one dataset with the same groupBy and groupField as before
      // We can reuse the original function and assign the result to the first element of the datasets array
      result.datasets[0] = getGraphData(data, routeStates, groupBy, groupField);
  
      // We also need to add the backgroundColor and borderColor properties to the dataset object
      // We can loop through the routeStates array and get the color for each field
      result.datasets[0].backgroundColor = [];
      result.datasets[0].borderColor = [];
      for (let state of routeStates) {
        result.datasets[0].backgroundColor.push(state.color);
        result.datasets[0].borderColor.push(state.color);
      }
  
      // We also need to change the label property of the dataset object to use the header instead of the field
      // We can loop through the result label array and get the corresponding header from the routeStates array
      for (let i = 0; i < result.datasets[0].label.length; i++) {
        let field = result.datasets[0].label[i];
        let header = routeStates.find(state => state.field === field).header;
        result.datasets[0].label[i] = header;
      }
  
      // We can also add a label property to the dataset object to show the name of the data
      result.datasets[0].label = groupField;
    } else if (chartType === "line" || chartType === "bar" || chartType === "bar horizontal" || chartType === "stack") {
      // For line or bar charts, we need multiple datasets, one for each routeState
      // We can loop through the routeStates array and create a dataset object for each state
      for (let state of routeStates) {
        // Initialize an empty dataset object
        let dataset = {};
  
        // Assign the type, label, backgroundColor and borderColor properties to the dataset object
        dataset.type = chartType === "bar horizontal" ? "bar" : chartType; // Use "bar" as the type for bar horizontal charts
        dataset.label = state.header;
        dataset.backgroundColor = state.color;
        dataset.borderColor = state.color;
  
        // Initialize an empty data array for the dataset object
        dataset.data = [];
  
        // Loop through the data array and get the values of the groupField for each item that matches the state
        for (let item of data) {
          if (item.routeState === state.field) {
            dataset.data.push(item[groupField]);
          }
        }
  
        // Push the dataset object to the result datasets array
        result.datasets.push(dataset);
      }
  
      // We also need to create the labels array for the result object
      // We can use the original function and get the labels from the first dataset
      result.labels = getGraphData(data, routeStates, groupBy, groupField).label;
    } else if (chartType === "radar" || chartType === "polarArea") {
      // For radar or polarArea charts, we only need one dataset with the same groupBy and groupField as before
      // We can reuse the original function and assign the result to the first element of the datasets array
      result.datasets[0] = getGraphData(data, routeStates, groupBy, groupField);
  
      // We also need to add the backgroundColor and borderColor properties to the dataset object
      // We can loop through the routeStates array and get the color for each field
      result.datasets[0].backgroundColor = [];
      result.datasets[0].borderColor = [];
      for (let state of routeStates) {
        result.datasets[0].backgroundColor.push(state.color);
        result.datasets[0].borderColor.push(state.color);
      }
  
      // We also need to change the label property of the dataset object to use the header instead of the field
      // We can loop through the result label array and get the corresponding header from the routeStates array
      for (let i = 0; i < result.datasets[0].label.length; i++) {
        let field = result.datasets[0].label[i];
        let header = routeStates.find(state => state.field === field).header;
        result.datasets[0].label[i] = header;
      }
  
      // We can also add a label property to the dataset object to show the name of the data
      result.datasets[0].label = groupField;
  
      // We can also add some specific properties to the dataset object for radar and polarArea charts
      // For example, we can change the pointStyle and rotation properties to customize the shape and angle of the data points
      result.datasets[0].pointStyle = "star"; // Use star-shaped points
      result.datasets[0].rotation = 45; // Rotate the points by 45 degrees
    } else if (Array.isArray(chartType)) {
      // If the chartType is an array, we need to create a mix of different chart types in one graph
      // We can loop through the chartType array and call the function recursively for each chart type
      // We can then concatenate the datasets arrays and use the labels array from the first chart type
      for (let type of chartType) {
        let graphData = getGraphData(data, routeStates, groupBy, groupField, type);
        result.datasets = result.datasets.concat(graphData.datasets);
        if (result.labels.length === 0) {
          result.labels = graphData.labels;
        }
      }
    } else {
      // If the chartType value is invalid, throw an error
    }
  
    // We also need to modify the date format for the labels to show only the month name for the dominant year, and the month name and the year for the other years
    // We also need to check if the total number of labels is more than 12, or if the md variable is true, then use the short form of the month name instead of the full name
    // We can create a helper function to format the date labels
    function formatDateLabels(labels) {
      // Initialize an empty array to store the formatted labels
      let formattedLabels = [];
  
      // Get the dominant year from the labels by finding the most frequent year
      let years = labels?.map(label => label.split(" ")[1]); // Get the year part of each label
      let dominantYear = years.sort((a, b) => years.filter(v => v === a).length - years.filter(v => v === b).length).pop(); // Get the most frequent year
  
      // Loop through the labels and format them according to the dominant year and the md variable
      for (let label of labels) {
        let [month, year] = label.split(" "); // Get the month and year parts of each label
        if (year === dominantYear) {
          // If the year is the dominant year, omit the year part
          formattedLabels.push(month);
        } else {
          // If the year is not the dominant year, keep the year part
          formattedLabels.push(label);
        }
        if (labels.length > 12 || md) {
          // If the total number of labels is more than 12, or if the md variable is true, use the short form of the month name
          formattedLabels = formattedLabels.map(label => label.slice(0, 3)); // Slice the first three characters of each label
          if (year !== dominantYear) {
            // If the year is not the dominant year, add the year part after the short month name
            formattedLabels[formattedLabels.length - 1] = formattedLabels[formattedLabels.length - 1] + " " + year;
          }
        }
      }
      // Return the formatted labels array
      return formattedLabels;
    }
  
    // Call the helper function to format the date labels for the result object
    result.labels = formatDateLabels(result?.labels);
  
    // Return the result object
    return result;
}
