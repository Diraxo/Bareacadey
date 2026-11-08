import React, {useState, useEffect} from "react";
import { Sidebar } from "primereact/sidebar";
import { hideSidebar } from "../../../app/slices/commonSlice";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import "./style.scss";
import { Divider } from "@mui/material";
import Loader from "../Loader";
import {useTheme} from '@mui/material/styles';

const SidebarOverlay = ({ children }) => {
  const dispatch = useDispatch();
  const theme = useTheme()
  const handleClose = () => {
    dispatch(hideSidebar());
  };
  const visible = useSelector((state) => state.common.openSidebar);
  const header = useSelector((state) => state.common.header);
  const position = useSelector((state) => state.common.position);

  const subtitle = useSelector((state) => state.common.subtitleSidebar);
  const width = useSelector((state) => state.common.widthSidebar);
  const paddingX = useSelector((state) => state.common.paddingXSidebar);
  const fullScreen = useSelector((state) => state.common.fullScreen);

  const openSidebar = useSelector(state=>state.common.openSidebar)
  const [loading, setLoading ] = useState(true)

  useEffect(()=>{
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 50);
  },[openSidebar])
  return (
    <div className="flex justify-content-center">
      <Sidebar
        visible={visible}
        position={position}
        onHide={handleClose}
        style={{ width: width, paddingLeft: paddingX, paddingRight: paddingX}}
        fullScreen={fullScreen??false}
        baseZIndex={100}
        blockScroll={true}
        dismissable={true}
        icons={
          <div className="w-full text-gray-800">
            <p style={{fontSize: 22, fontWeight: 500, color: theme?.palette?.primary?.main}} className="dark:text-gray-200 mr-1">{header}</p>
          </div>
        }
      >
      <div className="">
        {subtitle && <p className="mb-5 dark:text-gray-400">{subtitle}</p>}
        {!subtitle && <p className="mb-3"></p>}
        {loading ? <Loader /> :  children}
      </div>
      </Sidebar>
    </div>
  );
};

export default SidebarOverlay;
