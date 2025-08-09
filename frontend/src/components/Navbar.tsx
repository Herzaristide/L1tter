import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BookCopy,
  BookPlus,
  ChartNoAxesGantt,
  LogOut,
  Moon,
  Sun,
  Library,
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Track mouse position to show/hide navbar on left side approach
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const leftEdgeThreshold = 100; // Show when within 100px of left edge

      setIsVisible(e.clientX < leftEdgeThreshold);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Visual Indicator when navbar is hidden */}
      <div
        className={`fixed left-0 top-1/2 -translate-y-1/2 w-0.5 h-16 bg-black dark:bg-white 
                   rounded-r-full transition-all duration-500 ease-in-out z-30 ${
                     isVisible
                       ? 'opacity-0 -translate-x-full'
                       : 'opacity-40 translate-x-0'
                   }`}
      />

      <nav
        className={`fixed flex flex-col left-0 top-0 h-screen w-12 
          justify-center items-center transition-all duration-500 ease-in-out z-40
          gap-3 p-2 ${
            isVisible
              ? 'translate-x-0 opacity-100'
              : '-translate-x-full opacity-0'
          }`}
      >
        <Link
          to='/'
          className='w-8 h-8 flex items-center justify-center rounded-lg
                   hover:scale-110 hover:translate-x-1 transition-all duration-200 ease-out
                   bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200
                   border border-gray-200 dark:border-gray-700'
        >
          <span className='text-white dark:text-black font-bold text-xs'>
            L1
          </span>
        </Link>

        <Link
          to='/library'
          className='w-8 h-8 flex items-center justify-center rounded-lg
                   hover:scale-110 hover:translate-x-1 transition-all duration-200 ease-out
                   border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500
                   hover:bg-gray-50 dark:hover:bg-gray-900'
        >
          <Library
            size={16}
            className='text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
          />
        </Link>

        <button
          onClick={toggleTheme}
          className='w-8 h-8 flex items-center justify-center rounded-lg
                   hover:scale-110 hover:translate-x-1 transition-all duration-200 ease-out
                   border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500
                   hover:bg-gray-50 dark:hover:bg-gray-900'
        >
          {theme === 'light' ? (
            <Sun
              size={16}
              className='text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
            />
          ) : (
            <Moon
              size={16}
              className='text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
            />
          )}
        </button>

        {user && (
          <div
            className='w-8 h-8 flex items-center justify-center rounded-lg
                     hover:scale-110 hover:translate-x-1 transition-all duration-200 ease-out
                     border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500
                     hover:bg-gray-50 dark:hover:bg-gray-900'
          >
            <div className='w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center'>
              <span className='text-white dark:text-black text-xs font-bold'>
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {user && (
          <button
            onClick={handleLogout}
            className='w-8 h-8 flex items-center justify-center rounded-lg
                     hover:scale-110 hover:translate-x-1 transition-all duration-200 ease-out
                     border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600
                     hover:bg-red-50 dark:hover:bg-red-950'
          >
            <LogOut
              size={16}
              className='text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
            />
          </button>
        )}
      </nav>
    </>
  );
};

export default Navbar;
