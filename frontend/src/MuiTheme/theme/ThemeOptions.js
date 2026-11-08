// ** MUI Theme Provider
import { deepmerge } from '@mui/utils'
import themeConf from '../../configs/themeConfig'
// ** Theme Override Imports
import palette from './palette'
import spacing from './spacing'
import shadows from './shadows'
import breakpoints from './breakpoints'

const themeOptions = settings => {
  // ** Vars
  const { mode, themeColor, font } = settings

  const themeConfig = {
    palette: palette(mode, themeColor),
    typography: {
      fontFamily: font
    },
    shadows: shadows(mode),
    ...spacing,
    breakpoints: breakpoints(),
    shape: {
      borderRadius: 6
    },
    mixins: {
      toolbar: {
        minHeight: 64
      }
    }
  }

  return deepmerge(themeConfig, {
    direction: 'ltr',
    palette: {
      primary: {
        ...themeConfig.palette[themeColor]
      }
    },
  })
}

export default themeOptions
