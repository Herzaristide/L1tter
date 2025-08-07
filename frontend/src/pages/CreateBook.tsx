import React, { useState, useEffect } from 'react';
import { convertService, Chapter } from '../services/convertService';
import { bookService } from '../services/bookService';

interface Paragraph {
  content: string;
  order: number;
  chapterNumber?: number;
  readingTimeEst?: number;
}

const CreateBook: React.FC = () => {
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('en');
  const [imageUrl, setImageUrl] = useState('');
  const [edition, setEdition] = useState('');
  const [editionPublished, setEditionPublished] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('');
  const [originalPublished, setOriginalPublished] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

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
        extractedChapters = await convertService.convertPdfToText(file);
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
      const extractedChapters = await convertService.convertPdfFromUrl(pdfUrl);

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

  // Save book as draft handler
  const handleSave = async () => {
    if (!bookTitle.trim()) {
      alert('Please enter a book title');
      return;
    }

    setIsSaving(true);
    try {
      // Create the book
      const bookData = {
        title: bookTitle,
        description: description || undefined,
        language: language || 'en',
        imageUrl: imageUrl || undefined,
        edition: edition || undefined,
        editionPublished: editionPublished
          ? parseInt(editionPublished)
          : undefined,
        originalLanguage: originalLanguage || language,
        originalPublished: originalPublished
          ? parseInt(originalPublished)
          : undefined,
        isPublic: isPublic,
        isDraft: true, // Always save as draft from this page
        authorIds: [], // We'll need to handle authors separately
        tagIds: [], // We'll need to handle tags separately
      };

      const createdBook = await bookService.createBook(bookData);

      // Create all paragraphs for the book
      if (paragraphs.length > 0) {
        for (const paragraph of paragraphs) {
          await bookService.createParagraph(createdBook.id, {
            content: paragraph.content,
            order: paragraph.order,
            chapterNumber: paragraph.chapterNumber,
            readingTimeEst: paragraph.readingTimeEst,
          });
        }
      }

      alert(`Book "${bookTitle}" saved successfully as draft!`);

      // Optional: Clear form or redirect
      // You might want to redirect to the book edit page or dashboard
      console.log('Book created:', createdBook);
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Failed to save book. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='min-h-screen bg-white dark:bg-black lg:ml-72 transition-all duration-300'>
      <div className='max-w-4xl mx-auto px-8 py-12'>
        {/* Header */}
        <div className='flex items-center justify-between mb-16 border-b border-gray-100 dark:border-gray-800 pb-8'>
          <div>
            <h1 className='text-3xl font-light text-black dark:text-white tracking-wider uppercase'>
              Create Book
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-2 font-light tracking-wide'>
              Add a new book to your library
            </p>
          </div>
          <button
            type='button'
            onClick={handleSave}
            disabled={isSaving || !bookTitle.trim()}
            className='px-8 py-3 bg-black dark:bg-white text-white dark:text-black 
              disabled:bg-gray-300 disabled:cursor-not-allowed
              hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200
              font-light tracking-wider text-sm uppercase border border-black dark:border-white'
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
        <form className='space-y-12'>
          {/* File Upload Section */}
          <div className='space-y-6'>
            <h2 className='text-lg font-light text-black dark:text-white tracking-wider uppercase'>
              Content Source
            </h2>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border border-gray-200 dark:border-gray-800'>
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Upload File
                </label>
                <input
                  type='file'
                  accept='.pdf,.txt'
                  onChange={handleFileUpload}
                  className='w-full p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm'
                />
              </div>
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Or PDF URL
                </label>
                <div className='flex'>
                  <input
                    type='url'
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className='flex-1 p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                      text-black dark:text-white font-light text-sm'
                    placeholder='https://example.com/document.pdf'
                    disabled={isExtracting}
                  />
                  <button
                    type='button'
                    onClick={handleUrlSubmit}
                    disabled={!pdfUrl.trim() || isExtracting}
                    className='px-6 py-3 bg-black dark:bg-white text-white dark:text-black 
                      disabled:bg-gray-300 disabled:cursor-not-allowed
                      hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200
                      font-light tracking-wide text-sm uppercase border border-black dark:border-white'
                  >
                    Load
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className='space-y-6'>
            <h2 className='text-lg font-light text-black dark:text-white tracking-wider uppercase'>
              Basic Information
            </h2>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Title *
                </label>
                <input
                  type='text'
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                  placeholder='Enter book title'
                  required
                />
              </div>

              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                >
                  <option value='en'>English</option>
                  <option value='fr'>French</option>
                  <option value='es'>Spanish</option>
                  <option value='de'>German</option>
                  <option value='it'>Italian</option>
                  <option value='pt'>Portuguese</option>
                  <option value='ru'>Russian</option>
                  <option value='zh'>Chinese</option>
                  <option value='ja'>Japanese</option>
                  <option value='ko'>Korean</option>
                </select>
              </div>
            </div>

            <div className='space-y-3'>
              <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                  text-black dark:text-white font-light text-sm h-24 resize-none focus:outline-none focus:border-black dark:focus:border-white'
                placeholder='Book description (optional)'
              />
            </div>
          </div>

          {/* Toggle button for optional fields */}
          <div className='border-t border-gray-100 dark:border-gray-800 pt-8'>
            <button
              type='button'
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className='flex items-center gap-3 text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400 
              transition-colors font-light tracking-wide text-sm uppercase'
            >
              <span
                className={`transform transition-transform text-xs ${
                  showOptionalFields ? 'rotate-90' : ''
                }`}
              >
                →
              </span>
              {showOptionalFields ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Collapsible optional fields */}
          {showOptionalFields && (
            <>
              {/* Removed duplicate Description field */}

              <div className='flex w-full gap-4'>
                <div className='flex-1'>
                  <label className='block text-gray-700 dark:text-gray-200 mb-2'>
                    Cover Image URL
                  </label>
                  <input
                    type='url'
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    placeholder='https://example.com/cover.jpg (optional)'
                  />
                </div>

                <div className='flex-1'>
                  <label className='block text-gray-700 dark:text-gray-200 mb-2'>
                    Edition
                  </label>
                  <input
                    type='text'
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    placeholder='1st, 2nd, Revised, etc. (optional)'
                  />
                </div>
              </div>

              <div className='flex w-full gap-4'>
                <div className='flex-1'>
                  <label className='block text-gray-700 dark:text-gray-200 mb-2'>
                    Edition Published Year
                  </label>
                  <input
                    type='number'
                    value={editionPublished}
                    onChange={(e) => setEditionPublished(e.target.value)}
                    className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    placeholder='2024 (optional)'
                    min='1000'
                    max='9999'
                  />
                </div>

                <div className='flex-1'>
                  <label className='block text-gray-700 dark:text-gray-200 mb-2'>
                    Original Language
                  </label>
                  <select
                    value={originalLanguage}
                    onChange={(e) => setOriginalLanguage(e.target.value)}
                    className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  >
                    <option value=''>Same as current language</option>
                    <option value='en'>English</option>
                    <option value='fr'>French</option>
                    <option value='es'>Spanish</option>
                    <option value='de'>German</option>
                    <option value='it'>Italian</option>
                    <option value='pt'>Portuguese</option>
                    <option value='ru'>Russian</option>
                    <option value='zh'>Chinese</option>
                    <option value='ja'>Japanese</option>
                    <option value='ko'>Korean</option>
                  </select>
                </div>

                <div className='flex-1'>
                  <label className='block text-gray-700 dark:text-gray-200 mb-2'>
                    Original Published Year
                  </label>
                  <input
                    type='number'
                    value={originalPublished}
                    onChange={(e) => setOriginalPublished(e.target.value)}
                    className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    placeholder='1925 (optional)'
                    min='1000'
                    max='9999'
                  />
                </div>
              </div>

              <div className='flex w-full gap-4'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='isPublic'
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className='mr-2'
                  />
                  <label
                    htmlFor='isPublic'
                    className='text-gray-700 dark:text-gray-200'
                  >
                    Make this book public (others can view it)
                  </label>
                </div>
              </div>
            </>
          )}

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
                    <button
                      type='button'
                      onClick={() => removeParagraph(index)}
                      className='absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center'
                      title='Delete paragraph'
                    >
                      ×
                    </button>
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
                      className='w-full px-6 py-3 border rounded-2xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none text-sm overflow-hidden'
                      placeholder='Paragraph content...'
                      style={{ height: 'auto' }}
                    />
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
        </form>
      </div>
    </div>
  );
};

export default CreateBook;
