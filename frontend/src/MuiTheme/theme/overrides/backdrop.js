// ** Util Import
import { hexToRGBA } from '../../utils/hex-to-rgba'

const Backdrop = theme => {
  return {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor:
            theme.palette.mode === 'light'
              ? `rgba(${theme.palette.customColors.main}, 0.7)`
              : 'rgba(5, 6, 10, 0.72)',
          ...(theme.palette.mode === 'dark' && { backdropFilter: 'blur(3px)' })
        },
        invisible: {
          backgroundColor: 'transparent'
        }
      }
    }
  }
}

export default Backdrop
