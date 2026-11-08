import * as React from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Button,
  Menu,
  MenuItem,
  Divider,
  Popover,
  IconButton,
  Tabs,
  Grid,
  Avatar,
  Tooltip,
  tooltipClasses 
} from "@mui/material";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import AppBreadcrumb from "../../admin/shared/breadcrum";

import { useState, useEffect } from "react";

// ** MUI Imports
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import MuiTab from "@mui/material/Tab";
import LoadingButton from "@mui/lab/LoadingButton";

//import settings context
import { useSettings } from "../../../MuiTheme/hooks/useSettings";

//import theme
import { useTheme } from "@mui/material/styles";
import { MdClose } from "react-icons/md";
import { GoAlert } from "react-icons/go";

import {useMediaQuery} from '@mui/material';

import { PickList } from 'primereact/picklist';
import { IoChevronBack } from "react-icons/io5";

import { OverlayPanel } from 'primereact/overlaypanel';
import { useRef } from "react";
import { useGetUserQuery } from "../../../features/user/usersApiSlice";

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor:
      theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
  },
}));

const TabName = styled("span")(({ theme, hide }) => ({
  lineHeight: 1.71,
  fontSize: "0.875rem",
  marginLeft: theme.spacing(2.4),
  [theme.breakpoints.down("md")]: {
    display: hide ? "none" : "",
  },
}));

const Tab = styled(MuiTab)(({ theme }) => ({
  //   [theme.breakpoints.down('md')]: {
  //     minWidth: 100
  //   },
  //   [theme.breakpoints.down('sm')]: {
  //     minWidth: 67
  //   }
}));

const ButtonStyled = styled(Button)(({ theme, fsos }) => ({
  [theme.breakpoints.down("sm")]: {
    width: fsos === "true" ? "100%" : "",
    textAlign: fsos === "true" ? "center" : "",
  },
}));

function CircularProgressStyle(props) {
  return (
    <Box sx={{ position: "relative" }}>
      <CircularProgress
        variant="determinate"
        //   sx={{
        //     color: (theme) =>
        //       theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
        //   }}
        size={40}
        thickness={4}
        {...props}
        value={100}
      />
      <CircularProgress
        variant="indeterminate"
        disableShrink
        sx={{
          color: (theme) =>
            theme.palette.mode === "light" ? "#1a90ff" : "#308fe8",
          animationDuration: "550ms",
          position: "absolute",
          left: 0,
          [`& .${circularProgressClasses.circle}`]: {
            strokeLinecap: "round",
          },
        }}
        size={40}
        thickness={4}
        {...props}
      />
    </Box>
  );
}

export const ProgressBarOverlay = ({
  value = 0,
  variant = "determinate",
  sx = { height: ".5rem" },
  showValue = false,
  symbol = "%",
}) => {
  return showValue ? (
    <Box display="flex" alignItems="center" sx={{ ...sx, width: "100%" }}>
      <Box width="100%" mr={1}>
        <BorderLinearProgress variant={variant} value={value} sx={sx} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="text.secondary">
          {`${value}${symbol}`}
        </Typography>
      </Box>
    </Box>
  ) : (
    <BorderLinearProgress
      variant={variant}
      value={value}
      sx={{ ...sx, width: "100%" }}
    />
  );
};

export const CircularProgressOverlay = ({ sx = {} }) => {
  return <CircularProgressStyle sx={sx} />;
};

