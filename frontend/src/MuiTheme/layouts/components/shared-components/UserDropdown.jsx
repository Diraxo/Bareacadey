// ** React Imports
import { useState, Fragment } from 'react'

// ** Next Import
import { useNavigate } from 'react-router-dom'

// ** MUI Imports
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** react icons
import {MdPersonOutline, MdHistory, MdEventAvailable} from 'react-icons/md'
import {HiOutlineEnvelope, HiOutlineChatBubbleLeftRight} from 'react-icons/hi2'
import {AiOutlineSetting} from 'react-icons/ai'
import {IoHomeOutline, IoLogOutOutline} from 'react-icons/io5'

import { A3 } from '../../../../assets/avatars'
import { useSelector } from 'react-redux'

// ** Styled Components
const BadgeContentSpan = styled('span')(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
}))

const UserDropdown = ({settings}) => {
  // ** States
  const [anchorEl, setAnchorEl] = useState(null)

  const userInfo = useSelector((state) => state.auth.user);

  // ** Hooks
  const navigate = useNavigate()

  const handleDropdownOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = url => {
    if (url) {
      navigate(url)
    }
    setAnchorEl(null)
  }

  const styles = {
    py: 2,
    px: 4,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    color: 'text.primary',
    textDecoration: 'none',
    '& svg': {
      fontSize: '1.375rem',
      color: 'text.secondary'
    }
  }



  return (
    <Fragment>
      <Badge
        overlap='circular'
        onClick={handleDropdownOpen}
        sx={{ ml: 2, cursor: 'pointer', position: 'relative', zIndex: 0 }}
        badgeContent={<BadgeContentSpan />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Avatar
          alt={userInfo.full_name ?? ""}
          onClick={handleDropdownOpen}
          sx={{ width: 40, height: 40 }}
          src={userInfo.img_url??"/user.png"}
        />
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ '& .MuiMenu-paper': { width: 230, marginTop: 4 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          style: {
            border: settings.mode==="dark" ? `1px solid rgba(255,255,255,.1)` : ''
          }
        }}
      >
        <Box sx={{ pt: 2, pb: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              overlap='circular'
              badgeContent={<BadgeContentSpan />}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Avatar alt={userInfo.full_name ?? ""} src={userInfo.img_url??"/user.png"} sx={{ width: '2.5rem', height: '2.5rem' }} imgProps={{crossOrigin: "anonymous"}}/>
            </Badge>
            <Box sx={{ display: 'flex', marginLeft: 3, alignItems: 'flex-start', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 600 }}>{userInfo?.full_name}</Typography>
              <Typography variant='body2' sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                {userInfo.role}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mt: 0, mb: 1 }} />
        <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/admin/main/profile_update')}>
          <Box sx={styles}>
            <MdPersonOutline style={{ marginRight: 8 }} size={22} />
            Profile
          </Box>
        </MenuItem>
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose()}>
          <Box sx={styles}>
            <HiOutlineEnvelope style={{ marginRight: 10 }} size={20} />
            Inbox
          </Box>
        </MenuItem> */}
        <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/admin/main/chat')}>
          <Box sx={styles}>
            <HiOutlineChatBubbleLeftRight style={{ marginRight: 9 }} size={21}/>
            Chat
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/admin/main/settings')}>
          <Box sx={styles}>
            <AiOutlineSetting style={{ marginRight: 9 }} size={21}/>
            Settings
          </Box>
        </MenuItem>
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/admin/main/activities')}>
          <Box sx={styles}>
            <MdHistory style={{ marginRight: 9 }} size={21} />
            Activities
          </Box>
        </MenuItem> */}
        <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/admin/main/mytasks')}>
          <Box sx={styles}>
            <MdEventAvailable style={{ marginRight: 9 }} size={21} />
            My Tasks
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem sx={{ py: 2 }} onClick={() => handleDropdownClose('/')}>
          <IoHomeOutline style={{ marginRight: 8 }} size={20}/>
          Home Page
        </MenuItem>
        <MenuItem sx={{ py: 2 }} onClick={() => handleDropdownClose('/admin/main/logout')}>
          <IoLogOutOutline style={{ marginRight: 8 }} size={22}/>
          Logout
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export default UserDropdown
