import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search books...',
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4"
      role="search"
      aria-label="Search books"
    >
      <div className="relative flex items-center shadow-lg rounded-xl bg-white/80 backdrop-blur border border-gray-200">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-5 py-3 text-lg rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
          aria-label="Search books"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2"
            aria-label="Clear search"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
        <button
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-base font-semibold shadow-md transition-colors"
          aria-label="Search"
        >
          <span className="hidden sm:inline">Search</span>
          <span className="sm:hidden">🔍</span>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
