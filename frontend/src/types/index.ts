export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Publisher {
  id: string;
  name: string;
  description?: string;
  website?: string;
  address?: string;
  foundedYear?: number;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookAuthor {
  bookId: string;
  authorId: string;
  position?: number;
  author: Author;
}

export interface Book {
  id: string;
  workId?: string;
  title: string;
  description?: string;
  edition?: string;
  editionPublished?: number;
  originalLanguage: string;
  originalPublished?: number;
  imageUrl?: string;
  shoppingUrl?: string;
  language: string;
  slug?: string;
  genre?: string;
  isPublic: boolean;
  isDraft: boolean;
  userId?: string;
  collectionId?: string;
  publisherId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  orderInCollection?: number;
  paragraphs?: Paragraph[];
  progress?: Progress[];
  authors?: BookAuthor[];
  publisher?: Publisher;
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
