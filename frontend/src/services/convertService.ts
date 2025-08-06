import api from './api';

export type ConversionMode = 'structure' | 'smart' | 'page-structure' | 'raw';

export interface Chapter {
  title: string;
  content: string;
}

export const convertService = {
  /**
   * Convert PDF file to text using the backend API
   * @param file - The PDF file to convert
   * @param mode - Processing mode: 'structure' (default), 'smart', 'page-structure', or 'raw'
   * @returns Promise<Chapter[]> - The extracted chapters
   */
  async convertPdfToText(
    file: File,
    mode: ConversionMode = 'structure'
  ): Promise<Chapter[]> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('mode', mode);

    try {
      const response = await api.post('/convert/pdf-to-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.chapters;
      } else {
        throw new Error('Failed to convert PDF to text');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to convert PDF to text');
    }
  },

  /**
   * Convert PDF from URL to text using the backend API
   * @param url - The URL of the PDF file to convert
   * @param mode - Processing mode: 'structure' (default), 'smart', 'page-structure', or 'raw'
   * @returns Promise<Chapter[]> - The extracted chapters
   */
  async convertPdfFromUrl(
    url: string,
    mode: ConversionMode = 'structure'
  ): Promise<Chapter[]> {
    try {
      const response = await api.post('/convert/pdf-from-url', { url, mode });

      if (response.data.success) {
        return response.data.chapters;
      } else {
        throw new Error('Failed to convert PDF from URL to text');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to convert PDF from URL to text');
    }
  },

  /**
   * Check if convert service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await api.get('/convert/health');
      return response.data.status === 'OK';
    } catch (error) {
      return false;
    }
  },
};
