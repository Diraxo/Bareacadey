import React,{useContext} from 'react'
import { useLocation } from 'react-router-dom';
import { DataContext } from '../../../DataContext';
import { Card, CardHeader, CardContent } from '@mui/material';
import { BreadcrumbOverlay } from './ComponentsOverlay';

const ChildOnePageOverlay = ({children}) => {
  const location = useLocation();
  const { childOne: ChildOneComponent } = useContext(DataContext);
  
  return (
    <div>
      <BreadcrumbOverlay
          title={location.state?.header??""}
          enableClickActive={false}
          subtitle={location.state?.subtitle??""}
      />
      <div style={{marginTop: 20}}>
        <ChildOneComponent />
      </div>
    </div>
  )
}

export default ChildOnePageOverlay