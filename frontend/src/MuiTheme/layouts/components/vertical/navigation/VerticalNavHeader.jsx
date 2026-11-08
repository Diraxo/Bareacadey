// ** Next Import
import { Link } from 'react-router-dom'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Configs
import themeConfig from '../../../../../configs/themeConfig'
import Logo from '../../../../../assets/logo.png'

import {IoIosClose} from 'react-icons/io'

// ** Styled Components
const MenuHeaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: theme.spacing(4.5),
  transition: 'padding .25s ease-in-out',
  minHeight: theme.mixins.toolbar.minHeight
}))

const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  lineHeight: 'normal',
  textTransform: 'uppercase',
  color: theme.palette.text.primary,
  transition: 'opacity .25s ease-in-out, margin .25s ease-in-out'
}))

const StyledLink = styled('span')({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none'
})

const VerticalNavHeader = props => {
  // ** Props
  const { verticalNavMenuBranding: userVerticalNavMenuBranding, settings, hidden } = props
  // ** Hooks
  const theme = useTheme()
  return (
    <MenuHeaderWrapper className='nav-header' sx={{ pl: 2, mb: 4 }}>
      {userVerticalNavMenuBranding ? (
        userVerticalNavMenuBranding(props)
      ) : (
        <Link to='/'>
          <StyledLink>
            <img 
              src={Logo} 
              style={{width: 55, height: 50}} />
           
            <HeaderTitle variant='h6' sx={{ ml: 3 }} style={{fontFamily: settings.font, textTransform: 'uppercase', fontSize: 23, color: settings.mode==='light' && settings?.semiDark ? '#cecae3' : ''}}>
              {/* {themeConfig.templateName} */}
              <div className='flex justify-between items-center' style={{minWidth: 130}}>
                 <p>Admin</p>
                  {/* {hidden && <IoIosClose onClick={()=>{props.toggleNavVisibility()}} size={27} className="hover:curser-pointer"/>} */}
              </div>
            </HeaderTitle>
          </StyledLink>
        </Link>
      )}
    </MenuHeaderWrapper>
  )
}

export default VerticalNavHeader
