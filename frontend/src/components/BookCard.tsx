import React from 'react';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    imageUrl?: string;
    authors?: { author: { name: string } }[];
    genre?: string;
    averageRating?: number;
  };
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    <div className='bg-white rounded-lg shadow-md p-4 flex flex-col items-center w-64'>
      <img
        src={book.imageUrl || '/default-book.png'}
        alt={book.title}
        className='w-32 h-48 object-cover rounded mb-3 border'
      />
      <h2 className='text-lg font-semibold text-center mb-1'>{book.title}</h2>
      {book.authors && book.authors.length > 0 && (
        <p className='text-sm text-gray-600 mb-1'>
          by {book.authors.map((a) => a.author.name).join(', ')}
        </p>
      )}
      {book.genre && (
        <span className='text-xs bg-gray-200 rounded px-2 py-1 mb-1'>
          {book.genre}
        </span>
      )}
      {typeof book.averageRating === 'number' && (
        <div className='flex items-center mt-2'>
          <span className='text-yellow-500 mr-1'>★</span>
          <span className='text-sm font-medium'>
            {book.averageRating.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
};

export default BookCard;
