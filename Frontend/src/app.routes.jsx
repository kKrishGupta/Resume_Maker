import {createBrowserRouter} from 'react-router';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import Protected from './features/auth/components/Protected';
import Home from './features/interview/pages/Home';
import Interview from './features/interview/pages/Interview';
import Resume from "./features/resume/pages/ResumeBuilder";
import Mock from './features/mock/pages/mock';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import UserDashboard from './features/dashboard/pages/UserDashboard';
import ReportPage from './features/dashboard/pages/ReportPage';

export const router = createBrowserRouter([
{
  path :"/login",
  element : <Login/>
},
{
  path :"/register",
  element : <Register/>
},{
  path:"/",
  element:<Protected><Home/></Protected>
},{
  path:"/interview/:interviewId",
  element:<Protected><Interview /></Protected>
},{
  path:"/mock",
  element:<Protected><Mock /></Protected>
},{
  path:"/mock/:interviewId",
  element:<Protected><Mock /></Protected>
},
{
  path:"/admin",
  element:<Protected><AdminDashboard /></Protected>
},
{
  path:"/dashboard",
  element:<Protected><UserDashboard /></Protected>
},
{
  path:"/dashboard/report",
  element:<Protected><ReportPage /></Protected>
},
 {
    path: "/resume/:id",
    element:<Protected><Resume /></Protected>
  }
]);