export const BreadcrumbOverlay = ({
  title = "",
  subtitle = "",
  enableClickActive = true,
}) => {
  const theme = useTheme()
  return (
    <Card className="shadow-2">
      <CardHeader
        title={<AppBreadcrumb enableClickActive={enableClickActive} />}
      />
      <CardContent>
        {title && <p className="text-2xl font-bold pt-1" style={{color: theme?.palette?.primary?.dark}}>{title}</p>}
        {subtitle && (
          <p className="texl-sm mt-2" style={{ fontWeight: 400, color: theme?.palette?.secondary?.main }}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const TabOverlay = ({
  tabs = [],
  nameLabel = "name",
  iconLabel = "icon",
  elementLabel = "element",
  hideNameAtMd = false,
  tabStyle = {},
  remember = false,
  rememberTag = "",
  card = true,
  headerStyle={},
  vertical=false,
  verticalFullWidth=true,
  verticalMinWidth
}) => {
  const [value, setValue] = useState("0");

  const theme = useTheme()
  const md = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = (event, newValue) => {
    if (remember && rememberTag) {
      localStorage.setItem("tab_" + rememberTag, newValue);
    }
    setValue(newValue);
  };

  useEffect(() => {
    setTimeout(() => {
      let val = "0";
      if (remember && rememberTag) {
        const rt = localStorage.getItem("tab_" + rememberTag);
        if (rt) val = rt;
      }
      if (value != val) setValue(val);
    }, 100);
  }, []);

  return (vertical && !md) ? (
    <TabContext value={value}>
      <Box
       sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', p: 2, px: 0 }}
      >
        <TabList
          onChange={handleChange}
          aria-label="tabs"
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
          variant="scrollable"
          style={headerStyle}
          orientation="vertical"
        >
          {tabs.map((tab, index) => {
            return (
              <Tab
                value={index.toString()}
                key={index}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", minWidth: verticalMinWidth ? verticalMinWidth : verticalFullWidth ? 200 : '', justifyContent: 'center' }}>
                    {tab[iconLabel] && tab[iconLabel]}
                    <TabName hide={hideNameAtMd} style={tabStyle}>
                      {tab[nameLabel]}
                    </TabName>
                  </Box>
                }
              />
            );
          })}
        </TabList>
      
      {tabs.map((tab, index) => (
        <TabPanel sx={{ p: 0, width: verticalFullWidth ? "100%" : 'auto'}} key={index} value={index.toString()}>
          {tab[elementLabel] && tab[elementLabel]}
        </TabPanel>
      ))}
      </Box>
    </TabContext>
  ) : card ? (
    <Card>
      <TabContext value={value}>
        <TabList
          onChange={handleChange}
          aria-label="tabs"
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
          variant="scrollable"
          style={headerStyle}
        >
          {tabs.map((tab, index) => {
            return (
              <Tab
                value={index.toString()}
                key={index}
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {tab[iconLabel] && tab[iconLabel]}
                    <TabName hide={hideNameAtMd} style={tabStyle}>
                      {tab[nameLabel]}
                    </TabName>
                  </Box>
                }
              />
            );
          })}
        </TabList>
        {tabs.map((tab, index) => (
          <TabPanel sx={{ p: 0 }} key={index} value={index.toString()}>
            {tab[elementLabel] && tab[elementLabel]}
          </TabPanel>
        ))}
      </TabContext>
    </Card>
  ) : (
    <TabContext value={value}>
      <Card>
        <TabList
          onChange={handleChange}
          aria-label="tabs"
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
          variant="scrollable"
          style={headerStyle}
        >
          {tabs.map((tab, index) => {
            return (
              <Tab
                value={index.toString()}
                key={index}
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {tab[iconLabel] && tab[iconLabel]}
                    <TabName hide={hideNameAtMd} style={tabStyle}>
                      {tab[nameLabel]}
                    </TabName>
                  </Box>
                }
              />
            );
          })}
        </TabList>
      </Card>
      {tabs.map((tab, index) => (
        <TabPanel sx={{ p: 0 }} key={index} value={index.toString()}>
          {tab[elementLabel] && tab[elementLabel]}
        </TabPanel>
      ))}
    </TabContext>
  );
};

export const ButtonOverlay = ({
  text = "",
  variant = "contained",
  loadingVariant,
  sx = {},
  onClick = () => {},
  disabled = false,
  size = "medium",
  component = "button",
  startIcon,
  endIcon,
  color,
  loading = false,
  loadingLabel,
  loadingPosition = "center",
  fullScreenOnSmall = false,
  fullWidth = false,
  className=""
}) => {
  const defaultStyle = fullWidth ? {
    width: fullWidth ? "100%" : ""
  } : {
    
  }
  return !loading ? (
    <ButtonStyled
      variant={variant}
      sx={{...defaultStyle, ...sx }}
      className={className}
      onClick={onClick}
      disabled={disabled}
      size={size}
      component={component}
      startIcon={startIcon}
      endIcon={endIcon}
      color={color}
      fsos={fullScreenOnSmall ? "true" : "false"}
    >
      {text}
    </ButtonStyled>
  ) : (
    <LoadingButton
      variant={loadingVariant ? loadingVariant : variant}
      sx={{...defaultStyle, ...sx }}
      onClick={onClick}
      disabled={disabled}
      size={size}
      component={component}
      startIcon={startIcon}
      endIcon={endIcon}
      color={color}
      loading={loading}
      loadingIndicator={loadingLabel}
      loadingPosition={loadingPosition}
    >
      {text}
    </LoadingButton>
  );
};

export const MenuOverlay = ({
  button = <ButtonOverlay text="menu" />,
  menuItems = [],
  nameLabel = "name",
  iconLabel = "icon",
  header,
  tileListHeader,
  sx = { width: 230, marginTop: 8 },
  className,
  anchorVertical = "bottom",
  anchorHorizontal = "right",
  transformVertical = "top",
  transformHorizontal = "right",
  closeOnClick = true,
  arrow = true,
  disabled=false,
}) => {
  // ** States
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDropdownOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
  };

  const { settings } = useSettings();
  const theme = useTheme();

  const styles = {
    py: 2,
    px: 4,
    width: "100%",
    display: "flex",
    alignItems: "center",
    color: "text.primary",
    textDecoration: "none",
    "& svg": {
      fontSize: "1.375rem",
      color: "text.secondary",
    },
  };

  return (
    <div className={className}>
      <span onClick={handleDropdownOpen} style={{ ml: 2, cursor: "pointer" }}>
        {!disabled && button}
      </span>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ "& .MuiMenu-paper": { ...sx } }}
        anchorOrigin={{
          vertical: anchorVertical,
          horizontal: anchorHorizontal,
        }}
        transformOrigin={{
          vertical: transformVertical,
          horizontal: transformHorizontal,
        }}
        PaperProps={{
          elevation: 0,
          sx: !arrow
            ? {}
            : {
                border:
                  settings.mode === "dark"
                    ? `1px solid rgba(255,255,255,.1)`
                    : "",
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
                mt: 1.5,
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                "&:before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                  // background: settings.mode === "dark" ? "#131619" : theme.palette.background.paper
                },
              },
        }}
      >
        {header && (
          <Box sx={{ pt: 2, pb: 3, px: 4 }}>
            {tileListHeader && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  alt={tileListHeader?.title ?? "Your Title"}
                  src={tileListHeader.img ?? "/user.png"}
                  sx={{ width: "2.5rem", height: "2.5rem" }}
                />
                <Box
                  sx={{
                    display: "flex",
                    marginLeft: 3,
                    alignItems: "flex-start",
                    flexDirection: "column",
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    {tileListHeader?.title ?? "Your Title"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.8rem", color: "text.disabled" }}
                  >
                    {tileListHeader?.subtitle ?? "Your Subtitle"}
                  </Typography>
                </Box>
              </Box>
            )}
            <Divider sx={{ mt: 0, mb: 1 }} />
          </Box>
        )}
        {menuItems.map((menuItem, index) => {
          if(menuItem.hide) return;
          return (
            <div key={index}>
              <MenuItem
                sx={{ p: 0 }}
                onClick={(e) => {
                  menuItem?.onClick(e);
                  if (closeOnClick && (menuItem?.closeOnClick ?? true))
                    handleDropdownClose();
                }}
              >
                <Box sx={styles}>
                  {menuItem[iconLabel] && menuItem[iconLabel]}
                  {menuItem[iconLabel] && (
                    <span style={{ marginRight: 8 }}></span>
                  )}
                  {menuItem[nameLabel]}
                </Box>
              </MenuItem>
              {menuItem?.divider && <Divider />}
            </div>
          );
        })}
      </Menu>
    </div>
  );
};

