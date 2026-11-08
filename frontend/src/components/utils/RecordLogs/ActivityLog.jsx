
import React from 'react'; 
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useTheme } from '@mui/material/styles';
import User  from "/user.png"
import { Avatar } from '@mui/material';
import { GoDotFill } from "react-icons/go";
import { BsArrowRight } from "react-icons/bs";

const ActivityLog = ({activityLogs=[]}) => {
    const theme = useTheme();
    
    const formatDate = (date) => {
        const formattedDate = `${date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })} at ${date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric'
          })}`;
        return formattedDate;
    }

    const customizedMarker = (item) => {
        return (
            <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color??theme?.palette?.primary?.main }}>
                {item?.by?.imgUrl && <Avatar  src={item?.by?.imgUrl??User} />}
                {!item?.by?.imgUrl && <p className='font-bold'>{item?.by?.name.split(" ").map((chr)=>chr[0]).join("")}</p>}
            </span>
        );
    };

    const customizedContent = (item) => {
        const logs = item?.logs;
        return (
            <Card title={<span className='font-normal text-2xl'>{item?.by?.name}</span>} subTitle={item?.by?.date ? formatDate(new Date(item?.by?.date)) : ""} className='mb-4 border'>
                <div className='flex flex-col gap-2'>
                    {Object.keys(logs)?.map((key, index)=>{
                        return (
                            <div className='flex gap-2 items-center text-lg' key={index}>
                                <GoDotFill color={item.color??theme?.palette?.primary?.main}/>
                                <p>{key}</p>
                                <BsArrowRight />
                                <p style={{color: item.color??theme?.palette?.primary?.main}}>{logs[key]}</p>
                            </div>
                        )
                    })}
                </div>
            </Card>
        );
    };
        
    return (
        <div className="activity_log">
          {activityLogs?.length > 0 &&
            <Timeline value={activityLogs} align="left" className="" marker={customizedMarker} content={customizedContent} />
          }
        </div>
    )
}

export default ActivityLog;