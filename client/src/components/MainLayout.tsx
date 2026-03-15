import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Users, Trophy, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function MainLayout() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/customers', label: t('nav.customers'), icon: Users },
    { path: '/winners', label: t('nav.winners'), icon: Trophy },
    { path: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const currentPath = location.pathname === '/' ? '/customers' : location.pathname;

  return (
    <div className="app-root">
      <div className="page-content">
        <Outlet />
      </div>

      <nav className="bottom-nav">
        {tabs.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item${currentPath === path ? ' active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
