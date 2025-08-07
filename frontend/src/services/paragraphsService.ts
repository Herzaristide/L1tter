import api from './api';

export const paragraphsService = {
  getParagraphs: async (bookId: string, params: any = {}): Promise<any> => {
    const response = await api.get(`/paragraphs/book/${bookId}`, { params });
    return response.data;
  },

  getParagraph: async (id: string, params: any = {}): Promise<any> => {
    const response = await api.get(`/paragraphs/${id}`, { params });
    return response.data;
  },

  createParagraph: async (data: {
    bookId: string;
    content: string;
    order?: number;
    chapterNumber?: number;
    readingTimeEst?: number;
  }): Promise<any> => {
    const response = await api.post('/paragraphs', data);
    return response.data;
  },

  updateParagraph: async (
    id: string,
    data: {
      content?: string;
      order?: number;
      chapterNumber?: number;
      readingTimeEst?: number;
    }
  ): Promise<any> => {
    const response = await api.put(`/paragraphs/${id}`, data);
    return response.data;
  },

  deleteParagraph: async (id: string): Promise<void> => {
    await api.delete(`/paragraphs/${id}`);
  },

  getChapterStructure: async (bookId: string): Promise<any> => {
    const response = await api.get(`/paragraphs/book/${bookId}/chapters`);
    return response.data;
  },
};
