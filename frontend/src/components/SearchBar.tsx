import React, { useState, useEffect } from 'react';
import searchService, { SearchResult } from '../services/searchService';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSearch('');
  };

  // Unified search using new Meilisearch endpoints
  const handleSearch = async (searchText: string) => {
    if (!searchText.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      let data: SearchResult[] = [];

      const response = await searchService.searchAll(searchText);
      data = response.results;

      setResults(data);
      setShowResults(true);
      onSearch(searchText);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query) {
        handleSearch(query);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className='w-full flex flex-col items-center'>
      <form
        onSubmit={handleSubmit}
        role='search'
        aria-label='Search'
        className='w-full flex justify-center'
        autoComplete='off'
      >
        <div className='relative flex items-center w-full max-w-2xl bg-white dark:bg-gray-900 rounded-full shadow-xl border border-gray-200 dark:border-gray-800 px-4 py-2 focus-within:ring-2 focus-within:ring-primary-500 transition-all'>
          <span className='absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 dark:text-primary-400 pointer-events-none'>
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <circle cx='11' cy='11' r='8' />
              <line x1='21' y1='21' x2='16.65' y2='16.65' />
            </svg>
          </span>
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className='w-full pl-12 pr-24 py-3 text-lg rounded-full bg-transparent focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white'
            aria-label='Search'
            autoComplete='off'
          />
          {isLoading && (
            <div className='absolute right-24 top-1/2 -translate-y-1/2'>
              <div className='animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full'></div>
            </div>
          )}
          {query && !isLoading && (
            <button
              type='button'
              onClick={handleClear}
              className='absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2'
              aria-label='Clear search'
            >
              <span aria-hidden='true'>✕</span>
            </button>
          )}
          <button
            type='submit'
            className='absolute right-4 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-full text-base font-semibold shadow-md transition-colors'
            disabled={isLoading}
          >
            <span className='hidden sm:inline'>Search</span>
            <span className='sm:hidden'>🔍</span>
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      <div className='relative w-full max-w-2xl'>
        {showResults && results.length > 0 && (
          <div className='absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50'>
            {results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className='p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer'
                onClick={() => {
                  onSearch(query);
                  setShowResults(false);
                }}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full font-medium'>
                        {result.type}
                      </span>
                      {result._rankingScore && (
                        <span className='text-xs text-gray-500'>
                          {Math.round(result._rankingScore * 100)}% match
                        </span>
                      )}
                    </div>
                    <h4 className='font-semibold text-gray-900 mb-1'>
                      {result.title || result.name || 'Untitled'}
                    </h4>
                    {(result.description || result.bio || result.content) && (
                      <p className='text-sm text-gray-600 line-clamp-2'>
                        {result.description || result.bio || result.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {showResults && results.length === 0 && query && !isLoading && (
          <div className='absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-center text-gray-500'>
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
