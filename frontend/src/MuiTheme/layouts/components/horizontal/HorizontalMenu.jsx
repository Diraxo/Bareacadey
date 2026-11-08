import React from 'react'
import NavigationItems from '../../../../navigation/vertical'
import VerticalNavItems from './navigation/VerticalNavItems'
import { useSettings } from '../../../hooks/useSettings'
import {useTheme} from '@mui/material/styles'

const HorizontalMenu = () => {
const theme = useTheme()
const { settings, saveSettings } = useSettings()

//backgroundColor: settings?.mode==='light' && settings?.semiDark ? settings?.sideBarColor : settings.mode==='light' ?  'white' :  theme.palette.background.default,

  return (
    <div className={`w-full z-10 ${settings?.mode=="light" && settings?.semiDark && settings?.semiDarkAffectHeaders ? "border-t-2 bg-gray-1000" : ""} shadow-2 border`}
     style={{
      borderColor: theme?.palette?.customColors?.borderColor, 
      borderTopColor: settings?.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "rgba(255,255,255,.05)" : theme?.palette?.customColors?.borderColor, 
      backgroundColor: settings?.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? settings?.sideBarColor : settings.mode==='light' ?  '#f5f5f5' :  theme.palette.background.default,}}>
        <VerticalNavItems verticalNavItems={NavigationItems()} 
          settings={settings}
          saveSettings={saveSettings}
        />
    </div>
  )
}

export default HorizontalMenu