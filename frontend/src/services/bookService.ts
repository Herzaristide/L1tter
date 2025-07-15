import api from './api';
import { Book } from '../types';

export const bookService = {
  getBooks: async (): Promise<Book[]> => {
    const response = await api.get('/books');
    return response.data;
  },

  getBook: async (id: string): Promise<Book> => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  createBook: async (
    title: string,
    author: string,
    content: string
  ): Promise<Book> => {
    const response = await api.post('/books', { title, author, content });
    return response.data;
  },

  uploadBookFile: async (
    title: string,
    author: string,
    file: File
  ): Promise<Book> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('file', file);

    const response = await api.post('/books/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteBook: async (id: string): Promise<void> => {
    await api.delete(`/books/${id}`);
  },

  searchBooks: async (query: string): Promise<Book[]> => {
    const response = await api.get(
      `/books/search/${encodeURIComponent(query)}`
    );
    return response.data;
  },
};
