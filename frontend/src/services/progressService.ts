import api from './api';
import { Progress } from '../types';

export const progressService = {
  // Get all progress for the current user
  getProgress: async (): Promise<Progress[]> => {
    const response = await api.get('/progress');
    return response.data.progress || response.data;
  },

  // Get progress for a specific book
  getBookProgress: async (bookId: string): Promise<any> => {
    const response = await api.get(`/progress/book/${bookId}`);
    return response.data;
  },

  // Update progress for a paragraph
  updateProgress: async (
    paragraphId: string,
    position: number
  ): Promise<any> => {
    const response = await api.post('/progress', {
      paragraphId,
      position,
    });
    return response.data;
  },

  // Mark paragraph as completed
  completeParagraph: async (paragraphId: string): Promise<any> => {
    const response = await api.post(`/progress/complete/${paragraphId}`);
    return response.data;
  },

  // Get reading statistics and currently reading books
  getStats: async (): Promise<any> => {
    const response = await api.get('/progress/stats');
    return response.data;
  },

  // Delete progress for a paragraph
  deleteProgress: async (paragraphId: string): Promise<void> => {
    await api.delete(`/progress/${paragraphId}`);
  },
};
