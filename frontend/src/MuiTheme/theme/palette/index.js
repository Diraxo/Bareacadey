const DefaultPalette = (mode, themeColor) => {
  // ** Vars
  const lightColor = '58, 53, 65'
  const darkColor = '236, 238, 245'
  const mainColor = mode === 'light' ? lightColor : darkColor

  const primaryGradient = () => {
    if (themeColor === 'primary') {
      return '#C6A7FE'
    } else if (themeColor === 'secondary') {
      return '#9C9FA4'
    } else if (themeColor === 'success') {
      return '#93DD5C'
    } else if (themeColor === 'error') {
      return '#FF8C90'
    } else if (themeColor === 'warning') {
      return '#FFCF5C'
    } else if(themeColor === "purple") {
      return '#c19ffe'
    } else {
      return '#6ACDFF'
    }
  }

  return {
    customColors: {
      main: mainColor,
      primaryGradient: primaryGradient(),
      tableHeaderBg: mode === 'light' ? '#F9FAFC' : '#171B24',
      surfaceRaised: mode === 'light' ? '#FFFFFF' : '#171B24',
      surfaceSunken: mode === 'light' ? '#F4F5FA' : '#0E1117',
      borderColor: mode==='light' ? 'rgba(0,0,0,.1)' : 'rgba(255,255,255,.08)', 
      shade: mode==='light' ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.04)' 
    },
    common: {
      black: '#000',
      white: '#FFF'
    },
    mode: mode,
    primary: {
      light: mode === 'light' ? '#9E69FD' : '#B794FF',
      main: mode === 'light' ? '#9155FD' : '#A47CFF',
      dark: mode === 'light' ? '#804BDF' : '#8B5CF6',
      contrastText: '#FFF'
    },
    secondary: {
      light: '#9C9FA4',
      main: mode === 'light' ? '#8A8D93' : '#98A2B3',
      dark: '#777B82',
      contrastText: '#FFF'
    },
    success: {
      light: '#6AD01F',
      main: mode === 'light' ? '#1ea966' : '#2FBF7F',
      dark: '#4CB200',
      contrastText: '#FFF'
    },
    error: {
      light: '#FF6166',
      main: mode === 'light' ? '#FF4C51' : '#FF6B70',
      dark: '#E04347',
      contrastText: '#FFF'
    },
    warning: {
      light: '#FFCA64',
      main: '#FFB400',
      dark: '#E09E00',
      contrastText: '#FFF'
    },
    info: {
      light: '#32BAFF',
      main: '#16B1FF',
      dark: '#139CE0',
      contrastText: '#FFF'
    },
    purple: {
      light: '#b39ddb',
      main: mode === 'light' ? '#9155fd' : '#A47CFF',
      dark: '#6e3dd0',
      contrastText: '#fff',
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#12151C',
      A100: '#D5D5D5',
      A200: '#AAAAAA',
      A400: '#616161',
      A700: '#303030'
    },
    text: {
      primary: mode === 'light' ? `rgba(${mainColor}, 0.87)` : `rgba(${mainColor}, 0.92)`,
      secondary: mode === 'light' ? `rgba(${mainColor}, 0.68)` : `rgba(${mainColor}, 0.62)`,
      disabled: `rgba(${mainColor}, 0.38)`
    },
    divider: mode === 'light' ? `rgba(${mainColor}, 0.12)` : 'rgba(255, 255, 255, 0.08)',
    background: {
      paper: mode === 'light' ? '#FFF' : '#12151C',
      default: mode === 'light' ? '#F4F5FA' : '#0B0D12',
    },
    action: {
      active: `rgba(${mainColor}, 0.54)`,
      hover: `rgba(${mainColor}, ${mode === 'light' ? 0.04 : 0.05})`,
      selected: mode === 'light' ? `rgba(${mainColor}, 0.08)` : 'rgba(164, 124, 255, 0.14)',
      disabled: `rgba(${mainColor}, 0.3)`,
      disabledBackground: `rgba(${mainColor}, 0.18)`,
      focus: `rgba(${mainColor}, 0.12)`
    }
  }
}

export default DefaultPalette
