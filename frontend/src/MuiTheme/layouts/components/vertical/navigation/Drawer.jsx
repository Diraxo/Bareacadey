// ** MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import MuiSwipeableDrawer from '@mui/material/SwipeableDrawer'

const SwipeableDrawer = styled(MuiSwipeableDrawer)({
  overflowX: 'hidden',
  transition: 'width .25s ease-in-out',
  '& ul': {
    listStyle: 'none'
  },
  '& .MuiListItem-gutters': {
    paddingLeft: 4,
    paddingRight: 4
  },
  '& .MuiDrawer-paper': {
    left: 'unset',
    right: 'unset',
    overflowX: 'hidden',
    transition: 'width .25s ease-in-out, box-shadow .25s ease-in-out'
  }
})

const Drawer = props => {
  // ** Props
  const { hidden, children, navWidth, navVisible, setNavVisible, settings } = props

  // ** Hook
  const theme = useTheme()

  // Drawer Props for Mobile & Tablet screens
  const MobileDrawerProps = {
    open: navVisible,
    onOpen: () => setNavVisible(true),
    onClose: () => setNavVisible(false),
    ModalProps: {
      keepMounted: true 
    }
  }

  // Drawer Props for Desktop screens
  const DesktopDrawerProps = {
    open: true,
    onOpen: () => null,
    onClose: () => null
  }

  return (
    <SwipeableDrawer
      className='layout-vertical-nav'
      variant={hidden ? 'temporary' : 'permanent'}
      {...(hidden ? { ...MobileDrawerProps } : { ...DesktopDrawerProps })}
      PaperProps={{ sx: { width: navWidth, zIndex: 0 } }}
      sx={{
        width: navWidth,
        '& .MuiDrawer-paper': {
          backgroundColor:  settings?.mode==='light' && settings?.semiDark ? settings?.sideBarColor : settings.mode==='light' ?  'white' :  theme.palette.background.default,
          borderRight: settings?.box==="border" || hidden || settings?.mode==='dark' ? `1px solid ${theme.palette.customColors.borderColor}` : ''
        }
      }}
    >
      {children}
    </SwipeableDrawer>
  )
}

export default Drawer
