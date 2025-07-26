import api from './api';
import { Book } from '../types';

export const bookService = {
  getBooks: async (params: any = {}): Promise<Book[]> => {
    // Supports search, filter, pagination
    const response = await api.get('/books', { params });
    return response.data.books || response.data;
  },

  getBook: async (id: string, params: any = {}): Promise<Book> => {
    const response = await api.get(`/books/${id}`, { params });
    return response.data;
  },

  createBook: async (data: any): Promise<Book> => {
    // data: { title, language, imageUrl, collectionId, isPublic, authorIds, tagIds, chapters }
    const response = await api.post('/books', data);
    return response.data.book || response.data;
  },

  uploadBookFile: async (data: {
    title: string;
    author: string;
    file: File;
  }): Promise<Book> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('author', data.author);
    formData.append('file', data.file);
    const response = await api.post('/books/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.book || response.data;
  },

  deleteBook: async (id: string): Promise<void> => {
    await api.delete(`/books/${id}`);
  },

  searchBooks: async (params: any = {}): Promise<Book[]> => {
    // Use /books endpoint with search param
    const response = await api.get('/books', { params });
    return response.data.books || response.data;
  },

  analyzeBookFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/books/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
