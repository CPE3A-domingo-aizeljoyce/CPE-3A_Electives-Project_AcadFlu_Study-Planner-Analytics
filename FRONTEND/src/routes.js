import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { Root }          from './components/Root';
import { Layout }        from './components/Layout';
import { Landing }       from './pages/Landing';
import { Login }         from './pages/Login';
import { AuthCallback }  from './pages/AuthCallback';
import { ResetPassword } from './pages/ResetPassword';   // ← ADDED
import { Dashboard }     from './pages/Dashboard';
import { Tasks }         from './pages/Tasks';
import { StudyTimer }         from './pages/Timer';
import { Analytics }     from './pages/Analytics';
import { Goals }         from './pages/Goals';
import { Notes }         from './pages/Notes';
import { Achievements }  from './pages/Achievements';
import { Settings }      from './pages/Settings';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) return React.createElement(Navigate, { to: '/login', replace: true });
  return React.createElement(Outlet, null);
}

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      { path: '/',               Component: Landing      },
      { path: '/login',          Component: Login        },
      { path: '/auth/callback',  Component: AuthCallback },
      { path: '/reset-password', Component: ResetPassword },   // ← ADDED
      {
        path: '/app',
        Component: ProtectedRoute,
        children: [
          {
            Component: Layout,
            children: [
              { index: true,          Component: Dashboard    },
              { path: 'tasks',        Component: Tasks        },
              { path: 'timer',        Component: StudyTimer   },
              { path: 'analytics',    Component: Analytics    },
              { path: 'goals',        Component: Goals        },
              { path: 'notes',        Component: Notes        },
              { path: 'achievements', Component: Achievements },
              { path: 'settings',     Component: Settings     },
            ],
          },
        ],
      },
    ],
  },
]);
