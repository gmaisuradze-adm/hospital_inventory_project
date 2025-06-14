import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  socket: Socket | null;
  connected: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  socket: null,
  connected: false,
};

// Async thunk to initialize socket connection
export const initializeSocket = createAsyncThunk(
  'notifications/initializeSocket',
  async (_, { getState, dispatch }) => {
    const token = (getState() as any).auth.token;
    const userId = (getState() as any).auth.user?.id;

    if (!token || !userId) {
      throw new Error('No authentication data available');
    }

    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: {
        token,
      },
    });

    socket.on('connect', () => {
      dispatch(setConnected(true));
      socket.emit('join', userId);
    });

    socket.on('disconnect', () => {
      dispatch(setConnected(false));
    });

    socket.on('notification', (notification: Notification) => {
      dispatch(addNotification(notification));
    });

    return socket;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect();
        state.socket = null;
      }
      state.connected = false;
    },
  },
  
  extraReducers: (builder) => {
    builder.addCase(initializeSocket.fulfilled, (state, action) => {
      state.socket = action.payload;
    });
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setNotifications,
  setUnreadCount,
  setConnected,
  disconnectSocket,
} = notificationSlice.actions;

export default notificationSlice.reducer;
