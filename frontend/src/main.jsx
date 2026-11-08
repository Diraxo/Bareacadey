import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { DataProvider } from './DataContext';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import io from 'socket.io-client';

import ErrorPage from './ErrorPage';
import RequireAuth from './features/auth/requireAuth';
import RequireLogOut from './features/auth/requireLogOut';
import Loader from './components/utils/Loader';
import Logout from './features/auth/Logout';

import 'primereact/resources/primereact.css'; // core css
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css'; // icons
import './assets/primereact/styles/layout/layout.scss';
import './assets/primereact/styles/demo/Demos.scss';
import './index.scss';

// Lazy-loaded components
const App = React.lazy(() => import('./App'));
const UserLayout = React.lazy(() => import('./components/layouts/UserLayout'));
const LoginPage = React.lazy(() => import('./components/login'));
const Dashboard = React.lazy(() => import('./components/admin/dashboard/dashboard'));
const RegisterPage = React.lazy(() => import('./components/login/Register'));
const ProfileUpdate = React.lazy(() => import('./components/admin/profile/ProfileUpdate'));
const Chat = React.lazy(() => import('./components/admin/chat/chat'));
const Users = React.lazy(() => import('./components/admin/users/users'));
const Activities = React.lazy(() => import('./components/admin/activity/activities'));
const Email = React.lazy(() => import('./components/admin/email/email'));
const LandingPageItemsTab = React.lazy(() => import('./components/admin/LandingPageItems/LandingPageItems'));
const Contacts = React.lazy(() => import('./components/admin/Communication/Contacts/Contacts'));
const ResetPasswordPage = React.lazy(() => import('./components/login/ResetPassword'));
const MyTasksMain = React.lazy(() => import('./components/admin/Misc/MyTasks/MyTasksMain'));
const DeviceVerifiedPage = React.lazy(() => import('./components/login/DeviceVerified'));
const EmailVerifiedPage = React.lazy(() => import('./components/login/EmailVerified'));
const NewDashboard = React.lazy(() => import('./components/admin/dashboard/NewDashboard'));
const ELearningLandingPage = React.lazy(() => import('./components/landing_page/templates/ecommerce/ELearning'));
const CoursesTab = React.lazy(() => import('./components/admin/Courses/Courses'));
const ChaptersList = React.lazy(() => import('./components/landing_page/templates/ecommerce/ChaptersList'));
const Settings = React.lazy(() => import('./components/admin/account/settings'));
const Roles = React.lazy(() => import('./components/admin/roles/roles'));
const Quizzes = React.lazy(() => import('./components/admin/Quizzes/Quizzes'));
const PrivacyPage = React.lazy(() => import('./components/legal/PrivacyPage'));
const TermsPage = React.lazy(() => import('./components/legal/TermsPage'));
const SupportPage = React.lazy(() => import('./components/legal/SupportPage'));
const Instructors = React.lazy(() => import('./components/admin/Instructors/Instructors'));

// Socket connection
// The server rejects unauthenticated sockets. The access token is read at (re)connect time, and the connection is
// re-established whenever the token changes (login, silent refresh, logout).
const socket = io(import.meta.env.VITE_API_URL, {
  transports: ['websocket'],
  autoConnect: false,
  auth: (cb) => cb({ token: store.getState()?.auth?.token }),
});
let lastSocketToken = null;
const syncSocket = () => {
  const token = store.getState()?.auth?.token || null;
  if (token === lastSocketToken) return;
  lastSocketToken = token;
  socket.disconnect();
  if (token) socket.connect();
};
store.subscribe(syncSocket);
syncSocket();

// Import generated routes
import generateChildRoutes from './generateChildRoutes';

// generateChildRoutes("", 5)?.map((gr)=>console.log(gr?.path))

const routes = [
  {
    path: "/",
    element: <Suspense fallback={<Loader />}><App socket={socket} /></Suspense>,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Suspense fallback={<Loader />}><ELearningLandingPage /></Suspense> },
      { path: "privacy", element: <Suspense fallback={<Loader />}><PrivacyPage /></Suspense> },
      { path: "terms", element: <Suspense fallback={<Loader />}><TermsPage /></Suspense> },
      { path: "support", element: <Suspense fallback={<Loader />}><SupportPage /></Suspense> },
      { path: "courses/chapters", element: <Suspense fallback={<Loader />}><ChaptersList /></Suspense> },
      { path: "ecommerce", element: <Suspense fallback={<Loader />}><ELearningLandingPage /></Suspense> },
      { path: "profile_update", element: <Suspense fallback={<Loader />}><ProfileUpdate /></Suspense> },
      { path: "logout", element: <Suspense fallback={<Loader />}><Logout socket={socket} /></Suspense> },
      {
        element: <RequireLogOut />,
        children: [
          { path: "auth/login", element: <Suspense fallback={<Loader />}><LoginPage /></Suspense> },
          { path: "auth/register", element: <Suspense fallback={<Loader />}><RegisterPage /></Suspense> },
          { path: "auth/reset", element: <Suspense fallback={<Loader />}><ResetPasswordPage /></Suspense> },
          { path: "auth/device_verified", element: <Suspense fallback={<Loader />}><DeviceVerifiedPage /></Suspense> },
          { path: "auth/verify_email", element: <Suspense fallback={<Loader />}><EmailVerifiedPage /></Suspense> },
        ],
      },
      {
        element: <RequireAuth />,
        path: "admin",
        children: [
          { path: "", element: <Navigate to="main" replace /> },
          {
            path: "main",
            element: <Suspense fallback={<Loader />}><UserLayout /></Suspense>,
            children: [
              { path: "", element: <Suspense fallback={<Loader />}><NewDashboard /></Suspense> },
              { path: "users", element: <Suspense fallback={<Loader />}><Users /></Suspense> },
              { path: "roles", element: <Suspense fallback={<Loader />}><Roles /></Suspense> },
              { path: "courses", element: <Suspense fallback={<Loader />}><CoursesTab /></Suspense> },
              { path: "quizzes", element: <Suspense fallback={<Loader />}><Quizzes /></Suspense> },
              { path: "instructors", element: <Suspense fallback={<Loader />}><Instructors /></Suspense> },
              { path: "contact-us", element: <Suspense fallback={<Loader />}><Contacts /></Suspense> },
              { path: "landing_page_customization", element: <Suspense fallback={<Loader />}><LandingPageItemsTab /></Suspense> },
              { path: "chat", element: <Suspense fallback={<Loader />}><Chat socket={socket} /></Suspense> },
              { path: "email", element: <Suspense fallback={<Loader />}><Email /></Suspense> },
              { path: "activities", element: <Suspense fallback={<Loader />}><Activities /></Suspense> },
              { path: "mytasks", element: <Suspense fallback={<Loader />}><MyTasksMain /></Suspense> },
              { path: "settings", element: <Suspense fallback={<Loader />}><Settings /></Suspense> },
              { path: "profile_update", element: <Suspense fallback={<Loader />}><ProfileUpdate /></Suspense> },
              { path: "logout", element: <Suspense fallback={<Loader />}><Logout socket={socket} /></Suspense> },
              ...generateChildRoutes("", 5),


            ],
          },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

let container = null;

document.addEventListener('DOMContentLoaded', function (event) {
  if (!container) {
    container = document.getElementById('root');
    const root = ReactDOM.createRoot(container)
    root.render(<Loader />)
    root.render(
      <Provider store={store}>
        <DataProvider>
          <RouterProvider router={router} />
        </DataProvider>
      </Provider>
    );
  }
});

