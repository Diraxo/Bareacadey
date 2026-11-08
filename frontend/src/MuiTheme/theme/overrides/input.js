const input = theme => {
  return {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: theme.palette.text.secondary,
          
        }
      }
    },
    MuiInput: {
      styleOverrides: {
        root: {
          '&:before': {
            borderBottom: `1px solid rgba(${theme.palette.customColors.main}, 0.22)`
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottom: `1px solid rgba(${theme.palette.customColors.main}, 0.32)`
          },
          '&.Mui-disabled:before': {
            borderBottom: `1px solid ${theme.palette.text.disabled}`
          }
        }
      }
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: `rgba(${theme.palette.customColors.main}, 0.04)`,
          '&:hover:not(.Mui-disabled)': {
            backgroundColor: `rgba(${theme.palette.customColors.main}, 0.08)`
          },
          '&:before': {
            borderBottom: `1px solid rgba(${theme.palette.customColors.main}, 0.22)`
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottom: `1px solid rgba(${theme.palette.customColors.main}, 0.32)`
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          ...(theme.palette.mode === 'dark' && {
            backgroundColor: theme.palette.customColors.surfaceSunken,
            '&:hover:not(.Mui-disabled):not(.Mui-error):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.28)'
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(164, 124, 255, 0.16)'
            }
          }),
          '&:focus:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: `rgba(${theme.palette.customColors.main}, 0.32)`,
          },
          '&:hover.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.error.main
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.14)' : `rgba(${theme.palette.customColors.main}, 0.22)`
          },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.text.disabled
          },
          "&.MuiInputBase-root": {
            
          },
          
          // '& .MuiOutlinedInput-root': {
          //   '& fieldset': {
          //     borderColor: '#CACACA'
          //   },
          //   '&:hover fieldset': {
          //     borderColor: '#007AFF'
          //   },
          //   '&.Mui-focused hover': {
          //     borderColor: '#007AFF'
          //   },
          //   '&.Mui-focused fieldset': {
          //     borderColor: '007AFF'
          //   }
          // }
        }
      }
    }
  }
}

export default input
