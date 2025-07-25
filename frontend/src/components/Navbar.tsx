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
        className={`fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg glass-card
          ${
            isExpanded ? 'opacity-90' : 'opacity-70 hover:opacity-90'
          } transition-all duration-300`}
        aria-label='Toggle navigation menu'
      >
        <div className='w-6 h-6 flex flex-col justify-center items-center'>
          <div
            className={`w-5 h-0.5 bg-current transition-all duration-300 ${
              isExpanded ? 'rotate-45 translate-y-1' : ''
            }`}
          />
          <div
            className={`w-5 h-0.5 bg-current transition-all duration-300 my-1 ${
              isExpanded ? 'opacity-0' : ''
            }`}
          />
          <div
            className={`w-5 h-0.5 bg-current transition-all duration-300 ${
              isExpanded ? '-rotate-45 -translate-y-1' : ''
            }`}
          />
        </div>
      </button>
      <nav
        className={`fixed h-screen border-white/10 bg-black/25 backdrop-blur-lg flex flex-col items-center justify-between px-1 py-4
        transform transition-transform duration-300 ease-in-out z-50
        ${isExpanded ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:w-20 lg:hover:w-64 group`}
      >
        <div className='flex-1 space-y-2'>
          <Link
            to='/'
            className='flex items-center p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group/item'
            onClick={() => setIsExpanded(false)}
          >
            <div className='w-6 h-6 flex items-center justify-center'>L</div>
          </Link>

          {user?.role === 'ADMIN' && (
            <Link
              to='/upload'
              className='flex items-center p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group/item'
              onClick={() => setIsExpanded(false)}
            >
              <div className='w-6 h-6 flex items-center justify-center'>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
              </div>
            </Link>
          )}
        </div>
        {/* Bottom Section */}
        <div className='space-y-2 border-t border-white/10 pt-4'>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className='flex items-center w-full p-3 rounded-xl hover:bg-white/10 transition-all duration-200'
          >
            <div className='w-6 h-6 flex items-center justify-center'>
              {theme === 'light' ? (
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                  />
                </svg>
              ) : (
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
              )}
            </div>
          </button>

          {/* User Info & Logout */}
          {user && (
            <div className='space-y-2'>
              <div className='flex items-center p-3 rounded-xl bg-white/5'>
                <div
                  className='w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 
                    flex items-center justify-center text-white font-medium text-sm'
                >
                  {user.email.charAt(0).toUpperCase()}
                </div>
              </div>

              <button
                title='logout'
                onClick={handleLogout}
                className='flex items-center w-full p-3 rounded-xl hover:bg-red-500/20 
                    text-red-400 hover:text-red-300 transition-all duration-200'
              >
                <div className='w-6 h-6 flex items-center justify-center'>
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                    />
                  </svg>
                </div>
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
