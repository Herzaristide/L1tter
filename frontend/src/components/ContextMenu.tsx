import React, { useEffect, useRef, useState } from 'react';
import { translateService } from '../services/translateService';

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
  const [frenchTranslation, setFrenchTranslation] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string>('');

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

  // Translate selected text to French when component mounts
  useEffect(() => {
    const translateText = async () => {
      if (!selectedText.trim()) return;

      setIsTranslating(true);
      setTranslationError('');

      try {
        const result = await translateService.translateToFrench(selectedText);
        setFrenchTranslation(result.translatedText);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslationError('Translation unavailable');
        setFrenchTranslation(selectedText); // Fallback to original text
      } finally {
        setIsTranslating(false);
      }
    };

    translateText();
  }, [selectedText]);

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
      label: 'Copy Translation',
      action: 'copy-translation',
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
            d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
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
    if (action === 'copy-translation') {
      // Pass the French translation to the action handler
      onAction(action, frenchTranslation || selectedText);
    } else {
      // Pass the original selected text for other actions
      onAction(action, selectedText);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      data-context-menu
      className='fixed z-50 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-xl min-w-48'
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Header */}
      <div className='px-4 py-3 border-b border-gray-100 dark:border-gray-800'>
        <div className='text-lg flex items-center gap-2 mb-2'>
          {isTranslating && (
            <div className='w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin'></div>
          )}
        </div>

        {translationError ? (
          <p className='font-light text-red-500 dark:text-red-400 mt-1'>
            {translationError}
          </p>
        ) : (
          <p className=' font-light text-black dark:text-white mt-1 max-w-48'>
            {isTranslating
              ? 'Translating...'
              : frenchTranslation.length > 50
              ? frenchTranslation.substring(0, 50) + '...'
              : frenchTranslation}
          </p>
        )}

        {/* Original text (smaller) */}
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
    </div>
  );
};

export default ContextMenu;
