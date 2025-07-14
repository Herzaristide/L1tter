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
    <form onSubmit={handleSubmit} className='relative'>
      <div className='flex'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className='input-field pr-20'
        />
        <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1'>
          {query && (
            <button
              type='button'
              onClick={handleClear}
              className='text-gray-400 hover:text-gray-600 px-2'
            >
              Clear
            </button>
          )}
          <button
            type='submit'
            className='bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm'
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
