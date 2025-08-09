import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { BookOpen, Calendar, Globe, EyeOff, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BookCardProps {
  link: string;
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book, link }) => {
  const { user } = useAuth();

  return (
    <Link
      to={link}
      className='group block bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 
               hover:shadow-lg transition-all duration-300 overflow-hidden'
    >
      <div className='relative h-48 bg-gray-100 dark:bg-gray-700'>
        {book.imageUrl ? (
          <img
            src={book.imageUrl}
            alt={book.title}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center'>
            <BookOpen className='w-12 h-12 text-gray-400' />
          </div>
        )}

        {/* Status indicators for admin */}
        {user?.role === 'ADMIN' && (
          <div className='absolute top-2 right-2 flex gap-1'>
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
      </div>

      <div className='p-4 space-y-2'>
        <h2 className='text-lg font-light text-black dark:text-white tracking-wide group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200 line-clamp-2'>
          {book.title}
        </h2>

        {book.authors && book.authors.length > 0 && (
          <p className='text-sm text-gray-600 dark:text-gray-400 font-light tracking-wide line-clamp-1'>
            by {book.authors.map((ba) => ba.author.name).join(', ')}
          </p>
        )}

        <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 font-light tracking-wide uppercase'>
          {book.language && (
            <span className='flex items-center gap-1'>
              <Globe className='w-3 h-3' />
              {book.language}
            </span>
          )}
          {book.genre && (
            <span className='flex items-center gap-1'>
              <BookOpen className='w-3 h-3' />
              {book.genre}
            </span>
          )}
          {book.editionPublished && (
            <span className='flex items-center gap-1'>
              <Calendar className='w-3 h-3' />
              {book.editionPublished}
            </span>
          )}
        </div>

        {book.description && (
          <p className='text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed line-clamp-2'>
            {book.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export default BookCard;
