import { useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTab from '@mui/material/Tab'

import TabAccount from './tabs/BasicInfo'
import Credentials from './tabs/Credentials'
import GeneralSettings from './tabs/GeneralSettings'
import EmailConfiguration from './tabs/EmailConfiguration'

import 'react-datepicker/dist/react-datepicker.css'

import {AiOutlineSetting, AiOutlineUnorderedList, AiOutlineCloudUpload} from 'react-icons/ai'
import {MdOutlineColorLens, MdOutlineEmail, MdOutlinePersonOutline, MdLockOutline} from 'react-icons/md'
import {BsCreditCard} from 'react-icons/bs';
import Currency from './tabs/Currency'
import { useSelector } from 'react-redux'

const Tab = styled(MuiTab)(({ theme }) => ({
//   [theme.breakpoints.down('md')]: {
//     minWidth: 100
//   },
//   [theme.breakpoints.down('sm')]: {
//     minWidth: 67
//   }
}))

const TabName = styled('span')(({ theme }) => ({
  lineHeight: 1.71,
  fontSize: '0.875rem',
  marginLeft: theme.spacing(2.4),
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))

const Settings = () => {
  // ** State
  const [value, setValue] = useState('general')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const user = useSelector(state=>state?.auth?.user?.id)

  return (
    <Card>
      <TabContext value={value}>
        <TabList
          onChange={handleChange}
          aria-label='account-settings tabs'
          sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
          variant="scrollable"
        >
          {/* <Tab
            value='account'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MdOutlinePersonOutline />
                <TabName>Account</TabName>
              </Box>
            }
          />
          <Tab
            value='security'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MdLockOutline />
                <TabName>Credentials</TabName>
              </Box>
            }
          /> */}
          <Tab
            value='general'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AiOutlineSetting />
                <TabName>General Settings</TabName>
              </Box>
            }
          />
          {user && user==1 &&
          <Tab
             value='currency'
             label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BsCreditCard />
                <TabName>Currency</TabName>
              </Box>
            }
          />}
         
          {/* <Tab
            value='theme'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MdOutlineColorLens />
                <TabName>Theme Settings</TabName>
              </Box>
            }
          /> */}
          {/* <Tab
            value='model'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AiOutlineUnorderedList />
                <TabName>Model Config</TabName>
              </Box>
            }
          /> */}
          {/* <Tab
            value='email'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MdOutlineEmail />
                <TabName>Email Config</TabName>
              </Box>
            }
          /> */}
          {/* <Tab
            value='upload'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AiOutlineCloudUpload />
                <TabName>Upload Config</TabName>
              </Box>
            }
          />
          <Tab
            value='payment'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BsCreditCard />
                <TabName>Payment Gateway</TabName>
              </Box>
            }
          /> */}
          
        </TabList>

        <TabPanel sx={{ p: 0 }} value='account'>
          <TabAccount />
        </TabPanel>
        <TabPanel sx={{ p: 0 }} value='security'>
          <Credentials />
        </TabPanel>
        <TabPanel sx={{ p: 0 }} value='general'>
          <GeneralSettings />
        </TabPanel>
        <TabPanel sx={{ p: 0 }} value='email'>
          <EmailConfiguration />
        </TabPanel>
        <TabPanel sx={{p: 0}} value='currency'>
          <Currency />
        </TabPanel>
        
      </TabContext>
    </Card>
  )
}

export default Settings