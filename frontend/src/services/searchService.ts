import api from './api';

export interface SearchResult {
  id: string;
  type: string;
  index: string;
  title?: string;
  name?: string;
  content?: string;
  description?: string;
  bio?: string;
  _formatted?: any;
  _rankingScore?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
  totalFound?: number;
  searchedIndexes?: string[];
}

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const searchService = {
  // Universal search across all tables
  searchAll: async (query: string, limit = 50): Promise<SearchResponse> => {
    const response = await api.get('/search', {
      params: { q: query, limit },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Search specifically in books
  searchBooks: async (query: string, limit = 10): Promise<SearchResult[]> => {
    const response = await api.get('/search/books', {
      params: { q: query, limit },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Search by specific type/table
  searchByType: async (
    type: string,
    query: string,
    limit = 20
  ): Promise<SearchResponse> => {
    const response = await api.get(`/search/by-type/${type}`, {
      params: { q: query, limit },
      headers: getAuthHeader(),
    });
    return response.data;
  },
};

export default searchService;
