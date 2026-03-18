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

// Firebase Auth အတွက် လိုအပ်သော Import များ
import { auth, googleProvider } from './firebase';
import { signInWithRedirect, getRedirectResult, onAuthStateChanged, User, signOut } from 'firebase/auth';

function App() {
  // Login အခြေအနေကို မှတ်သားမည့် State များ
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Redirect ဖြင့် Login ဝင်ရာတွင် Error ရှိမရှိ စစ်ဆေးရန်
    getRedirectResult(auth).catch((error) => {
      console.error("Login redirect error:", error);
      alert("Login Error: " + error.message);
    });

    // User Login ဝင်ထားခြင်း ရှိ/မရှိ အမြဲစောင့်ကြည့်ရန်
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAuthLoading(false); // စစ်ဆေးပြီးပါက Loading ပိတ်မည်
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = () => {
    signInWithRedirect(auth, googleProvider);
  };

  const handleAdminLogout = () => {
    signOut(auth);
  };

  // ၁။ စစ်ဆေးနေစဉ် Loading ပြမည်
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151' }}>Loading Admin Panel...</p>
      </div>
    );
  }

  // ၂။ Login မဝင်ရသေးလျှင် (Admin မဟုတ်လျှင်) ဒီ Page ပြမည်
  if (!adminUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ background: 'white', padding: '40px 30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h1 style={{ color: '#2563eb', marginBottom: '10px', fontSize: '24px' }}>Admin Dashboard</h1>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Please sign in to access the control panel.</p>
          <button
            onClick={handleAdminLogin}
            style={{
              background: '#2563eb', color: 'white', padding: '12px 24px', width: '100%',
              borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
            }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // ၃။ Login ဝင်ပြီးသားဆိုလျှင် မူလ App အတိုင်း အလုပ်လုပ်မည်
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <SessionProvider>
            <ToastProvider>
              
              {/* Admin အကောင့် Logout လုပ်ရန် Top Bar အသေးလေး */}
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
                    padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold'
                  }}
                >
                  Logout
                </button>
              </div>

              {/* မူလ Router နှင့် Layout များ */}
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
