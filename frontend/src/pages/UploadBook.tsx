import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../services/bookService';

interface BookAnalysis {
  fileName: string;
  fileSize: number;
  detectedTitle?: string;
  detectedAuthor?: string;
  hasChapters: boolean;
  chapterCount: number;
  chapters: Array<{
    title: string;
    contentLength: number;
    paragraphCount: number;
  }>;
  paragraphCounts: {
    standard: number;
    chapterBased: number;
  };
  contentPreview: string;
  recommendations: {
    useDetectedTitle: boolean;
    useDetectedAuthor: boolean;
    useChapterStructure: boolean;
  };
}

const UploadBook: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<BookAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const navigate = useNavigate();

  const analyzeFile = useCallback(async (selectedFile: File) => {
    try {
      setAnalyzing(true);
      setError('');

      const analysisData = await bookService.analyzeBookFile(selectedFile);
      setAnalysis(analysisData);

      // Auto-fill detected values
      if (analysisData.detectedTitle && !title) {
        setTitle(analysisData.detectedTitle);
      }
      if (analysisData.detectedAuthor && !author) {
        setAuthor(analysisData.detectedAuthor);
      }

    } catch (err: any) {
      let errorMessage = 'Failed to analyze PDF file. Please try again.';

      if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = `Analysis failed: ${err.message}`;
      }

      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [title, author]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !author) {
      setError('Please provide both title and author');
      return;
    }

    if (!file) {
      setError('Please select a PDF file to upload');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const book = await bookService.uploadBookFile(title, author, file);
      navigate(`/read/${book.id}`);
    } catch (err) {
      setError('Failed to upload book. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setAnalysis(null);
    analyzeFile(selectedFile);
  }, [analyzeFile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const resetUpload = () => {
    setFile(null);
    setAnalysis(null);
    setTitle('');
    setAuthor('');
    setError('');
  };

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
          Upload PDF Book
        </h1>
        <p className='text-gray-600 dark:text-gray-400'>
          Upload PDF files and let our smart system automatically detect the title, author, and chapter structure.
        </p>
      </div>

      {!file ? (
        // File Upload Section
        <div className='space-y-6'>
          {error && (
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg'>
              {error}
            </div>
          )}

          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload PDF file"
              title="Upload PDF file"
            />

            <div className='space-y-4'>
              <div className='w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center'>
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  {dragActive ? 'Drop your PDF file here' : 'Upload your PDF book'}
                </h3>
                <p className='text-gray-600 dark:text-gray-400 mb-4'>
                  Drag and drop your PDF file here, or click to browse
                </p>
                <button
                  type="button"
                  className='btn-primary inline-flex items-center space-x-2'
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Choose PDF File</span>
                </button>
              </div>

              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Maximum file size: 10MB • PDF files only
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Analysis and Edit Section
        <div className='space-y-6'>
          {error && (
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg'>
              {error}
            </div>
          )}

          {/* File Info */}
          <div className='glass-card p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                📄 {file.name}
              </h2>
              <button
                onClick={resetUpload}
                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                title="Remove file and start over"
                aria-label="Remove file and start over"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className='text-sm text-gray-600 dark:text-gray-400 space-y-1'>
              <p>Size: {(file.size / 1024).toFixed(1)} KB</p>
              {analyzing && (
                <p className='text-primary-600 dark:text-primary-400 flex items-center space-x-2'>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Analyzing PDF structure...</span>
                </p>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className='glass-card p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                🔍 Detection Results
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                <div className='space-y-4'>
                  <div>
                    <h4 className='font-medium text-gray-900 dark:text-white mb-2'>Structure Analysis</h4>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>Chapters detected:</span>
                        <span className='font-medium'>{analysis.hasChapters ? `${analysis.chapterCount} chapters` : 'No chapters'}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>Total paragraphs:</span>
                        <span className='font-medium'>{analysis.paragraphCounts.standard}</span>
                      </div>
                      {analysis.hasChapters && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600 dark:text-gray-400'>Chapter-based paragraphs:</span>
                          <span className='font-medium'>{analysis.paragraphCounts.chapterBased}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {analysis.chapters.length > 0 && (
                    <div>
                      <h4 className='font-medium text-gray-900 dark:text-white mb-2'>Detected Chapters</h4>
                      <div className='max-h-32 overflow-y-auto space-y-1'>
                        {analysis.chapters.slice(0, 5).map((chapter, index) => (
                          <div key={index} className='text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded'>
                            <div className='font-medium text-gray-900 dark:text-white'>{chapter.title}</div>
                            <div className='text-gray-600 dark:text-gray-400'>
                              {chapter.paragraphCount} paragraphs • {(chapter.contentLength / 1000).toFixed(1)}k chars
                            </div>
                          </div>
                        ))}
                        {analysis.chapters.length > 5 && (
                          <div className='text-sm text-gray-500 dark:text-gray-400 text-center'>
                            +{analysis.chapters.length - 5} more chapters
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className='font-medium text-gray-900 dark:text-white mb-2'>Content Preview</h4>
                  <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto'>
                    <pre className='whitespace-pre-wrap font-mono text-xs leading-relaxed'>
                      {analysis.contentPreview}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Book Metadata Form */}
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='glass-card p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                ✏️ Book Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label htmlFor='title' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Book Title {analysis?.detectedTitle && <span className='text-green-600 dark:text-green-400'>(auto-detected)</span>}
                  </label>
                  <input
                    id='title'
                    type='text'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='input-field'
                    placeholder={analysis?.detectedTitle || 'Enter book title'}
                    required
                  />
                  {analysis?.detectedTitle && (
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      Detected: "{analysis.detectedTitle}"
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor='author' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Author {analysis?.detectedAuthor && <span className='text-green-600 dark:text-green-400'>(auto-detected)</span>}
                  </label>
                  <input
                    id='author'
                    type='text'
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className='input-field'
                    placeholder={analysis?.detectedAuthor || 'Enter author name'}
                    required
                  />
                  {analysis?.detectedAuthor && (
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                      Detected: "{analysis.detectedAuthor}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex justify-between'>
              <button
                type='button'
                onClick={() => navigate('/')}
                className='btn-secondary'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading || analyzing || !title || !author}
                className='btn-primary flex items-center space-x-2'
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                    </svg>
                    <span>Upload Book</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UploadBook;