export const PopoverOverlay = ({
  children,
  className,
  sx = { p: 6 },
  minWidth = 300,
  showHeader = true,
  showFooter = true,
  headerTitle = "header title",
  bodyTitle = "Are you sure you want to permanently remove this item?",
  dividerHeader = false,
  dividerFooter = false,
  closeButton = true,
  headerStyle = {},
  popPosition = "bottom",
  marginFromButton = 10,
  arrow = false,
  anchorEl,
  handleClose,
  okClick = () => {},
  cancelColor,
  okColor,
  headerColor,
}) => {
  const { settings } = useSettings();
  const theme = useTheme();

  return (
    <div className={`${className}`}>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: popPosition === "bottom" ? "bottom" : "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: popPosition === "bottom" ? "top" : "bottom",
          horizontal: "center",
        }}
        slotProps={{
          paper: {
            style: {
              minWidth: minWidth,
              // marginTop: popPosition === "bottom" ? marginFromButton : 0,
              // marginBottom: popPosition === "bottom" ? 0 : marginFromButton,
              border: `.5px solid ${theme.palette.customColors.borderColor}`,
              marginBottom: 40
            },
            elevation: 0,
            sx: !arrow
              ? {}
              : {
                  border:
                    settings.mode === "dark"
                      ? `1px solid rgba(255,255,255,.1)`
                      : "",
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
                  mt: 1.5,
                  "& .MuiAvatar-root": {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  "&:before": {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                    // background: settings.mode === "dark" ? "#131619" : theme.palette.background.paper
                  },
                },
          }
        }}
        
      >
        {showHeader && (
          <div
            style={{
              paddingLeft: 15,
              paddingRight: 10,
              paddingTop: 7,
              paddingBottom: 5,
              fontSize: 17,
              background: headerColor ?? "#474950",
              color: "#fff",
              ...headerStyle,
            }}
          >
            <div className="flex justify-between items-center">
              <span>{headerTitle}</span>
              {closeButton && (
                <IconButton onClick={handleClose}>
                  <MdClose color="#fff" />
                </IconButton>
              )}
            </div>
          </div>
        )}
        {dividerHeader && showHeader && <Divider />}
        <Box sx={sx}>
          {children ? (
            children
          ) : (
            <div className="flex gap-4 items-center">
              <GoAlert
                style={{
                  color: "orange",
                  fontSize: 28,
                }}
              />
              <p>{bodyTitle}</p>
            </div>
          )}
        </Box>
        {dividerFooter && showHeader && <Divider />}
        {showFooter && (
          <div className="flex justify-end items-center p-3">
            <Button
              onClick={handleClose}
              variant="contained"
              color="error"
              size="small"
              style={{
                backgroundColor: cancelColor ?? "#747475",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                okClick();
                handleClose();
              }}
              variant="contained"
              color="error"
              size="small"
              style={{
                backgroundColor: okColor ?? "#e8384f",
                marginLeft: 20,
              }}
            >
              Ok
            </Button>
          </div>
        )}
      </Popover>
    </div>
  );
};

