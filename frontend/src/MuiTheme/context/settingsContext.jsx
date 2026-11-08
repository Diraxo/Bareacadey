// ** React Imports
import { createContext, useEffect, useState } from 'react'
import {fonts} from '../../configs/themeConfig'
// ** ThemeConfig Import
import themeConfig from '../../configs/themeConfig'

// ** Create Context
const initialSettings = {
  themeColor: 'info',
  mode: themeConfig.mode,
  contentWidth: themeConfig.contentWidth,
  font: themeConfig.font,
  box: themeConfig.box,
  navigationSize: themeConfig.navigationSize,
  activeStyle: themeConfig.activeStyle,
  sideBarColor: '#091c22',
  semiDark: true,
  menuMode: "side",
  showMenus: false,
  headerViewMode: "default",
  headerOverflow: 'wrap',
  headerBorderLeft: true,
  semiDarkAffectHeaders: false,
};


export const SettingsContext = createContext({
  saveSettings: () => null,
  settings: initialSettings
})

export const SettingsProvider = ({ children }) => {

  const [settings, setSettings] = useState({ ...initialSettings })
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      const ls = localStorage.getItem("settings");
      if(ls) {
         const parsed = JSON.parse(ls) 
         setSettings((prev)=>parsed)
      }
    }
  },[])
  // ** State

  const saveSettings = updatedSettings => {
    if (typeof window !== 'undefined') {
      if(updatedSettings?.mode) {
        localStorage.setItem("settings",JSON.stringify(updatedSettings))
        setSettings(updatedSettings)
      }
    }
  }

  return <SettingsContext.Provider value={{ settings, saveSettings }}>{children}</SettingsContext.Provider>
}

export const SettingsConsumer = SettingsContext.Consumer
