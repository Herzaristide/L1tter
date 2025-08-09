import api from './api';
import { Author, Publisher } from '../types';

export const authorService = {
  getAuthors: async (params: any = {}): Promise<Author[]> => {
    const response = await api.get('/authors', { params });
    return response.data.authors || response.data;
  },

  getAuthor: async (id: string): Promise<Author> => {
    const response = await api.get(`/authors/${id}`);
    return response.data;
  },

  createAuthor: async (data: {
    name: string;
    bio?: string;
  }): Promise<Author> => {
    const response = await api.post('/authors', data);
    return response.data;
  },

  updateAuthor: async (
    id: string,
    data: { name?: string; bio?: string }
  ): Promise<Author> => {
    const response = await api.put(`/authors/${id}`, data);
    return response.data;
  },

  deleteAuthor: async (id: string): Promise<void> => {
    await api.delete(`/authors/${id}`);
  },
};

export const publisherService = {
  getPublishers: async (params: any = {}): Promise<Publisher[]> => {
    const response = await api.get('/publishers', { params });
    return response.data.publishers || response.data;
  },

  getPublisher: async (id: string): Promise<Publisher> => {
    const response = await api.get(`/publishers/${id}`);
    return response.data;
  },

  createPublisher: async (data: {
    name: string;
    description?: string;
    website?: string;
    address?: string;
    foundedYear?: number;
    country?: string;
  }): Promise<Publisher> => {
    const response = await api.post('/publishers', data);
    return response.data;
  },

  updatePublisher: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      website?: string;
      address?: string;
      foundedYear?: number;
      country?: string;
    }
  ): Promise<Publisher> => {
    const response = await api.put(`/publishers/${id}`, data);
    return response.data;
  },

  deletePublisher: async (id: string): Promise<void> => {
    await api.delete(`/publishers/${id}`);
  },
};
