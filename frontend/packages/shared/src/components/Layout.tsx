import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import LogoutIcon from '@mui/icons-material/Logout';
import { RootState } from '../store';
import { logout } from '../slices/authSlice';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  navItems?: { label: string; path: string }[];
}

export const Layout: React.FC<LayoutProps> = ({ title, children, navItems = [] }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('snackflow_token');
    navigate('/login');
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 3 }}>
            {title}
          </Typography>
          {navItems.map((item) => (
            <Typography
              key={item.path}
              variant="body2"
              sx={{ cursor: 'pointer', mr: 2, '&:hover': { opacity: 0.8 } }}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </Typography>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.name}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.role?.toUpperCase()}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
