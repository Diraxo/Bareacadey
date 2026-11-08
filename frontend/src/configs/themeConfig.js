
export const fonts = [
   '"Ubuntu", sans-serif',
   '"Open Sans", sans-serif',
   '"Lato", sans-serif',
   '"Roboto", sans-serif',
   '"Oswald", sans-serif',
];

const themeConfig = {
  templateName: 'Bare Academy',
  mode: 'light',
  contentWidth: 'boxed',

  routingLoader: false,

  menuTextTruncate: false,
  navigationSize: 260,
  activeStyle: 0,

  responsiveFontSizes: true, 
  disableRipple: false, 
  box: 'shadow', //shadow/border
  font: fonts[0]
}

export default themeConfig

