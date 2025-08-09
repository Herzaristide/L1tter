import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Reading from './pages/Reading';
import Management from './pages/Management';
import Editing from './pages/Editing';
import CreateBook from './pages/CreateBook';
import { ReactLenis } from 'lenis/react';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className='min-h-screen w-full bg-white dark:bg-black text-black dark:text-white'>
      {/* Custom Mouse Cursor with delay */}

      {isAuthenticated && <Navbar />}
      <main className='px-8 lg:px-40 w-full'>
        <Routes>
          <Route
            path='/login'
            element={isAuthenticated ? <Navigate to='/' replace /> : <Login />}
          />
          <Route
            path='/register'
            element={
              isAuthenticated ? <Navigate to='/' replace /> : <Register />
            }
          />
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/library'
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path='/:bookId'
            element={
              <ProtectedRoute>
                <Reading />
              </ProtectedRoute>
            }
          />
          {/* Admin-only Editing page */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Route
              path='/:bookId/edit'
              element={
                <ProtectedRoute>
                  <Editing />
                </ProtectedRoute>
              }
            />
          )}
          {/* Admin-only Management page */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Route
              path='/management'
              element={
                <ProtectedRoute>
                  <Management />
                </ProtectedRoute>
              }
            />
          )}
          {/* Admin-only Create Book page */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Route
              path='/create'
              element={
                <ProtectedRoute>
                  <CreateBook />
                </ProtectedRoute>
              }
            />
          )}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactLenis root>
          <Router>
            <AppRoutes />
          </Router>
        </ReactLenis>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
