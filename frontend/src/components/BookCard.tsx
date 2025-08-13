import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Book } from '../types';
import {
  BookOpen,
  Calendar,
  Globe,
  EyeOff,
  FileText,
  Edit,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className='group block rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 overflow-hidden h-64 w-44 cursor-pointer'
      onClick={() => navigate(`/${book.id}`)}
      role='button'
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter') navigate(`/${book.id}`);
      }}
    >
      <div className='relative h-full w-full'>
        {/* Background Image */}
        {book.imageUrl ? (
          <div
            className='absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300'
            style={{ backgroundImage: `url(${book.imageUrl})` }}
          />
        ) : (
          <div className='absolute inset-0 bg-gray-300 dark:bg-gray-600 flex items-center justify-center'>
            <BookOpen className='w-12 h-12 text-gray-500' />
          </div>
        )}

        {/* Gradient Overlay for better text readability */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

        {/* Status indicators for admin */}
        {user?.role === 'ADMIN' && (
          <div className='absolute top-2 right-2 flex gap-1 z-10'>
            {!book.isPublic && (
              <div className='bg-red-500 text-white px-2 py-1 rounded text-xs font-light'>
                <EyeOff className='w-3 h-3 inline mr-1' />
                Private
              </div>
            )}
            {book.isDraft && (
              <div className='bg-yellow-500 text-black px-2 py-1 rounded text-xs font-light'>
                <FileText className='w-3 h-3 inline mr-1' />
                Draft
              </div>
            )}
          </div>
        )}

        {user?.role === 'ADMIN' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/${book.id}/edit`);
            }}
            className='z-50 absolute top-2 left-2 bg-black dark:bg-white text-white dark:text-black
                             p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200
                             hover:bg-gray-800 dark:hover:bg-gray-200'
            title='Edit Book'
          >
            <Edit className='w-4 h-4' />
          </button>
        )}

        {/* Reading Progress Badge */}
        {book.progress && book.progress.length > 0 && (
          <>
            <div className='absolute top-2 left-2 z-10'>
              <div className='bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-light'>
                {Math.round(book.progress[0].position || 0)}% read
              </div>
            </div>

            {/* Progress bar at bottom */}
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-10'>
              <div
                className='h-full bg-blue-500 transition-all duration-300'
                style={{ width: `${book.progress[0].position || 0}%` }}
              />
            </div>
          </>
        )}

        {/* Book Information Overlay */}
        <div className='absolute bottom-0 left-0 right-0 p-3 z-10'>
          <h2 className='text-sm font-medium text-white tracking-wide line-clamp-2 mb-1'>
            {book.title}
          </h2>

          {book.authors && book.authors.length > 0 && (
            <p className='text-xs text-gray-200 font-light line-clamp-1 mb-2'>
              by {book.authors.map((ba) => ba.author.name).join(', ')}
            </p>
          )}

          {/* Compact metadata */}
          <div className='flex items-center gap-2 text-xs text-gray-300 font-light'>
            {book.language && (
              <span className='flex items-center gap-1'>
                <Globe className='w-3 h-3' />
                {book.language.toUpperCase()}
              </span>
            )}
            {book.editionPublished && (
              <span className='flex items-center gap-1'>
                <Calendar className='w-3 h-3' />
                {book.editionPublished}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
