import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Library from './pages/Library';
import UploadBook from './pages/UploadBook';
import BookView from './pages/BookView';
import Reader from './pages/Reader';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className='min-h-screen bg-gray-50'>
      {isAuthenticated && <Navbar />}
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
            <ProtectedRoute>
              <UploadBook />
            </ProtectedRoute>
          }
        />
        <Route
          path='/book/:id'
          element={
            <ProtectedRoute>
              <BookView />
            </ProtectedRoute>
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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
