import React, { useState, useRef, useEffect } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import InputAdornment from '@mui/material/InputAdornment'

// ** Icons Imports
import Menu from 'mdi-material-ui/Menu'
import Magnify from 'mdi-material-ui/Magnify'

import {BiMenuAltLeft} from 'react-icons/bi'
import {AiOutlineSearch} from 'react-icons/ai'

// ** Components
import ModeToggler from '../../../../MuiTheme/layouts/components/shared-components/ModeToggler'
import UserDropdown from '../../../../MuiTheme/layouts/components/shared-components/UserDropdown'
import NotificationDropdown from '../../../../MuiTheme/layouts/components/shared-components/NotificationDropdown'

import { RxDashboard } from "react-icons/rx";

import { useDispatch, useSelector } from 'react-redux'
import { setShowMenus } from '../../../../app/slices/commonSlice'

import { OverlayPanel } from 'primereact/overlaypanel';
import SearchPanel from './SearchPanel';
import { MdClose } from 'react-icons/md';


const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props
  const showMenus = useSelector(state=>state?.common?.showMenus)
  const dispatch = useDispatch()
  const op = useRef(null);
  const inputRef = useRef(null);

  const [searchText, setSearchText] = useState("")
  // ** Hook
  const hiddenSm = useMediaQuery(theme => theme.breakpoints.down('sm'))

  const handleSearchFocus = () => {
    inputRef?.current?.focus();
  };
  
  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {settings?.menuMode == "top" && 
          <div className='mr-3'> 
            <IconButton
              onClick={()=>{
                dispatch(
                  setShowMenus(!showMenus)
                )
              }}
            >  
              <RxDashboard size={22} color={settings?.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "rgba(255,255,255,.7)" : ""} />
            </IconButton> 
          </div>
        }
        {settings?.menuMode != "top" && hidden ? (
          <IconButton
            color='inherit'
            onClick={toggleNavVisibility}
            sx={{ ml: -2.75, ...(hiddenSm ? {} : { mr: 3.5 }) }}
          >
            <BiMenuAltLeft size={25} />
          </IconButton>
        ) : null}
        <TextField
          variant='standard'
          size='small'
          value=""
          sx={{ 
            input: {
              color: settings?.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "rgba(255,255,255,.3)" : ""
            },
            '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
          placeholder="Search for menus"
          onClick={(e) => op.current.toggle(e)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <AiOutlineSearch size={19} color={settings?.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "rgba(255,255,255,.3)" : ""} />
              </InputAdornment>
            ),
            disableUnderline: true,
          }}
        />
      </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        <NotificationDropdown settings={settings}/>
        <UserDropdown settings={settings}/>
      </Box>
      <OverlayPanel ref={op} onShow={handleSearchFocus} style={{minWidth: '100vw'}}>
          <div className='w-full border-b flex justify-start items-center p-2 mx-4'>

            <TextField
              variant='standard'
              size='small'
              value={searchText}
              onChange={(e)=>{
                setSearchText(e.target.value)
              }}
              inputRef={inputRef}
              sx={{ 
                marginRight: 15,
                input: {
                  // color: settings?.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "rgba(255,255,255,.3)" : ""
                },
                '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
              placeholder="Search"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <AiOutlineSearch size={19} 
                      // color={settings?.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "rgba(255,255,255,.3)" : ""} 
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position='end'>
                    <MdClose 
                      onClick={()=>{
                          setSearchText("")
                          handleSearchFocus()
                      }}
                      size={15} 
                      style={{marginTop: 10}} 
                      className="text-gray-400 hover:text-gray-700 hover:cursor-pointer"
                  />
                  </InputAdornment>
                ),
                disableUnderline: true,
              }}
            />
          </div>
          <div className='p-4'>
              <SearchPanel searchText={searchText} handleClose={()=>op?.current?.hide()}/>
          </div>
      </OverlayPanel>
    </Box>
  )
}

export default AppBarContent
