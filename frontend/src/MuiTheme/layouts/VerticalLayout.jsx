// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Fab from '@mui/material/Fab'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

// ** Icons Imports
import ArrowUp from 'mdi-material-ui/ArrowUp'

// ** Theme Config Import
import themeConfig from '../../configs/themeConfig'

// ** Components
import AppBar from './components/vertical/appBar'
import Navigation from './components/vertical/navigation'
import Footer from './components/shared-components/footer'
import ScrollToTop from '../../MuiTheme/components/scroll-to-top'

// ** Styled Component
import DatePickerWrapper from '../../MuiTheme/styles/libs/react-datepicker'

import {motion} from 'framer-motion';
import { minHeight } from '@mui/system'
import HorizontalMenu from './components/horizontal/HorizontalMenu'

import { useSelector } from 'react-redux'

const VerticalLayoutWrapper = styled('div')({
  height: '100%',
  display: 'flex'
})

const MainContentWrapper = styled(Box)({
  flexGrow: 1,
  minWidth: 0,
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column'
})

const ContentWrapper = styled('main')(({ theme }) => ({
  flexGrow: 1,
  width: '100%',
  padding: theme.spacing(6),
  transition: 'padding .25s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4)
  }
}))

const VerticalLayout = props => {
  // ** Props
  const { settings, children, scrollToTop } = props
  // ** Vars
  const { contentWidth } = settings
  const navWidth = themeConfig.navigationSize
  
  // ** States
  const [navVisible, setNavVisible] = useState(false)

  // ** Toggle Functions
  const toggleNavVisibility = () => setNavVisible(!navVisible)

  const showMenus = useSelector(state=>state?.common?.showMenus)
  
  return (
    <>
    <VerticalLayoutWrapper className='layout-wrapper'>
    {settings?.menuMode != "top" &&
      <Navigation
        navWidth={navWidth}
        navVisible={navVisible}
        setNavVisible={setNavVisible}
        toggleNavVisibility={toggleNavVisibility}
        {...props}
      />
    }
    <MainContentWrapper className='layout-content-wrapper'>
      <AppBar settings={settings} toggleNavVisibility={toggleNavVisibility} verticalAppBarContent={props.verticalAppBarContent} />
      {
      <motion.div
       className='w-full mt-0'
       animate={{
        height: showMenus ? 'auto' : 0,
       }}
      >
        {
          <motion.div
            animate={{
              height: showMenus ? '' : 0,
              display: showMenus ? 'block' : 'none'
            }}
          >
            <HorizontalMenu />
          </motion.div>
        }
      </motion.div>}
      <ContentWrapper
        className='layout-page-content'
        sx={{
          ...(contentWidth === 'boxed' && {
            mx: 'auto',
            //'@media (min-width:1440px)': { maxWidth: 1440 },
            '@media (min-width:1200px)': { maxWidth: '100%' }
          }),
        }}
      >
        {children}
      </ContentWrapper>

      {/* <Footer settings={settings}/> */}

      <DatePickerWrapper sx={{ zIndex: 11 }}>
        <Box id='react-datepicker-portal'></Box>
      </DatePickerWrapper>
    </MainContentWrapper>
  </VerticalLayoutWrapper>

      {scrollToTop ? (
        scrollToTop(props)
      ) : (
        <ScrollToTop className='mui-fixed'>
          <Fab color='primary' size='small' aria-label='scroll back to top'>
            <ArrowUp />
          </Fab>
        </ScrollToTop>
      )}
    </>
  )
}

export default VerticalLayout
