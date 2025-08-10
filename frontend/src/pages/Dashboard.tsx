import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import searchService, { SearchResponse } from '../services/searchService';
import BookCard from '../components/BookCard';
import { progressService } from '../services/progressService';
import { Book } from '../types';

const Dashboard: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingCarousel, setLoadingCarousel] = useState(true);

  useEffect(() => {
    const fetchCurrentlyReading = async () => {
      setLoadingCarousel(true);
      try {
        // Get user's reading progress and statistics
        const stats = await progressService.getStats();
        console.log('📊 Raw API Response:', JSON.stringify(stats, null, 2));

        // Extract currently reading books from stats
        const currentlyReadingBooks = stats.currentlyReading || [];
        console.log(
          '📚 Books with progress:',
          currentlyReadingBooks.map((book: Book) => ({
            title: book.title,
            progressExists: !!book.progress,
            progressData: book.progress,
          }))
        );

        setBooks(currentlyReadingBooks);
      } catch (err) {
        console.log('Error fetching currently reading books:', err);
        setBooks([]);
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
    <div className='min-h-screen bg-white dark:bg-black transition-all duration-300'>
      <div className='max-w-7xl mx-auto px-8 py-12'>
        {/* Header */}
        <div className='mb-12'>
          <h1 className='text-4xl font-light text-black dark:text-white tracking-wider uppercase mb-4'>
            Dashboard
          </h1>
          <p className='text-lg text-gray-600 dark:text-gray-400 font-light tracking-wide'>
            Welcome back to your reading journey
          </p>
        </div>

        {/* Search Bar */}
        <div className='mb-12'>
          <SearchBar
            onSearch={handleSearch}
            placeholder='Search books, authors, content...'
          />
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className='mb-12'>
            <h2 className='text-2xl font-light text-black dark:text-white tracking-wider uppercase mb-6'>
              Search Results
            </h2>
            {/* Display search results here if needed */}
          </div>
        )}

        {/* Currently Reading Section */}
        <div className='mb-12'>
          <h2 className='text-2xl font-light text-black dark:text-white tracking-wider uppercase mb-6'>
            Currently Reading
          </h2>

          {loadingCarousel ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
              {[...Array(4)].map((_, index) => (
                <div key={index} className='animate-pulse'>
                  <div className='bg-gray-200 dark:bg-gray-700 h-64 rounded-lg mb-4'></div>
                  <div className='bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2'></div>
                  <div className='bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3'></div>
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className='text-center py-32'>
              <div className='text-6xl mb-4'>📚</div>
              <p className='text-xl font-light text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-2'>
                No Books in Progress
              </p>
              <p className='text-sm font-light text-gray-400 tracking-wide'>
                Start reading a book to see it here
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
              {books.map((book) => (
                <BookCard key={book.id} book={book} link={`/${book.id}`} />
              ))}
            </div>
          )}
        </div>

        {/* Loading State for Search */}
        {isLoading && (
          <div className='flex justify-center py-8'>
            <div className='animate-spin h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full'></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
