import React, { useState, useEffect } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { AiFillCloseCircle, AiOutlineSearch } from "react-icons/ai";
import { FaCircleCheck } from "react-icons/fa6";
import { useRef } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { DatePickerOverlay, RadioOverlay } from "../CrudComponents/InputsOverlay";
import { ButtonOverlay } from "../CrudComponents/ComponentsOverlay";
import { Tag } from "primereact/tag";
import {useTheme} from "@mui/material/styles";
import { InputAdornment, TextField } from "@mui/material";
import { MdClose } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { showDialog, showSidebar } from "../../../app/slices/commonSlice";
import DialogOverlay from "../CrudComponents/DialogOverlay";
import SidebarOverlay from "../CrudComponents/SidebarOverlay";
import Loader from "../Loader";

const employees = [
  { id: 1, name: "Ousman Seid" },
  { id: 2, name: "Faysal Ali" },
  { id: 3, name: "Khadar Baxar" },
  { id: 4, name: "Bashir Mohammed" },
  { id: 5, name: "Samatar Osman" },
];

const attendance = [
  { user_id: 1, date: "2023-07-01", morning: true, afternoon: true },
  { user_id: 1, date: "2023-07-02", morning: false, afternoon: true },
  { user_id: 1, date: "2023-07-03", morning: true, afternoon: false },
  { user_id: 2, date: "2023-07-01", morning: true, afternoon: false },
  { user_id: 2, date: "2023-07-02", morning: true, afternoon: true },
  { user_id: 2, date: "2023-07-03", morning: false, afternoon: false },
  { user_id: 3, date: "2023-07-01", morning: false, afternoon: false },
  { user_id: 3, date: "2023-07-02", morning: true, afternoon: true },
  { user_id: 3, date: "2023-07-03", morning: true, afternoon: true },
];

