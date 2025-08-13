import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { notesService } from '../services/notesService';
import { progressService } from '../services/progressService';
import ContextMenu from '../components/ContextMenu';
import NotePopup from '../components/NotePopup';

const Reading: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<any | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProgress, setCurrentProgress] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
    paragraphId?: string;
    startIndex?: number;
    endIndex?: number;
  } | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [notePopupPosition, setNotePopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isOriginalHeaderVisible, setIsOriginalHeaderVisible] = useState(true);
  const [isFloatingHeaderOpen, setIsFloatingHeaderOpen] = useState(false);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBookAndNotes = async () => {
      if (!bookId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch book data first - this is critical
        const bookData = await bookService.getBook(bookId);
        setBook(bookData);

        // Fetch notes and progress separately - these are optional
        try {
          const notesData = await notesService.getNotes({ bookId });
          setNotes(notesData.notes || notesData || []);
        } catch (notesError) {
          console.warn('Failed to load notes:', notesError);
          setNotes([]);
        }

        try {
          const progressData = await progressService.getBookProgress(bookId);
          setCurrentProgress(progressData);
        } catch (progressError) {
          console.warn('Failed to load progress:', progressError);
          setCurrentProgress(null);
        }
      } catch (bookError) {
        console.error('Failed to load book:', bookError);
        setBook(null);
        setNotes([]);
        setCurrentProgress(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBookAndNotes();
  }, [bookId]);

  // Update progress when user reads
  const updateProgress = useCallback(
    async (paragraphId: string, position: number) => {
      if (!bookId) return;

      try {
        const progressData = await progressService.updateProgress(
          paragraphId,
          position
        );
        setCurrentProgress(progressData);
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    },
    [bookId]
  );

  // Progress tracking on scroll
  const updateProgressOnScroll = useCallback(() => {
    if (!book?.paragraphs?.length) return;

    const paragraphElements = document.querySelectorAll('[data-paragraph-id]');
    if (!paragraphElements.length) return;

    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;

    let currentParagraph: Element | null = null;
    let bestScore = -1;

    paragraphElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, viewportHeight);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = visibleHeight / rect.height;

      if (visibilityRatio > 0.3) {
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = viewportHeight / 2;
        const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
        const centerScore = 1 - distanceFromCenter / viewportHeight;
        const score = visibilityRatio * 0.7 + centerScore * 0.3;

        if (score > bestScore) {
          bestScore = score;
          currentParagraph = element;
        }
      }
    });

    if (currentParagraph !== null) {
      const element = currentParagraph as Element;
      const paragraphId = element.getAttribute('data-paragraph-id');
      if (paragraphId) {
        const paragraphIndex = book.paragraphs.findIndex(
          (p: any) => p.id === paragraphId
        );
        if (paragraphIndex !== -1) {
          const rect = element.getBoundingClientRect();
          const progressThroughParagraph = Math.max(
            0,
            Math.min(
              1,
              (scrollTop - (rect.top + scrollTop) + viewportHeight * 0.3) /
                rect.height
            )
          );

          const basePosition = (paragraphIndex / book.paragraphs.length) * 100;
          const paragraphWeight = (1 / book.paragraphs.length) * 100;
          const precisePosition =
            basePosition + progressThroughParagraph * paragraphWeight;
          const finalPosition = Math.max(
            0,
            Math.min(100, Math.round(precisePosition))
          );

          updateProgress(paragraphId, finalPosition);
        }
      }
    }
  }, [book?.paragraphs, updateProgress]);

  // Unified scroll handler for both progress and header visibility
  useEffect(() => {
    if (!book?.paragraphs?.length) return;

    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      // Close note popup when scrolling
      if (selectedNote) {
        setSelectedNote(null);
        setNotePopupPosition(null);
      }

      // Check header visibility
      if (headerRef.current) {
        const headerVisible =
          headerRef.current.getBoundingClientRect().bottom > 0;
        setIsOriginalHeaderVisible(headerVisible);
      }

      // Throttle progress updates
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateProgressOnScroll, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgressOnScroll(); // Initial update

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [updateProgressOnScroll, selectedNote, book?.paragraphs]);

  // Auto-scroll to last read position
  useEffect(() => {
    if (
      book?.paragraphs?.length &&
      currentProgress?.paragraphId &&
      !hasAutoScrolled
    ) {
      const timeoutId = setTimeout(() => {
        const paragraphElement = document.querySelector(
          `[data-paragraph-id="${currentProgress.paragraphId}"]`
        );
        if (paragraphElement) {
          paragraphElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
          setHasAutoScrolled(true);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [book?.paragraphs, currentProgress?.paragraphId, hasAutoScrolled]);

  const toggleFloatingHeader = () => {
    setIsFloatingHeaderOpen(!isFloatingHeaderOpen);
  };

  // Helper function to find paragraph element and ID from selection
  const findParagraphFromSelection = (range: Range) => {
    let paragraphElement = range.commonAncestorContainer;
    while (
      paragraphElement &&
      paragraphElement.nodeType !== Node.ELEMENT_NODE &&
      paragraphElement.parentNode
    ) {
      paragraphElement = paragraphElement.parentNode;
    }

    let paragraphId: string | null = null;
    let currentElement = paragraphElement as Element;
    while (currentElement && !paragraphId) {
      paragraphId = currentElement.getAttribute('data-paragraph-id');
      const parentElement = currentElement.parentElement;
      if (!parentElement) break;
      currentElement = parentElement;
    }

    return { paragraphElement: currentElement, paragraphId };
  };

  // Simplified text position calculation
  const getTextPosition = (
    range: Range,
    paragraphElement: Element
  ): { startIndex: number; endIndex: number } => {
    const paragraphId = paragraphElement.getAttribute('data-paragraph-id');
    if (!paragraphId) {
      return { startIndex: 0, endIndex: 0 };
    }

    const paragraph = book?.paragraphs?.find((p: any) => p.id === paragraphId);
    if (!paragraph) {
      return { startIndex: 0, endIndex: 0 };
    }

    const getTextOffset = (node: Node, offset: number): number => {
      let textOffset = 0;
      const walker = document.createTreeWalker(
        paragraphElement,
        NodeFilter.SHOW_TEXT
      );

      let currentNode;
      while ((currentNode = walker.nextNode())) {
        if (currentNode === node) {
          return textOffset + offset;
        }
        textOffset += (currentNode.textContent || '').length;
      }
      return textOffset;
    };

    try {
      const startOffset = getTextOffset(
        range.startContainer,
        range.startOffset
      );
      const endOffset = getTextOffset(range.endContainer, range.endOffset);
      return { startIndex: startOffset, endIndex: endOffset };
    } catch (e) {
      // Fallback: find text in original content
      const selectedText = range.toString();
      const index = paragraph.content.indexOf(selectedText);
      if (index !== -1) {
        return {
          startIndex: index,
          endIndex: index + selectedText.length,
        };
      }
      return { startIndex: 0, endIndex: selectedText.length };
    }
  };

  // Unified text selection handler
  const handleTextSelection = (
    event: React.MouseEvent,
    isRightClick = false
  ) => {
    if (isRightClick) event.preventDefault();

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) return;

      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const { paragraphElement, paragraphId } =
        findParagraphFromSelection(range);
      const { startIndex, endIndex } = getTextPosition(range, paragraphElement);

      const rect = range.getBoundingClientRect();
      setContextMenu({
        x: isRightClick ? event.clientX : rect.right + 10,
        y: isRightClick ? event.clientY : rect.top - 10,
        selectedText,
        paragraphId: paragraphId || undefined,
        startIndex,
        endIndex,
      });
    }, 100);
  };

  const handleContextMenuAction = (action: string, text: string) => {
    switch (action) {
      case 'copy':
      case 'copy-translation':
        navigator.clipboard.writeText(text);
        break;
      case 'note-created':
        loadNotes();
        break;
      case 'highlight':
      case 'note-error':
      case 'search':
        // TODO: Implement these features
        break;
    }
  };

  const loadNotes = async () => {
    if (!bookId) return;
    try {
      const notesData = await notesService.getNotes({ bookId });
      setNotes(notesData.notes || notesData || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await notesService.deleteNote(noteId);
      setSelectedNote(null);
      setNotePopupPosition(null);
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const renderParagraphWithNotes = (paragraph: any) => {
    const paragraphNotes = notes.filter(
      (note) => note.paragraphId === paragraph.id
    );

    if (paragraphNotes.length === 0) {
      // No notes for this paragraph, render normally
      return (
        <p className='mb-8' key={paragraph.id} data-paragraph-id={paragraph.id}>
          {paragraph.content}
        </p>
      );
    }

    // Split content by note positions and insert note indicators
    const contentParts = [];
    let lastIndex = 0;

    // Sort notes by start index
    const sortedNotes = [...paragraphNotes].sort(
      (a, b) => (a.startIndex || 0) - (b.startIndex || 0)
    );

    sortedNotes.forEach((note, index) => {
      const startIndex = note.startIndex || 0;
      const endIndex = note.endIndex || startIndex;

      // Add text before the note
      if (startIndex > lastIndex) {
        contentParts.push(
          <span key={`text-${index}-before`}>
            {paragraph.content.slice(lastIndex, startIndex)}
          </span>
        );
      }

      // Add the noted text with indicator
      const notedText = paragraph.content.slice(startIndex, endIndex);
      contentParts.push(
        <span key={`note-${note.id}`} className='relative '>
          <span className='bg-yellow-100 dark:bg-yellow-900/30 rounded'>
            {notedText}
          </span>
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isCurrentlySelected = selectedNote?.id === note.id;

              if (isCurrentlySelected) {
                setSelectedNote(null);
                setNotePopupPosition(null);
              } else {
                setSelectedNote(note);
                setNotePopupPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                });
              }
            }}
            className='absolute -top-1 -right-3 w-3 h-3 border-black dark:border-white border rounded-full cursor-pointer hover:scale-110 transition-all duration-200 shadow-sm'
            title='Click to view note'
          />
        </span>
      );

      lastIndex = endIndex;
    });

    // Add remaining text
    if (lastIndex < paragraph.content.length) {
      contentParts.push(
        <span key='text-end'>{paragraph.content.slice(lastIndex)}</span>
      );
    }

    return (
      <p className='mb-8' key={paragraph.id} data-paragraph-id={paragraph.id}>
        {contentParts}
      </p>
    );
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  // Handle clicks outside menus and selection changes
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (contextMenu && !target.closest('[data-context-menu]')) {
        setContextMenu(null);
      }

      if (
        selectedNote &&
        !target.closest('.note-popup') &&
        !target.closest('button[title="Click to view note"]')
      ) {
        setSelectedNote(null);
        setNotePopupPosition(null);
      }
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [contextMenu, selectedNote]);

  // Component cleanup
  useEffect(() => {
    return () => {
      // No cleanup needed since we removed intersection observer
    };
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-white dark:bg-black flex justify-center items-center'>
        <div className='text-center'>
          <div className='animate-spin h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-4'></div>
          <p className='text-gray-500 dark:text-gray-400 font-light tracking-wide'>
            Loading book...
          </p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className='min-h-screen bg-white dark:bg-black flex justify-center items-center'>
        <div className='text-center py-16'>
          <div className='text-6xl mb-4'>📚</div>
          <p className='text-xl font-light text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-2'>
            Book Not Found
          </p>
          <p className='text-sm font-light text-gray-400 tracking-wide mb-6'>
            The book you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <p className='text-xs font-light text-gray-400 tracking-wide'>
            Book ID: {bookId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white dark:bg-black transition-all duration-300'>
      {/* Progress Bar */}
      {currentProgress && (
        <div className='fixed top-0 left-0 w-full z-50'>
          <div className='h-1 bg-gray-200 dark:bg-gray-800'>
            <div
              className='h-full bg-black dark:bg-white transition-all duration-300'
              style={{ width: `${currentProgress.position || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Floating Header Toggle Button - Only shows when original header is not visible */}
      {!isOriginalHeaderVisible && (
        <div className='fixed top-4 right-4 z-50 flex items-center gap-2'>
          {book?.title && (
            <div className='bg-black/80 dark:bg-white/80 backdrop-blur-sm text-white dark:text-black px-3 py-1 rounded-full text-sm font-light max-w-xs truncate'>
              {book.title}
            </div>
          )}
          <button
            onClick={toggleFloatingHeader}
            className='w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300'
            title={
              isFloatingHeaderOpen
                ? 'Hide floating header'
                : 'Show floating header'
            }
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                isFloatingHeaderOpen ? 'rotate-45' : 'rotate-0'
              }`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </button>
        </div>
      )}

      {/* Floating Header Overlay */}
      {isFloatingHeaderOpen && (
        <div className='fixed inset-0 z-40 flex items-start justify-center pt-4'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setIsFloatingHeaderOpen(false)}
          />

          {/* Floating Header Content */}
          <div className='relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto'>
            <div className='p-6'>
              {/* Close Button */}
              <button
                onClick={() => setIsFloatingHeaderOpen(false)}
                className='absolute top-4 right-4 w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors'
                title='Close floating header'
                aria-label='Close floating header'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>

              {/* Header Content - Same as original but compact */}
              <div className='flex items-start gap-4 pr-8'>
                <img
                  src={book.imageUrl || '/default-book.png'}
                  alt={book.title}
                  className='w-20 h-28 object-cover border border-gray-200 dark:border-gray-800 rounded'
                />
                <div className='flex-1'>
                  <h1 className='text-2xl font-light text-black dark:text-white tracking-wider uppercase mb-2'>
                    {book.title}
                  </h1>
                  {book.authors && book.authors.length > 0 && (
                    <p className='text-sm text-gray-600 dark:text-gray-400 font-light tracking-wide mb-3'>
                      by{' '}
                      {book.authors.map((a: any) => a.author.name).join(', ')}
                    </p>
                  )}

                  {/* Compact Reading Progress */}
                  {currentProgress && (
                    <div className='mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700'>
                      <div className='flex justify-between text-xs mb-1'>
                        <span className='text-black dark:text-white font-light'>
                          {Math.round(currentProgress.position || 0)}% Complete
                        </span>
                        <span className='text-gray-500 dark:text-gray-400 font-light'>
                          Last read:{' '}
                          {new Date(
                            currentProgress.updatedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className='h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-black dark:bg-white transition-all duration-300'
                          style={{ width: `${currentProgress.position || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Compact Stats */}
                  <div className='grid grid-cols-3 gap-3 text-xs text-gray-500 dark:text-gray-400 font-light uppercase'>
                    {book._count?.paragraphs && (
                      <div>
                        <span className='block text-black dark:text-white text-sm font-light'>
                          {book._count.paragraphs}
                        </span>
                        Paragraphs
                      </div>
                    )}
                    {book.language && (
                      <div>
                        <span className='block text-black dark:text-white text-sm font-light'>
                          {book.language.toUpperCase()}
                        </span>
                        Language
                      </div>
                    )}
                    {book.paragraphs && book.paragraphs.length > 0 && (
                      <div>
                        <span className='block text-black dark:text-white text-sm font-light'>
                          ~
                          {Math.ceil(
                            book.paragraphs.reduce(
                              (total: number, p: any) =>
                                total + (p.readingTimeEst || 0),
                              0
                            ) / 60
                          )}
                        </span>
                        Minutes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='max-w-4xl mx-auto px-8 py-12'>
        {/* Original Book Header (always present at top of page) */}
        <div
          ref={headerRef}
          className='border-b border-gray-100 dark:border-gray-800 pb-12 mb-16'
        >
          <div className='flex items-start gap-8'>
            <img
              src={book.imageUrl || '/default-book.png'}
              alt={book.title}
              className='w-32 h-48 object-cover border border-gray-200 dark:border-gray-800'
            />
            <div className='flex-1'>
              <h1 className='text-4xl font-light text-black dark:text-white tracking-wider uppercase mb-4'>
                {book.title}
              </h1>
              {book.authors && book.authors.length > 0 && (
                <p className='text-lg text-gray-600 dark:text-gray-400 font-light tracking-wide mb-6'>
                  by {book.authors.map((a: any) => a.author.name).join(', ')}
                </p>
              )}

              {/* Reading Progress Info */}
              {currentProgress && (
                <div className='mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-sm font-light text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                      Reading Progress
                    </h3>
                    <div className='flex items-center gap-2 text-xs'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        Auto-scroll:
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-light ${
                          hasAutoScrolled
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        }`}
                      >
                        {hasAutoScrolled ? 'Completed' : 'Pending'}
                      </span>
                      {hasAutoScrolled && (
                        <button
                          onClick={() => setHasAutoScrolled(false)}
                          className='px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded text-xs font-light transition-colors'
                          title='Enable auto-scroll for next visit'
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-4'>
                    <div className='flex-1'>
                      <div className='flex justify-between text-sm mb-1'>
                        <span className='text-black dark:text-white font-light'>
                          {Math.round(currentProgress.position || 0)}% Complete
                        </span>
                        <span className='text-gray-500 dark:text-gray-400 font-light'>
                          Last read:{' '}
                          {new Date(
                            currentProgress.updatedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className='h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-black dark:bg-white transition-all duration-300'
                          style={{
                            width: `${currentProgress.position || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Stats */}
              <div className='grid grid-cols-3 gap-8 text-sm text-gray-500 dark:text-gray-400 font-light tracking-wide uppercase border-t border-gray-100 dark:border-gray-800 pt-6'>
                {book._count?.paragraphs && (
                  <div>
                    <span className='block text-black dark:text-white text-lg font-light'>
                      {book._count.paragraphs}
                    </span>
                    Paragraphs
                  </div>
                )}
                {book.language && (
                  <div>
                    <span className='block text-black dark:text-white text-lg font-light'>
                      {book.language.toUpperCase()}
                    </span>
                    Language
                  </div>
                )}
                {book.paragraphs && book.paragraphs.length > 0 && (
                  <div>
                    <span className='block text-black dark:text-white text-lg font-light'>
                      ~
                      {Math.ceil(
                        book.paragraphs.reduce(
                          (total: number, p: any) =>
                            total + (p.readingTimeEst || 0),
                          0
                        ) / 60
                      )}
                    </span>
                    Minutes
                  </div>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <p className='text-gray-700 dark:text-gray-300 mt-8 font-light leading-relaxed tracking-wide'>
                  {book.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='space-y-8'>
          {book.paragraphs && book.paragraphs.length > 0 ? (
            book.paragraphs.map((paragraph: any, index: number) => (
              <section key={paragraph.id} className='scroll-mt-24'>
                <div
                  data-paragraph-id={paragraph.id}
                  className='max-w-none text-black dark:text-white leading-loose tracking-wide font-light text-lg select-text text-justify'
                  onContextMenu={(e) => handleTextSelection(e, true)}
                  onMouseUp={(e) => handleTextSelection(e, false)}
                >
                  {renderParagraphWithNotes(paragraph)}
                </div>
              </section>
            ))
          ) : (
            <div className='text-center py-32 text-gray-500 dark:text-gray-400'>
              <p className='text-xl font-light tracking-wider uppercase mb-4'>
                No Content Available
              </p>
              <p className='text-sm font-light tracking-wide'>
                This book doesn't have any paragraphs yet.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className='bg-gradient-to-t from-white to-white/10 w-full h-20 fixed bottom-0 left-0 dark:from-black dark:to-black/10' />

      <div className='bg-gradient-to-b from-white to-white/10 dark:from-black dark:to-black/10 w-full h-20 fixed left-0 top-0' />
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedText={contextMenu.selectedText}
          bookId={bookId}
          paragraphId={contextMenu.paragraphId}
          startIndex={contextMenu.startIndex}
          endIndex={contextMenu.endIndex}
          onClose={closeContextMenu}
          onAction={handleContextMenuAction}
        />
      )}

      {/* Note Popup */}
      {selectedNote && notePopupPosition && (
        <NotePopup
          note={selectedNote}
          position={notePopupPosition}
          onClose={() => {
            setSelectedNote(null);
            setNotePopupPosition(null);
          }}
          onDelete={deleteNote}
        />
      )}
    </div>
  );
};

export default Reading;