export const PopoverAutoOverlay = ({
  button = <ButtonOverlay text="popover" />,
  children = <p>child items...</p>,
  className,
  sx = { p: 4 },
  minWidth = 300,
  showHeader = true,
  headerTitle = "header title",
  divider = true,
  closeButton = true,
  headerStyle = {
    paddingLeft: 15,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 3,
    fontSize: 17,
  },
  popPosition = "bottom",
  marginFromButton = 15,
  arrow = false,
  close = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const { settings } = useSettings();

  useEffect(() => {
    if (close) {
      handleClose();
    }
  }, [close]);

  const theme = useTheme()
  
  return (
    <div className={className}>
      <span onClick={handleClick} style={{ cursor: "pointer" }}>
        {button}
      </span>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: popPosition === "bottom" ? "bottom" : "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: popPosition === "bottom" ? "top" : "bottom",
          horizontal: "center",
        }}
        PaperProps={{
          style: {
            minWidth: minWidth,
            marginTop: popPosition === "bottom" ? marginFromButton : 0,
            marginBottom: popPosition === "bottom" ? 0 : marginFromButton,
            border: `.5px solid ${theme.palette.customColors.borderColor}`,
          },
          elevation: 0,
          sx: !arrow
            ? {}
            : {
                border:
                  settings.mode === "dark"
                    ? `1px solid rgba(255,255,255,.1)`
                    : "",
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
                mt: 1.5,
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                "&:before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                  // background: settings.mode === "dark" ? "#131619" : theme.palette.background.paper
                },
              },
        }}
      >
        {showHeader && (
          <div style={headerStyle}>
            <div className="flex justify-between items-center">
              <span>{headerTitle}</span>
              {closeButton && (
                <IconButton onClick={handleClose}>
                  <MdClose />
                </IconButton>
              )}
            </div>
          </div>
        )}
        {divider && showHeader && <Divider />}
        <Box sx={sx}>{children}</Box>
      </Popover>
    </div>
  );
};

