import api from './api';
import { Chapter, Paragraph, PaginatedResponse } from '../types';

export const chapterService = {
  getChapters: async (bookId: string): Promise<Chapter[]> => {
    const response = await api.get(`/chapters/book/${bookId}`);
    return response.data;
  },

  getChapter: async (id: string): Promise<Chapter> => {
    const response = await api.get(`/chapters/${id}`);
    return response.data;
  },
};

export const paragraphService = {
  getParagraphs: async (
    chapterId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Paragraph>> => {
    const response = await api.get(`/paragraphs/chapter/${chapterId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  getParagraph: async (id: string): Promise<Paragraph> => {
    const response = await api.get(`/paragraphs/${id}`);
    return response.data;
  },
};
