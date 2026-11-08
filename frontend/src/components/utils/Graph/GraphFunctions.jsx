import { DashboardShortcut, DashboardStatistics, GetChart } from "./GraphComponents";
import { useWindowWidth } from "../CrudComponents/UtilityFunctions";
import tinycolor from "tinycolor2";

const getDateLabels = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateLabels = [];
  const labelCoverage = [];

  const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const monthsDifference = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();

  function getWeekOfMonth(date) {
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 15) return 2;
    if (day <= 22) return 3;
    return 4; // For days 23 and beyond
  }

  if (monthsDifference > 24) {
    // Use years
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
      const label = year.toString();
      dateLabels.push(label);
      labelCoverage.push({
        key: label,
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31),
      });
    }
  } else if (monthsDifference > 3) {
    // Use months with year for the first month of each year
    let current = new Date(start);
    while (current <= end) {
      const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
      const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0); // Last day of the month
  
      let label;
      if (current.getMonth() === 0 || current.getTime() === start.getTime()) {
        label = current.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else {
        label = current.toLocaleString('default', { month: 'short' });
      }
  
      dateLabels.push(label);
      labelCoverage.push({
        key: label,
        start: startOfMonth,
        end: endOfMonth,
      });
  
      // Move to the next month
      current.setMonth(current.getMonth() + 1);
  
      // Ensure that we cover the end date's month
      if (current.getFullYear() === end.getFullYear() && current.getMonth() > end.getMonth()) {
        break;
      }
    }
  
    // Add the end date's month if not already included
    const lastLabel = dateLabels[dateLabels.length - 1];
    const lastLabelMonth = new Date(labelCoverage[labelCoverage.length - 1].end).getMonth();
    if (end.getMonth() !== lastLabelMonth || end.getFullYear() !== new Date(labelCoverage[labelCoverage.length - 1].end).getFullYear()) {
      const endMonthLabel = end.toLocaleString('default', { month: 'short' });
      dateLabels.push(endMonthLabel);
      labelCoverage.push({
        key: endMonthLabel,
        start: new Date(end.getFullYear(), end.getMonth(), 1),
        end: new Date(end.getFullYear(), end.getMonth() + 1, 0),
      });
    }
  } else if (monthsDifference <= 3 && monthsDifference > 0) {
    // Use weeks with year and month for the first week of each month
    let current = new Date(start);
    while (current <= end) {
      const weekOfMonth = getWeekOfMonth(current);
      const startOfWeek = new Date(current); // Week starts from current date
      let endOfWeek;

      // Determine the end of the week based on the week of the month
      if (weekOfMonth === 1) {
        endOfWeek = new Date(current.getFullYear(), current.getMonth(), 7);
      } else if (weekOfMonth === 2) {
        endOfWeek = new Date(current.getFullYear(), current.getMonth(), 15);
      } else if (weekOfMonth === 3) {
        endOfWeek = new Date(current.getFullYear(), current.getMonth(), 22);
      } else {
        endOfWeek = new Date(current.getFullYear(), current.getMonth() + 1, 0); // Last day of the month
      }

      let label;
      if (weekOfMonth === 1 || (current.getTime() === start.getTime() && getWeekOfMonth(start) === 1)) {
        label = `${current.toLocaleString('default', { month: 'short', year: 'numeric' })} - Week ${weekOfMonth}`;
      } else {
        label = `Week ${weekOfMonth}`;
      }

      dateLabels.push(label);
      labelCoverage.push({
        key: label,
        start: startOfWeek,
        end: endOfWeek,
      });

      // Move to the next week boundary
      if (weekOfMonth === 1) {
        current.setDate(8); // Move to the 8th day of the month
      } else if (weekOfMonth === 2) {
        current.setDate(16); // Move to the 16th day of the month
      } else if (weekOfMonth === 3) {
        current.setDate(23); // Move to the 23rd day of the month
      } else {
        // Move to the next month
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
      }
    }
  } else if (daysDifference <= 31) {
    // Use days with year and month for the first day of each month
    let current = new Date(start);
    while (current <= end) {
      let label;
      const startOfDay = new Date(current);
      const endOfDay = new Date(current);

      if (current.getDate() === 1 || current.getTime() === start.getTime()) {
        label = `${current.toLocaleString('default', { month: 'short', year: 'numeric' })} - ${current.getDate()}`;
      } else {
        label = current.getDate().toString();
      }

      dateLabels.push(label);
      labelCoverage.push({
        key: label,
        start: startOfDay,
        end: endOfDay,
      });

      current.setDate(current.getDate() + 1);
    }
  }

  return { dateLabels, labelCoverage };
};

