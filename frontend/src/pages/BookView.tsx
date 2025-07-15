import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, Paragraph } from '../types';
import { bookService } from '../services/bookService';

const BookView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const bookData = await bookService.getBook(id);
        setBook(bookData);

        // Get paragraphs directly from the book data
        if (bookData.paragraphs) {
          setParagraphs(bookData.paragraphs);
        }
      } catch (err) {
        console.error('Error loading book:', err);
        setError('Failed to load book');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
          {error || 'Book not found'}
        </div>
      </div>
    );
  }

  const progress = book.progress?.[0];

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <div className='mb-6'>
        <button
          onClick={() => navigate('/')}
          className='text-primary-600 hover:text-primary-700 mb-4'
        >
          ← Back to Library
        </button>

        <div className='card'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            {book.title}
          </h1>
          <p className='text-xl text-gray-600 mb-4'>by {book.author}</p>

          {progress && (
            <div className='bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4'>
              <h3 className='font-medium text-primary-900 mb-2'>
                Continue Reading
              </h3>
              <p className='text-primary-700 text-sm mb-3'>
                Last read: Paragraph {progress.paragraph?.order}
              </p>
              <button
                onClick={() =>
                  navigate(`/read/${book.id}/${progress.paragraphId}`)
                }
                className='btn-primary'
              >
                Continue from where you left off
              </button>
            </div>
          )}

          <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
            <div>
              <span className='font-medium'>Paragraphs:</span>{' '}
              {paragraphs.length}
            </div>
            <div>
              <span className='font-medium'>Added:</span>{' '}
              {new Date(book.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className='card'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>Reading</h2>
        <div className='space-y-4'>
          <div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'>
            <div>
              <h3 className='font-medium text-gray-900'>Start Reading</h3>
              <p className='text-sm text-gray-600'>
                {paragraphs.length} paragraphs available
              </p>
              {paragraphs.length > 0 && (
                <p className='text-sm text-gray-500 mt-1'>
                  Preview: {paragraphs[0]?.content.substring(0, 100)}...
                </p>
              )}
            </div>
            <button
              onClick={() => navigate(`/read/${book.id}`)}
              className='btn-primary'
            >
              Start Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookView;
