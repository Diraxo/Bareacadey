import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { arrayMoveImmutable } from "array-move";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";
import { Button, Checkbox, Divider, FormControlLabel, IconButton } from "@mui/material";
import { OverlayPanel } from 'primereact/overlaypanel';

//icons
import {
  TbCheckbox,
  TbSignature,
} from "react-icons/tb";
import {
  AiOutlineFontColors,
  AiOutlineMail,
} from "react-icons/ai";
import { RxSlider } from "react-icons/rx";
import { TiSortNumerically } from "react-icons/ti";
import {

  BsTextareaT,
  BsTextLeft,
  BsCashCoin,
} from "react-icons/bs";
import {
  MdDateRange,
  MdRadioButtonChecked,
  MdOutlinePreview,
} from "react-icons/md";
import {
  BiAddToQueue,
  BiChevronLeft,
  BiChevronRight,
  BiImageAdd,
  BiTime,
} from "react-icons/bi";
import { VscJson } from "react-icons/vsc";
import { IoText, IoCallOutline } from "react-icons/io5";
import { IoIosArrowDropdown } from "react-icons/io";
import { RxDividerHorizontal } from "react-icons/rx";
import { FaListUl } from "react-icons/fa";
import "./form-builder.scss";
import EditGroup from "./EditGroup";
import FieldDetail from "./FieldDetail";
import FormViewer from "./FormViewer";

