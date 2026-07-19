import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginCredentials, RegisterData, AuthResponse, User } from '@snackflow/shared-types';
import { apiClient } from '../api/client';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('snackflow_token'),
  isAuthenticated: !!localStorage.getItem('snackflow_token'),
  loading: false,
  error: null,
};

export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // Mock login for Vercel demo
      const mockToken = 'mock-demo-token';
      const mockUser: User = {
        id: 'user-1',
        email: credentials.email,
        name: 'Demo Manager',
        role: 'manager',
        preferredLanguage: 'en',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('snackflow_token', mockToken);
      return { user: mockUser, token: mockToken, expiresIn: 3600 };
    } catch (error: unknown) {
      return rejectWithValue('Login failed');
    }
  }
);

export const register = createAsyncThunk<AuthResponse, RegisterData>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
      localStorage.setItem('snackflow_token', response.data.token);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchProfile = createAsyncThunk<User>(
  'auth/profile',
  async (_, { rejectWithValue }) => {
    try {
      // Mock profile for Vercel demo
      const mockUser: User = {
        id: 'user-1',
        email: 'manager@snackflow.ai',
        name: 'Demo Manager',
        role: 'manager',
        preferredLanguage: 'en',
        createdAt: new Date().toISOString()
      };
      return mockUser;
    } catch (error: unknown) {
      return rejectWithValue('Failed to fetch profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('snackflow_token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('snackflow_token');
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
