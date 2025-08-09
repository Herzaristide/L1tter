import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
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
        <div className='relative w-full max-w-2xl'>
          <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className='w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                     rounded-xl text-black dark:text-white placeholder-gray-500 font-light tracking-wide
                     focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                     transition-all duration-200'
            aria-label='Search'
            autoComplete='off'
          />
          {isLoading && (
            <div className='absolute right-4 top-1/2 transform -translate-y-1/2'>
              <div className='animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full'></div>
            </div>
          )}
          {query && !isLoading && (
            <button
              type='button'
              onClick={handleClear}
              className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                       transition-colors duration-200'
              aria-label='Clear search'
            >
              <X className='w-5 h-5' />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      <div className='relative w-full max-w-2xl'>
        {showResults && results.length > 0 && (
          <div
            className='absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl 
                        border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50'
          >
            {results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className='p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 
                         last:border-b-0 cursor-pointer transition-colors duration-200'
                onClick={() => {
                  onSearch(query);
                  setShowResults(false);
                }}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span
                        className='text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                     rounded-full font-light uppercase tracking-wide'
                      >
                        {result.type}
                      </span>
                      {result._rankingScore && (
                        <span className='text-xs text-gray-500 font-light tracking-wide'>
                          {Math.round(result._rankingScore * 100)}% match
                        </span>
                      )}
                    </div>
                    <h4 className='font-light text-black dark:text-white tracking-wide mb-1'>
                      {result.title || result.name || 'Untitled'}
                    </h4>
                    {(result.description || result.bio || result.content) && (
                      <p className='text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed line-clamp-2'>
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
          <div
            className='absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl 
                        border border-gray-200 dark:border-gray-700 p-6 text-center'
          >
            <p className='text-gray-500 dark:text-gray-400 font-light tracking-wide'>
              No results found for "{query}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
