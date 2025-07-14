import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className='bg-white shadow-lg'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center'>
            <Link to='/' className='text-xl font-bold text-primary-600'>
              L1tter
            </Link>
          </div>

          <div className='flex items-center space-x-4'>
            {user && (
              <>
                <Link to='/' className='text-gray-700 hover:text-primary-600'>
                  Library
                </Link>
                <Link
                  to='/upload'
                  className='text-gray-700 hover:text-primary-600'
                >
                  Upload Book
                </Link>
                <div className='flex items-center space-x-2'>
                  <span className='text-gray-700'>Hello, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className='text-gray-700 hover:text-primary-600'
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
