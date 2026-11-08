const Menu = theme => {
  return {
    MuiMenu: {
      styleOverrides: {
        root: {
          '& .MuiMenu-paper': {
            borderRadius: 5,
            boxShadow: theme.palette.mode === 'light' ? theme.shadows[8] : theme.shadows[9],
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

export default Menu