const FormBuilder = ({
  title = "Assignment 1",
  fields = [],
  setFields,
  groups = [],
  setGroups,
  type="exam", //survey
  autoResult = false,
}) => {
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));

  const opRef = useRef()

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const reorder_move = (list, startIndex, endIndex) => {
    if (startIndex > endIndex) endIndex = endIndex + 1;
    const result = arrayMoveImmutable(list, startIndex, endIndex);
    return result;
  };

  const [showSideBar, setShowSideBar] = useState(true);
  const [editGroupExpanded, setEditGroupExpanded] = useState({});

  const copy = (
    source,
    destination,
    droppableSource,
    droppableDestination,
    src,
    endIndex
  ) => {
    //const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const item = src;

    destClone.splice(endIndex, 0, { ...item, id: uuid() });
    return destClone;
  };

  const [frontendItems, setFrontendItems] = useState([
    {
      id: 1,
      name: "Textfield",
      icon: <IoText />,
    },
    {
      id: 2,
      name: "Textarea",
      icon: <BsTextareaT />,
    },
    {
      id: 3,
      name: "Richtext",
      icon: <BsTextLeft />,
    },
    {
      id: 4,
      name: "Date",
      icon: <MdDateRange />,
    },
    {
      id: 5,
      name: "Number",
      icon: <TiSortNumerically />,
    },
    // {
    //     id: 6,
    //     name: "Datetime",
    //     icon: 5,
    // },
    {
      id: 7,
      name: "Select",
      icon: <IoIosArrowDropdown />,
    },
    {
      id: 8,
      name: "Checkbox",
      icon: <TbCheckbox />,
    },
    // {
    //     id: 9,
    //     name: "People",
    //     icon: 8,
    // },
    // {
    //     id: 10,
    //     name: "Association",
    //     icon: 9,
    // },
    {
      id: 14,
      name: "Email",
      icon: <AiOutlineMail />,
    },
    {
      id: 15,
      name: "Phone",
      icon: <IoCallOutline />,
    },
    {
      id: 16,
      name: "Radio",
      icon: <MdRadioButtonChecked />,
    },
    {
      id: 17,
      name: "Slider",
      icon: <RxSlider />,
    },
    {
      id: 18,
      name: "Currency",
      icon: <BsCashCoin />,
    },
    // {
    //     id: 19,
    //     name: "File",
    //     icon: 18,
    // },
    // {
    //     id: 20,
    //     name: "Video",
    //     icon: 11,
    // },
    // {
    //     id: 21,
    //     name: "Files",
    //     icon: 12,
    // },
    {
      id: 22,
      name: "Color",
      icon: <AiOutlineFontColors />,
    },
    // {
    //     id: 23,
    //     name: "Password",
    //     icon: 20,
    // },
    // {
    //     id: 24,
    //     name: "Conf Pass",
    //     icon: 21,
    // },
    {
      id: 25,
      name: "Signature",
      icon: <TbSignature />,
    },
    // {
    //     id: 25,
    //     name: "Divider",
    //     icon: 24,
    // },
    // {
    //     id: 26,
    //     name: "Custom",
    //     icon: 22,
    // },
    // {
    //     id: 27,
    //     name: "Collections",
    //     icon: 25
    // }
  ]);

  useEffect(()=>{
    if(groups?.length <= 0) {
      setGroups([
        {
          id: "root",
          name: "Root",
          readonly: true
        }
      ])
    }
  },[groups])

  const onDragEnd = (result) => {
    const { destination, source } = result;
    // dropped outside the list
    if (!destination) {
      return;
    }

    if (
      source.droppableId == "outer_droppable" &&
      destination.droppableId == "outer_droppable"
    ) {
      const reordered = arrayMoveImmutable(
        groups,
        source.index,
        destination.index
      );
      setGroups(reordered);
    } else if (source.droppableId == destination.droppableId) {
      const groupId = destination.droppableId.split("droppable")[1];
      const filteredFields = fields?.filter((fld) => fld.group == groupId);
      let startId = 0;
      let endId = 0;

      filteredFields.map((field, index) => {
        if (index === source.index) {
          startId = field.id;
        } else if (index === destination.index) {
          endId = field.id;
        }
      });
      let startIndex = 0;
      let endIndex = 0;
      fields.map((field, index) => {
        if (field.id === startId) {
          startIndex = index;
        } else if (field.id === endId) {
          endIndex = index;
        }
      });
      let ro = reorder(fields, startIndex, endIndex);
      setFields(ro);
    } else if (source.droppableId == "frontend_droppable") {
      const groupId = destination.droppableId.split("droppable")[1];
      const filteredFields = fields.filter((fld) => fld.group == groupId);
      let endId = 0;

      filteredFields.map((field, index) => {
        if (index === destination.index) {
          endId = field.id;
        }
      });
      let endIndex = 0;
      fields.map((field, index) => {
        if (field.id === endId) {
          endIndex = index;
        }
      });
      let frontend = { show: true };
      let backend = {};
      let relation = {};
      let root = {};

      if (frontendItems[source.index]?.name === "Textfield") {
        /*** frontend */
        frontend.type = "text";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = true;

        /*** backend */
        backend.db_label = "textfield";
        backend.type = 2;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Textarea") {
        frontend.type = "text";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = true;
        frontend.multiline = true;
        frontend.rows = 5;

        frontend.override = true;
        frontend.grid = 12;

        /*** backend */
        backend.db_label = "textarea";
        backend.type = 5;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Richtext") {
        frontend.type = "rich_text";
        frontend.label = frontendItems[source.index]?.name;
        // frontend.required = true;
        frontend.height = 320;
        frontend.img = false;

        /*** backend */
        backend.db_label = "richtext";
        backend.type = 5;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Date") {
        frontend.type = "date";
        frontend.inputType = "date"; //date, time, datetime, daterange
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.date = true;
        frontend.day = true;
        frontend.month = true;
        frontend.year = true;
        frontend.layout = "desktop";
        frontend.inputType = "date";
        frontend.required = true;

        /*** backend */
        backend.db_label = "date";
        backend.type = 4;
        // backend.defaultValue = "Sequelize.NOW";
      } else if (frontendItems[source.index]?.name === "Number") {
        frontend.type = "number";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = false;

        /*** backend */
        backend.db_label = "number";
        backend.type = 9;
        backend.allowNull = true;
        backend.defaultValue = "0";
      } else if (frontendItems[source.index]?.name === "Currency") {
        frontend.type = "currency";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = false;

        /*** backend */
        backend.db_label = "currency";
        backend.type = 9;
        backend.allowNull = true;
        backend.defaultValue = "0";
      } else if (frontendItems[source.index]?.name === "Select") {
        frontend.type = "select";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.avatar = false;
        frontend.nameLabel = "name";
        frontend.valueLabel = "value";
        frontend.imgLabel = "img";
        frontend.colorLabel = "color";
        frontend.options = [
          {
            name: "Option 1",
            value: "Option 1",
          },
          {
            name: "Option 2",
            value: "Option 2",
          },
        ];

        /*** backend */
        backend.db_label = "select";
        backend.type = 13;
        backend.options = ["Option 1", "Option 2"];
      } else if (frontendItems[source.index]?.name === "Checkbox") {
        frontend.type = "checkbox";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.override = true;
        frontend.sx = "{mt: 6}";

        /*** backend */
        backend.db_label = "checkbox";
        backend.type = 3;
        backend.defaultValue = false;

        root.minWidth = "5rem";
      } else if (frontendItems[source.index]?.name === "Slider") {
        frontend.type = "slider";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.min = 0;
        frontend.max = 100;
        frontend.step = 1;

        /*** backend */
        backend.db_label = "slider";
        backend.type = 9;
        backend.options = ["Option 1", "Option 2"];
      } else if (frontendItems[source.index]?.name === "Radio") {
        frontend.type = "radio";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.nameLabel = "name";
        frontend.valueLabel = "value";
        frontend.options = [
          {
            name: "Option 1",
            value: "Option 1",
          },
          {
            name: "Option 2",
            value: "Option 2",
          },
        ];

        /*** backend */
        backend.db_label = "radio";
        backend.type = 13;
        backend.options = ["Option 1", "Option 2"];
      } else if (frontendItems[source.index]?.name === "Image") {
        frontend.type = "file";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.filetype = "image";
        backend.db_label = "image";
        backend.type = 5;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Files") {
        frontend.type = "files";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.filetype = "file";
        frontend.override = true;
        frontend.grid = 12;

        backend.db_label = "files";
        backend.type = 5;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "File") {
        frontend.type = "file";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.filetype = "file";

        backend.db_label = "file";
        backend.type = 5;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Collections") {
        frontend.type = "collection";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.override = true;
        frontend.grid = 12;
        frontend.collections = [];

        backend.db_label = "collections";
        backend.type = 5;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Color") {
        /*** frontend */
        frontend.type = "color";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = true;

        /*** backend */
        backend.db_label = "color";
        backend.type = 2;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Password") {
        /*** frontend */
        frontend.type = "password";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = true;

        /*** backend */
        backend.db_label = "password";
        backend.type = 2;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Conf Pass") {
        /*** frontend */
        frontend.type = "confirm_password";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = true;
        frontend.target = "password";

        root.type = 2;
      } else if (frontendItems[source.index]?.name === "Signature") {
        /*** frontend */
        frontend.type = "signature";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = false;

        /*** backend */
        backend.db_label = "signature";
        backend.type = 5;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Divider") {
        /*** frontend */
        frontend.type = "divider";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = false;
        frontend.override = true;
        frontend.grid = 12;

        root.type = 2;
      } else if (frontendItems[source.index]?.name === "People") {
        /*** frontend */
        frontend.type = "people";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = true;
        frontend.nameLabel = "name";
        frontend.imageLabel = "url";

        root.type = 2;
      } else if (frontendItems[source.index]?.name === "Email") {
        /*** frontend */
        frontend.type = "email";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = true;

        /*** backend */
        backend.db_label = "email";
        backend.type = 2;
        backend.allowNull = false;
        // backend.unique = true;
      } else if (frontendItems[source.index]?.name === "Phone") {
        /*** frontend */
        frontend.type = "phone";
        frontend.label = frontendItems[source.index]?.name;
        frontend.placeholder = frontendItems[source.index]?.name;
        frontend.required = true;

        /*** backend */
        backend.db_label = "phone";
        backend.type = 2;
        backend.allowNull = true;
      } else if (frontendItems[source.index]?.name === "Custom") {
        frontend.type = "custom";
        frontend.label = frontendItems[source.index]?.name;
        frontend.required = true;
        frontend.height = 320;
        frontend.img = false;

        /*** backend */
        backend.db_label = "custom";
        backend.type = 5;
        backend.allowNull = true;
        backend.defaultValue = "[]";
      }

      const src = {
        ...frontendItems[source.index],
        group: groupId,
        description: "",
        readonly: false,
        type: 1,
        show: true,
        frontend: frontend,
        backend: backend,
        // relation: { isRelation: false },
        ...root,
      };

      let cp = copy([], fields, source, destination, src, endIndex);
      setFields(cp);
    } else if (
      source.droppableId.toString().startsWith("droppable") &&
      !source.droppableId.toString().startsWith("droppable_route")
    ) {
      const groupId = destination.droppableId.split("droppable")[1];
      const SourceGroupId = source.droppableId.split("droppable")[1];

      const filteredSourceFields = fields.filter(
        (fld) => fld.group == SourceGroupId
      );
      const filteredDestinationFields = fields.filter(
        (fld) => fld.group == groupId
      );
      let startId = 0;
      let endId = 0;
      filteredSourceFields.map((field, index) => {
        if (index == source.index) {
          startId = field.id;
        }
      });
      filteredDestinationFields.map((field, index) => {
        if (destination.index > 0) {
          if (index == destination.index - 1) {
            endId = field.id;
          }
        } else {
          if (index == destination.index) {
            //endId = field.id;
            fields.map((fl, indx) => {
              if (fl.id === field.id) {
                endId = indx > 0 ? fields[indx - 1].id : fields[indx];
              }
            });
          }
        }
      });
      let startIndex = 0;
      let endIndex = 0;
      let src = {};

      fields.map((field, index) => {
        if (field.id == startId) {
          startIndex = index;
          src = { ...field, group: groupId };
        } else if (field.id == endId) {
          endIndex = index;
        }
      });

      let rf = [...fields];
      rf[startIndex] = src;
      let ro = reorder_move(rf, startIndex, endIndex);
      setFields(ro);
    }
  };

  const GridCard = ({ name, icon }) => {
    return type=="exam" ? (
      <div className="flex px-3 py-3 border rounded-md shadow-1" style={{backgroundColor: theme?.palette?.background?.paper}}>
        <div className="icon">{icon}</div>
        <p className="p-name text-center">{name}</p>
      </div>
    ) : (
      <div className="input-card border" style={{backgroundColor: theme?.palette?.background?.paper}}>
        <div className="icon">{icon}</div>
        <p className="p-name text-center">{name}</p>
      </div>
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className=""></div>
      <OverlayPanel ref={opRef} showCloseIcon dismissable={false}>
          <FormViewer
            title={title}
            fields={fields}
            groups={groups}
          />
      </OverlayPanel>
      <div className="flex project-main-container">
        <div className="flex w-full" style={{ width: 300 }}>
          {/*** left div */}
          <div
            className="right-div shadow-2 border p-3"
            style={{ height: "100%", maxHeight: "100vh", overflow: "auto", backgroundColor: theme?.palette?.background?.paper }}
          >
            <div className="right-div-directions">
              <motion.div
                initial={{
                  y: -50,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: 0,
                }}
                className="flex justify-between"
              >
                <p className="font-bold text-md opacity-80">All Fields</p>
              </motion.div>
              {
                <motion.div
                  initial={{
                    scaleX: 0,
                  }}
                  animate={{
                    scaleX: 1,
                  }}
                  transition={{
                    delay: 0.3,
                  }}
                >
                  <p className="opacity-80 text-sm pt-1 pb-2">
                    Drag a field type to the right area to build your form.
                  </p>
                </motion.div>
              }
            </div>
            {
              <Droppable
                droppableId={"frontend_droppable"}
                isDropDisabled={true}
                type="inner"
              >
                {(provided, snapshot) => (
                  <div className="droppable-container">
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <div className={type=="exam" ? "flex flex-col gap-2 rounded-md shadow-1 p-2" : "grid-view"}>
                        {frontendItems?.map((ii, ind) => {
                          return (
                            <Draggable
                              draggableId={"drag_frontend" + ind}
                              index={ind}
                              key={"drag_frontend" + ind}
                            >
                              {(provided, snapshot) => (
                                <motion.div
                                  initial={{
                                    x:
                                      (ind + 1) % 3 === 1
                                        ? 200
                                        : (ind + 1) % 3 === 2
                                        ? 0
                                        : -200,
                                    y: 200,
                                    opacity: 0,
                                    scale: 0,
                                  }}
                                  animate={{
                                    x: 0,
                                    y: 0,
                                    opacity: 1,
                                    scale: [0, 1.1, 1],
                                  }}
                                  transition={{
                                    duration: 0.3,
                                    delay: ind * 0.12 + 0.5,
                                  }}
                                >
                                  <div
                                    className="draggable"
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    ref={provided.innerRef}
                                  >
                                    <GridCard name={ii.name} icon={ii.icon} />
                                  </div>
                                  {snapshot.isDragging && (
                                    <div
                                      className="draggable"
                                      // {...provided.draggableProps}
                                      // {...provided.dragHandleProps}
                                      // ref={provided.innerRef}
                                    >
                                      <GridCard name={ii.name} icon={ii.icon} />
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </Draggable>
                          );
                        })}
                      </div>
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            }
          </div>

          {/*** right div */}
          <div
            className="left-div"
            style={{ height: "100%", maxHeight: "100vh", overflow: "auto" }}
          >
            <motion.button
              initial={{
                left: 0,
                top: 0,
              }}
              animate={{
                // left: sm && showSideBar ? 235 : !sm ? "" : 5,
                left: 7,
                top: 7,
                // top: sm && !showSideBar ? 10 : "",
              }}
              className="sidebar-toggle hover:bg-[#0580fd]"
              onClick={() => {
                setShowSideBar(!showSideBar);
              }}
              style={{
                position: sm ? "absolute" : "",
                zIndex: 200,
                //left: (sm && showSideBar) ? 235 : !sm ? '' : 5 ,
                //top: (sm && !showSideBar) ? 10 : ''
              }}
            >
              {!showSideBar && <BiChevronRight style={{ fontSize: 22 }} />}
              {showSideBar && <BiChevronLeft style={{ fontSize: 22 }} />}
            </motion.button>

            {
              <div className="design-area">
                <div className="droppable-area">
                  <div className="droppable-header">
                    <p style={{color: theme.palette.primary.main}}>{title + " Form"}</p>
                    <div>
                      <IconButton
                        onClick={(e) => {
                          opRef?.current?.toggle(e);
                        }}
                      >
                        <MdOutlinePreview
                          style={{
                            fontSize: 25,
                            padding: 0,
                            margin: 0,
                            color: theme.palette.primary.main,
                          }}
                        />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          let groupId = 0;
                          groups?.map((group) => {
                            if (group?.id > groupId) {
                              groupId = group?.id;
                            }
                          });
                          groupId++;
                          setGroups([
                            ...groups,
                            {
                              id: groupId,
                              name: "Enter group name...",
                              readonly: false,
                            },
                          ]);
                        }}
                      >
                        <BiAddToQueue
                          style={{
                            fontSize: 25,
                            color: theme.palette.primary.main,
                          }}
                        />
                      </IconButton>
                    </div>
                  </div>
                  <Divider />

                  <Droppable
                    droppableId="outer_droppable"
                    direction="vertical"
                    type="outer"
                  >
                    {(provided2, snap) => (
                      <div
                        {...provided2.droppableProps}
                        ref={provided2.innerRef}
                        style={{
                          margin: snap.isDraggingOver ? 10 : "",
                          background: snap.isDraggingOver
                            ? "rgba(10,10,240,.08)"
                            : "",
                          border: snap.isDraggingOver
                            ? "2px dashed rgb(56, 106, 255)"
                            : "",
                          borderRadius: 5,
                          //paddingLeft: !snapshot.isDraggingOver ?  0 : ""
                        }}
                      >
                        {groups?.map((group, groupIndex) => {
                          let groupFields = [];

                          fields?.map((field) => {
                            if (field?.group == group.id) {
                              groupFields.push(field);
                            }
                          });

                          return (
                            <Draggable
                              draggableId={"outer_drag" + groupIndex}
                              index={groupIndex}
                              key={"outer_drag" + groupIndex}
                            >
                              {(providedDrag) => (
                                <div
                                  {...providedDrag.draggableProps}
                                  // {...providedDrag.dragHandleProps}
                                  ref={providedDrag.innerRef}
                                >
                                  <Droppable
                                    droppableId={
                                      "droppable" + group?.id ?? groupIndex
                                    }
                                    isDropDisabled={false}
                                    type="inner"
                                  >
                                    {(provided, snapshot) => (
                                      <div className="droppable-container">
                                        <label>
                                          <EditGroup
                                            groupName={group?.name ?? ""}
                                            callBackFunc={(value) => {
                                              let grps = groups?.map((grp, index) => {
                                                if (grp?.id == group?.id) {
                                                  grp.name = value;
                                                }
                                                return grp
                                              });
                                              const updatedGroups = groups?.map((grp) => {
                                                  if (group?.id === grp?.id) {
                                                      return { ...grp, name: value };
                                                  }
                                                  return grp;
                                              });
                                              setGroups(updatedGroups);
                                            }}
                                            deleteCallBack={() => {
                                              if (confirm("Are you sure?")) {
                                                let fieldsTemp = fields?.map(
                                                  (field) => {
                                                    if (
                                                      field?.group == group?.id
                                                    ) {
                                                      field.group = 1;
                                                    }
                                                    return field;
                                                  }
                                                );
                                                let grps = groups.filter(
                                                  (grp) => grp.id != group?.id
                                                );
                                                setFields((prev) => fieldsTemp);
                                                setGroups((prev) => grps);
                                              }
                                            }}
                                            readonly={group?.readonly ?? false}
                                            ind={groupIndex}
                                            provided={providedDrag}
                                            expanded={editGroupExpanded}
                                            setExpanded={setEditGroupExpanded}
                                            groupId={groupIndex}
                                            allGroups={groups}
                                            groupObject={group}
                                            setGroups={setGroups}
                                          />
                                        </label>
                                        <div
                                          {...provided.droppableProps}
                                          ref={provided.innerRef}
                                          style={{
                                            background: snapshot.isDraggingOver
                                              ? (theme?.palette?.mode == "light" ? "#e6effc" : "#35374b")
                                              : groupFields.length <= 0
                                              ? theme?.palette?.background?.default
                                              : "",
                                            border: !(
                                              editGroupExpanded[
                                                `group` + groupIndex
                                              ] ?? true
                                            )
                                              ? ""
                                              : snapshot.isDraggingOver
                                              ? "2px dashed rgb(56, 106, 255)"
                                              : groupFields.length <= 0
                                              ? "2px dashed rgb(0, 0, 0, .1)"
                                              : "1px solid rgba(0,0,0,.1)",
                                            //paddingLeft: !snapshot.isDraggingOver ?  0 : ""
                                          }}
                                          className={
                                            editGroupExpanded[
                                              `group` + groupIndex
                                            ] ?? true
                                              ? "droppable"
                                              : ""
                                          }
                                        >
                                          {(editGroupExpanded[
                                            `group` + groupIndex
                                          ] ??
                                            true) && (
                                            <div>
                                              {groupFields?.map(
                                                (field, ind) => {
                                                  //frontendItems
                                                  let icon = <></>;
                                                  if (
                                                    field?.frontend?.type ==
                                                      "text" &&
                                                    field?.frontend
                                                      ?.multiline == false
                                                  ) {
                                                    icon = <IoText />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                      "text" &&
                                                    field?.frontend
                                                      ?.multiline == true
                                                  ) {
                                                    icon = <BsTextareaT />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "rich_text"
                                                  ) {
                                                    icon = <BsTextLeft />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "date"
                                                  ) {
                                                    icon = <MdDateRange />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "number"
                                                  ) {
                                                    icon = (
                                                      <TiSortNumerically />
                                                    );
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "select"
                                                  ) {
                                                    icon = (
                                                      <IoIosArrowDropdown />
                                                    );
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "checkbox"
                                                  ) {
                                                    icon = <TbCheckbox />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "email"
                                                  ) {
                                                    icon = <AiOutlineMail />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "phone"
                                                  ) {
                                                    icon = <IoCallOutline />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "radio"
                                                  ) {
                                                    icon = (
                                                      <MdRadioButtonChecked />
                                                    );
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "slider"
                                                  ) {
                                                    icon = <RxSlider />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "currency"
                                                  ) {
                                                    icon = <BsCashCoin />;
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "color"
                                                  ) {
                                                    icon = (
                                                      <AiOutlineFontColors />
                                                    );
                                                  } else if (
                                                    field?.frontend?.type ==
                                                    "signature"
                                                  ) {
                                                    icon = <TbSignature />;
                                                  }
                                                  return (
                                                    <Draggable
                                                      draggableId={
                                                        "drop" +
                                                        groupIndex +
                                                        "drag" +
                                                        ind
                                                      }
                                                      index={ind}
                                                      key={"drag" + ind}
                                                    >
                                                      {(provided, snapshot) => (
                                                        <div
                                                          className="draggable"
                                                          {...provided.draggableProps}
                                                          {...provided.dragHandleProps}
                                                          ref={
                                                            provided.innerRef
                                                          }
                                                        >
                                                          {(
                                                            <FieldDetail
                                                              name={field.name}
                                                              icon={icon}
                                                              index={ind}
                                                              fieldId={field.id}
                                                              readonly={
                                                                field.readonly
                                                              }
                                                              fields={fields}
                                                              setFields={
                                                                setFields
                                                              }
                                                            />
                                                          )}
                                                        </div>
                                                      )}
                                                    </Draggable>
                                                  );
                                                }
                                              )}
                                            </div>
                                          )}

                                          {provided.placeholder}
                                        </div>
                                        {!(
                                          editGroupExpanded[
                                            `group` + groupIndex
                                          ] ?? true
                                        ) && <div className="mt-4 border-b" />}
                                      </div>
                                    )}
                                  </Droppable>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}

                        {provided2.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default FormBuilder;
