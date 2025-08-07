import api from './api';

export const reportsService = {
  createReport: async (data: {
    reportType: string;
    description: string;
    bookId?: string;
    paragraphId?: string;
    authorId?: string;
    publisherId?: string;
    noteId?: string;
    bookRatingId?: string;
    paragraphRatingId?: string;
    authorRatingId?: string;
  }): Promise<any> => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  getReports: async (params: any = {}): Promise<any> => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  getMyReports: async (params: any = {}): Promise<any> => {
    const response = await api.get('/reports/my-reports', { params });
    return response.data;
  },

  updateReport: async (
    id: string,
    data: { status: string; adminNotes?: string }
  ): Promise<any> => {
    const response = await api.patch(`/reports/${id}`, data);
    return response.data;
  },

  getReportStats: async (): Promise<any> => {
    const response = await api.get('/reports/stats');
    return response.data;
  },
};
