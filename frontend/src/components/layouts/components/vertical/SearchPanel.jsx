import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import verticalNavItems from '../../../../navigation/vertical'
import {useTheme} from '@mui/material/styles'
import MenuOverlayNavLink from './MenuOverlayNavLink';
import { useSettings } from '../../../../MuiTheme/hooks/useSettings'
import { AiOutlineSearch } from 'react-icons/ai';

const SearchPanel = ({searchText, handleClose}) => {

    const theme = useTheme()
    const {settings } = useSettings()
    const permissions = useSelector(state=>state.auth.user.permissions)
    const checkDependency = (item) => {
        if(!item?.permissions) return true;
        let ret = false;
        for(let i = 0; i < item?.permissions.length; i++) {
        if(permissions.includes(item?.permissions[i])) {
            ret = true;
        }
        }
        return ret;
    }

    const allNavItems = verticalNavItems()

    let navItemsGrouped = allNavItems?.reduce((acc, cur) => {
        if (cur?.sectionTitle) {
          acc.push({title: cur?.sectionTitle, items: []});
        } else {
          if (checkDependency(cur) && (!searchText || cur?.title?.toLowerCase()?.includes(searchText?.toLowerCase()))) {
            acc[acc.length - 1].items.push(cur);
          }
        }
        return acc;
    }, [{name: 'Dashboard', items: []}]);


    return (
        <div className={`flex p-4 flex-wrap border-1`} style={{maxWidth: 1400, margin: 'auto', borderColor: theme?.palette?.customColors?.borderColor}}>
        {
          navItemsGrouped?.map((item, index) => {
            if (item?.items?.length <= 0) return;
            if (item?.title) {
              return (
                <div key={"out"+index} className={`${settings?.headerOverflow=="scroll" ? "mb-2" : "mb-4"} flex flex-col mr-2 ${settings?.headerViewMode=="boxed" ? "shadow-2 border p-3 rounded-md mx-3" : ""}`} style={{borderColor: theme?.palette?.customColors?.borderColor}}>
                  <div className='flex flex-col'>
                    <p className='text-lg font-bold' style={{color: settings?.mode==='light' ? "rgba(0,0,0,.6)" : ""}}>{item?.title}</p>
                    <div className={`${settings?.headerBorderLeft ? "border-l-2 pl-1" : ""} `} style={{borderColor: theme?.palette?.customColors?.borderColor}}>
                      {item?.items?.map((menuItem, indexIn)=>{
                        return (
                          <MenuOverlayNavLink item={menuItem} settings={settings} key={"in"+indexIn} handleClose={handleClose}/>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            }
          })
        }
        {
           navItemsGrouped?.every((item)=>item?.items?.length <= 0) && 
           <div className='w-full flex gap-2 justify-center items-center p-2 text-lg opacity-60'><AiOutlineSearch size={21} style={{marginTop: 1}}/><span>No Result</span></div>
        }
        </div>
    )
}

export default SearchPanel