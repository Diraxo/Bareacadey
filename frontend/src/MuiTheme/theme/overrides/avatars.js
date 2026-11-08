import UserIcon from "/user.png"
const Avatar = theme => {
  return {
    MuiAvatar: {
      styleOverrides: {
        
        root: {
          '.MuiAvatar-fallback': {
            background: `url(${UserIcon}) center no-repeat`,
            backgroundSize: '100% 100%',
            width: '100%',
            height: '100%',
            path: {
              display: 'none',
            },
          },
        },
        colorDefault: {
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700]
        },
        rounded: {
          borderRadius: 5
        }
      },
      defaultProps: {
        imgProps: { crossOrigin: 'anonymous' },
      },
    },
    MuiAvatarGroup: {
      styleOverrides: {
        root: {
          justifyContent: 'flex-end',
          '.MuiCard-root & .MuiAvatar-root': {
            borderColor: theme.palette.background.paper
          }
        }
      },
    }
  }
}

export default Avatar
