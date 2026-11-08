const Popover = theme => {
  return {
    MuiPopover: {
      styleOverrides: {
        root: {
          '& .MuiPopover-paper': {
            boxShadow: theme.shadows[6],
            ...(theme.palette.mode === 'dark' && {
              backgroundColor: theme.palette.customColors.surfaceRaised,
              border: `1px solid ${theme.palette.customColors.borderColor}`
            })
          }
        }
      }
    }
  }
}

export default Popover
