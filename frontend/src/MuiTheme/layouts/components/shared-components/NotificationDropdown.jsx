// ** React Imports
import { useState, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MuiMenu from '@mui/material/Menu'
import MuiAvatar from '@mui/material/Avatar'
import MuiMenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import BellOutline from 'mdi-material-ui/BellOutline'

import {IoMdNotificationsOutline} from 'react-icons/io'; 

// ** Third Party Components
import PerfectScrollbarComponent from 'react-perfect-scrollbar'

import formatDistanceToNow from 'date-fns/formatDistanceToNow'
// ** Styled Menu component
const Menu = styled(MuiMenu)(({ theme }) => ({
  '& .MuiMenu-paper': {
    width: 380,
    overflow: 'hidden',
    marginTop: theme.spacing(4),
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  },
  '& .MuiMenu-list': {
    padding: 0
  }
}))

// ** Styled MenuItem component
const MenuItem = styled(MuiMenuItem)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`
}))

const styles = {
  maxHeight: 349,
  '& .MuiMenuItem-root:last-of-type': {
    border: 0
  },
}
// ** Styled PerfectScrollbar component
const PerfectScrollbar = styled(PerfectScrollbarComponent)({
  ...styles
})

// ** Styled Avatar component
const Avatar = styled(MuiAvatar)({
  width: '2.375rem',
  height: '2.375rem',
  fontSize: '1.125rem'
})

// ** Styled component for the title in MenuItems
const MenuItemTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  flex: '1 1 100%',
  overflow: 'hidden',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  marginBottom: theme.spacing(0.75)
}))

// ** Styled component for the subtitle in MenuItems
const MenuItemSubtitle = styled(Typography)({
  flex: '1 1 100%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis'
})

const NotificationDropdown = ({settings}) => {
  // ** States
  const [anchorEl, setAnchorEl] = useState(null)

  // ** Hook
  const hidden = useMediaQuery(theme => theme.breakpoints.down('lg'))

  const handleDropdownOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = () => {
    setAnchorEl(null)
  }

  const ScrollWrapper = ({ children }) => {
    if (hidden || true) {
      return <Box sx={{ ...styles, overflowY: 'auto', overflowX: 'hidden' }}>{children}</Box>
    } else {
      return (
        <PerfectScrollbar options={{ wheelPropagation: true, suppressScrollX: true}}>{children}</PerfectScrollbar>
      )
    }
  }

  //formatDistanceToNow(new Date(notification.timestamp));
  const [notifications, setNotifications] = useState([
    // {
    //   id: 1,
    //   type: "inbox",
    //   title: "New Support Request",
    //   message: "You have a new support request from John Doe regarding account issues.",
    //   timestamp: "2023-02-11T23:30:00Z",
    //   seen: false,
    //   user: {
    //     name: "John Doe",
    //     url: "/user/johndoe"
    //   }
    // },
    // {
    //   id: 2,
    //   type: "chat",
    //   title: "New Chat Message",
    //   message: "Jane Smith would like to discuss a product feature.",
    //   timestamp: "2023-02-08T11:15:00Z",
    //   seen: false,
    //   user: {
    //     name: "Jane Smith",
    //     url: "/user/janesmith"
    //   }
    // },
    // {
    //   id: 3,
    //   type: "activity",
    //   title: "New User Signup",
    //   message: "A new user has signed up and is waiting for approval.",
    //   timestamp: "2023-02-08T12:00:00Z",
    //   seen: true,
    //   user: {
    //     name: "New User",
    //    // url: "/user/newuser"
    //   }
    // },
    // {
    //   id: 4,
    //   type: "activity",
    //   title: "System Upgrade",
    //   message: "The system will undergo a scheduled upgrade tonight at 10 PM.",
    //   timestamp: "2023-02-08T13:00:00Z",
    //   seen: false,
    //   user: {
    //     name: "System Admin",
    //    // url: "/user/systemadmin"
    //   }
    // },
    // {
    //   id: 5,
    //   type: "activity",
    //   title: "Product Update",
    //   message: "A new version of the product is now available. Please update to ensure the best experience.",
    //   timestamp: "2023-02-09T01:00:00Z",
    //   seen: false,
    //   user: {
    //     name: "Product Manager",
    //     //url: "/user/productmanager"
    //   }
    // },
  ])

  return (
    <Fragment>
      <IconButton color='inherit' aria-haspopup='true' onClick={handleDropdownOpen} aria-controls='customized-menu'>
        <IoMdNotificationsOutline size={26}/>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleDropdownClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          style: {
            border: settings.mode==="dark" ? `1px solid rgba(255,255,255,.1)` : ''
          }
        }}
      >
        <MenuItem disableRipple>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography sx={{ fontWeight: 600 }}>Notifications</Typography>
            {notifications?.length > 0 &&
            <Chip
              size='small'
              label={notifications?.length+" New"}
              color='primary'
              sx={{ height: 20, fontSize: '0.75rem', fontWeight: 500, borderRadius: '10px' }}
            />}
          </Box>
        </MenuItem>
        <ScrollWrapper>

        {notifications.map((not,ind)=>{
           return (
           <MenuItem onClick={handleDropdownClose} key={ind}>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <Avatar alt={not.type=="activity"? "A" : ""} src={not.user.url} sx={{ bgcolor: not.user.url ? '' : 'green', color:'white' }}/>
                <Box sx={{ mx: 4, flex: '1 1', display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
                  <MenuItemTitle style={{fontSize:'1rem', fontWeight: 600, lineHeight: 1.5}}>{not.title}</MenuItemTitle>
                  <MenuItemSubtitle style={{fontSize:'0.975rem', fontWeight: 400, lineHeight: 1.5}} variant='body2'>{not.message}</MenuItemSubtitle>
                </Box>
                <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                  {formatDistanceToNow(new Date(not.timestamp))}
                </Typography>
              </Box>
            </MenuItem>
           );
        })}
        {notifications?.length <= 0 && 
          <MenuItem>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
             <div className='flex p-4 items-center gap-2 justify-center w-full' style={{minHeight: 50}}>
                <IoMdNotificationsOutline size={24} style={{marginTop: 1}}/>
                <p className='flex items-center justify-center font-bold'>No Notifications Found</p>
             </div>
          </Box>
        </MenuItem> 
        }
          {/* <MenuItem onClick={handleDropdownClose}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <Avatar alt='Flora' src='/images/avatars/4.png' />
              <Box sx={{ mx: 4, flex: '1 1', display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
                <MenuItemTitle>Congratulation Flora! 🎉</MenuItemTitle>
                <MenuItemSubtitle variant='body2'>Won the monthly best seller badge</MenuItemSubtitle>
              </Box>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                Mon
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleDropdownClose}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ color: 'common.white', backgroundColor: 'primary.main' }}>VU</Avatar>
              <Box sx={{ mx: 4, flex: '1 1', display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
                <MenuItemTitle>New user registered.</MenuItemTitle>
                <MenuItemSubtitle variant='body2'>5 hours ago</MenuItemSubtitle>
              </Box>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                Yesterday
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleDropdownClose}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <Avatar alt='message' src='/images/avatars/5.png' />
              <Box sx={{ mx: 4, flex: '1 1', display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
                <MenuItemTitle>New message received 👋🏻</MenuItemTitle>
                <MenuItemSubtitle variant='body2'>You have 10 unread messages</MenuItemSubtitle>
              </Box>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                11 Aug
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleDropdownClose}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <img width={38} height={38} alt='paypal' src='/images/misc/paypal.png' />
              <Box sx={{ mx: 4, flex: '1 1', display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
                <MenuItemTitle>Paypal</MenuItemTitle>
                <MenuItemSubtitle variant='body2'>Received Payment</MenuItemSubtitle>
              </Box>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                25 May
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleDropdownClose}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <Avatar alt='order' src='/images/avatars/3.png' />
              <Box sx={{ mx: 4, flex: '1 1', display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
                <MenuItemTitle>Revised Order 📦</MenuItemTitle>
                <MenuItemSubtitle variant='body2'>New order revised from john</MenuItemSubtitle>
              </Box>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                19 Mar
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleDropdownClose}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <img width={38} height={38} alt='chart' src='/images/misc/chart.png' />
              <Box sx={{ mx: 4, flex: '1 1', display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
                <MenuItemTitle>Finance report has been generated</MenuItemTitle>
                <MenuItemSubtitle variant='body2'>25 hrs ago</MenuItemSubtitle>
              </Box>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                27 Dec
              </Typography>
            </Box>
          </MenuItem> */}
        </ScrollWrapper>
        <MenuItem
          disableRipple
          sx={{ py: 3.5, backgroundColor: theme => theme.palette.background.paper, borderBottom: 0, borderTop: theme => `1px solid ${theme.palette.divider}`,  }}
          
        >
          <Button fullWidth variant='contained' onClick={handleDropdownClose}>
            Read All Notifications
          </Button>
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export default NotificationDropdown
