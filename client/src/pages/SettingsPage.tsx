import React from 'react';
import { Moon, Sun, Globe, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsPage() {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.description')}</p>
      </div>

      {/* Settings Card */}
      <div className="settings-card mb-4">
        {/* Dark Mode */}
        <div className="settings-item">
          <div className="settings-icon">
            {isDarkMode ? <Moon /> : <Sun />}
          </div>
          <div className="settings-info">
            <div className="settings-info-title">{t('settings.darkTheme')}</div>
            <div className="settings-info-sub">{isDarkMode ? 'On' : 'Off'}</div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={e => setIsDarkMode(e.target.checked)}
            />
            <span className="switch-track" />
          </label>
        </div>

        {/* Language */}
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
            <button
              className={`lang-btn${language === 'my' ? ' active' : ''}`}
              onClick={() => setLanguage('my')}
            >
              မြန်မာ
            </button>
            <button
              className={`lang-btn${language === 'en' ? ' active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--info-bg)', color: 'var(--info)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Info size={16} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Myanmar 2D/3D Lottery Summarizer
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {t('settings.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
