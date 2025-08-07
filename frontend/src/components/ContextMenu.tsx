import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  selectedText: string;
  onClose: () => void;
  onAction: (action: string, text: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  selectedText,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuItems = [
    {
      label: 'Copy',
      action: 'copy',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
          />
        </svg>
      ),
    },
    {
      label: 'Highlight',
      action: 'highlight',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14'
          />
        </svg>
      ),
    },
    {
      label: 'Add Note',
      action: 'note',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
          />
        </svg>
      ),
    },
    {
      label: 'Search',
      action: 'search',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      ),
    },
  ];

  const handleItemClick = (action: string) => {
    onAction(action, selectedText);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className='fixed z-50 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-xl min-w-48'
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Header */}
      <div className='px-4 py-3 border-b border-gray-100 dark:border-gray-800'>
        <p className='text-xs font-light text-gray-500 dark:text-gray-400 tracking-wider uppercase'>
          Selected Text
        </p>
        <p className='text-sm font-light text-black dark:text-white mt-1 truncate max-w-48'>
          "
          {selectedText.length > 50
            ? selectedText.substring(0, 50) + '...'
            : selectedText}
          "
        </p>
      </div>

      {/* Menu Items */}
      <div className='py-2'>
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item.action)}
            className='w-full flex items-center px-4 py-3 text-left text-black dark:text-white
              hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200
              font-light tracking-wide text-sm'
          >
            <div className='w-4 h-4 mr-3 flex items-center justify-center'>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className='px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900'>
        <p className='text-xs font-light text-gray-400 tracking-wide'>
          {selectedText.split(' ').length} words selected
        </p>
      </div>
    </div>
  );
};

export default ContextMenu;
