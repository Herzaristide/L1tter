export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  paragraphs?: Paragraph[];
  progress?: Progress[];
  _count?: {
    paragraphs: number;
  };
}

export interface Paragraph {
  id: string;
  bookId: string;
  order: number;
  content: string;
  book?: Book;
}

export interface Progress {
  id: string;
  userId: string;
  bookId: string;
  paragraphId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  book?: Book;
  paragraph?: Paragraph;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  paragraphs: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
