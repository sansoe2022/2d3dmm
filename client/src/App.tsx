import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SessionProvider } from './contexts/SessionContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/MainLayout';
import CustomerList from './pages/CustomerList';
import WinnerSearch from './pages/WinnerSearch';
import SettingsPage from './pages/SettingsPage';

// Firebase Auth အတွက် Import များ (Email & Password ကို ပြောင်းသုံးထားသည်)
import { auth } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, User, signOut } from 'firebase/auth';

function App() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login Form အတွက် State များ
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Page Refresh ဖြစ်တာကို တားရန်
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError('Email သို့မဟုတ် Password မှားယွင်းနေပါသည်။');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    signOut(auth);
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>Loading Admin Panel...</p>
      </div>
    );
  }

  // Admin မဟုတ်လျှင် ပြမည့် Login မျက်နှာပြင် (Email & Password Form)
  if (!adminUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f3f4f6', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px 30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ color: '#2563eb', marginBottom: '8px', fontSize: '24px', textAlign: 'center' }}>Admin Login</h1>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>Enter your admin credentials</p>
          
          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', boxSizing: 'border-box' }}
                placeholder="admin@example.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px', textAlign: 'center', background: '#fee2e2', padding: '8px', borderRadius: '6px' }}>
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                background: isLoggingIn ? '#93c5fd' : '#2563eb', 
                color: 'white', padding: '12px', width: '100%',
                borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px', 
                cursor: isLoggingIn ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoggingIn ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <SessionProvider>
            <ToastProvider>
              
              <div style={{
                background: '#1f2937', padding: '8px 16px', display: 'flex', 
                justifyContent: 'space-between', alignItems: 'center', 
                color: 'white', fontSize: '12px', position: 'sticky', top: 0, zIndex: 1000
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                  Admin: {adminUser.email}
                </span>
                <button
                  onClick={handleAdminLogout}
                  style={{
                    background: '#dc2626', color: 'white', border: 'none', 
                    padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>

              <BrowserRouter>
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<CustomerList />} />
                    <Route path="/customers" element={<CustomerList />} />
                    <Route path="/winners" element={<WinnerSearch />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Routes>
              </BrowserRouter>
              
            </ToastProvider>
          </SessionProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
