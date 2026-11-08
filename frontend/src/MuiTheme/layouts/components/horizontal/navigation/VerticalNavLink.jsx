// ** Next Imports
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import ListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton from '@mui/material/ListItemButton'

import { useDispatch } from 'react-redux'
// ** Configs Import
import themeConfig from '../../../../../configs/themeConfig'

// ** Custom Components Imports
import UserIcon from '../../../../../components/layouts/components/UserIcon'
import { setShowMenus } from '../../../../../app/slices/commonSlice'

// ** Utils
// import { handleURLQueries } from '../../../utils'


const VerticalNavLink = ({ item, navVisible, toggleNavVisibility, settings }) => {

  const dispatch = useDispatch()
  // ** Styled Components
  const activeStyle=1;
  const MenuNavLink = styled(ListItemButton)(({ theme }) => ({
    width: activeStyle==0 ?  themeConfig.navigationSize-15 : themeConfig.navigationSize-10,
    borderTopRightRadius: activeStyle==0 ? 100 : 5,
    borderBottomRightRadius: activeStyle==0 ? 100 : 5,
    borderTopLeftRadius: activeStyle==0 ? 0 : 5,
    borderBottomLeftRadius: activeStyle==0 ? 0 : 5,
    marginLeft: activeStyle==0 ? 0 : 0,
    color: theme.palette.text.primary,
    padding: theme.spacing(2.25, 3.5),
    transition: 'opacity .25s ease-in-out',
    '&.active, &.active:hover': {
      boxShadow: theme.shadows[3],
      backgroundImage: `linear-gradient(98deg, ${theme.palette.customColors.primaryGradient}, ${theme.palette.primary.main} 94%)`
    },
    '&.active .MuiTypography-root, &.active .MuiSvgIcon-root': {
      color: `${theme.palette.common.white} !important`
    }
  }))
  
  const MenuItemTextMetaWrapper = styled(Box)({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'opacity .25s ease-in-out',
    ...(themeConfig.menuTextTruncate && { overflow: 'hidden' })
  })
  // ** Hooks
  const router = useLocation()
  const IconTag = item.icon

  const getModelName = (path) => {
    const parts = path.split("/");
    const numPathsToSkip = 3; 
    if(parts.slice(numPathsToSkip)[0]) {
      return parts[0]+'/'+parts[1]+'/'+parts[2]+'/'+parts.slice(numPathsToSkip)[0];
    }
    else {
      return parts[0]+'/'+parts[1]+'/'+parts[2]
    }
  };

  const isNavLinkActive = () => {
    if (getModelName(router.pathname) === item.path) {
      return true
    } else {
      return false
    }
  }

  return (
    <ListItem
      disablePadding
      className='nav-link'
      disabled={item.disabled || false}
      sx={{ mt: 1.5, px: '0 !important' }}
    >
      <Link to={item.path === undefined ? '/' : `${item.path}`} {...(item.openInNewTab ? { target: '_blank' } : null)}>
        <MenuNavLink
          component={'span'}
          className={isNavLinkActive() ? 'active' : ''}
          {...(item.openInNewTab ? { target: '_blank' } : null)}
          onClick={e => {
            dispatch(
              setShowMenus(false)
            )
            if (item.path === undefined) {
              e.preventDefault()
              e.stopPropagation()
            }
            if (navVisible) {
              toggleNavVisibility()
            }
          }}
          sx={{
            pl: 3.5,
            ...(item.disabled ? { pointerEvents: 'none' } : { cursor: 'pointer' })
          }}
        >
          <ListItemIcon
            sx={{
              mr: 2.5,
              color: settings.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "#cecae3" : '',
              transition: 'margin .25s ease-in-out'
            }}
          >
            <UserIcon icon={IconTag} isNavLinkActive={isNavLinkActive}/>
          </ListItemIcon>

          <MenuItemTextMetaWrapper>
            <Typography {...(themeConfig.menuTextTruncate && { noWrap: true })} style={{color: settings.mode==='light' && settings?.semiDark && settings?.semiDarkAffectHeaders ? "#cecae3" : '',}}>{item.title}</Typography>
            {item.badgeContent ? (
              <Chip
                label={item.badgeContent}
                color={item.badgeColor || 'primary'}
                sx={{
                  height: 20,
                  fontWeight: 500,
                  marginLeft: 1.25,
                  '& .MuiChip-label': { px: 1.5, textTransform: 'capitalize' }
                }}
              />
            ) : null}
          </MenuItemTextMetaWrapper>
        </MenuNavLink>
      </Link>
    </ListItem>
  )
}

export default VerticalNavLink
