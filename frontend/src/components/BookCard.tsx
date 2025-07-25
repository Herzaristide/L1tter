import React, { useState } from 'react';
import { Book } from '../types';
import { Link } from 'react-router-dom';

interface BookCardProps {
  book: Book;
  onDelete?: (id: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const progress = book.progress?.[0];
  const totalParagraphs =
    book._count?.paragraphs || book.paragraphs?.length || 0;
  const progressPercentage =
    progress && totalParagraphs > 0
      ? ((progress.paragraph?.order || 1) / totalParagraphs) * 100
      : 0;

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(book.id);
    }
  };

  return (
    <Link
      to={`/read/${book.id}`}
      className='hover:scale-105 
              w-1/4'
    >
      {/* Book Cover Simulation
      <div
        className='relative h-48 bg-gradient-to-br from-primary-500 to-primary-700 
        dark:from-primary-600 dark:to-primary-800 mb-4 rounded-lg '
      >
        <div className='absolute inset-0 bg-black/10'></div>
        <div className='absolute bottom-3 left-3 right-3'>
          <div className='h-1 bg-white/30 rounded mb-2'></div>
          <div className='h-1 bg-white/20 rounded mb-1 w-3/4'></div>
          <div className='h-1 bg-white/10 rounded w-1/2'></div>
        </div>

        {onDelete && (
          <div className='absolute top-3 right-3'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 
                flex items-center justify-center text-white/80 hover:text-white 
                transition-all duration-200 backdrop-blur-sm'
              aria-label='Book options'
            >
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' />
              </svg>
            </button>

            {isMenuOpen && (
              <>
                <div
                  className='fixed inset-0 z-10'
                  onClick={() => setIsMenuOpen(false)}
                ></div>
                <div
                  className='absolute top-10 right-0 z-20 min-w-[120px] glass-card 
                  border border-white/20 rounded-lg shadow-xl'
                >
                  <button
                    onClick={handleDelete}
                    className='w-full px-3 py-2 text-left text-red-400 hover:text-red-300 
                      hover:bg-red-500/10 rounded-lg transition-colors duration-200 
                      flex items-center space-x-2'
                  >
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
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                    <span className='text-sm'>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className='space-y-3'>
        <div>
          <h3
            className='font-bold text-lg leading-tight mb-1 line-clamp-2 
            group-hover:text-primary-600 dark:group-hover:text-primary-400 
            transition-colors duration-200'
          >
            {book.title}
          </h3>
          <p className='text-sm opacity-70 line-clamp-1'>by {book.author}</p>
        </div>

        {progress && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-xs'>
              <span className='opacity-70'>Progress</span>
              <span className='font-medium'>
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className='relative h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden'>
              <div
                className='absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 
                  rounded-full transition-all duration-500 ease-out'
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <p className='text-xs opacity-60'>
              Paragraph {progress.paragraph?.order} of {totalParagraphs}
            </p>
          </div>
        )}

        <div className='flex items-center justify-between pt-2 border-t border-white/10'>
          <span className='text-xs opacity-60 flex items-center space-x-1'>
            <svg
              className='w-3 h-3'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <span>{totalParagraphs} paragraphs</span>
          </span>
        </div>
      </div> */}
    </Link>
  );
};

export default BookCard;
