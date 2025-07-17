import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

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
          ${isExpanded ? 'opacity-90' : 'opacity-70 hover:opacity-90'} transition-all duration-300`}
        aria-label="Toggle navigation menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <div className={`w-5 h-0.5 bg-current transition-all duration-300 ${isExpanded ? 'rotate-45 translate-y-1' : ''
            }`} />
          <div className={`w-5 h-0.5 bg-current transition-all duration-300 my-1 ${isExpanded ? 'opacity-0' : ''
            }`} />
          <div className={`w-5 h-0.5 bg-current transition-all duration-300 ${isExpanded ? '-rotate-45 -translate-y-1' : ''
            }`} />
        </div>
      </button>

      {/* Sidebar Navigation */}
      <nav className={`fixed left-0 top-0 h-screen w-64 glass-card border-r border-white/10 
        transform transition-transform duration-300 ease-in-out z-40
        ${isExpanded ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:w-20 lg:hover:w-64 group`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center lg:justify-start mb-8 pt-12 lg:pt-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 
              flex items-center justify-center text-white font-bold text-xl shadow-lg">
              L
            </div>
            <span className="ml-3 text-xl font-bold opacity-100 lg:opacity-0 lg:group-hover:opacity-100 
              transition-opacity duration-300">
              L1tter
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 space-y-2">
            <Link
              to="/"
              className="flex items-center p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group/item"
              onClick={() => setIsExpanded(false)}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="ml-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 
                transition-opacity duration-300">
                Library
              </span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to="/upload"
                className="flex items-center p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group/item"
                onClick={() => setIsExpanded(false)}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="ml-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 
                  transition-opacity duration-300">
                  Upload Book
                </span>
              </Link>
            )}
          </div>

          {/* Bottom Section */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center w-full p-3 rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {theme === 'light' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <span className="ml-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 
                transition-opacity duration-300">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>

            {/* User Info & Logout */}
            {user && (
              <div className="space-y-2">
                <div className="flex items-center p-3 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 
                    flex items-center justify-center text-white font-medium text-sm">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 
                    transition-opacity duration-300 min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs opacity-70 capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full p-3 rounded-xl hover:bg-red-500/20 
                    text-red-400 hover:text-red-300 transition-all duration-200"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span className="ml-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 
                    transition-opacity duration-300">
                    Logout
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default Navbar;
