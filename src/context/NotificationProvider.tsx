import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Alert, Snackbar, Slide, SlideProps, Stack } from '@mui/material';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
}

export interface NotificationContextProps {
  showNotification: (message: string, severity: NotificationSeverity) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const NotificationContext = createContext<NotificationContextProps>({
  showNotification: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />;
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, severity: NotificationSeverity) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, message, severity }]);

    // Auto remove after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  const success = useCallback((message: string) => showNotification(message, 'success'), [showNotification]);
  const error = useCallback((message: string) => showNotification(message, 'error'), [showNotification]);
  const warning = useCallback((message: string) => showNotification(message, 'warning'), [showNotification]);
  const info = useCallback((message: string) => showNotification(message, 'info'), [showNotification]);

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, success, error, warning, info }}>
      {children}
      
      <Stack
        spacing={1}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 48,
          zIndex: 9999,
          maxWidth: '400px',
        }}
      >
        {notifications.map((notification) => (
          <Snackbar
            key={notification.id}
            open={true}
            slots={{
              transition: SlideTransition
            }}
            sx={{ position: 'relative', left: 0, bottom: 0, transform: 'none' }}
          >
            <Alert
              onClose={() => handleClose(notification.id)}
              severity={notification.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </NotificationContext.Provider>
  );
};
