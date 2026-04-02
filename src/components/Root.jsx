import { Outlet } from 'react-router';
import { AppearanceProvider } from './AppearanceProvider';

export function Root() {
  return (
    <AppearanceProvider>
      <Outlet />
    </AppearanceProvider>
  );
}
