import { useState, useEffect } from 'react';
import { Book } from '../types';
import { bookService } from '../services/bookService';

export const useBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getPublishedBooks();
      setBooks(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const addBook = async (title: string, author: string, content: string) => {
    try {
      const newBook = await bookService.createBook(title, author, content);
      setBooks((prev) => [newBook, ...prev]);
      return newBook;
    } catch (err) {
      throw new Error('Failed to create book');
    }
  };

  const deleteBook = async (id: string) => {
    try {
      await bookService.deleteBook(id);
      setBooks((prev) => prev.filter((book) => book.id !== id));
    } catch (err) {
      throw new Error('Failed to delete book');
    }
  };

  const searchBooks = async (query: string) => {
    try {
      setLoading(true);
      const data = await bookService.searchBooks(query);
      setBooks(data);
      setError(null);
    } catch (err) {
      setError('Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return {
    books,
    loading,
    error,
    fetchBooks,
    addBook,
    deleteBook,
    searchBooks,
  };
};
