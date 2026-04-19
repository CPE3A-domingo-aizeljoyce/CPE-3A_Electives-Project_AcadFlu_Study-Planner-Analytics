import { createContext, useContext } from 'react';

export const NotificationRefreshContext = createContext();

export const useNotificationRefresh = () => {
  const context = useContext(NotificationRefreshContext);
  if (!context) {
    console.warn('useNotificationRefresh must be used within NotificationRefreshContext provider');
    return { refetch: () => {} };
  }
  return context;
};
