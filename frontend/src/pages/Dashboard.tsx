import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import searchService, { SearchResponse } from '../services/searchService';
import BookCard from '../components/BookCard';
import { progressService } from '../services/progressService';
import { Book } from '../types';
import Loader from '../components/Loader';

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
        {/* Search Bar */}
        <div className='mb-12'>
          <SearchBar
            onSearch={handleSearch}
            placeholder='Search books, authors, content...'
          />
        </div>

        {/* Currently Reading Section */}
        <div className='mb-12'>
          <h2 className='text-2xl font-light text-black dark:text-white tracking-wider uppercase mb-6'>
            Currently Reading
          </h2>

          {loadingCarousel ? (
            <Loader />
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
            <div className='flex gap-4'>
              {books.map((book) => (
                <BookCard key={book.id} book={book} link={`/${book.id}`} />
              ))}
            </div>
          )}
        </div>

        {/* Loading State for Search */}
        {isLoading && <Loader />}
      </div>
    </div>
  );
};

export default Dashboard;
