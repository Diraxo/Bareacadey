const UserIcon = props => {
  // ** Props
  const { icon, iconProps } = props
  const IconTag = icon
  let styles
  return <IconTag {...iconProps} style={{ ...styles, color: props.isNavLinkActive() ? 'white' : '' }} />
}

export default UserIcon
