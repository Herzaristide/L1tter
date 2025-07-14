import { useState, useEffect } from 'react';
import { Progress } from '../types';
import { progressService } from '../services/progressService';

export const useProgress = (bookId?: string) => {
  const [progress, setProgress] = useState<Progress | Progress[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const data = bookId
        ? await progressService.getBookProgress(bookId)
        : await progressService.getProgress();
      setProgress(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (
    bookId: string,
    chapterId: string,
    paragraphId: string,
    position: number
  ) => {
    try {
      const updatedProgress = await progressService.updateProgress(
        bookId,
        chapterId,
        paragraphId,
        position
      );
      setProgress(updatedProgress);
      return updatedProgress;
    } catch (err) {
      throw new Error('Failed to update progress');
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [bookId]);

  return {
    progress,
    loading,
    error,
    fetchProgress,
    updateProgress,
  };
};