export const PickListOverlay = ({
  source=[],
  setSource,
  target=[],
  setTarget=[],
  itemTemplate
}) => {
  // const [source, setSource] = useState([]);
  // const [target, setTarget] = useState([]);


  const onChange = (event) => {
      setSource(event.source);
      setTarget(event.target);
  };

  const itemTemplateDefault = (item) => {
      return (
          <div className="flex flex-wrap p-2 align-items-center gap-3">
              {item}
          </div>
      );
  };

  return (
      <div className="p-2">
          <PickList source={source} target={target} onChange={onChange} itemTemplate={(item)=>itemTemplate ? itemTemplate(item) : itemTemplateDefault(item)} filter filterBy="name" breakpoint="1400px"
              sourceHeader="Available" targetHeader="Selected" sourceStyle={{ height: '24rem' }} targetStyle={{ height: '24rem' }}
              sourceFilterPlaceholder="Search by name" targetFilterPlaceholder="Search by name" />
      </div>
  );
}

export const TwoColumnGridLauncherOverlay = ({
  items = [],
  nameLabel = "name",
  iconLabel = "icon",
  elementLabel = "element",
  subtitleLabel = "subtitle",
  remember = false,
  rememberTag = "",
  card = true,
  headerStyle={},
  subTitleStyle={},
  iconStyle={},
}) => {
  const [element, setElement] = useState({
    show: false,
    element: null,
    index: 0
  })

  const theme = useTheme()
  const md = useMediaQuery(theme.breakpoints.down('md'));

  const updateLocalStorage = (newValue) => {
    if (remember && rememberTag) {
      localStorage.setItem("grid_launcher_" + rememberTag, JSON.stringify(newValue));
    }
  };

  useEffect(() => {
    if(!remember) return;
    setTimeout(() => {
      let val = {show: false, index: 0};
      if (remember && rememberTag) {
        val = JSON.parse(localStorage.getItem("grid_launcher_" + rememberTag))??{show: false, index: 0};
      }

      if(remember && val?.show) {
        items?.map((item, index)=>{
          if(index==val?.index) {
            setElement({
              show: true,
              element: item[elementLabel],
              index: index
            })
          }
        })
      }
      // if (value != val) setValue(val);
    }, 100);
  }, [items]);

  return (
    <div className="mt-4 mb-6 mx-4" style={{minHeight: "60vh"}}>
      {!(element.show && element?.element) &&
        <Grid container spacing={6} >
        {items?.map((item,ind)=>{
          return (
            <Grid item sm={12} md={6} className="mt-4" key={item[nameLabel]+"_"+ind}>
              <div className="py-3">
                <Box sx={{ display: "flex", maxWidth: 300, margin: 'auto'}} >
                    {item[iconLabel] && <div className="pr-4">{item[iconLabel]}</div>}
                    <div style={headerStyle} className=" flex flex-col gap-2">
                      <p 
                        className="hover:cursor-pointer hover:underline" 
                        style={{color: theme?.palette?.primary?.main, fontSize: 19}}
                        onClick={()=>{
                          if(remember) {
                            updateLocalStorage({
                              show: true,
                              index: ind
                            })
                          }
                          setElement({
                            show: true,
                            element: item[elementLabel]??<></>
                          })
                        }}
                      >{item[nameLabel]}</p>
                      {item[subtitleLabel] && <p className="text-lg" style={{color: theme?.palette?.secondary?.main}}>{item[subtitleLabel]}</p>}
                    </div>
                </Box>
              </div>
            </Grid>
          )
        })}
      </Grid>}
      {element?.show &&
      <div className="flex flex-col">
        <Button 
          // variant=" "
          color="secondary"
          sx={{
            width: 100
          }}
          startIcon={<IoChevronBack />}
          size="medium"
          onClick={()=>{
            if(remember) {
              updateLocalStorage({
                show: false,
                index: 0
              })
            }
            setElement({
              show: false,
              element: null,
            })
          }}
        >Back</Button>
        <div className="pt-4">
        {
          element?.element
        }
        </div>
      </div>}
    </div>
  )
};

