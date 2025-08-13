import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import ParagraphItem from '../components/ParagraphItem';
import { convertService, Chapter } from '../services/convertService';
import { bookService } from '../services/bookService';

interface Paragraph {
  id: string;
  content: string;
  order: number;
  chapterNumber?: number;
  readingTimeEst?: number;
  selected: boolean;
}

// ...existing code...

const CreateBook: React.FC = () => {
  console.log(`🏠 CreateBook component rendering`);

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

  // Use refs to create stable callback references that never change
  const callbacksRef = useRef({
    updateContent: (id: string, content: string) => {},
    toggleSelect: (id: string) => {},
  });

  // Update the refs when the component state changes
  callbacksRef.current.updateContent = useCallback(
    (id: string, content: string) => {
      console.log(`📝 Content change for ID: ${id.slice(-8)}`);
      setParagraphs((prevParagraphs) => {
        const newParagraphs = [...prevParagraphs];
        const index = newParagraphs.findIndex((p) => p.id === id);
        if (index !== -1) {
          newParagraphs[index] = { ...newParagraphs[index], content };
        }
        return newParagraphs;
      });
    },
    []
  );

  callbacksRef.current.toggleSelect = useCallback((id: string) => {
    console.log(`🎯 Toggle called for ID: ${id.slice(-8)}`);
    const startTime = performance.now();

    setParagraphs((prevParagraphs) => {
      console.log(`📊 Total paragraphs in array: ${prevParagraphs.length}`);

      const newParagraphs = [...prevParagraphs];
      const index = newParagraphs.findIndex((p) => p.id === id);

      console.log(`🔍 Found paragraph at index: ${index}`);

      if (index !== -1) {
        const oldSelected = newParagraphs[index].selected;
        newParagraphs[index] = {
          ...newParagraphs[index],
          selected: !newParagraphs[index].selected,
        };
        console.log(
          `✅ Updated paragraph ${id.slice(
            -8
          )}: ${oldSelected} → ${!oldSelected}`
        );
      }

      const endTime = performance.now();
      console.log(
        `⏱️ Toggle operation took: ${(endTime - startTime).toFixed(2)}ms`
      );

      return newParagraphs;
    });
  }, []);

  // Pagination for large books to prevent performance issues
  const [currentPage, setCurrentPage] = useState(0);
  const PARAGRAPHS_PER_PAGE = 50; // Limit to 50 paragraphs per page

  const totalPages = Math.ceil(paragraphs.length / PARAGRAPHS_PER_PAGE);
  const startIndex = currentPage * PARAGRAPHS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + PARAGRAPHS_PER_PAGE,
    paragraphs.length
  );
  const visibleParagraphs = paragraphs.slice(startIndex, endIndex);

  console.log(
    `📄 Rendering page ${currentPage + 1}/${totalPages}, showing paragraphs ${
      startIndex + 1
    }-${endIndex} of ${paragraphs.length}`
  );

  // Memoized calculations to prevent expensive re-computations
  const selectedParagraphsCount = useMemo(() => {
    console.log(
      `🧮 Calculating selectedParagraphsCount for ${paragraphs.length} paragraphs`
    );
    const count = paragraphs.filter((p) => p.selected).length;
    console.log(`📊 Selected paragraphs count: ${count}`);
    return count;
  }, [paragraphs]);

  const selectedParagraphs = useMemo(() => {
    console.log(`🧮 Calculating selectedParagraphs array`);
    return paragraphs.filter((p) => p.selected);
  }, [paragraphs]);

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
          const timestamp = Date.now() + paragraphIndex; // Add index to ensure uniqueness
          extractedParagraphs.push({
            id: `file-paragraph-${timestamp}-${chapterIndex}-${paragraphIndex}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            content: paragraphText.trim(),
            order: timestamp, // Use timestamp instead of sequential numbering
            chapterNumber: chapterIndex + 1,
            readingTimeEst: Math.ceil(
              paragraphText.trim().split(' ').length / 3
            ), // ~3 words per second
            selected: true, // All paragraphs selected by default
          });
        });
      });

      setParagraphs(extractedParagraphs);
    } catch (error) {
      console.error('Error reading file:', error);
      setParagraphs([
        {
          id: `error-paragraph-${Date.now()}`,
          content: `Error reading file: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          order: 1,
          selected: true,
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
          const timestamp = Date.now() + paragraphIndex; // Add index to ensure uniqueness
          extractedParagraphs.push({
            id: `url-paragraph-${timestamp}-${chapterIndex}-${paragraphIndex}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            content: paragraphText.trim(),
            order: timestamp, // Use timestamp instead of sequential numbering
            chapterNumber: chapterIndex + 1,
            readingTimeEst: Math.ceil(
              paragraphText.trim().split(' ').length / 3
            ), // ~3 words per second
            selected: true, // All paragraphs selected by default
          });
        });
      });

      setParagraphs(extractedParagraphs);
    } catch (error) {
      console.error('Error reading PDF from URL:', error);
      setParagraphs([
        {
          id: `url-error-paragraph-${Date.now()}`,
          content: `Error reading PDF from URL: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          order: 1,
          selected: true,
        },
      ]);
    } finally {
      setIsExtracting(false);
    }
  };

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 80) + 'px';
  }, []);

  // Adjust all textareas when paragraphs change
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach((textarea) => {
      if (textarea instanceof HTMLTextAreaElement) {
        adjustTextareaHeight(textarea);
      }
    });
  }, [visibleParagraphs]); // Only adjust when visible paragraphs change

  const addNewParagraph = useCallback(() => {
    const newParagraph: Paragraph = {
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
      order: Date.now(), // Use timestamp for order to avoid conflicts
      chapterNumber: 1,
      readingTimeEst: 0,
      selected: true, // New paragraphs are selected by default
    };
    setParagraphs((prev) => [...prev, newParagraph]);
  }, []);

  // Save book as draft handler
  const handleSave = async () => {
    if (!bookTitle.trim()) {
      alert('Please enter a book title');
      return;
    }

    if (selectedParagraphsCount === 0) {
      alert('Please select at least one paragraph to save');
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

      // Create only selected paragraphs for the book
      if (selectedParagraphs.length > 0) {
        for (let i = 0; i < selectedParagraphs.length; i++) {
          const paragraph = selectedParagraphs[i];
          await bookService.createParagraph(createdBook.id, {
            content: paragraph.content,
            order: i + 1, // Assign sequential order only when saving
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
            disabled={
              isSaving || !bookTitle.trim() || selectedParagraphsCount === 0
            }
            className='px-8 py-3 bg-black dark:bg-white text-white dark:text-black 
              disabled:bg-gray-300 disabled:cursor-not-allowed
              hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200
              font-light tracking-wider text-sm uppercase border border-black dark:border-white'
          >
            {isSaving
              ? 'Saving...'
              : `Save Draft ${
                  selectedParagraphsCount > 0
                    ? `(${selectedParagraphsCount} paragraphs)`
                    : ''
                }`}
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
              <div className='flex-1 flex flex-col gap-4 overflow-y-auto p-2 pl-10'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col'>
                    <label className='text-gray-700 dark:text-gray-200 font-medium'>
                      Book Paragraphs ({paragraphs.length} found,{' '}
                      {selectedParagraphsCount} selected)
                    </label>
                    <div className='flex items-center gap-4 mt-2'>
                      <button
                        type='button'
                        onClick={() => {
                          setParagraphs((prev) =>
                            prev.map((p) => ({ ...p, selected: true }))
                          );
                        }}
                        className='text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        Select All
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setParagraphs((prev) =>
                            prev.map((p) => ({ ...p, selected: false }))
                          );
                        }}
                        className='text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                      >
                        Unselect All
                      </button>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={addNewParagraph}
                    className='px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm'
                  >
                    Add Paragraph
                  </button>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className='flex items-center justify-between mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg'>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                      Page {currentPage + 1} of {totalPages} (showing{' '}
                      {visibleParagraphs.length} paragraphs)
                    </span>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => setCurrentPage(0)}
                        disabled={currentPage === 0}
                        className='px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50'
                      >
                        First
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className='px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50'
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className='px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50'
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages - 1)}
                        disabled={currentPage === totalPages - 1}
                        className='px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50'
                      >
                        Last
                      </button>
                    </div>
                  </div>
                )}

                {visibleParagraphs.map((paragraph) => (
                  <ParagraphItem
                    key={paragraph.id}
                    paragraph={paragraph}
                    onContentChange={callbacksRef.current.updateContent}
                    onToggleSelect={callbacksRef.current.toggleSelect}
                  />
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

          {/* Save Summary */}
          {paragraphs.length > 0 && (
            <div className='mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg'>
              <div className='flex items-center justify-between text-sm text-gray-600 dark:text-gray-400'>
                <span>
                  Ready to save:{' '}
                  <strong className='text-black dark:text-white'>
                    {selectedParagraphsCount}
                  </strong>{' '}
                  of <strong>{paragraphs.length}</strong> paragraphs
                </span>
                {selectedParagraphsCount === 0 && (
                  <span className='text-red-500 dark:text-red-400'>
                    Select at least one paragraph to save
                  </span>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateBook;
