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
          <p className='text-primary-600 dark:text-primary-400 font-medium'>Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen lg:ml-20 transition-all duration-300'>
      <div className='max-w-7xl mx-auto px-4 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Your Library</h1>
              <p className='text-gray-600 dark:text-gray-400'>
                {books.length} {books.length === 1 ? 'book' : 'books'} in your collection
              </p>
            </div>
            <div className='flex-shrink-0'>
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>

        {error && (
          <div className='mb-6 p-4 rounded-xl border border-red-200 dark:border-red-800 
            bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'>
            <div className='flex items-center space-x-2'>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty States */}
        {isSearching && books.length === 0 && (
          <div className='text-center py-16'>
            <div className='mb-6'>
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className='text-xl font-semibold mb-2'>No books found</h3>
            <p className='text-gray-600 dark:text-gray-400 max-w-md mx-auto'>
              We couldn't find any books matching your search. Try adjusting your search terms.
            </p>
          </div>
        )}

        {!isSearching && books.length === 0 && (
          <div className='text-center py-16'>
            <div className='mb-6'>
              <svg className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className='text-2xl font-bold mb-3'>Welcome to your library</h3>
            <p className='text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto'>
              Your personal reading collection is empty. Start building your library by uploading your first book.
            </p>
            <a href='/upload' className='btn-primary inline-flex items-center space-x-2'>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload Your First Book</span>
            </a>
          </div>
        )}

        {/* Books Grid */}
        {books.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'>
            {books.map((book) => (
              <BookCard key={book.id} book={book} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
