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
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-4'>Your Library</h1>
        <SearchBar onSearch={handleSearch} />
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6'>
          {error}
        </div>
      )}

      {isSearching && books.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-gray-500'>No books found matching your search.</p>
        </div>
      )}

      {!isSearching && books.length === 0 && (
        <div className='text-center py-12'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No books in your library
          </h3>
          <p className='text-gray-500 mb-4'>
            Start building your collection by uploading your first book.
          </p>
          <a href='/upload' className='btn-primary'>
            Upload Your First Book
          </a>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {books.map((book) => (
          <BookCard key={book.id} book={book} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
};

export default Library;