export const VerticalStepDetailOverlay = ({
  options,
  groups,
  remember = false,
  rememberTag = "",
  title="",
  showTitleInDetailView=true,
  navigationButtons=true,
  clickOnTitles=true,
  elementHeaderStyle="default",
  print=false,
  signers={}
}) => {
  const theme = useTheme()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const md = useMediaQuery(theme.breakpoints.down('md'));
  const updateLocalStorage = (newValue) => {
    if (remember && rememberTag) {
      localStorage.setItem("vertical_step_" + rememberTag, newValue);
    }
  };

  const {
    data: users,
    isLoading,
    isSuccess,
    isError,
    error,
    refetch
} = useGetUserQuery()

  const [childGroups, setChildGroups] = useState([])

  useEffect(() => {
    if(!remember) return;
    setTimeout(() => {
      let val = 0;
      if (remember && rememberTag) {
        val = parseFloat(localStorage.getItem("vertical_step_" + rememberTag))??0;
      }
      setSelectedIndex(val)      
    }, 100);
  }, []);
  
  // useEffect(()=>{
  //   let cg = []
  //   const option = options[selectedIndex]
  //   if(option) {
  //     let thisGroup = groups?.find((group)=>group?.name == option?.nameNoStyle)
  //     if(thisGroup) {
  //       groups?.map((group)=>{
  //         if(group?.parentId == thisGroup?.id) {
  //           const childOption = options?.find((option)=>option?.nameNoStyle == group?.name)
  //           if(childOption) {
  //             cg?.push(childOption)
  //           }
  //         }
  //       })
  //     }
  //   }
  //   setChildGroups(cg)
  // },[selectedIndex, groups])

  const elementTitleWidget = (name) => {
    return (elementHeaderStyle=="default") ?  (
      <div className="p-2 pl-3 rounded bg-[#323a41] text-white font-bold">
        <p style={{fontSize: 21}}>{name}</p>
      </div>
    ) : (elementHeaderStyle=="half-line") ? (
      <div className="flex border-b">
        <div className="p-2 pr-6 pl-3 rounded bg-[#323a41] text-white font-bold w-fit -skew-x-12 relative">
          <div className="absolute top-0 left-0 skew-x-12 -mx-2 bg-[#323a41] rounded-l" style={{width: 13, height: 45}}></div>
          <p style={{fontSize: 21}} className="">{name}</p>
        </div>
        <div className="flex-1 bg-[#323a41] h-2"></div>
      </div>
    ) : <></>
  }
  const [items, setItems] = useState([])

  useEffect(()=>{
    let items = []
    groups?.map((group, index)=>{
      const option = options?.find((op)=>op?.id == group?.id)
      let item = {}
      if(option && !group?.parentId) {
        item.name = option?.nameNoStyle
        item.element = (
          <React.Fragment key={index}>
            {showTitleInDetailView && 
              // <div className="p-2 pl-3 rounded bg-[#323a41] text-white font-bold">
              //   <p style={{fontSize: 21}}>{option?.nameNoStyle}</p>
              // </div>
              elementTitleWidget(option?.nameNoStyle)
            }
            {option?.element}
            {options?.map((op)=>{
              if(op?.parentId == option?.id) {
                return (
                  <React.Fragment key={op?.nameNoStyle+"-"+index}>
                    {/* <div className="p-2 pl-3 rounded bg-[#323a41] text-white font-bold">
                      <p style={{fontSize: 21}}>{op?.nameNoStyle}</p>
                    </div> */}
                    {elementTitleWidget(op?.nameNoStyle)}
                    {op?.element}
                  </React.Fragment>
                )
              }
            })}
          </React.Fragment>
        )
      }
      else {
        options?.map((op)=>{
          if(op?.parentId == group?.id) {
            item.name = group?.name
            item.element = (
              <React.Fragment key={index}>
                {options?.map((op)=>{
                  if(op?.parentId == group?.id) {
                    return (
                      <React.Fragment key={op?.nameNoStyle+"-"+index}>
                        {/* <div className="p-2 pl-3 rounded bg-[#323a41] text-white font-bold">
                          <p style={{fontSize: 21}}>{op?.nameNoStyle}</p>
                        </div> */}
                        {elementTitleWidget(op?.nameNoStyle)}
                        
                        {op?.element}
                      </React.Fragment>
                    )
                  }
                })}
              </React.Fragment>
            )
          }
        })
      }
      if(item?.name && item?.element) {
        items.push(item)
      }
    })
    setItems(items)
  },[selectedIndex, groups])

  return !print ? (
    <div className="flex gap-4 flex-wrap overflow-x-auto">
      <div className="border shadow-2 pb-3 pt-3 px-1 flex flex-col gap-3" style={{minWidth: 300}}>
        {title &&
          <div className="text-2xl font-bold border-b mb-2 pb-2"><span className="pl-1 pr-3" style={{color: theme?.palette?.primary?.main}}>{title}</span></div>
        }
        {
          items?.map((item, index)=>{
            return (
              <div 
                key={index} 
                className={`p-2 mx-1 font-bold hover:cursor-pointer ${index == selectedIndex ? "text-white rounded" : ""}`}
                style={{
                  backgroundColor: index==selectedIndex ? theme?.palette?.primary?.main : ""
                }}
                onClick={()=>{
                  if(!clickOnTitles) return;
                  if(remember) {
                    updateLocalStorage(index)
                  }
                  setSelectedIndex(index)
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >{item?.name}</span>
              </div>
            )
          })
        }
        {/* {
          groups?.map((group, index)=>{
            const option = options?.find((op)=>op?.id == group?.id)
            if(option && !group?.parentId) {
              return (
                <div 
                  key={index} 
                  className={`p-2 mx-1 font-bold hover:cursor-pointer ${index == selectedIndex ? "bg-blue-400 text-white rounded" : ""}`}
                  onClick={()=>{
                    if(!clickOnTitles) return;
                    if(remember) {
                      updateLocalStorage(index)
                    }
                    setSelectedIndex(index)
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >{option?.nameNoStyle}</span>
                </div>
              )
            }
            else {
              return options?.map((op)=>{
                if(op?.parentId == group?.id) {
                  return (
                    <div 
                      key={index} 
                      className={`p-2 mx-1 font-bold hover:cursor-pointer ${index == selectedIndex ? "bg-blue-400 text-white rounded" : ""}`}
                      onClick={()=>{
                        if(!clickOnTitles) return;
                        if(remember) {
                          updateLocalStorage(index)
                        }
                        setSelectedIndex(index)
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          textTransform: "capitalize",
                        }}
                      >{group?.name}</span>
                    </div>
                  )
                }
              })
            }
          })
        }
        {
          options?.map((option, index)=>{
            let pass = true;
            if(groups) {
              groups?.map((group)=>{
                if(option?.nameNoStyle == group?.name && group?.parentId) {
                  pass = false;
                }
              })
            }
            if(!pass) return;

            return (
              <div 
                key={index} 
                className={`p-2 mx-1 font-bold hover:cursor-pointer ${index == selectedIndex ? "bg-blue-400 text-white rounded" : ""}`}
                onClick={()=>{
                  if(!clickOnTitles) return;
                  if(remember) {
                    updateLocalStorage(index)
                  }
                  setSelectedIndex(index)
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >{option?.nameNoStyle}</span>
              </div>
            )
          })
        } */}
      </div>
      
      <div className="border shadow-2 rounded flex-1">
        {/* {showTitleInDetailView && 
          <div className="p-2 pl-3 rounded bg-[#323a41] text-white font-bold">
            <p style={{fontSize: 21}}>{options[selectedIndex]?.nameNoStyle}</p>
          </div>
        }
        {options[selectedIndex]?.element}
        {childGroups?.length > 0 && 
          <div>
            {childGroups?.map((childGroup, index)=>{
              return (
                <React.Fragment key={childGroup?.nameNoStyle+"-"+index}>
                  <div className="p-2 pl-3 rounded bg-[#323a41] text-white font-bold">
                    <p style={{fontSize: 21}}>{childGroup?.nameNoStyle}</p>
                  </div>
                  
                  {childGroup?.element}
                </React.Fragment>
              )
            })}
          </div>
        }  */}
        {items[selectedIndex]?.element}
        {navigationButtons && 
          <div className={` flex justify-between border-t-2 p-3 ${md ? "mt-2 mb-5" : "my-2"}`}>
            <Button 
              variant="contained"
              size="small"
              onClick={()=>{
                const index = selectedIndex > 0 ? (selectedIndex- 1) : 0;
                if(remember) {
                  updateLocalStorage(index)
                }
                setSelectedIndex(index)
              }}
              disabled={selectedIndex <= 0}
            >Back</Button>

            <Button 
              variant="contained"
              size="small"
              onClick={()=>{
                const index = selectedIndex < items?.length - 1 ? (selectedIndex + 1) : selectedIndex;
                if(remember) {
                  updateLocalStorage(index)
                }
                setSelectedIndex(index)
              }}
              disabled={selectedIndex >= items?.length - 1}
            >Next</Button>
          </div>
        }
      </div>
    </div>
  ) : (
    <div className="flex gap-4 flex-wrap overflow-x-auto">
      
      <div className="border shadow-2 rounded flex-1 p-3">
        {items?.map((item)=>{
          return item?.element
        })}
      </div>
      <div className="flex justify-between p-6 text-xl w-full">
        {signers?.checked && 
          <div className="flex flex-col">
            <div className="flex gap-2">
              <p className="font-bold">Checked By: </p>
              <div className="flex flex-col gap-1">
                {signers?.checked?.fullName}
              </div>
            </div>
            <div>
              {/* {JSON.stringify(users)} */}
            </div>
          </div>
        }
        {signers?.approved && 
          <div className="flex flex-col">
            <div className="flex gap-2">
              <p className="font-bold">Approved By: </p>
              <div className="flex flex-col gap-1">
                {signers?.approved?.fullName}
              </div>
            </div>
            <div>
              {/* {JSON.stringify(users)} */}
            </div>
          </div>
        }
      </div>
    </div>
  )
}

export const ImageOverlay2 = ({src='', alt="", style={}, className="", width="auto", height="auto", props, preview=false, title="Image Overlay"}) => {
  const op = useRef(null);

  return (
    <>
       <img width={width} height={height} src={src} alt={alt} style={style} className={"hover:cursor-pointer "+className} onClick={(e) => {if(preview) {op.current.toggle(e)}}} {...props} />
      {preview &&
      <OverlayPanel ref={op} showCloseIcon>
          {title && <div className="font-bold mb-2 text-xl -mt-2">{title}</div>}
          <img src={src} className="rounded" alt={alt} ></img>
      </OverlayPanel>}
    </>
  )
}

export const ImageOverlay = ({
  src,
  alt,
  style={},
  className="",
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const placeholderSrc = String(src).replace('uploads/common', 'uploads/common/thumbnails')
  return (
    <div className="w-full">
      {!loaded &&
      <img
        src={placeholderSrc }
        style={{...style, width: "100%"}}
        className={className}
        {...props}
      />}
      <img
        src={src }
        alt={alt}
        style={loaded ? {...style} : {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, visibility: 'hidden'}}
        onLoad={(e)=>setLoaded(true)}
        className={className}
        {...props}
      />
      </div>
  );
};

export const BootstrapTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.common.black,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.black,
  },
}));

export const TitleHeaderOverlay = ({name="", elementHeaderStyle="half-line"}) => {
  return (elementHeaderStyle=="default") ?  (
    <div className="p-2 pl-3 rounded bg-[#323a41] text-white font-bold">
      <p style={{fontSize: 21}}>{name}</p>
    </div>
  ) : (elementHeaderStyle=="half-line") ? (
    <div className="flex border-b">
      <div className="p-2 pr-6 pl-3 rounded bg-[#323a41] text-white font-bold w-fit -skew-x-12 relative">
        <div className="absolute top-0 left-0 skew-x-12 -mx-2 bg-[#323a41] rounded-l" style={{width: 13, height: 45}}></div>
        <p style={{fontSize: 21}} className="">{name}</p>
      </div>
      <div className="flex-1 bg-[#323a41] h-2"></div>
    </div>
  ) : <></>
}