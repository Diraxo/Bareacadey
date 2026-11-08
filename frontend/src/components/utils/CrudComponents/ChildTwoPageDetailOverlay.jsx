import React,{useContext} from 'react'
import { useLocation } from 'react-router-dom';
import { DataContext } from '../../../DataContext';
import { Card, CardHeader, CardContent } from '@mui/material';
import { BreadcrumbOverlay } from './ComponentsOverlay';

const ChildTwoDetailPageOverlay = ({children}) => {
  const location = useLocation();
  const { childTwoDetail: ChildTwoDetailComponent } = useContext(DataContext);
  
  return (
    <div>
      <BreadcrumbOverlay
          title={location.state?.header??""}
          enableClickActive={false}
          subtitle={location.state?.subtitle??""}
      />
      <Card sx={{mt: 5, p: 5}}>
        <ChildTwoDetailComponent />
      </Card>
    </div>
  )
}

export default ChildTwoDetailPageOverlay