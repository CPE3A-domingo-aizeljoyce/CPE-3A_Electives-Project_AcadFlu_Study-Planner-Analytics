import { Outlet } from 'react-router';
import { AppearanceProvider } from './AppearanceProvider';
import { TaskProvider } from './TaskContext';

export function Root() {
  return (
    <AppearanceProvider>
      <TaskProvider>
        <Outlet />
      </TaskProvider>
    </AppearanceProvider>
  );
}
