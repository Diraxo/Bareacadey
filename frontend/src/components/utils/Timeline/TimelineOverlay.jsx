import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

const TimelineOverlay = ({ items = [], position = "right", sx={} }) => {
  return (
    <div className="w-full overflow-x-auto">
      <Timeline position={position} sx={{overflowX: "auto", ...sx}}>
        {items?.map((item, index) => {
          return (
            <TimelineItem key={index}>
             {item?.opposite && 
                <TimelineOppositeContent >
                    {item?.opposite}
                </TimelineOppositeContent>
              }
              <TimelineSeparator>
                <TimelineDot style={{backgroundColor: item?.color ? item?.color : ""}} />
                {index < items?.length -1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent><div>{item?.component}</div></TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </div>
  );
};

export default TimelineOverlay;
