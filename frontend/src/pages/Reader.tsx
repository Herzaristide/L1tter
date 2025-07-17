import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isManualNavigation, setIsManualNavigation] = useState(false);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manualNavTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { updateProgress } = useProgress();

  // Calculate reading progress percentage
  const progressPercentage = paragraphs.length > 0
    ? Math.min(((currentParagraphIndex + 1) / paragraphs.length) * 100, 100)
    : 0;

  const getParagraphTextStyles = (index: number) => {
    const isActive = index === currentParagraphIndex;
    return `text-md leading-relaxed transition-all duration-300 ${isActive
      ? 'text-gray-900 dark:text-white font-regular'
      : 'text-gray-700 dark:text-gray-300'
      }`;
  };

  // Navigation state helpers
  const canGoPrevious = currentParagraphIndex > 0;
  const canGoNext = currentParagraphIndex < paragraphs.length - 1;

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

  // Scroll detection to highlight center paragraph
  useEffect(() => {
    const handleScroll = () => {
      if (paragraphs.length === 0 || isManualNavigation) return;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce scroll handling
      scrollTimeoutRef.current = setTimeout(() => {
        const viewportHeight = window.innerHeight;
        const headerHeight = 100;
        const centerY = viewportHeight / 2;

        let closestIndex = 0;
        let closestDistance = Infinity;

        paragraphRefs.current.forEach((ref, index) => {
          if (ref) {
            const rect = ref.getBoundingClientRect();
            const paragraphCenterY = rect.top + rect.height / 2;
            const distance = Math.abs(paragraphCenterY - centerY);

            // Check if paragraph is visible in viewport
            const isVisible = rect.top < viewportHeight - 50 && rect.bottom > headerHeight + 50;

            if (isVisible && distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          }
        });

        // Only update if the closest paragraph has changed
        if (closestIndex !== currentParagraphIndex && closestDistance < viewportHeight * 0.5) {
          setCurrentParagraphIndex(closestIndex);
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial call to set the correct paragraph on load
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [paragraphs.length, currentParagraphIndex, isManualNavigation]);

  useEffect(() => {
    // Update progress when current paragraph changes
    if (book && paragraphs.length > 0 && currentParagraphIndex >= 0) {
      const currentParagraph = paragraphs[currentParagraphIndex];
      if (currentParagraph) {
        updateProgress(book.id, currentParagraph.id, currentParagraphIndex + 1);
      }
    }
  }, [book, currentParagraphIndex, paragraphs, updateProgress]);

  const setManualNavigation = useCallback(() => {
    setIsManualNavigation(true);
    if (manualNavTimeoutRef.current) {
      clearTimeout(manualNavTimeoutRef.current);
    }
    manualNavTimeoutRef.current = setTimeout(() => {
      setIsManualNavigation(false);
    }, 1000);
  }, []);

  const handlePreviousParagraph = useCallback(() => {
    if (currentParagraphIndex > 0) {
      setManualNavigation();
      setCurrentParagraphIndex(currentParagraphIndex - 1);
    }
  }, [currentParagraphIndex, setManualNavigation]);

  const handleNextParagraph = useCallback(() => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      setManualNavigation();
      setCurrentParagraphIndex(currentParagraphIndex + 1);
    }
  }, [currentParagraphIndex, paragraphs.length, setManualNavigation]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        handlePreviousParagraph();
        break;
      case 'ArrowRight':
        handleNextParagraph();
        break;
      case 'Escape':
        navigate('/');
        break;
    }
  }, [navigate, handlePreviousParagraph, handleNextParagraph]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      // Cleanup timeouts
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (manualNavTimeoutRef.current) {
        clearTimeout(manualNavTimeoutRef.current);
      }
    };
  }, [handleKeyPress]);

  if (loading) {
    return (
      <div className='min-h-screen lg:ml-20 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4'>
        <div className='glass-card max-w-sm w-full p-8 text-center animate-pulse'>
          <div className='w-20 h-20 mx-auto mb-6 relative'>
            <div className='w-20 h-20 rounded-full border-4 border-primary-100 dark:border-primary-900'></div>
            <div className='w-20 h-20 rounded-full border-4 border-primary-500 border-t-transparent animate-spin absolute top-0'></div>
          </div>
          <h3 className='text-xl font-semibold mb-2 text-gray-900 dark:text-white'>Loading Book</h3>
          <p className='text-primary-600 dark:text-primary-400 font-medium'>Preparing your reading experience...</p>
          <div className='mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
            <div className='bg-primary-500 h-2 rounded-full animate-pulse' style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className='min-h-screen lg:ml-20 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4'>
        <div className='glass-card max-w-md w-full p-8 text-center border-l-4 border-red-500'>
          <div className='mb-6'>
            <div className='w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center'>
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className='text-2xl font-bold mb-3 text-gray-900 dark:text-white'>Oops! Something went wrong</h3>
          <p className='text-gray-600 dark:text-gray-300 mb-6 leading-relaxed'>
            {error || 'The book you\'re looking for could not be found. It may have been moved or deleted.'}
          </p>
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <button
              onClick={() => navigate('/')}
              className='btn-primary flex items-center justify-center space-x-2'
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>Return to Library</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className='btn-secondary flex items-center justify-center space-x-2'
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paragraphs.length === 0) {
    return (
      <div className='min-h-screen lg:ml-20 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4'>
        <div className='glass-card max-w-md w-full p-8 text-center border-l-4 border-yellow-500'>
          <div className='mb-6'>
            <div className='w-20 h-20 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center'>
              <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <h3 className='text-2xl font-bold mb-3 text-gray-900 dark:text-white'>Book is Empty</h3>
          <p className='text-gray-600 dark:text-gray-300 mb-6 leading-relaxed'>
            This book doesn't contain any readable content yet. The file might be corrupted or still processing.
          </p>
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <button
              onClick={() => navigate('/')}
              className='btn-primary flex items-center justify-center space-x-2'
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>Browse Library</span>
            </button>
            <button
              onClick={() => navigate('/upload')}
              className='btn-secondary flex items-center justify-center space-x-2'
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload New Book</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white dark:bg-black lg:ml-20 transition-all duration-300 pb-32'>

      {/* Reading Area */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 transition-all duration-500">
        <div ref={containerRef} className='glass-card min-h-[70vh] relative'>
          {/* Reading Progress Indicator */}
          <div className='absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-10'>
            <div
              className='h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className='flex flex-col space-y-6 p-6 overflow-y-auto'>
            {paragraphs.map((paragraph, index) => (
              <div
                key={paragraph.id}
                ref={(el) => (paragraphRefs.current[index] = el)}
                onClick={() => {
                  setManualNavigation();
                  setCurrentParagraphIndex(index);
                }}
              >
                <div className='flex items-start text-justify'>
                  <p className={getParagraphTextStyles(index)}>
                    {paragraph.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Navigation Controls */}
      <div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30'>
        <div className='glass-card px-6 py-3 flex items-center space-x-6 shadow-2xl border border-white/20'>
          <button
            onClick={handlePreviousParagraph}
            disabled={!canGoPrevious}
            className='flex items-center space-x-2 p-3 rounded-xl hover:bg-white/10 
              disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200
              text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 19l-7-7 7-7" />
            </svg>
            <span className='hidden sm:inline font-medium'>Previous</span>
          </button>

          <div className='flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg'>
            <span className='text-sm font-medium text-gray-900 dark:text-white'>
              {currentParagraphIndex + 1}
            </span>
            <span className='text-sm text-gray-500 dark:text-gray-400'>/</span>
            <span className='text-sm text-gray-600 dark:text-gray-400'>
              {paragraphs.length}
            </span>
          </div>

          <button
            onClick={handleNextParagraph}
            disabled={!canGoNext}
            className='flex items-center space-x-2 p-3 rounded-xl hover:bg-white/10 
              disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200
              text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          >
            <span className='hidden sm:inline font-medium'>Next</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className='fixed bottom-4 right-4 glass-card p-3 text-xs text-gray-600 dark:text-gray-400 
        opacity-60 hover:opacity-100 transition-opacity duration-200'>
        <div className='space-y-1'>
          <div>← → Navigate</div>
          <div>Scroll Auto-highlight</div>
          <div>ESC Return</div>
        </div>
      </div>
    </div>
  );
};

export default Reader;
