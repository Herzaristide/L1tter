import React from 'react';
import { Book } from '../types';
import { Link } from 'react-router-dom';

interface BookCardProps {
  book: Book;
  onDelete?: (id: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onDelete }) => {
  const progress = book.progress?.[0];
  const progressPercentage = progress
    ? ((progress.chapter?.number || 1) / (book.chapters?.length || 1)) * 100
    : 0;

  return (
    <div className='card hover:shadow-lg transition-shadow'>
      <div className='flex justify-between items-start mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-1'>
            {book.title}
          </h3>
          <p className='text-gray-600 text-sm'>by {book.author}</p>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(book.id)}
            className='text-red-500 hover:text-red-700 text-sm'
          >
            Delete
          </button>
        )}
      </div>

      {progress && (
        <div className='mb-4'>
          <div className='flex justify-between text-sm text-gray-600 mb-1'>
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-primary-600 h-2 rounded-full'
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            Chapter {progress.chapter?.number}: {progress.chapter?.title}
          </p>
        </div>
      )}

      <div className='flex justify-between items-center'>
        <span className='text-xs text-gray-500'>
          {book.chapters?.length || 0} chapters
        </span>
        <Link to={`/book/${book.id}`} className='btn-primary text-sm'>
          {progress ? 'Continue Reading' : 'Start Reading'}
        </Link>
      </div>
    </div>
  );
};

export default BookCard;
