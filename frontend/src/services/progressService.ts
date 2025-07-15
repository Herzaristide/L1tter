import api from './api';
import { Progress } from '../types';

export const progressService = {
  getProgress: async (): Promise<Progress[]> => {
    const response = await api.get('/progress');
    return response.data;
  },

  getBookProgress: async (bookId: string): Promise<Progress | null> => {
    const response = await api.get(`/progress/book/${bookId}`);
    return response.data;
  },

  updateProgress: async (
    bookId: string,
    paragraphId: string,
    position: number
  ): Promise<Progress> => {
    const response = await api.post('/progress', {
      bookId,
      paragraphId,
      position,
    });
    return response.data;
  },

  deleteProgress: async (bookId: string): Promise<void> => {
    await api.delete(`/progress/book/${bookId}`);
  },
};
