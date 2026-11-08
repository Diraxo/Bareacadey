import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import "./calendar.scss"
import DialogOverlay from '../CrudComponents/DialogOverlay';
import SidebarOverlay from '../CrudComponents/SidebarOverlay';
import { useDispatch, useSelector } from 'react-redux';
import { showDialog, showSidebar } from '../../../app/slices/commonSlice';
import { Tooltip } from '@mui/material';
import { useDataContext } from '../../../DataContext';
import { useLocation, useNavigate } from 'react-router-dom';
  
const CalendarOverlay = ({
  data,
  setInfo,
  add={show: false, window:"dialog", header:"Dialog Header", component: <></>},
  edit={show: false, window:["inline","sidebar"], header:"Sidebar Header", component: <></>},
  dialogZIndex=0,
  states=[],
  resizeCallback,
  detailClick,
  sideBar={position:"right", paddingX: 10, width: 350},
  addNewPage,
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const disableDataTableWindows = useSelector(state=>state.common.disableDataTableWindows);
  const [addOrEdit, setAddOrEdit] = useState({
    add: false,
    edit: false,
  })
  const {setNewComponent, setEditComponent, setDetailComponent, new: NewComponent} = useDataContext()

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
    else if(add?.window==="newpage") {
      setNewComponent(()=>add.component)
      navigate(location.pathname+"/new", { state: { header: add?.header, subtitle: add?.subtitle ?? "Please fill out the form below with the necessary information.",} })
   }
    setAddOrEdit({add: true, edit: false})
  }

  const handleDateClick = (info) => {
    if(addNewPage) {
      addNewPage(info)
    }
    else {
      setInfo((prev)=>({event: "dateClick", data: info}))
      addClick()
    }
  };

  const handleEventClick = (info) => {
    const rowData = {id: info?.event?.id}
    if(rowData?.id) {
      detailClick(rowData)
    }
  };

  const handleEventDrop = (info) => {
    let event = info.event;
    const id = event?.id;
    const start = event?.start;
    const end = event?.end;
    resizeCallback(id, start, end)
  };

  const handleEventResize = (info) => {
    let event = info.event;
    const id = event?.id;
    const start = event?.start;
    const end = event?.end;
    resizeCallback(id, start, end)
  };

  const handleSelect = (info) => {
    if(addNewPage) {
      addNewPage(info)
    }
    else {
      setInfo((prev)=>({event: "select", data: info}))
      addClick()
    }
  };

  const [allEvents, setAllEvents] = useState([])

  useEffect(()=>{
    if(data) {
      let allEvs = []
      data?.map((dt)=>{
        let item = {...dt};
        if(states?.length > 0 ) {
          states?.map((state)=>{
            if(dt?.routeState == state?.label) {
              item.backgroundColor = state?.color;
              item.textColor = "#ffffff"
              item.classNames = "font-bold pl-1 text-lg"
            }
          })
        }
        allEvs.push(item)
      })
      setAllEvents(allEvs)
    }
  },[data])

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
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={allEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        editable={edit?.show}
        eventResize={handleEventResize}
        selectable={add?.show}
        selectMirror={true}
        select={handleSelect}
        eventContent={(arg) => {
          if (arg.event.extendedProps.description) {
            return (
              <Tooltip title={<p style={{fontSize: 12}}>{arg.event.extendedProps.description}</p>} arrow>
                <span>{arg.event.title}</span>
              </Tooltip>
            );
          } else {
            return arg.event.title;
          }
        }}
      />
    </div>
  );
   
}

export default CalendarOverlay

/*
{
  "id": "a", // a unique identifier of the event
  "groupId": "1", // a group identifier for events that are dragged and resized together
  "allDay": false, // whether the event is shown in the all-day section or not
  "start": "2023-10-12T10:00:00", // when the event begins
  "end": "2023-10-12T11:00:00", // when the event ends
  "startStr": "2023-10-12T10:00:00Z", // an ISO8601 string representation of the start date
  "endStr": "2023-10-12T11:00:00Z", // an ISO8601 string representation of the end date
  "title": "Meeting", // the text that will appear on the event
  "url": "https://example.com/meeting", // a URL that will be visited when the event is clicked
  "classNames": ["meeting", "important"], // an array of CSS class names that will be attached to the event
  "editable": true, // whether the event can be modified by the user or not
  "startEditable": true, // whether the event's start date can be modified by the user or not
  "durationEditable": true, // whether the event's duration can be modified by the user or not
  "resourceEditable": true, // whether the event's resource can be modified by the user or not
  "display": "auto", // how the event is rendered on the calendar
  "overlap": true, // whether the event can overlap other events or not
  "constraint": null, // a constraint for where the event can be placed
  "backgroundColor": "#ff0000", // a CSS color for the background of the event
  "borderColor": "#000000", // a CSS color for the border of the event
  "textColor": "#ffffff", // a CSS color for the text of the event
  "extendedProps": { // an object with custom properties that are not used by FullCalendar internally
    "description": "A meeting with John and Jane",
    "location": "Room A"
  }
}
*/