const getLabelForDate = (date, labelCoverage) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0); // Ensure target date is at the start of the day

  // Iterate through the labelCoverage array
  for (let i = 0; i < labelCoverage.length; i++) {
    const { key, start, end } = labelCoverage[i];

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0); // Ensure start date is at the start of the day
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // Ensure end date is at the end of the day

    // Check if the targetDate is within the range (inclusive of start and end)
    if (targetDate >= startDate && targetDate <= endDate) {
      return {key, index: i};
    }

    // Check for single-day ranges where start and end are the same
    if (startDate.getTime() === endDate.getTime() && targetDate.getTime() === startDate.getTime()) {
      return {key, index};
    }
  }

  return null; // Return null if no matching label is found
};

function getHoverColor(backgroundColor) {
  var color = tinycolor(backgroundColor);
  if (color.isValid()) {
    return color.darken(10).toString();
  } else {
    return null;
  }
}

function reduceOpacity(colorValue, opacity) {
  let color = tinycolor(colorValue);
  if (color.isValid()) {
    return color.setAlpha(opacity).toString();
  } else {
    return null;
  }
}

function getMonthsBetween(date1, date2) {
  let yearDiff = date2.getFullYear() - date1.getFullYear();
  let monthDiff = date2.getMonth() - date1.getMonth();
  return yearDiff * 12 + monthDiff;
}

