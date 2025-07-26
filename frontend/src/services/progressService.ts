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

  // Update progress for a chapter
  updateProgress: async (chapterId: string, position: number): Promise<any> => {
    const response = await api.post('/progress', {
      chapterId,
      position,
    });
    return response.data;
  },

  // Mark chapter as completed
  completeChapter: async (chapterId: string): Promise<any> => {
    const response = await api.post(`/progress/complete/${chapterId}`);
    return response.data;
  },

  // Get reading statistics and currently reading books
  getStats: async (): Promise<any> => {
    const response = await api.get('/progress/stats');
    return response.data;
  },

  // Delete progress for a chapter
  deleteProgress: async (chapterId: string): Promise<void> => {
    await api.delete(`/progress/${chapterId}`);
  },
};
