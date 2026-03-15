import React from 'react';
import {
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Brightness4, Language } from '@mui/icons-material';

export default function SettingsPage() {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <Container maxWidth="sm" sx={{ py: 3, pb: 12 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
        {t('settings.title')}
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        {t('settings.description')}
      </Typography>

      {/* Settings Card with List */}
      <Card elevation={1} sx={{ borderRadius: '12px' }}>
        <List sx={{ width: '100%' }}>
          {/* Dark Theme Setting */}
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={isDarkMode}
                onChange={(e) => setIsDarkMode(e.target.checked)}
                color="primary"
              />
            }
            sx={{
              py: 2,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 137, 123, 0.04)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Brightness4 color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={t('settings.darkTheme')}
              primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
              secondary={isDarkMode ? 'On' : 'Off'}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>

          <Divider variant="inset" component="li" sx={{ my: 0 }} />

          {/* Language Setting */}
          <ListItem
            sx={{
              py: 2,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 137, 123, 0.04)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Language color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={t('settings.language')}
              primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box
                component="button"
                onClick={() => setLanguage('my')}
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: '20px',
                  border: language === 'my' ? '2px solid' : '1px solid',
                  borderColor: language === 'my' ? 'primary.main' : 'divider',
                  backgroundColor: language === 'my' ? 'primary.main' : 'transparent',
                  color: language === 'my' ? 'primary.contrastText' : 'text.primary',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: language === 'my' ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                မြန်မာ
              </Box>
              <Box
                component="button"
                onClick={() => setLanguage('en')}
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: '20px',
                  border: language === 'en' ? '2px solid' : '1px solid',
                  borderColor: language === 'en' ? 'primary.main' : 'divider',
                  backgroundColor: language === 'en' ? 'primary.main' : 'transparent',
                  color: language === 'en' ? 'primary.contrastText' : 'text.primary',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: language === 'en' ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                English
              </Box>
            </Box>
          </ListItem>
        </List>
      </Card>

      {/* Info Card */}
      <Card
        elevation={0}
        sx={{
          mt: 3,
          backgroundColor: 'action.hover',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent>
          <Typography variant="caption" color="textSecondary">
            {t('settings.description')}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
