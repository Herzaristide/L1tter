import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../services/bookService';

const Reading: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const data = await bookService.getBook(bookId!);
        setBook(data);
      } catch (err) {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    if (bookId) fetchBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-full py-16'>
        <div className='animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full'></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className='text-center py-16 text-gray-500'>Book not found.</div>
    );
  }

  return (
    <div className='max-w-3xl mx-auto py-8 px-4'>
      <div className='flex items-center gap-6 mb-8'>
        <img
          src={book.imageUrl || '/default-book.png'}
          alt={book.title}
          className='w-24 h-36 object-cover rounded border'
        />
        <div>
          <h1 className='text-2xl font-bold mb-2'>{book.title}</h1>
          {book.authors && book.authors.length > 0 && (
            <p className='text-gray-600'>
              by {book.authors.map((a: any) => a.author.name).join(', ')}
            </p>
          )}
        </div>
      </div>
      <div className='space-y-12'>
        {book.chapters && book.chapters.length > 0 ? (
          book.chapters.map((chapter: any) => (
            <section key={chapter.id} className='scroll-mt-24'>
              <h2 className='text-xl font-semibold mb-2'>
                {chapter.title || `Chapter ${chapter.order}`}
              </h2>
              <div className='prose prose-lg max-w-none text-gray-900 dark:text-gray-100 whitespace-pre-line'>
                {chapter.content}
              </div>
            </section>
          ))
        ) : (
          <div className='text-gray-500'>No chapters found.</div>
        )}
      </div>
    </div>
  );
};

export default Reading;
