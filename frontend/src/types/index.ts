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
  chapters?: Chapter[];
  progress?: Progress[];
}

export interface Chapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  createdAt: string;
  book?: Book;
  paragraphs?: Paragraph[];
  _count?: {
    paragraphs: number;
  };
}

export interface Paragraph {
  id: string;
  chapterId: string;
  order: number;
  content: string;
  chapter?: Chapter;
}

export interface Progress {
  id: string;
  userId: string;
  bookId: string;
  chapterId: string;
  paragraphId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  book?: Book;
  chapter?: Chapter;
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
