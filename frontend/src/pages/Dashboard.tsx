import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import searchService, { SearchResponse } from '../services/searchService';

const Dashboard: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyReading, setCurrentlyReading] = useState<any[]>([]);
  const [loadingCarousel, setLoadingCarousel] = useState(true);

  // Fetch currently reading books from backend
  React.useEffect(() => {
    const fetchCurrentlyReading = async () => {
      setLoadingCarousel(true);
      try {
        const stats = await import('../services/progressService').then((m) =>
          m.progressService.getStats()
        );
        // Duplicate the data 5 times for demo purposes
        const arr = stats.currentlyReading || [];
        setCurrentlyReading(Array(5).fill(arr).flat());
      } catch (err) {
        setCurrentlyReading([]);
      } finally {
        setLoadingCarousel(false);
      }
    };
    fetchCurrentlyReading();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await searchService.searchAll(query);
      setSearchResults(response);
    } catch (error) {
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full'>
      <SearchBar onSearch={handleSearch} placeholder={`Search ...`} />

      {/* Carousel for currently read books */}
      <div className='mt-8 mb-4'>
        <h2 className='text-xl font-semibold mb-2 text-gray-900 dark:text-white'>
          Currently Reading
        </h2>
        {loadingCarousel ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full'></div>
          </div>
        ) : currentlyReading.length === 0 ? (
          <div className='text-gray-500 text-center py-8'>
            No books currently being read.
          </div>
        ) : (
          <div
            className='flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory w-full px-2'
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {currentlyReading.map((item) => (
              <div
                key={item.book.id + '-' + item.chapter.id}
                className='snap-center min-w-[200px] max-w-[200px] bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 flex flex-col items-center justify-between'
              >
                <div className='w-32 h-44 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 shadow-md'>
                  {/* Optionally show cover if available */}
                  <span className='text-5xl'>📖</span>
                </div>
                <h3 className='font-bold text-base text-gray-900 dark:text-white mb-1 text-center'>
                  {item.book.title}
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400 mb-2 text-center'>
                  {item.book.authors?.join(', ')}
                </p>
                <div className='text-xs text-gray-400 mb-2'>
                  Chapter {item.chapter.order}: {item.chapter.title}
                </div>
                <button className='bg-primary-600 hover:bg-primary-700 text-white px-4 py-1 rounded-full text-xs font-semibold shadow transition-colors'>
                  Continue Reading
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='flex justify-center mt-8'>
          <div className='animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full'></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
