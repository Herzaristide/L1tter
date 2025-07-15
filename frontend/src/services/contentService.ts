import api from './api';
import { Paragraph, PaginatedResponse } from '../types';

export const paragraphService = {
  getParagraphs: async (
    bookId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Paragraph>> => {
    const response = await api.get(`/paragraphs/book/${bookId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  getParagraph: async (id: string): Promise<Paragraph> => {
    const response = await api.get(`/paragraphs/${id}`);
    return response.data;
  },
};
