import React from "react";
import "gantt-task-react/dist/index.css";
import { ViewMode } from "gantt-task-react";

export const GanttHeader = ({
  onViewModeChange,
  onViewListChange,
  isChecked,
}) => {
  return (
    <div className="flex justify-between w-full mb-4 border-b pb-3">
     <div className="flex gap-4 font-bold text-lg">
        <button
          className="Button"
          onClick={() => onViewModeChange(ViewMode.Hour)}
        >
          Hour
        </button>
        <button
          className="Button"
          onClick={() => onViewModeChange(ViewMode.QuarterDay)}
        >
          Quarter of Day
        </button>
        <button
          className="Button"
          onClick={() => onViewModeChange(ViewMode.HalfDay)}
        >
          Half of Day
        </button>
        <button className="Button" onClick={() => onViewModeChange(ViewMode.Day)}>
          Day
        </button>
        <button
          className="Button"
          onClick={() => onViewModeChange(ViewMode.Week)}
        >
          Week
        </button>
        <button
          className="Button"
          onClick={() => onViewModeChange(ViewMode.Month)}
        >
          Month
        </button>
        <button
          className="Button"
          onClick={() => onViewModeChange(ViewMode.Year)}
        >
          Year
        </button>
      </div> 
      <div className="Switch">
        <label className="pr-2">
          <input
            type="checkbox"
            defaultChecked={isChecked}
            onClick={() => onViewListChange(!isChecked)}
          />
          <span className="Slider" />
        </label>
        Show Task List
      </div>
    </div>
  );
};