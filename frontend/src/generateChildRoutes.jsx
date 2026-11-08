import React, { Suspense } from 'react';
import Loader from './components/utils/Loader';

const NewPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/NewPageOverlay'));
const EditPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/EditPageOverlay'));
const ChildOnePageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildOnePageOverlay'));
const ChildTwoPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildTwoPageOverlay'));
const ChildThreePageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildThreePageOverlay'));
const ChildFourPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildFourPageOverlay'));
const ChildFivePageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildFivePageOverlay'));
const ChildOneDetailPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildOnePageDetailOverlay'));
const ChildTwoDetailPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildTwoPageDetailOverlay'));
const ChildThreeDetailPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildThreePageDetailOverlay'));
const ChildFourDetailPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildFourPageDetailOverlay'));
const ChildFiveDetailPageOverlay = React.lazy(() => import('./components/utils/CrudComponents/ChildFivePageDetailOverlay'));

// import NewPageOverlay from './components/utils/CrudComponents/NewPageOverlay';
// import EditPageOverlay from './components/utils/CrudComponents/EditPageOverlay';

// import ChildOnePageOverlay from './components/utils/CrudComponents/ChildOnePageOverlay';
// import ChildTwoPageOverlay from './components/utils/CrudComponents/ChildTwoPageOverlay';
// import ChildThreePageOverlay from './components/utils/CrudComponents/ChildThreePageOverlay';
// import ChildFourPageOverlay from './components/utils/CrudComponents/ChildFourPageOverlay';
// import ChildFivePageOverlay from './components/utils/CrudComponents/ChildFivePageOverlay';

// import ChildOneDetailPageOverlay from './components/utils/CrudComponents/ChildOnePageDetailOverlay';
// import ChildTwoDetailPageOverlay from './components/utils/CrudComponents/ChildTwoPageDetailOverlay';
// import ChildThreeDetailPageOverlay from './components/utils/CrudComponents/ChildThreePageDetailOverlay';
// import ChildFourDetailPageOverlay from './components/utils/CrudComponents/ChildFourPageDetailOverlay';
// import ChildFiveDetailPageOverlay from './components/utils/CrudComponents/ChildFivePageDetailOverlay';


const generateChildRoutes = (basePath = "", depth = 5) => {
  if(false) {
  return [

    {
      path: ":model/l/:model",
      element: <ChildOnePageOverlay />
    },
    {
      path: ":model/l/:model/new",
      element: <NewPageOverlay />
    },
    {
      path: ":model/l/:model/edit",
      element: <EditPageOverlay />
    },
    {
      path: ":model/l/:model/detail",
      element: <ChildOneDetailPageOverlay />
    },
    {
      path: ":model/l/:model/detail/edit",
      element: <EditPageOverlay />
    },
    {
      path: ":model/new",
      element: <NewPageOverlay />
    },
    {
      path: ":model/edit",
      element: <EditPageOverlay />
    },
    {
      path: ":model/detail",
      element: <ChildOneDetailPageOverlay />
    },
    {
      path: ":model/detail/edit",
      element: <EditPageOverlay />
    },

  ]
}

  const routes = [
        { path: `:model/l/:model`, element: <Suspense fallback={<Loader />}><ChildOnePageOverlay /></Suspense> },
        { path: `:model/l/:model/new`, element: <Suspense fallback={<Loader />}><NewPageOverlay /></Suspense> },
        { path: `:model/l/:model/edit`, element: <Suspense fallback={<Loader />}><EditPageOverlay /></Suspense> },
        { path: `:model/l/:model/detail`, element: <Suspense fallback={<Loader />}><ChildOneDetailPageOverlay /></Suspense> },
        { path: `:model/l/:model/detail/edit`, element: <Suspense fallback={<Loader />}><EditPageOverlay /></Suspense> },
        { path: `:model/new`, element: <Suspense fallback={<Loader />}><NewPageOverlay /></Suspense> },
        { path: `:model/edit`, element: <Suspense fallback={<Loader />}><EditPageOverlay /></Suspense> },
        { path: `:model/detail`, element: <Suspense fallback={<Loader />}><ChildOneDetailPageOverlay /></Suspense> },
        { path: `:model/detail/edit`, element: <Suspense fallback={<Loader />}><EditPageOverlay /></Suspense> }
  ];

  // Define components for each level
  const overlays = [
    <ChildOnePageOverlay />,
    <ChildTwoPageOverlay />,
    <ChildThreePageOverlay />,
    <ChildFourPageOverlay />,
    <ChildFivePageOverlay />,
  ];

  const details = [
    <ChildOneDetailPageOverlay />,
    <ChildTwoDetailPageOverlay />,
    <ChildThreeDetailPageOverlay />,
    <ChildFourDetailPageOverlay />,
    <ChildFiveDetailPageOverlay />,
  ];

  let routesWithL = []
  let routesWithOutL = []

  const createRoutes = (pathPrefix, level) => {
    if (level >= depth) return;

    const Overlay = overlays[level];
    const Detail = details[level];

    
    routesWithL.push(
        { path: `${pathPrefix}/:model`, element: <Suspense fallback={<Loader />}>{Overlay}</Suspense> },
        { path: `${pathPrefix}/:model/new`, element: <Suspense fallback={<Loader />}><NewPageOverlay /></Suspense> },
        { path: `${pathPrefix}/:model/edit`, element: <Suspense fallback={<Loader />}><EditPageOverlay /></Suspense> },
        { path: `${pathPrefix}/:model/detail`, element: <Suspense fallback={<Loader />}>{Detail}</Suspense> },
        { path: `${pathPrefix}/:model/detail/edit`, element: <Suspense fallback={<Loader />}><EditPageOverlay /></Suspense> }
    )
    routesWithOutL.push(
        { path: `${pathPrefix}/:model`, element: <Suspense fallback={<Loader />}>{Overlay}</Suspense> },
        { path: `${pathPrefix}/:model/new`, element: <Suspense fallback={<Loader />}><NewPageOverlay /></Suspense> },
        { path: `${pathPrefix}/:model/edit`, element: <Suspense fallback={<Loader />}><EditPageOverlay /></Suspense> },
        { path: `${pathPrefix}/:model/detail`, element: <Suspense fallback={<Loader />}>{Detail}</Suspense> },
        { path: `${pathPrefix}/:model/detail/edit`, element: <Suspense fallback={<Loader />}><EditPageOverlay /></Suspense> }
    )

    // Generate nested routes recursively
    createRoutes(`${pathPrefix}/:model/detail`, level + 1);
  };

  // Start with the root path
  createRoutes(basePath, 1);


  routesWithL = routesWithL.map((route)=>{
    return (
      {...route, path: ":model/l/:model/detail"+route?.path}
    )
  })
  routesWithOutL = routesWithOutL.map((route)=>{
    return (
      {...route, path: ":model/detail"+route?.path}
    )
  })

  routes.push(...routesWithL, ...routesWithOutL)

  return routes;
};


export default generateChildRoutes;
