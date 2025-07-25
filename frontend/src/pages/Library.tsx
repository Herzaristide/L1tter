import React, { useState } from 'react';
import { useBooks } from '../hooks/useBooks';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';

const Library: React.FC = () => {
  const { books, loading, error, deleteBook, searchBooks, fetchBooks } =
    useBooks();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      setIsSearching(true);
      await searchBooks(query);
    } else {
      setIsSearching(false);
      await fetchBooks();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await deleteBook(id);
      } catch (err) {
        alert('Failed to delete book');
      }
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen lg:ml-20 flex items-center justify-center'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='w-16 h-16 relative'>
            <div className='w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-800'></div>
            <div className='w-16 h-16 rounded-full border-4 border-primary-600 border-t-transparent animate-spin absolute top-0'></div>
          </div>
          <p className='text-primary-600 dark:text-primary-400 font-medium'>
            Loading your library...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <SearchBar onSearch={handleSearch} />
      {error && (
        <div
          className='mb-6 p-4 rounded-xl border border-red-200 dark:border-red-800 
            bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        >
          <div className='flex items-center space-x-2'>
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
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Books Grid */}
      {books.length > 0 && (
        <div className='flex overflow-scroll gap-4 w-full'>
          {books.map((book) => (
            <BookCard key={book.id} book={book} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
