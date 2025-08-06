import React, { useState } from 'react';
import {
  convertService,
  ConversionMode,
  Chapter,
} from '../services/convertService';

const CreateBook: React.FC = () => {
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [conversionMode, setConversionMode] =
    useState<ConversionMode>('structure');

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      let extractedChapters: Chapter[];

      if (
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
      ) {
        // Use backend API for PDF conversion with selected mode
        extractedChapters = await convertService.convertPdfToText(
          file,
          conversionMode
        );
      } else {
        // For text files, read directly and treat as one chapter
        const text = await file.text();
        extractedChapters = [{ title: 'Content', content: text }];
      }

      setChapters(extractedChapters);
    } catch (error) {
      console.error('Error reading file:', error);
      setChapters([
        {
          title: 'Error',
          content: `Error reading file: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!pdfUrl.trim()) return;

    setIsExtracting(true);
    try {
      const extractedChapters = await convertService.convertPdfFromUrl(
        pdfUrl,
        conversionMode
      );
      setChapters(extractedChapters);
    } catch (error) {
      console.error('Error reading PDF from URL:', error);
      setChapters([
        {
          title: 'Error',
          content: `Error reading PDF from URL: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission here
    console.log({ bookTitle, bookAuthor, chapters });
  };

  const updateChapterContent = (index: number, content: string) => {
    const updatedChapters = [...chapters];
    updatedChapters[index].content = content;
    setChapters(updatedChapters);
  };

  const updateChapterTitle = (index: number, title: string) => {
    const updatedChapters = [...chapters];
    updatedChapters[index].title = title;
    setChapters(updatedChapters);
  };

  return (
    <div className='w-full h-full flex flex-col p-6'>
      <h1 className='text-2xl font-bold mb-6'>Create a New Book</h1>

      <form
        onSubmit={handleSubmit}
        className='w-full h-full flex flex-col gap-4'
      >
        {/* Top row with file upload and book details */}
        <div className='flex gap-4 items-end'>
          {/* File upload */}
          <div className='flex-1'>
            <label className='block text-gray-700 dark:text-gray-200 mb-2'>
              Upload File (.pdf or .txt)
            </label>
            <input
              type='file'
              accept='.pdf,.txt'
              onChange={handleFileUpload}
              className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
            />
          </div>

          {/* Book title */}
          <div className='flex-1'>
            <label className='block text-gray-700 dark:text-gray-200 mb-2'>
              Book Title
            </label>
            <input
              type='text'
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              placeholder='Enter book title'
            />
          </div>

          {/* Book author */}
          <div className='flex-1'>
            <label className='block text-gray-700 dark:text-gray-200 mb-2'>
              Author
            </label>
            <input
              type='text'
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              placeholder='Enter author name'
            />
          </div>
        </div>

        {/* URL input row */}
        <div className='flex gap-2 items-end'>
          <div className='flex-1'>
            <label className='block text-gray-700 dark:text-gray-200 mb-2'>
              Or load PDF from URL
            </label>
            <input
              type='url'
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              placeholder='https://example.com/document.pdf'
              disabled={isExtracting}
            />
          </div>
          <button
            type='button'
            onClick={handleUrlSubmit}
            disabled={!pdfUrl.trim() || isExtracting}
            className='px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Load PDF
          </button>
        </div>

        {/* PDF Processing Mode Selector */}
        <div className='flex gap-4 items-center'>
          <label className='text-gray-700 dark:text-gray-200 font-medium'>
            PDF Processing Mode:
          </label>
          <div className='flex gap-4'>
            <label className='flex items-center'>
              <input
                type='radio'
                value='structure'
                checked={conversionMode === 'structure'}
                onChange={(e) =>
                  setConversionMode(e.target.value as ConversionMode)
                }
                className='mr-2'
              />
              <span className='text-sm'>Structure (Font & Position)</span>
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                value='smart'
                checked={conversionMode === 'smart'}
                onChange={(e) =>
                  setConversionMode(e.target.value as ConversionMode)
                }
                className='mr-2'
              />
              <span className='text-sm'>Smart (Pattern Detection)</span>
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                value='page-structure'
                checked={conversionMode === 'page-structure'}
                onChange={(e) =>
                  setConversionMode(e.target.value as ConversionMode)
                }
                className='mr-2'
              />
              <span className='text-sm'>Page Structure</span>
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                value='raw'
                checked={conversionMode === 'raw'}
                onChange={(e) =>
                  setConversionMode(e.target.value as ConversionMode)
                }
                className='mr-2'
              />
              <span className='text-sm'>Raw Text</span>
            </label>
          </div>
        </div>

        {/* Large textarea for content */}
        <div className='flex-1 flex flex-col'>
          {isExtracting ? (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-lg text-gray-600 dark:text-gray-300'>
                Extracting text from file...
              </div>
            </div>
          ) : chapters.length > 0 ? (
            <div className='flex-1 flex flex-col gap-4 overflow-y-auto'>
              <label className='text-gray-700 dark:text-gray-200 font-medium'>
                Book Chapters ({chapters.length} found)
              </label>
              {chapters.map((chapter, index) => (
                <div
                  key={index}
                  className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800'
                >
                  {/* Chapter title input */}
                  <div className='mb-3'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1'>
                      Chapter {index + 1} Title
                    </label>
                    <input
                      type='text'
                      value={chapter.title}
                      onChange={(e) =>
                        updateChapterTitle(index, e.target.value)
                      }
                      className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm font-medium'
                      placeholder={`Chapter ${index + 1} title`}
                    />
                  </div>
                  {/* Chapter content textarea */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1'>
                      Content
                    </label>
                    <textarea
                      value={chapter.content}
                      onChange={(e) =>
                        updateChapterContent(index, e.target.value)
                      }
                      className='w-full h-64 px-3 py-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none text-sm'
                      placeholder='Chapter content...'
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center text-gray-500 dark:text-gray-400'>
                <p className='text-lg mb-2'>No content loaded</p>
                <p className='text-sm'>
                  Upload a file or enter a PDF URL to extract chapters
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
        <div className='flex justify-end'>
          <button
            type='submit'
            className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded'
          >
            Create Book
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBook;
