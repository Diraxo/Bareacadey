import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {useTheme} from '@mui/material/styles';
import { useSelector } from 'react-redux';

const KanbanOverlay = ({data, routeStates, kanbanComponent, emptyComponent, kanbanDropCallback, label="routeState",}) => {
  const theme = useTheme()
  const authPermissions = useSelector(state=>state?.auth?.user?.permissions);

  function rearrange (data, source, destination) {
    let array = [...data]
    let sourceIndex = array.findIndex (obj => obj.id == source?.id);
    let destinationIndex = array.findIndex (obj => obj.id == destination?.id);
    if (sourceIndex !== -1 && destinationIndex !== -1) {
      let sourceObject = array.splice (sourceIndex, 1) [0];
      array.splice (destinationIndex, 0, sourceObject);
    }
    return array?.map((arr)=>arr?.id);
  }

  const onDragEnd = result => {
    const { destination, source, draggableId } = result;
    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    const sourceItems = data?.filter(dt=>dt[label] == source?.droppableId);
    const destinationItems = data?.filter(dt=>dt[label] == destination?.droppableId);
    const sourceItem = sourceItems[source?.index];
    const destinationItem = destinationItems[destination?.index];
    const ordered = rearrange(data, sourceItem, destinationItem);
    kanbanDropCallback(source, destination, sourceItem, ordered)
  };


  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-row gap-6 w-full overflow-x-auto">
        {routeStates?.map(routeState => {
          const items = data?.filter(dt=>dt[label] == routeState?.label);
          if(routeState?.access?.length > 0) {
            if(!routeState?.access?.some(item=>authPermissions?.includes(item))) {
              return;
            }
          }
          let droppable = true;
          if(routeState?.set_access?.length > 0) {
            if(!routeState?.set_access?.some(access=>authPermissions?.includes(access))) {
              droppable = false;
            }
          }
          return (
            <div key={routeState?.label} className="w-full shadow-2 border rounded-md mr-4">
              <div className="text-lg font-medium mb-3 flex items-center p-3 rounded" style={{
                backgroundColor: routeState?.color,
                color: routeState?.color ? "white" : ""
              }}>{routeState?.header}</div>
              <Droppable droppableId={routeState?.label} isDropDisabled={!droppable}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    className={` px-3 ${
                      snapshot.isDraggingOver ? `border-2 rounded ${theme?.palette?.mode=="light" ? 'bg-gray-100' : 'bg-gray-900'} border-dotted` : ''
                    }`}
                    {...provided.droppableProps}
                  >
                    {items?.map((item, index) => (
                      <Draggable key={item.id} draggableId={"item"+item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`py-2 rounded-md ${
                              snapshot.isDragging
                                ? 'opacity-80'
                                : ''
                            }`}
                            
                          >
                           {kanbanComponent(item, routeState)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items?.length === 0 && <div className="empty-message" style={{minWidth: 250}}>{emptyComponent}</div>}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
        </div>
        </DragDropContext>
  )
}


export default KanbanOverlay;