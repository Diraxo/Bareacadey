import { Avatar, Card } from '@mui/material'
import React from 'react'
import {useTheme} from '@mui/material/styles';
import { useSettings } from '../../../MuiTheme/hooks/useSettings';

const OtherChatItem = ({chat, url}) => {
  const theme = useTheme();
  const {settings} = useSettings();
  const mode = settings?.mode;

  return (
    <div className='flex gap-2'>
    <Card
      style={{
        fontSize: 15,
        backgroundColor: theme.palette.primary.main,
        color: 'white',
      }}
      className="w-fit px-3 py-2"
    >
        {chat?.message}
    </Card>
    <Avatar
      src={url}
      sx={{
        width: 32,
        height: 32
      }}
    />
    </div>
  )
}

export default OtherChatItem