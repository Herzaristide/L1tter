import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import searchService, { SearchResponse } from '../services/searchService';
import BookCard from '../components/BookCard';
import { bookService } from '../services/bookService';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const Management: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [loadingCarousel, setLoadingCarousel] = useState(true);

  useEffect(() => {
    const fetchCurrentlyReading = async () => {
      setLoadingCarousel(true);
      try {
        const books = await bookService.getBooks();
        setBooks(books);
      } catch (err) {
        console.log(err);
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
          All books
        </h2>
        {loadingCarousel ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full'></div>
          </div>
        ) : books.length === 0 ? (
          <div className='text-gray-500 text-center py-8'>
            No books currently being read.
          </div>
        ) : (
          <div
            className='flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory w-full px-2'
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <Link
              to={'/create'}
              className=' rounded-lg shadow-md p-4 flex flex-col items-center w-64 justify-center hover:bg-gray-200'
            >
              <Plus size={56} />
            </Link>
            {books.map((book) => (
              <BookCard book={book} link={`/${book.id}/edit`} />
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

export default Management;
