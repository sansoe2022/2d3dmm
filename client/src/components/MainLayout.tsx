import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  CssBaseline,
} from '@mui/material';
import { People, EmojiEvents, Settings } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

export default function MainLayout() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const pathToValue: Record<string, number> = {
    '/': 0,
    '/customers': 0,
    '/winners': 1,
  };

  const currentValue = pathToValue[location.pathname] ?? 0;

  const handleNavigation = (event: React.SyntheticEvent, newValue: number) => {
    const paths = ['/customers', '/winners'];
    navigate(paths[newValue]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Main Content */}
      <Box sx={{ flex: 1, pb: 8, overflow: 'auto' }}>
        <Outlet />
      </Box>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation value={currentValue} onChange={handleNavigation} showLabels>
          <BottomNavigationAction
            label={t('nav.customers')}
            icon={<People />}
          />
          <BottomNavigationAction
            label={t('nav.winners')}
            icon={<EmojiEvents />}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
