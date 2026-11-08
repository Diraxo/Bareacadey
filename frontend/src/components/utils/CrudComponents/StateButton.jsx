
import { Button, TextField } from '@mui/material';
import { OverlayPanel } from 'primereact/overlaypanel';
import React, { useRef, useState } from 'react';

const StateButton = ({ routeAction }) => {
    const op = useRef(null);
    const [note, setNote] = useState("")
    return (
        <div className="">
            <Button variant='contained' onClick={(e) => op?.current?.toggle(e)} sx={{backgroundColor: routeAction?.color??""}} className="font-bold">{routeAction?.name}</Button>
            <OverlayPanel ref={op}>
                <div className='mb-3' style={{minWidth: 200, marginTop: -5}}>
                    <p className='text-lg font-bold'>Are you sure, <span className={`${routeAction?.color ? '' : "text-blue-400"}`} style={{color: routeAction?.color??""}}>{routeAction?.name}?</span></p>
                </div>
                <div className='w-full'>
                    <TextField
                        id="reason"
                        // label="Reason"
                        placeholder={routeAction?.name+" note..."}
                        multiline
                        value={note}
                        onChange={(e)=>setNote(e.target.value)}
                        rows={3}
                        sx={{
                            mb: 4,
                            borderRadius: 0
                        }}
                    />
                </div>
                <div className=' flex justify-end gap-3' style={{marginBottom: -10}}>
                    <Button variant='outlined' color='error' size="small" onClick={(e)=>op?.current?.toggle(e)} className="font-bold">No</Button>
                    <Button variant='contained' color='success' size="small" onClick={(e)=>{routeAction?.onClick(e, note); op?.current?.hide(e); }} className="font-bold">Yes</Button>
                </div>
            </OverlayPanel>
        </div>
    );
}

export default StateButton;