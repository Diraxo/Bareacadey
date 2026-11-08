import React, {useState} from 'react';
import { MdEdit, MdDeleteOutline, MdOutlineDragHandle } from 'react-icons/md';
import {IoIosLock, IoIosArrowForward, IoIosArrowDown, IoMdCloseCircle} from 'react-icons/io';
import { FormControl, IconButton, InputLabel, Menu, MenuItem, Select } from '@mui/material';
import {RxDragHandleDots2} from 'react-icons/rx';
import { useEffect } from 'react';
import { BsStack } from 'react-icons/bs';

const EditGroup = ({groupName, callBackFunc=()=>{}, deleteCallBack=()=>{}, readonly, provided, ind, expanded, setExpanded, groupId, allGroups, groupObject, setGroups}) => {
  const [edit, setEdit] = useState(false);
  const [value, setValue] = useState(groupName);


  const editGroupByLabel = (label, value) => {
    const updatedGroups = allGroups?.map((group) => {
        if (group?.id === groupObject?.id) {
            return { ...group, [label]: value };
        }
        return group;
    });
    setGroups(updatedGroups)
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    editGroupByLabel("name", value)
    // callBackFunc(value);
    setEdit((prev)=>false);
  }

  useEffect(()=>{
    setValue(groupName)
  }, [groupName]);

  const label = "group"+groupId;

  const [anchorEl, setAnchorEl] = useState(null);

  const handleDropdownOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
  };

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    }}>
        {
            !edit &&
            <>
               <div className='flex justify-start items-center gap-2'>
                  <span {...provided.dragHandleProps}>
                    <RxDragHandleDots2  className='text-2xl text-gray-500'/>
                  </span>
                  <p>{groupName}</p>
                </div>

                {readonly && 
                <div className='flex items-center gap-2'>
                 <div 
                      className="hover:cursor-pointer hover:bg-gray-100 rounded-full"
                      style={{
                          padding: 8,
                      }}
                  >
                     <IoIosLock style={{
                      color: '#172b4d',
                      fontSize: 16
                     }}/>
                  </div>
                  <div 
                        onClick={()=>{
                          const label = "group"+groupId;
                          setExpanded({
                            ...expanded, [label]: !(expanded[label]??true)
                          })
                        }}
                        className="hover:cursor-pointer hover:bg-gray-100 rounded-full"
                        style={{
                            padding: 8,
                        }}
                    >
                    {expanded[label]??true ? <IoIosArrowDown
                       style={{fontSize: 20}} 
                    /> : <IoIosArrowForward style={{fontSize: 20}} />}
                    </div>
                </div>  
                }
                {!readonly &&
                <div style={{
                    border: '1px solid rgba(0,0,0,.1)',
                    borderRadius: 5,
                    padding: '1px 5px',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                
                    <div 
                      onClick={()=>{
                        setEdit(true);
                      }}
                      className="hover:cursor-pointer hover:bg-gray-100 rounded-full"
                      style={{
                        padding: 8,
                        marginRight: 8
                      }}
                    >
                    <MdEdit
                       style={{fontSize: 19}} 
                    />
                    </div>

                    <div 
                      onClick={handleDropdownOpen}
                      className="hover:cursor-pointer hover:bg-gray-100 rounded-full"
                      style={{
                        padding: 8,
                        marginRight: 8
                      }}
                    >
                    <BsStack
                       style={{fontSize: 19}}
                       color="#904ee2" 
                    />
                    </div>

                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={() => handleDropdownClose()}
                      
                      sx={{ "& .MuiMenu-paper": { minWidth: 100 } }}
                      
                    >
                     <div className='p-4'>

                      <div className='absolute top-1 right-1 hover:cursor-pointer' onClick={handleDropdownClose}><IoMdCloseCircle size={23}/></div>

                     <FormControl fullWidth sx={{minWidth: 300, marginTop: 2, marginBottom: 2}}>
                        <InputLabel id="demo-simple-select-label">Select Parent</InputLabel>
                        <Select
                          label="Select Parent"
                          value={groupObject?.parentId}
                          sx={{
                            height: 45,
                            padding: 0,
                            borderRadius: 2,
                          }}
                          fullWidth
                          multiple={false}
                          className=" py-2 pr-4 pl-8 rounded-lg outline-slate-300 border-r-8 border-r-transparent"
                          onChange={(e) => {
                            editGroupByLabel("parentId", e.target.value)
                          }}
                        >
                          <MenuItem value="">-</MenuItem>
                          {allGroups?.map((group, index)=>{
                            if(group?.id == 1 || group?.id == groupObject?.id || group?.parentId) return;
                            return (
                              <MenuItem key={group?.id+"-"+index} value={group?.id}>{group?.name}</MenuItem>
                            )
                          })}
                        </Select>
                      </FormControl>
                     </div>
                    </Menu>

                    
               
                    <div 
                        onClick={()=>{
                          deleteCallBack();
                        }}
                        className="hover:cursor-pointer hover:bg-gray-100 rounded-full"
                        style={{
                            padding: 8,
                        }}
                    >
                    <MdDeleteOutline
                       style={{fontSize: 20}} 
                    />
                    </div>
                    <div 
                        onClick={()=>{
                          const label = "group"+groupId;
                          setExpanded({
                            ...expanded, [label]: !(expanded[label]??true)
                          })
                        }}
                        className="hover:cursor-pointer hover:bg-gray-100 rounded-full"
                        style={{
                            padding: 8,
                        }}
                    >
                    {expanded[label]??true ? <IoIosArrowDown
                       style={{fontSize: 20}} 
                    /> : <IoIosArrowForward style={{fontSize: 20}} />}
                    </div>
                    
                
                </div>}
                
      
            </>
        }
        {
            edit &&
          <>
          <form onSubmit={handleSubmit}>
            <input 
                value={value}
                className="group-input"
                placeholder="Enter group name"
                style={{
                    width: '100%',
                   // marginRight: 20
                }}
                onChange={(e)=>{
                    setValue(e.target.value);
                }}
            />
            </form>
         </>
        }
    </div>
  )
}

export default EditGroup