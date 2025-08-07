import api from './api';

export const notesService = {
  getNotes: async (params: any = {}): Promise<any> => {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  getNote: async (id: string): Promise<any> => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  createNote: async (data: {
    bookId: string;
    paragraphId: string;
    startIndex?: number;
    endIndex?: number;
    selectedText?: string;
    text?: string;
    firstContent?: string;
    secondContent?: string;
    thirdContent?: string;
    noteType?: string;
    isPublic?: boolean;
    tagIds?: string[];
  }): Promise<any> => {
    const response = await api.post('/notes', data);
    return response.data;
  },

  updateNote: async (
    id: string,
    data: {
      text?: string;
      firstContent?: string;
      secondContent?: string;
      thirdContent?: string;
      noteType?: string;
      isPublic?: boolean;
    }
  ): Promise<any> => {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },

  deleteNote: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },

  shareNote: async (id: string, userEmail: string): Promise<any> => {
    const response = await api.post(`/notes/${id}/share`, { userEmail });
    return response.data;
  },

  removeShare: async (noteId: string, userId: string): Promise<void> => {
    await api.delete(`/notes/${noteId}/share/${userId}`);
  },
};
