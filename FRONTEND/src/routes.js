import { createBrowserRouter } from 'react-router';
import { Root }         from './components/Root';
import { Layout }       from './components/Layout';
import { Landing }      from './pages/Landing';
import { Login }        from './pages/Login';
import { Dashboard }    from './pages/Dashboard';
import { Tasks }        from './pages/Tasks';
import { StudyTimer }   from './pages/Timer';
import { Analytics }    from './pages/Analytics';
import { Goals }        from './pages/Goals';
import { Notes }        from './pages/Notes';
import { Achievements } from './pages/Achievements';
import { Settings }     from './pages/Settings';

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      { path: '/',      Component: Landing },
      { path: '/login', Component: Login   },
      {
        path: '/app',
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
]);
