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
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className='h-screen w-screen bg-white dark:bg-black text-black dark:text-white'>
      {/* {isAuthenticated && <Navbar />} */}

      <main className='px-8 lg:px-40 h-screen w-screen'>
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
