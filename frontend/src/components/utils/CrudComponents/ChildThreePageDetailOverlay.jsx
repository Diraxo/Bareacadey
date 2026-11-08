import React,{useContext} from 'react'
import { useLocation } from 'react-router-dom';
import { DataContext } from '../../../DataContext';
import { Card, CardHeader, CardContent } from '@mui/material';
import { BreadcrumbOverlay } from './ComponentsOverlay';

const ChildThreeDetailPageOverlay = ({children}) => {
  const location = useLocation();
  const { childThreeDetail: ChildThreeDetailComponent } = useContext(DataContext);
  
  return (
    <div>
      <BreadcrumbOverlay
          title={location.state?.header??""}
          enableClickActive={false}
          subtitle={location.state?.subtitle??""}
      />
      <Card sx={{mt: 5, p: 5}}>
        <ChildThreeDetailComponent />
      </Card>
    </div>
  )
}

export default ChildThreeDetailPageOverlay