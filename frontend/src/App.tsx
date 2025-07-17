import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Library from './pages/Library';
import UploadBook from './pages/UploadBook';
import Reader from './pages/Reader';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className='min-h-screen bg-white dark:bg-black text-black dark:text-white'>
      {isAuthenticated && <Navbar />}

      <main>
        <Routes>
          <Route
            path='/login'
            element={isAuthenticated ? <Navigate to='/' replace /> : <Login />}
          />
          <Route
            path='/register'
            element={isAuthenticated ? <Navigate to='/' replace /> : <Register />}
          />
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path='/upload'
            element={
              <AdminRoute>
                <UploadBook />
              </AdminRoute>
            }
          />
          <Route
            path='/read/:bookId'
            element={
              <ProtectedRoute>
                <Reader />
              </ProtectedRoute>
            }
          />
          <Route
            path='/read/:bookId/:paragraphId'
            element={
              <ProtectedRoute>
                <Reader />
              </ProtectedRoute>
            }
          />
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
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
