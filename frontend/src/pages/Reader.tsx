import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chapter, Paragraph } from '../types';
import { chapterService, paragraphService } from '../services/contentService';
import { useProgress } from '../hooks/useProgress';

const Reader: React.FC = () => {
  const { chapterId, paragraphId } = useParams<{
    chapterId: string;
    paragraphId?: string;
  }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const { updateProgress } = useProgress();

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) return;

      try {
        setLoading(true);
        const chapterData = await chapterService.getChapter(chapterId);
        setChapter(chapterData);

        if (chapterData.paragraphs) {
          setParagraphs(chapterData.paragraphs);

          // Find starting paragraph if specified
          if (paragraphId) {
            const index = chapterData.paragraphs.findIndex(
              (p) => p.id === paragraphId
            );
            if (index >= 0) {
              setCurrentParagraphIndex(index);
            }
          }
        }
      } catch (err) {
        setError('Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [chapterId, paragraphId]);

  useEffect(() => {
    // Scroll to current paragraph
    if (paragraphs.length > 0 && paragraphRefs.current[currentParagraphIndex]) {
      paragraphRefs.current[currentParagraphIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentParagraphIndex, paragraphs]);

  const updateReadingProgress = async (paragraphIndex: number) => {
    if (!chapter || !paragraphs[paragraphIndex]) return;

    try {
      await updateProgress(
        chapter.bookId,
        chapter.id,
        paragraphs[paragraphIndex].id,
        paragraphIndex + 1
      );
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handlePreviousParagraph = () => {
    if (currentParagraphIndex > 0) {
      const newIndex = currentParagraphIndex - 1;
      setCurrentParagraphIndex(newIndex);
      updateReadingProgress(newIndex);
    }
  };

  const handleNextParagraph = () => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      const newIndex = currentParagraphIndex + 1;
      setCurrentParagraphIndex(newIndex);
      updateReadingProgress(newIndex);
    }
  };

  const handleParagraphClick = (index: number) => {
    setCurrentParagraphIndex(index);
    updateReadingProgress(index);
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
          {error || 'Chapter not found'}
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <div className='sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10'>
        <div className='max-w-4xl mx-auto flex justify-between items-center'>
          <button
            onClick={() => navigate(`/book/${chapter.bookId}`)}
            className='text-primary-600 hover:text-primary-700'
          >
            ← Back to Book
          </button>

          <div className='text-center'>
            <h1 className='text-lg font-semibold text-gray-900'>
              {chapter.title}
            </h1>
            <p className='text-sm text-gray-600'>
              {chapter.book?.title} by {chapter.book?.author}
            </p>
          </div>

          <div className='text-sm text-gray-600'>
            {currentParagraphIndex + 1} / {paragraphs.length}
          </div>
        </div>
      </div>

      {/* Reading Area */}
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <div className='prose prose-lg max-w-none'>
          {paragraphs.map((paragraph, index) => (
            <p
              key={paragraph.id}
              ref={(el) => (paragraphRefs.current[index] = el)}
              onClick={() => handleParagraphClick(index)}
              className={`cursor-pointer transition-all duration-200 ${
                index === currentParagraphIndex
                  ? 'bg-primary-50 border-l-4 border-primary-500 pl-4 py-2'
                  : 'hover:bg-gray-50 py-2'
              }`}
            >
              {paragraph.content}
            </p>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4'>
        <div className='max-w-4xl mx-auto flex justify-between items-center'>
          <button
            onClick={handlePreviousParagraph}
            disabled={currentParagraphIndex === 0}
            className='btn-secondary disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Previous
          </button>

          <div className='flex space-x-2'>
            <span className='text-sm text-gray-600'>
              Progress:{' '}
              {Math.round(
                ((currentParagraphIndex + 1) / paragraphs.length) * 100
              )}
              %
            </span>
          </div>

          <button
            onClick={handleNextParagraph}
            disabled={currentParagraphIndex === paragraphs.length - 1}
            className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reader;
