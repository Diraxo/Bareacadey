import { TextField } from '@mui/material';
import { InputText } from 'primereact/inputtext';
import React, { useState} from 'react';



// itemTemplate(option) {
//     // custom item content
// }

export const filterTemplate = (options, ml=false) => {
    let {filterOptions} = options;

    const [filterValue, setFilterValue] = useState('');
    const filterInputRef = React.useRef();

    const myResetFunction = (options) => {
        setFilterValue('');
        options.reset();
        filterInputRef && filterInputRef.current.focus()
    }
    
    const myFilterFunction = (event, options) => {
        let _filterValue = event.target.value;
        setFilterValue(_filterValue);
        options.filter(event);
    }


    return (
        <div className={`flex flex-column gap-2 ${ml ? "ml-2" : ""}`}>
            {/* <TextField autoFocus inputRef={filterInputRef} variant='standard' placeholder='search' sx={{mx: 5, my: 2}}/> */}
            {/* <InputText placeholder='search' className="p-inputtext-sm border-none  mx-2" value={filterValue} ref={filterInputRef} onChange={(e) => myFilterFunction(e, filterOptions)} /> */}
            <span className={`p-input-icon-left ${ml ? "mx-2" : ""}`}>
                <i className="pi pi-search" style={{fontSize: 14, marginTop: -6.5}}/>
                <InputText autoFocus placeholder="Search" className="p-inputtext-sm border-none" style={{borderRadius: 5}} value={filterValue} ref={filterInputRef} onChange={(e) => myFilterFunction(e, filterOptions)} />
            </span>
        </div>
    )
}

