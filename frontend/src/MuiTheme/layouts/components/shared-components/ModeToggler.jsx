import IconButton from '@mui/material/IconButton'

import {BsMoonStars} from 'react-icons/bs'
import {FiSun} from 'react-icons/fi'

import { useEffect } from 'react'
import {useTheme} from '@mui/material/styles'

const ModeToggler = props => {
  // ** Props
  const { settings, saveSettings } = props
 
  const handleModeChange = mode => {
    saveSettings({ ...settings, mode })
  }

  const handleModeToggle = () => {
    if (settings.mode === 'light') {
      handleModeChange('dark')
    } else {
      handleModeChange('light')
    }
  }

  const theme = useTheme()

  useEffect(() => {
    let link;
    if (settings.mode === 'light') {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = '/themes/mdc-light-indigo/theme.css';
      document.head.appendChild(link);
    } else if (settings.mode === 'dark') {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = '/themes/mdc-dark-indigo/theme.css';
      document.head.appendChild(link);
    }
    return () => {
      document.head.removeChild(link);
    };
  }, [settings.mode]);

  useEffect(()=>{
    // const tables = document.getElementsByTagName("table");
    // const font = settings.font;

    // for (let i = 0; i < tables.length; i++) {
    //   tables[i].style.fontFamily = font;
    // }

    switch (settings.mode) {
      case 'light':
        document.documentElement.classList.remove('dark');
        document.documentElement.style.setProperty('--primary-color', theme.palette.primary.dark);
        break;
      case 'dark':
        document.documentElement.classList.add('dark');
        document.documentElement.style.setProperty('--primary-color', theme.palette.primary.dark);
        break;
      case 'system':
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
        break;
      default:
        break;
    }
  },[settings.mode])


  return (
    <IconButton color='inherit' aria-haspopup='true' onClick={handleModeToggle}>
        {settings.mode === 'dark' ? <FiSun size={22}/> : <BsMoonStars size={19}/>}
    </IconButton>
  )
}

export default ModeToggler
