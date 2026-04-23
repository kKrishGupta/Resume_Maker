import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './app.routes.jsx';

import { AuthProvider } from './features/auth/auth.context.jsx';
import { SessionProvider } from "./features/interview/session.context";
import { InterviewProvider } from "./features/interview/interview.context";

function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <InterviewProvider>
          <RouterProvider router={router} />
        </InterviewProvider>
      </SessionProvider>
    </AuthProvider>
  );
}

export default App;