function getAllData(mData, routeStates, chart,  labelType, labelField, parentType, md) {
 
  const {
    type = "bar",
    labelText = "",
    groupBy = "routeState",
    groupField = "routeState",
    colorField = "color",
    dataLabel =  "",
    mainData=[],
    backgroundColor="",
    hoverBackgroundColor="",
    maxBarTickness=15,
    barThickness="",
    borderRadius=50,
    borderColor="",
    fill = false,
    tension = 0.4,
    groupItems = []
} = chart;
  let tickness = 0
  let bRadius = 0
  let lineTension = tension;
  let bTickness = barThickness;
  
  if(type=="bar" || parentType=="stack" || parentType=="mix") {
    tickness = maxBarTickness??20;
    bRadius = borderRadius??50;
  }
  if(parentType=="stack" || parentType=="bar") {
    bTickness = tickness;
  }
  if(type=="line" || parentType=="line") {
    lineTension = tension;
  }
  const data = mainData?.length > 0 ? mainData : mData
  // Initialize an empty object to store the result
  let result = {label: [], data: []};

  if(labelType=="routeState") {
    let datasets = {type: type, label: labelText, backgroundColor: ((type=="line" || parentType=="line") && backgroundColor != "") ? reduceOpacity(backgroundColor, 0.2) : (backgroundColor ?? ""), data: [], maxBarTickness: tickness, borderRadius: bRadius, borderColor: borderColor ? borderColor : backgroundColor, tension: lineTension, fill: fill}
    if(backgroundColor != "") {
      datasets.hoverBackgroundColor = hoverBackgroundColor ? hoverBackgroundColor : getHoverColor(backgroundColor)
    }
    if(parentType=="stack" || (parentType=="bar" && bTickness > 0)) {
      datasets.maxBarThickness = bTickness;
    }
    let bgs = [];
    let hoverBgs = [];
    for (let state of routeStates) {
      result.label.push(state?.header);
      if(state[colorField] && (parentType=="doughnut" || parentType=="pie" || parentType=="polarArea")) {
        bgs.push(state[colorField]);
        hoverBgs.push(getHoverColor(state[colorField], 0.2));
      }
      let count = 0;
      for (let item of data) {
        if (item[labelField] == state?.label) {
          if(dataLabel) {
            count = count + item[dataLabel]??0
          } else {
            count++;
          }
        }
      }
      datasets.data.push(count)
      if(bgs?.length > 0) {
        datasets.backgroundColor = bgs;
        datasets.hoverBackgroundColor = hoverBgs;
        datasets.borderWidth = 0.2;
      }
    }
    result.data.push(datasets);
  } else if(labelType=="date") {
    let minDate = new Date(Math.min(...data.map(item => Date.parse(item[labelField]))));
    let maxDate = new Date(Math.max(...data.map(item => Date.parse(item[labelField]))));
    const  { dateLabels, labelCoverage } = getDateLabels(minDate, maxDate);
    result.label = dateLabels
    // let months = getMonthsBetween(minDate, maxDate);

    // for (let i = 0; i <= months; i++) {
    //   let date = new Date(minDate.getFullYear(), minDate.getMonth() + i);
    //   let label = date.toLocaleString("default", {month: "long"}) + " " + date.getFullYear();
    //   result.label.push(label);
    // }

    let dts = []
    let datasets = {}
    let tempData = {}
    result.label?.map((label, ind)=>{
      let count = 0;
      for (let item of data) {
        let date = new Date(item[labelField]);
        const labelForDate = getLabelForDate(date, labelCoverage);
        if(!labelForDate) {
          return;
        }
        const {key: itemLabel, index} = labelForDate
        // let itemLabel = date.toLocaleString("default", {month: "long"}) + " " + date.getFullYear();
        if (ind == index) {
          if(!groupBy) {
            if(dataLabel) {
              count = count + item[dataLabel]??0
            } else {
              count++;
            }
          } else {
              let label = item[groupField];
              if(!tempData[itemLabel+"_"+index]) {
                tempData[itemLabel+"_"+index] = {}
              }
              if(dataLabel) {
                // tempData = {...tempData, [label]: ((tempData[label]??0) + item[dataLabel]) }
                tempData[itemLabel+"_"+index][label] = (tempData[itemLabel+"_"+index][label]??0) + item[dataLabel]
              } else {
                // tempData = {...tempData, [label]: ((tempData[label]??0) + 1) }
                tempData[itemLabel+"_"+index][label] = (tempData[itemLabel+"_"+index][label]??0) + 1
              }
          }
        }
      }
      
      if(!groupBy) {
        dts.push(count)
      } else {
        let tempD = tempData[label+"_"+ind] ? tempData[label+"_"+ind] : {}
        if(groupBy=="routeState") {
          routeStates?.map((routeState)=>{
            const lbl = routeState?.label
            if(!datasets[lbl]) {
              datasets[lbl] = []
            }
            if(tempD[lbl]) {
              datasets[lbl].push(tempD[lbl])     //datasets = {not_started: [0,1,4,2,..], running: [3,2,3,...],...}
            } else {
              datasets[lbl].push(0)
            }
          })
        } else if(groupBy=="relation") {

        } else if(groupBy=="field") {

        }
      }
    })
    
    if(!groupBy) {
      let dataset = {}
      dataset.label = labelText;
      dataset.type = type;
      dataset.data = dts;
      dataset.backgroundColor = ((type=="line" || parentType=="line") && backgroundColor != "") ? reduceOpacity(backgroundColor, 0.2) : (backgroundColor ?? "");
      if(backgroundColor != "") {
        dataset.hoverBackgroundColor = hoverBackgroundColor ? hoverBackgroundColor : getHoverColor(backgroundColor)
      }
      dataset.maxBarTickness = tickness;
      dataset.borderRadius = bRadius;
      dataset.borderColor = borderColor ? borderColor : backgroundColor;
      dataset.tension = lineTension;
      dataset.fill = fill;
      if(parentType=="stack" || (parentType=="bar" && bTickness > 0)) {
         dataset.maxBarThickness = bTickness;
      }
      result.data.push(dataset);
    } else if(groupBy=="routeState") {
      let dats = []
      routeStates?.map((routeState)=>{
        let temp = {type: type, label: routeState?.header, backgroundColor: ((type=="line" || parentType=="line") && (routeState?.color != "")) ? reduceOpacity(routeState?.color, 0.2) : (routeState?.color ?? ""), borderColor: borderColor ? borderColor : routeState?.color, data: datasets[routeState?.label]??[], maxBarTickness: tickness, borderRadius: bRadius, tension: lineTension, fill: fill }
        if(routeState?.color) {
          temp.hoverBackgroundColor = getHoverColor(routeState?.color)
        } 
        if(parentType=="stack") {
          temp.barThickness = bTickness;
        }
        // temp.barPercentage = 0.5;
        dats.push(temp)
      })
      result.data = dats
    } else if(groupBy=="field") {

    }
  } else if(labelType=="field") {
    let datasets = {type: type, label: labelText, backgroundColor: ((type=="line" || parentType=="line") && backgroundColor != "") ? reduceOpacity(backgroundColor, 0.2) : (backgroundColor ?? ""), data: [], maxBarTickness: tickness, borderRadius: bRadius, borderColor: borderColor ? borderColor : backgroundColor, tension: lineTension, fill: fill}
    if(backgroundColor != "") {
      datasets.hoverBackgroundColor = hoverBackgroundColor ? hoverBackgroundColor : getHoverColor(backgroundColor)
    }
    if(parentType=="stack" || (parentType=="bar" && bTickness > 0)) {
      datasets.maxBarThickness = bTickness;
    }
    let bgs = [];
    let hoverBgs = [];
    for (let state of data) {
      result.label.push(state[labelField]);
      if(state[colorField] && (parentType=="doughnut" || parentType=="pie" || parentType=="polarArea")) {
        bgs.push(state[colorField]);
        hoverBgs.push(getHoverColor(state[colorField], 0.2));
      }
      let count = state[dataLabel]??0;
      // for (let item of data) {
      //   if (item[dataLabel]) {
      //     if(dataLabel) {
      //       count = count + item[dataLabel]??0
      //     } else {
      //       count++;
      //     }
      //   }
      // }

      datasets.data.push(count)
      if(bgs?.length > 0) {
        datasets.backgroundColor = bgs;
        datasets.hoverBackgroundColor = hoverBgs;
        datasets.borderWidth = 0.2;
      }
    }
    result.data.push(datasets);
  }
  
  return result;
}

