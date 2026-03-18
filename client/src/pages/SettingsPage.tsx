import React, { useEffect, useState } from 'react';
import { Moon, Sun, Globe, Info, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { auth } from '../firebase';
import { signOut, User } from 'firebase/auth';

export default function SettingsPage() {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(auth.currentUser);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      signOut(auth);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.description')}</p>
      </div>

      {/* Account Settings Card (အသစ်ထည့်ထားသော Logout အပိုင်း) */}
      <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px', marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</h3>
      <div className="settings-card mb-4">
        <div className="settings-item">
          <div className="settings-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <UserIcon size={20} />
          </div>
          <div className="settings-info">
            <div className="settings-info-title">Admin Account</div>
            <div className="settings-info-sub">{currentUser?.email || 'Loading...'}</div>
          </div>
        </div>
        
        <div className="settings-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <div className="settings-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
            <LogOut size={20} />
          </div>
          <div className="settings-info">
            <div className="settings-info-title" style={{ color: '#dc2626' }}>Logout</div>
            <div className="settings-info-sub">Sign out of admin panel</div>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px', marginLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preferences</h3>
      <div className="settings-card mb-4">
        <div className="settings-item">
          <div className="settings-icon">
            {isDarkMode ? <Moon /> : <Sun />}
          </div>
          <div className="settings-info">
            <div className="settings-info-title">{t('settings.darkTheme')}</div>
            <div className="settings-info-sub">{isDarkMode ? 'On' : 'Off'}</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={isDarkMode} onChange={e => setIsDarkMode(e.target.checked)} />
            <span className="switch-track" />
          </label>
        </div>

        <div className="settings-item">
          <div className="settings-icon">
            <Globe />
          </div>
          <div className="settings-info">
            <div className="settings-info-title">{t('settings.language')}</div>
            <div className="settings-info-sub">
              {language === 'my' ? 'မြန်မာ' : 'English'}
            </div>
          </div>
          <div className="lang-btns">
            <button className={`lang-btn${language === 'my' ? ' active' : ''}`} onClick={() => setLanguage('my')}>မြန်မာ</button>
            <button className={`lang-btn${language === 'en' ? ' active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Info size={16} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Myanmar 2D/3D Lottery Summarizer</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('settings.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
