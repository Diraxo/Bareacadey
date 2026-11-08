import React, { useState } from "react";
import { ViewMode, Gantt } from "gantt-task-react";
import { GanttHeader } from "./GanttHeader";
import "gantt-task-react/dist/index.css";
import "./gantt.scss";

export const GanttChartOverlay = () => {
    const currentDate = new Date();
    const taskStyles = {
        backgroundColor: 'red',
        backgroundSelectedColor: 'blue',
        progressColor: "green",
        progressSelectedColor: 'orange'
    }
    const allTasks = [
        {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
            name: "Some Project",
            id: "ProjectSample",
            progress: 25,
            type: "project",
            hideChildren: false,
            displayOrder: 1,
            // styles: {
            //     backgroundColor: 'red',
            //     backgroundSelectedColor: 'blue',
            //     progressColor: "green",
            //     progressSelectedColor: 'orange'
            // }
          },
          {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            end: new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              2,
              12,
              28
            ),
            name: "Idea",
            id: "Task 0",
            progress: 45,
            type: "task",
            project: "ProjectSample",
            displayOrder: 2,
          },
          {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4, 0, 0),
            name: "Research",
            id: "Task 1",
            progress: 25,
            dependencies: ["Task 0"],
            type: "task",
            project: "ProjectSample",
            displayOrder: 3,
          },
          {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8, 0, 0),
            name: "Discussion with team",
            id: "Task 2",
            progress: 10,
            dependencies: ["Task 1"],
            type: "task",
            project: "ProjectSample",
            displayOrder: 4,
          },
          {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 9, 0, 0),
            name: "Developing",
            id: "Task 3",
            progress: 2,
            dependencies: ["Task 2"],
            type: "task",
            project: "ProjectSample",
            displayOrder: 5,
          },
          {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
            name: "Review",
            id: "Task 4",
            type: "task",
            progress: 70,
            dependencies: ["Task 2"],
            project: "ProjectSample",
            displayOrder: 6,
          },
          {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
            name: "Release",
            id: "Task 6",
            progress: currentDate.getMonth(),
            type: "milestone",
            dependencies: ["Task 4"],
            project: "ProjectSample",
            displayOrder: 7,
          },
          {
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 19),
            name: "Party Time",
            id: "Task 9",
            progress: 0,
            isDisabled: true,
            type: "task",
          },
    ];

    function getStartEndDateForProject(tasks, projectId) {
        const projectTasks = tasks.filter(t => t.project === projectId);
        let start = projectTasks[0].start;
        let end = projectTasks[0].end;
      
        for (let i = 0; i < projectTasks.length; i++) {
          const task = projectTasks[i];
          if (start.getTime() > task.start.getTime()) {
            start = task.start;
          }
          if (end.getTime() < task.end.getTime()) {
            end = task.end;
          }
        }
        return [start, end];
    }

    const [view, setView] = useState(ViewMode.Day);
    const [tasks, setTasks] = useState(allTasks);
    const [isChecked, setIsChecked] = useState(true);

    let columnWidth = 65;
    if (view === ViewMode.Year) {
        columnWidth = 350;
    } else if (view === ViewMode.Month) {
        columnWidth = 300;
    } else if (view === ViewMode.Week) {
        columnWidth = 250;
    }

    const handleTaskChange = (task) => {
        console.log("On date change Id:" + task.id);
        let newTasks = tasks.map(t => (t.id === task.id ? task : t));
        if (task.project) {
        const [start, end] = getStartEndDateForProject(newTasks, task.project);
        const project = newTasks[newTasks.findIndex(t => t.id === task.project)];
        if (
            project.start.getTime() !== start.getTime() ||
            project.end.getTime() !== end.getTime()
        ) {
            const changedProject = { ...project, start, end };
            newTasks = newTasks.map(t =>
            t.id === task.project ? changedProject : t
            );
        }
        }
        setTasks(newTasks);
    };

    const handleTaskDelete = (task) => {
        const conf = window.confirm("Are you sure about " + task.name + " ?");
        if (conf) {
        setTasks(tasks.filter(t => t.id !== task.id));
        }
        return conf;
    };

    const handleProgressChange = async (task) => {
        setTasks(tasks.map(t => (t.id === task.id ? task : t)));
        console.log("On progress change Id:" + task.id);
    };

    const handleDblClick = (task) => {
        alert("On Double Click event Id:" + task.id);
    };

    const handleClick = (task) => {
        console.log("On Click event Id:" + task.id);
    };

    const handleSelect = (task, isSelected) => {
        console.log(task.name + " has " + (isSelected ? "selected" : "unselected"));
    };

    const handleExpanderClick = (task) => {
        setTasks(tasks.map(t => (t.id === task.id ? task : t)));
        console.log("On expander click Id:" + task.id);
    };
      
    return (
        <div className="Wrapper">
            <GanttHeader
                onViewModeChange={viewMode => setView(viewMode)}
                onViewListChange={setIsChecked}
                isChecked={isChecked}
            />
            {/* <h3>Gantt With Unlimited Height</h3> */}
            <Gantt
                tasks={tasks}
                viewMode={view}
                onDateChange={handleTaskChange}
                onDelete={handleTaskDelete}
                onProgressChange={handleProgressChange}
                onDoubleClick={handleDblClick}
                onClick={handleClick}
                onSelect={handleSelect}
                onExpanderClick={handleExpanderClick}
                listCellWidth={isChecked ? "155px" : ""}
                columnWidth={columnWidth}
                TooltipContent={({task})=>{
                    return <div className="shadow-2 border px-3 py-2 rounded-md">{task?.name}</div>
                }}
                barCornerRadius={15}
                // TaskListTable={(t)=>{
                //     return <div className="shadow-2 border">Table Replacement</div>
                // }}
            />
            {/* <h3>Gantt With Limited Height</h3>
            <Gantt
                tasks={tasks}
                viewMode={view}
                onDateChange={handleTaskChange}
                onDelete={handleTaskDelete}
                onProgressChange={handleProgressChange}
                onDoubleClick={handleDblClick}
                onClick={handleClick}
                onSelect={handleSelect}
                
                onExpanderClick={handleExpanderClick}
                listCellWidth={isChecked ? "155px" : ""}
                ganttHeight={300}
                columnWidth={columnWidth}
                
                
            /> */}
        </div>
    );
}
