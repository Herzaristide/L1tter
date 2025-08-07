import React, { useState, useEffect } from 'react';
import {
  convertService,
  ConversionMode,
  Chapter,
} from '../services/convertService';

interface Paragraph {
  content: string;
  order: number;
  chapterNumber?: number;
  readingTimeEst?: number;
}

const CreateBook: React.FC = () => {
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [conversionMode, setConversionMode] =
    useState<ConversionMode>('paragraphs');

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

      // Convert chapters to paragraphs
      const extractedParagraphs: Paragraph[] = [];
      extractedChapters.forEach((chapter, chapterIndex) => {
        // Split chapter content into paragraphs
        const paragraphTexts = chapter.content
          .split(/\n\s*\n/)
          .filter((p) => p.trim().length > 0);

        paragraphTexts.forEach((paragraphText, paragraphIndex) => {
          extractedParagraphs.push({
            content: paragraphText.trim(),
            order: extractedParagraphs.length + 1,
            chapterNumber: chapterIndex + 1,
            readingTimeEst: Math.ceil(
              paragraphText.trim().split(' ').length / 3
            ), // ~3 words per second
          });
        });
      });

      setParagraphs(extractedParagraphs);
    } catch (error) {
      console.error('Error reading file:', error);
      setParagraphs([
        {
          content: `Error reading file: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          order: 1,
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

      // Convert chapters to paragraphs
      const extractedParagraphs: Paragraph[] = [];
      extractedChapters.forEach((chapter, chapterIndex) => {
        // Split chapter content into paragraphs
        const paragraphTexts = chapter.content
          .split(/\n\s*\n/)
          .filter((p) => p.trim().length > 0);

        paragraphTexts.forEach((paragraphText, paragraphIndex) => {
          extractedParagraphs.push({
            content: paragraphText.trim(),
            order: extractedParagraphs.length + 1,
            chapterNumber: chapterIndex + 1,
            readingTimeEst: Math.ceil(
              paragraphText.trim().split(' ').length / 3
            ), // ~3 words per second
          });
        });
      });

      setParagraphs(extractedParagraphs);
    } catch (error) {
      console.error('Error reading PDF from URL:', error);
      setParagraphs([
        {
          content: `Error reading PDF from URL: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          order: 1,
        },
      ]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission here
    console.log({ bookTitle, bookAuthor, paragraphs });
  };

  const updateParagraphContent = (index: number, content: string) => {
    const updatedParagraphs = [...paragraphs];
    updatedParagraphs[index].content = content;
    setParagraphs(updatedParagraphs);
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 80) + 'px';
  };

  // Adjust all textareas when paragraphs change
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea) => {
      if (textarea instanceof HTMLTextAreaElement) {
        adjustTextareaHeight(textarea);
      }
    });
  }, [paragraphs]);

  const updateParagraphChapter = (index: number, chapterNumber: number) => {
    const updatedParagraphs = [...paragraphs];
    updatedParagraphs[index].chapterNumber = chapterNumber;
    setParagraphs(updatedParagraphs);
  };

  const updateParagraphReadingTime = (index: number, readingTime: number) => {
    const updatedParagraphs = [...paragraphs];
    updatedParagraphs[index].readingTimeEst = readingTime;
    setParagraphs(updatedParagraphs);
  };

  const addNewParagraph = () => {
    const newParagraph: Paragraph = {
      content: '',
      order: paragraphs.length + 1,
      chapterNumber: 1,
      readingTimeEst: 0,
    };
    setParagraphs([...paragraphs, newParagraph]);
  };

  const removeParagraph = (index: number) => {
    const updatedParagraphs = paragraphs.filter((_, i) => i !== index);
    // Reorder remaining paragraphs
    updatedParagraphs.forEach((paragraph, i) => {
      paragraph.order = i + 1;
    });
    setParagraphs(updatedParagraphs);
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
                value='paragraphs'
                checked={conversionMode === 'paragraphs'}
                onChange={(e) =>
                  setConversionMode(e.target.value as ConversionMode)
                }
                className='mr-2'
              />
              <span className='text-sm'>Paragraphs (Advanced)</span>
            </label>
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
          ) : paragraphs.length > 0 ? (
            <div className='flex-1 flex flex-col gap-4 overflow-y-auto p-2'>
              <div className='flex items-center justify-between'>
                <label className='text-gray-700 dark:text-gray-200 font-medium'>
                  Book Paragraphs ({paragraphs.length} found)
                </label>
                <button
                  type='button'
                  onClick={addNewParagraph}
                  className='px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm'
                >
                  Add Paragraph
                </button>
              </div>
              {paragraphs.map((paragraph, index) => (
                <div key={index} className='relative flex mt-2 mr-2'>
                  {/* Delete button at top right */}

                  {/* Paragraph content textarea */}
                  <textarea
                    value={paragraph.content}
                    onChange={(e) => {
                      updateParagraphContent(index, e.target.value);
                      adjustTextareaHeight(e.target);
                    }}
                    onInput={(e) =>
                      adjustTextareaHeight(e.target as HTMLTextAreaElement)
                    }
                    ref={(el) => {
                      if (el) {
                        // Adjust height when element is first rendered
                        setTimeout(() => adjustTextareaHeight(el), 0);
                      }
                    }}
                    className='w-full px-6 py-3 border rounded-2xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none text-sm h-fit'
                    placeholder='Paragraph content...'
                  />
                  <button
                    type='button'
                    onClick={() => removeParagraph(index)}
                    className='absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center'
                    title='Delete paragraph'
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center text-gray-500 dark:text-gray-400'>
                <p className='text-lg mb-2'>No content loaded</p>
                <p className='text-sm'>
                  Upload a file or enter a PDF URL to extract paragraphs
                </p>
                <button
                  type='button'
                  onClick={addNewParagraph}
                  className='mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded'
                >
                  Add First Paragraph
                </button>
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
