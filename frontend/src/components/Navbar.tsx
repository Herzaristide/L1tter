import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed top-6 left-6 z-50 lg:hidden p-2 rounded-full bg-black text-white
          hover:bg-gray-800 transition-all duration-200 border border-gray-200`}
        aria-label='Toggle navigation menu'
      >
        <div className='w-4 h-4 flex flex-col justify-center items-center'>
          <div
            className={`w-3 h-0.5 bg-white transition-all duration-300 ${
              isExpanded ? 'rotate-45 translate-y-0.5' : ''
            }`}
          />
          <div
            className={`w-3 h-0.5 bg-white transition-all duration-300 my-0.5 ${
              isExpanded ? 'opacity-0' : ''
            }`}
          />
          <div
            className={`w-3 h-0.5 bg-white transition-all duration-300 ${
              isExpanded ? '-rotate-45 -translate-y-0.5' : ''
            }`}
          />
        </div>
      </button>
      <nav
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-black border-r border-gray-100 dark:border-gray-800
        flex flex-col transition-all duration-300 ease-in-out z-40
        ${isExpanded ? 'w-72' : 'w-0 lg:w-20'}
        lg:hover:w-72 group overflow-hidden`}
      >
        {/* Brand/Logo Section */}
        <div className='px-8 py-8'>
          <div className='flex items-center space-x-3'>
            <div className='w-6 h-6 bg-black dark:bg-white rounded-sm flex items-center justify-center'>
              <span className='text-white dark:text-black font-bold text-xs'>
                L
              </span>
            </div>
            <div className='opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300'>
              <h1 className='text-xl font-light text-black dark:text-white tracking-wider'>
                L1TTER
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className='flex-1 px-6 space-y-1'>
          <Link
            to='/'
            className='flex items-center px-4 py-4 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900
              transition-all duration-200 group/item border-b border-gray-100 dark:border-gray-800 font-light tracking-wide'
            onClick={() => setIsExpanded(false)}
          >
            <div className='w-4 h-4 flex items-center justify-center mr-6'>
              <div className='w-2 h-2 bg-black dark:bg-white rounded-full'></div>
            </div>
            <span className='text-sm whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300'>
              LIBRARY
            </span>
          </Link>

          <Link
            to='/create'
            className='flex items-center px-4 py-4 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900
              transition-all duration-200 group/item border-b border-gray-100 dark:border-gray-800 font-light tracking-wide'
            onClick={() => setIsExpanded(false)}
          >
            <div className='w-4 h-4 flex items-center justify-center mr-6'>
              <div className='w-2 h-2 bg-black dark:bg-white rounded-full'></div>
            </div>
            <span className='text-sm whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300'>
              CREATE
            </span>
          </Link>

          {user?.role === 'ADMIN' && (
            <Link
              to='/management'
              className='flex items-center px-4 py-4 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900
                transition-all duration-200 group/item border-b border-gray-100 dark:border-gray-800 font-light tracking-wide'
              onClick={() => setIsExpanded(false)}
            >
              <div className='w-4 h-4 flex items-center justify-center mr-6'>
                <div className='w-2 h-2 bg-black dark:bg-white rounded-full'></div>
              </div>
              <span className='text-sm whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300'>
                ADMIN
              </span>
            </Link>
          )}
        </div>
        {/* Bottom Section */}
        <div className='px-6 py-6 border-t border-gray-100 dark:border-gray-800 space-y-4'>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className='flex items-center w-full px-4 py-3 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900
              transition-all duration-200 font-light tracking-wide text-sm'
          >
            <div className='w-4 h-4 flex items-center justify-center mr-6'>
              <div className='w-2 h-2 bg-black dark:bg-white rounded-full'></div>
            </div>
            <span className='whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300'>
              {theme === 'light' ? 'DARK' : 'LIGHT'}
            </span>
          </button>

          {/* User Section */}
          {user && (
            <div className='space-y-2'>
              {/* User Info */}
              <div className='flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800'>
                <div className='w-4 h-4 bg-black dark:bg-white rounded-full flex items-center justify-center mr-6'>
                  <span className='text-white dark:text-black text-xs font-bold'>
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className='opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300'>
                  <p className='text-xs font-light text-black dark:text-white tracking-wider uppercase'>
                    {user.email.split('@')[0]}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className='flex items-center w-full px-4 py-3 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900
                  transition-all duration-200 font-light tracking-wide text-sm'
              >
                <div className='w-4 h-4 flex items-center justify-center mr-6'>
                  <div className='w-2 h-2 bg-black dark:bg-white rounded-full'></div>
                </div>
                <span className='whitespace-nowrap opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300'>
                  LOGOUT
                </span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