function getDates(startDate, endDate) {
  let dates = [];
  let currentDate = new Date(startDate); 
  while (currentDate <= endDate) { 
    dates.push(new Date(currentDate)); 
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}


function convertDateRange(array) {
  let result = [];
  for (let obj of array) { 
    let dates = getDates(obj.start_date, obj.end_date); 
    for (let date of dates) { 
      let newObj = {...obj}; 
      newObj.date = date; 
      newObj.morning = (newObj?.morning != null) ? newObj?.morning : true; 
      newObj.afternoon = newObj?.afternoon??true; 
      newObj.allDay = newObj.allDay??true;
      if(newObj?.user_parent_id) {
        newObj.user_id = newObj?.user_parent_id; 
      }
      result.push(newObj); 
    }
  }
  return result;
}

function AttendanceOverlay({ 
  // startDate,//=new Date("2023-07-01"), 
  // endDate,//=new Date("2023-08-01"),
  stDate=new Date().getTime()-7*24*60*60*1000,
  enDate=new Date().getTime(), 
  users=employees??[],
  usersField=[{field: "name", name: "Employee Name", default: true},{field: "id", name: "Employee ID"}],
  attendances=attendance??[],
  leave={leaveTypes: [], freePassValues: ["Working"], freePassField: "consider_as", attendanceLeaveField: "leavetype_id"},
  isLoading=false,
  markType="present", 
  weekends=["sun"],
  title="Attendance",
  emptyMessage="No User Found",
  borderSeparate=false,
  setInfo,
  add={show: false, window:"dialog", header:"Dialog Header", component: <></>},
  edit={show: false, window:["inline","sidebar"], header:"Sidebar Header", component: <></>},
  dialogZIndex=0,
  searchText="",
  states=[],
  detailClick=()=>{},
  showOposite=true,
  hideDatesAfter=true,
  layout="one_day"
}) {
  let selField = "";
  usersField?.map((uf)=>{
    if(uf?.default==true) {
      selField = uf?.field;
    } 
  })

  const [loading, setLoading ] = useState(true)

  useEffect(()=>{
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 50);
  },[])
  
  const [selectedField, setSelectedField] = useState(selField)
  const theme = useTheme()

  const dispatch = useDispatch()
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  const [addOrEdit, setAddOrEdit] = useState({
    add: false,
    edit: false,
  })

  const addClick = () => {
    if(add?.window==="dialog") {
      dispatch(
        showDialog({
          header: add.header??"",
          openDialog: true,
          fullScreen: add?.fullScreen ? true : false
        })
      );
    } else if(add?.window==="sidebar") {
      dispatch(
        showSidebar({
          header: add.header??"",
          openDialog: true,
          position: (sideBar.position==="right") ? "right" : (sideBar.position === "left") ? "left" : (sideBar.position==="top") ? "top" : (sideBar.position==="bottom") ? "bottom" : "right",
          subtitle: add?.subtitle ?? "Please fill out the form below with the necessary information.",
          paddingX: sideBar?.paddingX ?? 10,
          width: sideBar?.width ?? 350,
          fullScreen: add?.fullScreen ? true : false
        })
      );
    }
   
    setAddOrEdit({add: true, edit: false})
  }

  function filterByLeaveTypes(attendances) {
    if(leave?.leaveTypes?.length <= 0 || leave?.freePassValues?.length <= 0 || !leave?.freePassField || !leave?.attendanceLeaveField) {
      return attendances;
    }
    const allowed = leave?.leaveTypes?.filter(leaveType => {
      return !leave?.freePassValues?.some(freePassValue => {
        return leaveType[leave?.freePassField] == freePassValue;
      });
    }).map(leaveType => {
      return leaveType.id;
    });

    const filtered = attendances?.filter(attendance => {
      return allowed?.includes(attendance?.[leave?.attendanceLeaveField]);
    });
    return filtered;
  }

  const att = filterByLeaveTypes(attendances);  

  let startDateString = title+"_start_date"
  const endDateString = title+"_end_date"
  let sDate = localStorage.getItem(startDateString)??stDate
  let eDate = localStorage.getItem(endDateString)??enDate
  const [startDate, setStartDate] = useState(new Date(parseFloat(sDate)))
  const [endDate, setEndDate] = useState(new Date(parseFloat(eDate)))

  const format_date = (value) => {
    return value.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  
  // const [searchText, setSearchText] = useState("")
  const [usersFiltered, setUsersFiltered] = useState([])

  useEffect(()=>{
    let uf = users?.filter((user)=>{
      if(!searchText || user[selectedField]?.toLocaleString()?.toLowerCase()?.includes(searchText?.toLowerCase())) {
        return true;
      } else {
        return false;
      }
    })?.sort((a,b)=>{
      if (typeof a[selectedField] == "number") {
        return a[selectedField] - b[selectedField];
      } else if(typeof a[selectedField] == "string") {
        return a[selectedField].localeCompare(b[selectedField]);
      }
    });
    setUsersFiltered(uf);
  },[users, selectedField, searchText])

  const op = useRef(null)
  const dateRangeSelector = () => {
    return (
      <div className="flex justify-between items-center flex-wrap">
          {usersField?.length > 1 &&
            <div className="">
                <RadioOverlay
                  row={true}
                  options={usersField}
                  nameLabel="name"
                  valueLabel="field"
                  value={selectedField}
                  onChange={(e)=>{
                    setSelectedField(e?.target?.value)
                  }}
                  label={<p className="font-bold text-lg">Sort By</p>}
                />
            </div>
          }
          {/* <div className="flex items-center gap-4"> */}
          
         
            <div>
              <p className="my-6 border p-3  rounded-md shadow-2 font-bold hover:cursor-pointer w-fit" onClick={(e) => op?.current.toggle(e)}>{format_date(startDate)+" - "+format_date(endDate)}</p>
              <OverlayPanel ref={op}>
                <div className="flex flex-col" style={{maxWidth: 400}}>
                  <div className="flex border-b-2">
                    <DatePickerOverlay
                      mui={false}
                      value={startDate}
                      // setValue={setStartDate}
                      onChange={(date)=>{
                        localStorage.setItem(startDateString,date.getTime())
                        setStartDate(()=>date)
                      }}
                      borderRadius={0}
                    />
                    <DatePickerOverlay
                      mui={false}
                      value={endDate}
                      // setValue={setEndDate}
                      onChange={(date)=>{
                        localStorage.setItem(endDateString, date.getTime())
                        setEndDate(()=>date)
                      }}
                      borderRadius={0}
                    />
                  </div>
                  {/* <div>
                    <ButtonOverlay
                      text="Confirm"
                      sx={{
                        width: '100%',
                        height: 40
                      }}
                      loading={isLoading}
                      // loadingPosition="start"
                      onClick={()=>{
                        loadVehicleCosts()
                        if(op?.current) {
                          op?.current.hide()
                        }
                      }}
                    />
                  </div> */}
                  <div className="flex flex-wrap gap-2 mt-3">
                      <Tag 
                        value="This Week" 
                        severity={"primary"} 
                        className="hover:cursor-pointer"
                        onClick={()=>{
                          const date = new Date(new Date().getTime() - 6 * 24 * 60 * 60 * 1000)
                          localStorage.setItem(startDateString,date.getTime())
                          localStorage.setItem(endDateString,new Date().getTime())
                          setStartDate(()=>date)
                          setEndDate(()=>new Date())
                        }}
                      />
                      <Tag 
                        value="This Month" 
                        severity={"success"} 
                        className="hover:cursor-pointer"
                        onClick={()=>{
                          const date = new Date(new Date().getTime() - 29 * 24 * 60 * 60 * 1000)
                          localStorage.setItem(startDateString,date.getTime())
                          localStorage.setItem(endDateString,new Date().getTime())
                          setStartDate(()=>date)
                          setEndDate(()=>new Date())
                        }}
                      />
                      <Tag 
                        value="This Year" 
                        severity={"warning"} 
                        className="hover:cursor-pointer"
                        onClick={()=>{
                          const date = new Date(new Date().getTime() - 364 * 24 * 60 * 60 * 1000)
                          localStorage.setItem(startDateString,date.getTime())
                          localStorage.setItem(endDateString,new Date().getTime())
                          setStartDate(()=>date)
                          setEndDate(()=>new Date())
                        }}
                      />
                  </div>
                </div>
              </OverlayPanel>
            </div>
            {/* <div>
            <TextField
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search"
              variant="standard"
              size="medium"
              sx={{
                width: { xss: 0, xs: 180, sm: 200 },
                display: { xss: "none", xs: "block" },
                "& .MuiInputBase-root": {
                  height: 40,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AiOutlineSearch />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <MdClose
                      onClick={() => {
                        setSearchText("")
                      }}
                      size={15}
                      style={{ marginTop: 10 }}
                      className="text-gray-300 hover:text-gray-700 hover:cursor-pointer"
                    />
                  </InputAdornment>
                ),
              }}
            />
          </div>  */}
          {/* </div> */}
        </div>
     
    )
  }
  
  const [dates, setDates] = useState([]);

  useEffect(() => {
    const interval = { start: new Date(startDate), end: new Date(endDate) };
    const datesArray = eachDayOfInterval(interval);
    // setLoading(()=>true)
    setDates(datesArray);
    // setLoading(()=>false)
  }, [startDate, endDate]);


  function getAttendance(user_id, date) {
    const record = convertDateRange(att)?.find(
      (item) => item?.user_id == user_id && item?.date?.getTime() == date?.getTime()
    );
    if (record) {
      return { morning: record.morning, afternoon: record.afternoon, date: date };
    } else {
      return { morning: false, afternoon: false, date: date };
    }
  }

  function isWeekendOrHoliday (date) {
    if(hideDatesAfter && (new Date(date)?.getTime() > new Date()?.getTime())) return true;
    var day = new Date(date)?.toLocaleString("en-US", {weekday: "short"});
    if(weekends?.map(x => x?.toLowerCase())?.includes(day?.toLowerCase())) return true;
    
    return false;
  }

  const handleDateClick = (user, date, time, value) => {
    if(!isWeekendOrHoliday(date)) {
      let active
      if(markType == "present") {
        active =  value ? true : false
      } else {
        active = value ? false : true
      }
      if(!active && !showOposite) {

      }
    } else {
      setInfo((prev)=>({ user: user, data: date, time: time}))
      addClick()
    }
  };

  function formatAttendance(value, date) {
    if(isWeekendOrHoliday(date)) return;
    if(!showOposite && !value) return;
    let content;
    if(markType == "present") {
      content =  value ? <FaCircleCheck color="#31bda6" size={17}/> : <AiFillCloseCircle color="#fd4545" size={18} />
    } else {
      content = value ? <AiFillCloseCircle color="#fd4545" size={18} /> : <FaCircleCheck color="#31bda6" size={17} />
    }
    return <div className="flex justify-center items-center"> {content}</div>
  }

  function formatMonth(date) {
    return format(date, "MMMM yyyy");
  }

  function formatDay(date) {
    return format(date, "dd EEE");
  }

  const emptyMessageComponent = (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 100,
      }}
    >
      <div
        className="text-white px-3 py-1 rounded-2xl"
        style={{ backgroundColor: theme.palette.primary.dark, fontWeight: 700 }}
      >
        {emptyMessage}
      </div>
    </div>
  );

  return (
    <div className="calendar-container">
      {((add.show && addOrEdit.add && add.component) || (edit.show && addOrEdit.edit && edit.component)) && !disableDataTableWindows &&
      <DialogOverlay baseIndex={dialogZIndex}>
        {add.show && addOrEdit.add && add.component}
        {edit.show && addOrEdit.edit && edit.component}
      </DialogOverlay>}
      {((add.show && addOrEdit.add && add.component) || (edit.show && addOrEdit.edit && edit.component)) && !disableDataTableWindows &&
      <SidebarOverlay>
        {add.show && addOrEdit.add && add.component}
        {edit.show && addOrEdit.edit && edit.component}
      </SidebarOverlay>}
      <div className="mx-2 mb-4 overflow-x-auto">
        {dateRangeSelector()}
        {!loading && dates?.length > 0 && usersFiltered?.length > 0 &&
          <table className={`table-auto ${borderSeparate ? "border-separate" : "border-collapse"} w-full`}>
            <thead>
              <tr>
                <th className="border border-gray-400 px-4 py-2 text-left" style={{minWidth: 200}}>{usersField?.find((uf)=>uf?.field == selectedField)?.name}</th>
                {dates?.map((date, index) => (
                  <th
                    key={index}
                    className="border border-gray-400 px-4 py-2 text-center"
                    colSpan="2"
                  >
                    {index === 0 || formatMonth(date) !== formatMonth(dates[index - 1])
                      ? formatMonth(date)
                      : ""}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-gray-400 px-4 py-2 text-left"></th>
                {dates?.map((date, index) => (
                  <th
                    key={index}
                    className="border border-gray-400 px-4 py-2 text-center"
                    colSpan="2"
                  >
                    {formatDay(date)}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-gray-400 px-4 py-2 text-left"></th>
                {dates?.map((date, index) => (
                  <React.Fragment key={index}>
                    <th
                      key={`${index}-m`}
                      className="border border-gray-400 px-4 py-2 text-center"
                    >
                      M
                    </th>
                    <th
                      key={`${index}-a`}
                      className="border border-gray-400 px-4 py-2 text-center"
                    >
                      A
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersFiltered?.map((user) => (
                <tr key={user?.id}>
                  <td className="border border-gray-400 px-4 py-2 font-bold">{user[selectedField]??''}</td>
                  {dates.map((date, index) => {
                    const attendance = getAttendance(
                      user?.id,
                      date
                    );
                    return (
                      <React.Fragment key={index}>
                        <td
                          key={`${index}-m`}
                          className={`border border-gray-400 px-4 py-2 text-center ${
                            attendance.morning ? "bg-green-2000" : "bg-red-4001 text-white"
                          }`}
                          style={{
                            backgroundColor: !isWeekendOrHoliday(attendance?.date) ? theme?.palette?.background?.default : ""
                          }}
                          onClick={()=>{
                            handleDateClick(user, date, "morning", attendance?.morning)
                          }}
                        >
                          {formatAttendance(attendance?.morning, attendance?.date)}
                        </td>
                        <td
                          key={`${index}-a`}
                          className={`border border-gray-400 px-4 py-2 text-center ${
                            attendance.afternoon ? "bg-green-2000" : "bg-red-4001 text-white"
                          }`}
                          style={{
                            backgroundColor: !isWeekendOrHoliday(attendance?.date) ? theme?.palette?.background?.default : ""
                          }}
                          onClick={()=>{
                            handleDateClick(user, date, "afternoon", attendance?.morning)
                          }}
                        >
                          {formatAttendance(attendance?.afternoon, attendance?.date)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              {usersFiltered?.length <= 0 &&
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-bold" colSpan={(dates?.length * 2) + 1}>{emptyMessageComponent}</td>
                </tr>
              }
            </tbody>
          </table>
        }
        {loading && <Loader />}
        {usersFiltered?.length <= 0 && !loading &&
          <div>
            <div className="border border-gray-400 px-4 py-2 font-bold" colSpan={(dates?.length * 2) + 1}>{emptyMessageComponent}</div>
          </div>
        }
      </div>
    </div>
  );
}

export default AttendanceOverlay;
