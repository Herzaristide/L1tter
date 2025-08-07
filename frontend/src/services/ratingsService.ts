import api from './api';

export const ratingsService = {
  // Book Ratings
  getBookRatings: async (bookId: string, params: any = {}): Promise<any> => {
    const response = await api.get(`/ratings/books/${bookId}`, { params });
    return response.data;
  },

  createBookRating: async (
    bookId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> => {
    const response = await api.post(`/ratings/books/${bookId}`, data);
    return response.data;
  },

  updateBookRating: async (
    bookId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> => {
    const response = await api.post(`/ratings/books/${bookId}`, data);
    return response.data;
  },

  deleteBookRating: async (bookId: string): Promise<void> => {
    await api.delete(`/ratings/books/${bookId}`);
  },

  // Paragraph Ratings
  getParagraphRatings: async (
    paragraphId: string,
    params: any = {}
  ): Promise<any> => {
    const response = await api.get(`/ratings/paragraphs/${paragraphId}`, {
      params,
    });
    return response.data;
  },

  createParagraphRating: async (
    paragraphId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> => {
    const response = await api.post(`/ratings/paragraphs/${paragraphId}`, data);
    return response.data;
  },

  updateParagraphRating: async (
    paragraphId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> => {
    const response = await api.post(`/ratings/paragraphs/${paragraphId}`, data);
    return response.data;
  },

  deleteParagraphRating: async (paragraphId: string): Promise<void> => {
    await api.delete(`/ratings/paragraphs/${paragraphId}`);
  },

  // Author Ratings
  getAuthorRatings: async (
    authorId: string,
    params: any = {}
  ): Promise<any> => {
    const response = await api.get(`/ratings/authors/${authorId}`, { params });
    return response.data;
  },

  createAuthorRating: async (
    authorId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> => {
    const response = await api.post(`/ratings/authors/${authorId}`, data);
    return response.data;
  },

  updateAuthorRating: async (
    authorId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> => {
    const response = await api.post(`/ratings/authors/${authorId}`, data);
    return response.data;
  },

  deleteAuthorRating: async (authorId: string): Promise<void> => {
    await api.delete(`/ratings/authors/${authorId}`);
  },

  // User's Ratings
  getMyRatings: async (params: any = {}): Promise<any> => {
    const response = await api.get('/ratings/my-ratings', { params });
    return response.data;
  },
};
