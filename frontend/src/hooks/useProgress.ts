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
    paragraphId: string,
    position: number
  ) => {
    try {
      const updatedProgress = await progressService.updateProgress(
        bookId,
        paragraphId,
        position
      );
      setProgress(updatedProgress);
      setError(null);
      return updatedProgress;
    } catch (err) {
      setError('Failed to update progress');
      throw new Error('Failed to update progress');
    }
  };

  const deleteProgress = async (bookId: string) => {
    try {
      await progressService.deleteProgress(bookId);
      setProgress(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete progress');
      throw new Error('Failed to delete progress');
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
    deleteProgress,
  };
};
