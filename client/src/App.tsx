import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SessionProvider } from './contexts/SessionContext';
import { SnackbarProvider } from 'notistack';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/MainLayout';
import CustomerList from './pages/CustomerList';
import WinnerSearch from './pages/WinnerSearch';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <SessionProvider>
            <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
              <BrowserRouter>
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<CustomerList />} />
                    <Route path="/customers" element={<CustomerList />} />
                    <Route path="/winners" element={<WinnerSearch />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </SnackbarProvider>
          </SessionProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
