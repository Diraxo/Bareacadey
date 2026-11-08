import { Card, CardContent, CardHeader, Grid, IconButton } from '@mui/material';
import React from 'react'
import { BiDotsVerticalRounded } from 'react-icons/bi';
import { MdOutlineDelete } from 'react-icons/md';
import { BreadcrumbOverlay, MenuOverlay, ProgressBarOverlay } from '../../utils/CrudComponents/ComponentsOverlay';
import AllUsersDashboard from './AllUsersDashboard';

const Dashboard = () => {
  const modules = [
    {
      id: 1,
      name: "Vehicles",
      count: 10,
    },
    {
      id: 2,
      name: "Permanent Drivers",
      count: 5,
    },
    {
      id: 3,
      name: "Contract Drivers",
      count: 24
    },
    {
      id: 4,
      name: "Trips",
      count: 36
    },
    {
      id: 5,
      name: "Roles",
      count: 10
    }
  ]
  return (
    <div>
       <BreadcrumbOverlay
            title={"Dashboard"}
            enableClickActive={true}
            subtitle={"This is a place where you get overview report of everything"}
        />
        <div className='mt-3'></div>
        <Grid container spacing={3}>
          <Grid item xs={12}>
        <AllUsersDashboard />
            
          </Grid>
          {
            modules.map((module, index)=>{
              return (
                   <Grid item xs={12} sm={6} lg={4} xl={3} key={index}>
                      <Card>
                        <CardHeader
                          title={
                            <div className='flex justify-between'>
                              <p className='text-sm font-normal'>Total of {module.count}</p>
                              <MenuOverlay
                                button={ <IconButton style={{marginRight: -10, marginTop: -10}}>
                                            <BiDotsVerticalRounded size={22} />
                                          </IconButton>}
                                sx={{
                                  marginTop: 5,
                                  ml: 3
                                }}
                                menuItems={
                                  [
                                    {
                                      name: "Delete",
                                      icon: <MdOutlineDelete/>,
                                      onClick: (e)=>{
                                      }
                                    }
                                  ]
                                }
                              />
                            </div>
                        }
                        />
                        <CardContent>
                          <div className='flex justify-between'>
                          <div>
                              <p className='text-2xl'>{module.name}</p>
                          </div>
                          <div className='flex items-end'>
                             
                             
                          </div>
                          </div>
                          
                        </CardContent>
                      </Card>
                </Grid>
              )
            })
          }
        </Grid>
    </div>
  )
}

export default Dashboard