import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookService } from '../services/bookService';
import { authorService, publisherService } from '../services/authorService';
import { Book, Author, Publisher } from '../types';
import {
  Search,
  Filter,
  Calendar,
  Globe,
  User,
  Building,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  ChevronDown,
  Plus,
  Edit,
} from 'lucide-react';

interface SearchFilters {
  search: string;
  authorId: string;
  publisherId: string;
  language: string;
  genre: string;
  yearFrom: string;
  yearTo: string;
  isPublic?: boolean;
  isDraft?: boolean;
}

const Library: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    authorId: '',
    publisherId: '',
    language: '',
    genre: '',
    yearFrom: '',
    yearTo: '',
    isPublic: undefined,
    isDraft: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (filters.search) params.search = filters.search;
      if (filters.authorId) params.authorId = filters.authorId;
      if (filters.publisherId) params.publisherId = filters.publisherId;
      if (filters.language) params.language = filters.language;
      if (filters.genre) params.genre = filters.genre;
      if (filters.yearFrom) params.yearFrom = parseInt(filters.yearFrom);
      if (filters.yearTo) params.yearTo = parseInt(filters.yearTo);

      // Admin-only filters
      if (user?.role === 'ADMIN') {
        if (filters.isPublic !== undefined) params.isPublic = filters.isPublic;
        if (filters.isDraft !== undefined) params.isDraft = filters.isDraft;
      }

      const data = await bookService.getBooks(params);
      setBooks(data);
    } catch (error) {
      console.error('Failed to fetch books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [filters, user?.role]);

  const fetchFilterData = useCallback(async () => {
    try {
      // Fetch authors, publishers, and unique values for languages/genres
      const [authorsData, publishersData, allBooksData] = await Promise.all([
        authorService.getAuthors(),
        publisherService.getPublishers(),
        bookService.getBooks({ includeAll: true }),
      ]);

      setAuthors(authorsData);
      setPublishers(publishersData);

      // Extract unique languages and genres
      const uniqueLanguages = [
        ...new Set(allBooksData.map((book) => book.language).filter(Boolean)),
      ];
      const uniqueGenres = [
        ...new Set(allBooksData.map((book) => book.genre).filter(Boolean)),
      ];

      setLanguages(uniqueLanguages);
      setGenres(uniqueGenres);
    } catch (error) {
      console.error('Failed to fetch filter data:', error);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const resetFilters = () => {
    setFilters({
      search: '',
      authorId: '',
      publisherId: '',
      language: '',
      genre: '',
      yearFrom: '',
      yearTo: '',
      isPublic: undefined,
      isDraft: undefined,
    });
    setSearchTerm('');
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className='min-h-screen bg-white dark:bg-black transition-all duration-300'>
      <div className='max-w-7xl mx-auto px-8 py-12'>
        {/* Header */}
        <div className='mb-12 flex justify-between items-start'>
          <div>
            <h1 className='text-4xl font-light text-black dark:text-white tracking-wider uppercase mb-4'>
              Library
            </h1>
            <p className='text-lg text-gray-600 dark:text-gray-400 font-light tracking-wide'>
              Discover and explore our collection of books
            </p>
          </div>

          {/* Admin Create Button */}
          {user?.role === 'ADMIN' && (
            <Link
              to='/create'
              className='flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black
                       rounded-lg font-light tracking-wide hover:bg-gray-800 dark:hover:bg-gray-200
                       transition-colors duration-200'
            >
              <Plus className='w-5 h-5' />
              Create Book
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className='mb-8'>
          <div className='relative max-w-2xl'>
            <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <input
              type='text'
              placeholder='Search books by title...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                       rounded-xl text-black dark:text-white placeholder-gray-500 font-light tracking-wide
                       focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                       transition-all duration-200'
            />
          </div>
        </div>

        {/* Filters Toggle */}
        <div className='mb-8'>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg
                     text-gray-700 dark:text-gray-300 font-light tracking-wide
                     hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200'
          >
            <Filter className='w-4 h-4' />
            Filters
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showFilters ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className='mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {/* Author Filter */}
              <div>
                <label className='block text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
                  <User className='w-4 h-4 inline mr-2' />
                  Author
                </label>
                <select
                  value={filters.authorId}
                  onChange={(e) =>
                    handleFilterChange('authorId', e.target.value)
                  }
                  className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded-lg text-black dark:text-white font-light
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
                >
                  <option value=''>All Authors</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Publisher Filter */}
              <div>
                <label className='block text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
                  <Building className='w-4 h-4 inline mr-2' />
                  Publisher
                </label>
                <select
                  value={filters.publisherId}
                  onChange={(e) =>
                    handleFilterChange('publisherId', e.target.value)
                  }
                  className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded-lg text-black dark:text-white font-light
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
                >
                  <option value=''>All Publishers</option>
                  {publishers.map((publisher) => (
                    <option key={publisher.id} value={publisher.id}>
                      {publisher.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className='block text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
                  <Globe className='w-4 h-4 inline mr-2' />
                  Language
                </label>
                <select
                  value={filters.language}
                  onChange={(e) =>
                    handleFilterChange('language', e.target.value)
                  }
                  className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded-lg text-black dark:text-white font-light
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
                >
                  <option value=''>All Languages</option>
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre Filter */}
              <div>
                <label className='block text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
                  <BookOpen className='w-4 h-4 inline mr-2' />
                  Genre
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                  className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded-lg text-black dark:text-white font-light
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
                >
                  <option value=''>All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Range */}
              <div>
                <label className='block text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
                  <Calendar className='w-4 h-4 inline mr-2' />
                  Year From
                </label>
                <input
                  type='number'
                  placeholder='e.g. 2020'
                  value={filters.yearFrom}
                  onChange={(e) =>
                    handleFilterChange('yearFrom', e.target.value)
                  }
                  className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded-lg text-black dark:text-white font-light
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
                />
              </div>

              <div>
                <label className='block text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
                  <Calendar className='w-4 h-4 inline mr-2' />
                  Year To
                </label>
                <input
                  type='number'
                  placeholder='e.g. 2024'
                  value={filters.yearTo}
                  onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                  className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded-lg text-black dark:text-white font-light
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
                />
              </div>

              {/* Admin-only filters */}
              {user?.role === 'ADMIN' && (
                <>
                  <div>
                    <label className='block text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
                      <Eye className='w-4 h-4 inline mr-2' />
                      Visibility
                    </label>
                    <select
                      value={
                        filters.isPublic === undefined
                          ? ''
                          : filters.isPublic.toString()
                      }
                      onChange={(e) =>
                        handleFilterChange(
                          'isPublic',
                          e.target.value === ''
                            ? undefined
                            : e.target.value === 'true'
                        )
                      }
                      className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                               rounded-lg text-black dark:text-white font-light
                               focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
                    >
                      <option value=''>All</option>
                      <option value='true'>Public</option>
                      <option value='false'>Private</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
                      <FileText className='w-4 h-4 inline mr-2' />
                      Status
                    </label>
                    <select
                      value={
                        filters.isDraft === undefined
                          ? ''
                          : filters.isDraft.toString()
                      }
                      onChange={(e) =>
                        handleFilterChange(
                          'isDraft',
                          e.target.value === ''
                            ? undefined
                            : e.target.value === 'true'
                        )
                      }
                      className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                               rounded-lg text-black dark:text-white font-light
                               focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent'
                    >
                      <option value=''>All</option>
                      <option value='false'>Published</option>
                      <option value='true'>Draft</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Reset Filters Button */}
            <div className='mt-6 flex justify-end'>
              <button
                onClick={resetFilters}
                className='px-6 py-2 text-sm font-light text-gray-600 dark:text-gray-400 
                         hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200'
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className='mb-8'>
          <p className='text-sm text-gray-600 dark:text-gray-400 font-light tracking-wide'>
            {loading
              ? 'Loading...'
              : `${books.length} book${books.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
            {[...Array(8)].map((_, index) => (
              <div key={index} className='animate-pulse'>
                <div className='bg-gray-200 dark:bg-gray-700 h-64 rounded-lg mb-4'></div>
                <div className='bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2'></div>
                <div className='bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3'></div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className='text-center py-32'>
            <BookOpen className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <p className='text-xl font-light text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-2'>
              No Books Found
            </p>
            <p className='text-sm font-light text-gray-400 tracking-wide'>
              Try adjusting your search criteria or filters
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
            {books.map((book) => (
              <div key={book.id} className='group relative'>
                <Link to={`/${book.id}`} className='cursor-pointer block'>
                  <div
                    className='relative overflow-hidden rounded-lg mb-4 bg-gray-100 dark:bg-gray-800 
                                border border-gray-200 dark:border-gray-700 h-64
                                group-hover:shadow-xl transition-all duration-300'
                  >
                    {book.imageUrl ? (
                      <img
                        src={book.imageUrl}
                        alt={book.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <BookOpen className='w-16 h-16 text-gray-400' />
                      </div>
                    )}

                    {/* Status indicators for admin */}
                    {user?.role === 'ADMIN' && (
                      <div className='absolute top-2 right-2 flex gap-1'>
                        {!book.isPublic && (
                          <div className='bg-red-500 text-white px-2 py-1 rounded text-xs font-light'>
                            <EyeOff className='w-3 h-3 inline mr-1' />
                            Private
                          </div>
                        )}
                        {book.isDraft && (
                          <div className='bg-yellow-500 text-black px-2 py-1 rounded text-xs font-light'>
                            <FileText className='w-3 h-3 inline mr-1' />
                            Draft
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <h3 className='text-lg font-light text-black dark:text-white tracking-wide group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200'>
                      {book.title}
                    </h3>

                    {book.authors && book.authors.length > 0 && (
                      <p className='text-sm text-gray-600 dark:text-gray-400 font-light tracking-wide'>
                        by {book.authors.map((ba) => ba.author.name).join(', ')}
                      </p>
                    )}

                    <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 font-light tracking-wide uppercase'>
                      {book.language && (
                        <span className='flex items-center gap-1'>
                          <Globe className='w-3 h-3' />
                          {book.language}
                        </span>
                      )}
                      {book.genre && (
                        <span className='flex items-center gap-1'>
                          <BookOpen className='w-3 h-3' />
                          {book.genre}
                        </span>
                      )}
                      {book.editionPublished && (
                        <span className='flex items-center gap-1'>
                          <Calendar className='w-3 h-3' />
                          {book.editionPublished}
                        </span>
                      )}
                    </div>

                    {book.description && (
                      <p className='text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed line-clamp-3'>
                        {book.description}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Admin Edit Button */}
                {user?.role === 'ADMIN' && (
                  <Link
                    to={`/${book.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className='z-50 absolute top-2 left-2 bg-black dark:bg-white text-white dark:text-black
                             p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200
                             hover:bg-gray-800 dark:hover:bg-gray-200'
                    title='Edit Book'
                  >
                    <Edit className='w-4 h-4' />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
