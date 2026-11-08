import React, { createContext, useContext, useState } from 'react';

export const DataContext = createContext({
  new: null,
  edit: null,
  detail: null,
  childOne: null,
  childTwo: null,
  childThree: null,
  childFour: null,
  childFive: null,

  childOneDetail: null,
  childTwoDetail: null,
  childThreeDetail: null,
  childFourDetail: null,
  childFiveDetail: null,

  setNewComponent: ()=><div></div>,
  setEditComponent: ()=>{},
  setDetailComponent: ()=>{},

  setChildOneComponent: ()=>{},
  setChildTwoComponent: ()=>{},
  setChildThreeComponent: ()=>{},
  setChildFourComponent: ()=>{},
  setChildFiveComponent: ()=>{},

  setChildOneDetailComponent: ()=>{},
  setChildTwoDetailComponent: ()=>{},
  setChildThreeDetailComponent: ()=>{},
  setChildFourDetailComponent: ()=>{},
  setChildFiveDetailComponent: ()=>{},
});

export const DataProvider = ({ children }) => {
  const newInitial = () => <div>New Component</div>;
  const editInitial = () => <div>Edit Component</div>;
  const detailInitial = () => <div>Detail Component</div>;

  const childOneInitial = () => <div>Ch1</div>;
  const childTwoInitial = () => <div>Ch2</div>;
  const childThreeInitial = () => <div>Ch3</div>;
  const childFourInitial = () => <div>Ch4</div>;
  const childFiveInitial = () => <div>Ch5</div>;

  const childOneDetailInitial = () => <div>Ch1 Detail</div>;
  const childTwoDetailInitial = () => <div>Ch2 Detail</div>;
  const childThreeDetailInitial = () => <div>Ch3 Detail</div>;
  const childFourDetailInitial = () => <div>Ch4 Detail</div>;
  const childFiveDetailInitial = () => <div>Ch5 Detail</div>;

  const [newComponent, setNewComponent] = useState(()=>newInitial);
  const [editComponent, setEditComponent] = useState(()=>editInitial);
  const [detailComponent, setDetailComponent] = useState(()=>detailInitial);

  const [childOneComponent, setChildOneComponent] = useState(()=>childOneInitial);
  const [childTwoComponent, setChildTwoComponent] = useState(()=>childTwoInitial);
  const [childThreeComponent, setChildThreeComponent] = useState(()=>childThreeInitial);
  const [childFourComponent, setChildFourComponent] = useState(()=>childFourInitial);
  const [childFiveComponent, setChildFiveComponent] = useState(()=>childFiveInitial);
  
  const [childOneDetailComponent, setChildOneDetailComponent] = useState(()=>childOneDetailInitial);
  const [childTwoDetailComponent, setChildTwoDetailComponent] = useState(()=>childTwoDetailInitial);
  const [childThreeDetailComponent, setChildThreeDetailComponent] = useState(()=>childThreeDetailInitial);
  const [childFourDetailComponent, setChildFourDetailComponent] = useState(()=>childFourDetailInitial);
  const [childFiveDetailComponent, setChildFiveDetailComponent] = useState(()=>childFiveDetailInitial);


  const contextValue = {
    new: newComponent,
    edit: editComponent,
    detail: detailComponent,

    childOne: childOneComponent,
    childTwo: childTwoComponent,
    childThree: childThreeComponent,
    childFour: childFourComponent,
    childFive: childFiveComponent,

    childOneDetail: childOneDetailComponent,
    childTwoDetail: childTwoDetailComponent,
    childThreeDetail: childThreeDetailComponent,
    childFourDetail: childFourDetailComponent,
    childFiveDetail: childFiveDetailComponent,

    setNewComponent: (component) => {
      setNewComponent((prev)=>component)
    },
    setEditComponent: (component) => {
      setEditComponent((prev)=>component)
    },
    setDetailComponent: (component) => {
      setDetailComponent((prev)=>component)
    },

    setChildOneComponent: (component) => {
      setChildOneComponent((prev)=>component)
    },
    setChildTwoComponent: (component) => {
      setChildTwoComponent((prev)=>component)
    },
    setChildThreeComponent: (component) => {
      setChildThreeComponent((prev)=>component)
    },
    setChildFourComponent: (component) => {
      setChildFourComponent((prev)=>component)
    },
    setChildFiveComponent: (component) => {
      setChildFiveComponent((prev)=>component)
    },

    setChildOneDetailComponent: (component) => {
      setChildOneDetailComponent((prev)=>component)
    },
    setChildTwoDetailComponent: (component) => {
      setChildTwoDetailComponent((prev)=>component)
    },
    setChildThreeDetailComponent: (component) => {
      setChildThreeDetailComponent((prev)=>component)
    },
    setChildFourDetailComponent: (component) => {
      setChildFourDetailComponent((prev)=>component)
    },
    setChildFiveDetailComponent: (component) => {
      setChildFiveDetailComponent((prev)=>component)
    },
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  return useContext(DataContext)
}
