import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: {
    [key: string]: boolean;
  };
  modals: {
    [key: string]: boolean;
  };
  filters: {
    [key: string]: any;
  };
}

const initialState: UIState = {
  sidebarOpen: false,
  theme: 'light',
  loading: {},
  modals: {},
  filters: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    
    setModal: (state, action: PayloadAction<{ key: string; open: boolean }>) => {
      state.modals[action.payload.key] = action.payload.open;
    },
    
    setFilter: (state, action: PayloadAction<{ key: string; filter: any }>) => {
      state.filters[action.payload.key] = action.payload.filter;
    },
    
    clearFilters: (state, action: PayloadAction<string>) => {
      delete state.filters[action.payload];
    },
    
    resetUI: () => initialState,
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLoading,
  setModal,
  setFilter,
  clearFilters,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
