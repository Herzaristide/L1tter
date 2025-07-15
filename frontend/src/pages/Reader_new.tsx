import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, Paragraph } from '../types';
import { bookService } from '../services/bookService';
import { useProgress } from '../hooks/useProgress';

const Reader: React.FC = () => {
  const { bookId, paragraphId } = useParams<{
    bookId: string;
    paragraphId?: string;
  }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const { updateProgress } = useProgress();

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;

      try {
        setLoading(true);
        const bookData = await bookService.getBook(bookId);
        setBook(bookData);

        if (bookData.paragraphs) {
          setParagraphs(bookData.paragraphs);

          // Find the current paragraph index if paragraphId is provided
          if (paragraphId) {
            const index = bookData.paragraphs.findIndex(
              (p) => p.id === paragraphId
            );
            if (index !== -1) {
              setCurrentParagraphIndex(index);
            }
          }
        }
      } catch (err) {
        setError('Failed to load book');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, paragraphId]);

  useEffect(() => {
    // Scroll to current paragraph
    if (paragraphs.length > 0 && paragraphRefs.current[currentParagraphIndex]) {
      paragraphRefs.current[currentParagraphIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentParagraphIndex, paragraphs]);

  useEffect(() => {
    // Update progress when current paragraph changes
    if (book && paragraphs.length > 0 && currentParagraphIndex >= 0) {
      const currentParagraph = paragraphs[currentParagraphIndex];
      if (currentParagraph) {
        updateProgress(book.id, currentParagraph.id, currentParagraphIndex + 1);
      }
    }
  }, [book, currentParagraphIndex, paragraphs, updateProgress]);

  const handlePreviousParagraph = () => {
    if (currentParagraphIndex > 0) {
      setCurrentParagraphIndex(currentParagraphIndex - 1);
    }
  };

  const handleNextParagraph = () => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      setCurrentParagraphIndex(currentParagraphIndex + 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePreviousParagraph();
    } else if (e.key === 'ArrowRight') {
      handleNextParagraph();
    } else if (e.key === 'Escape') {
      navigate(`/book/${bookId}`);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentParagraphIndex, paragraphs.length, bookId, navigate]);

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

  if (paragraphs.length === 0) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <div className='bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded'>
          No paragraphs found in this book
        </div>
      </div>
    );
  }

  const currentParagraph = paragraphs[currentParagraphIndex];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b sticky top-0 z-10'>
        <div className='max-w-4xl mx-auto px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => navigate(`/book/${bookId}`)}
              className='text-gray-600 hover:text-gray-900'
            >
              ← Back to Book
            </button>
            <div>
              <h1 className='font-semibold text-gray-900'>{book.title}</h1>
              <p className='text-sm text-gray-600'>by {book.author}</p>
            </div>
          </div>
          <div className='text-sm text-gray-600'>
            Paragraph {currentParagraphIndex + 1} of {paragraphs.length}
          </div>
        </div>
      </div>

      {/* Reading Area */}
      <div className='max-w-3xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-lg shadow-sm p-8'>
          <div className='space-y-6'>
            {paragraphs.map((paragraph, index) => (
              <p
                key={paragraph.id}
                ref={(el) => (paragraphRefs.current[index] = el)}
                className={`text-lg leading-relaxed transition-all duration-300 ${
                  index === currentParagraphIndex
                    ? 'text-gray-900 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500'
                    : 'text-gray-600'
                }`}
                onClick={() => setCurrentParagraphIndex(index)}
                style={{ cursor: 'pointer' }}
              >
                {paragraph.content}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2'>
        <div className='bg-white rounded-full shadow-lg border px-4 py-2 flex items-center space-x-4'>
          <button
            onClick={handlePreviousParagraph}
            disabled={currentParagraphIndex === 0}
            className='p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            ← Previous
          </button>
          <span className='text-sm text-gray-600'>
            {currentParagraphIndex + 1} / {paragraphs.length}
          </span>
          <button
            onClick={handleNextParagraph}
            disabled={currentParagraphIndex === paragraphs.length - 1}
            className='p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Next →
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='fixed bottom-0 left-0 right-0 h-1 bg-gray-200'>
        <div
          className='h-full bg-blue-500 transition-all duration-300'
          style={{
            width: `${
              ((currentParagraphIndex + 1) / paragraphs.length) * 100
            }%`,
          }}
        />
      </div>
    </div>
  );
};

export default Reader;
