// ** MUI Imports
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Layout Imports
// !Do not remove this Layout import
import VerticalLayout from '../../MuiTheme/layouts/VerticalLayout'

// ** Navigation Imports
import VerticalNavItems from '../../navigation/vertical'

// ** Component Import
import VerticalAppBarContent from './components/vertical/AppBarContent'

// ** Hook Import
import { useSettings } from '../../MuiTheme/hooks/useSettings'
import { Outlet } from 'react-router-dom'

const UserLayout = ({ children }) => {
  const { settings, saveSettings } = useSettings()

  const hidden = useMediaQuery(theme => theme.breakpoints.down('lg'))

  return (
    <VerticalLayout
      hidden={hidden}
      settings={settings}
      saveSettings={saveSettings}
      verticalNavItems={VerticalNavItems()} // Navigation Items
      afterVerticalNavMenuContent={<p>Bottom</p>}
      verticalAppBarContent={(
        props // AppBar Content
      ) => (
        <VerticalAppBarContent
          hidden={hidden}
          settings={settings}
          saveSettings={saveSettings}
          toggleNavVisibility={props.toggleNavVisibility}
        />
      )}
    >
      {children}
      <Outlet/>
    </VerticalLayout>
  )
}

export default UserLayout