function getDatas(data, routeStates, groupBy, groupField, md, dataLabel) {
  let result = [];

  if (groupBy === "routeState") {
    // Loop through the routeStates array and count the number of data items that match each field
    for (let state of routeStates) {
      let count = 0;
      let backgroundColor = state?.color
      for (let item of data) {
        if (item[groupField] === state?.label) {
          if(dataLabel) {
            count + item[dataLabel]??0
          } else {
            count++;
          }
        }
      }
      // Push the field and the count to the result arrays
      result.label.push(state?.label);
      result.data.push(count);
    }
  } else if (groupBy === "date") {
    // Convert the date strings to Date objects and find the minimum and maximum dates
    let minDate = new Date(Math.min(...data.map(item => Date.parse(item[groupField]))));
    let maxDate = new Date(Math.max(...data.map(item => Date.parse(item[groupField]))));

    // Create a helper function to get the number of months between two dates


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
          if(dataLabel) {
            count + item[dataLabel]??0
          } else {
            count++;
          }
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
          if(dataLabel) {
            count + (item[dataLabel] || 0)
          } else {
            count++;
          }
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
 

  // Call the helper function to format the date labels for the result object
  result.label = formatDateLabels(result.label);

  // Return the result object
  return result;
}

export const GetCharts = ({chart, mainData=[], routeStates=[]}) => {
   const width = useWindowWidth();
   let labels = [];
   let datasets = [];
   const type = chart?.type;
   let componentType = "chart";

   if(type=="bar" || type=="pie" || type=="line" || type=="polarArea" || type=="radar" || type=="stack" || type=="horizontal_bar" || type=="doughnut" || type=="mix") {
      chart?.charts?.map((ch, index)=>{
        const {label, data} = getAllData(chart?.data || mainData, routeStates, ch,  chart?.labelType, chart?.labelField, chart?.type, width < 800)
        if(index == 0) {
          labels =  label
        }
        datasets = [...datasets, ...data]
      })
   } else if(type=="custom") {
     componentType = "custom";
   } else if(type=="count") {
     componentType = "count";
   } else if(type=="shortcut") {
     componentType = "shortcut"
   }

   
    // const {data, label} = getBaseData(mainData, [], "date", "date", width < 800);
    // console.log(getAllData(mainData, routeStates, chart?.charts[0],  chart?.labelType, chart?.labelField, width < 800))
    // getAllData(mainData, routeStates, chart?.charts[0],  chart?.labelType, chart?.labelField, width < 800)
    return (
        <div className="overflow-x-auto h-full">
          {componentType == "chart" &&
          <GetChart
            // labels={label}
            // datas={data}
            title={chart?.title}
            subtitle={chart?.subtitle}
            labels={labels}
            datasets={datasets}
            type={chart?.type}
            width={width}
            card={chart?.card??true}
          />}
          {componentType == "count" && 
            <DashboardStatistics
              chart={chart}
              card={chart?.card??true}
            />
          }
          {componentType=="shortcut" &&
            <DashboardShortcut
              chart={chart}
              card={chart?.card??true}
            />
          }
        </div>
    )
}