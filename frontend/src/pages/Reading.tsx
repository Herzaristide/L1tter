import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { notesService } from '../services/notesService';
import ContextMenu from '../components/ContextMenu';

const Reading: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<any | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
    paragraphId?: string;
    startIndex?: number;
    endIndex?: number;
  } | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);

  useEffect(() => {
    const fetchBookAndNotes = async () => {
      setLoading(true);
      try {
        const [bookData, notesData] = await Promise.all([
          bookService.getBook(bookId!),
          notesService.getNotes({ bookId: bookId! }),
        ]);
        setBook(bookData);
        setNotes(notesData.notes || notesData || []);
      } catch (err) {
        setBook(null);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };
    if (bookId) fetchBookAndNotes();
  }, [bookId]);

  const handleTextSelection = (
    event: React.MouseEvent,
    paragraphId: string
  ) => {
    // Handle right-click context menu
    event.preventDefault();
    const selection = window.getSelection();

    if (selection && selection.toString().trim().length > 0) {
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);

      // Calculate text position within the paragraph
      const startIndex = range.startOffset;
      const endIndex = range.endOffset;

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        selectedText,
        paragraphId,
        startIndex,
        endIndex,
      });
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    // Auto-show context menu on text selection
    setTimeout(() => {
      const selection = window.getSelection();

      if (selection && selection.toString().trim().length > 0) {
        const selectedText = selection.toString().trim();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Find the paragraph element that contains the selection
        let paragraphElement = range.commonAncestorContainer;
        while (
          paragraphElement &&
          paragraphElement.nodeType !== Node.ELEMENT_NODE &&
          paragraphElement.parentNode
        ) {
          paragraphElement = paragraphElement.parentNode;
        }

        // Look for data-paragraph-id attribute
        let paragraphId: string | null = null;
        let currentElement = paragraphElement as Element;
        while (currentElement && !paragraphId) {
          paragraphId = currentElement.getAttribute('data-paragraph-id');
          const parentElement = currentElement.parentElement;
          if (!parentElement) break;
          currentElement = parentElement;
        }

        // Calculate text position within the paragraph
        const startIndex = range.startOffset;
        const endIndex = range.endOffset;

        // Position menu near the end of selection
        setContextMenu({
          x: rect.right + 10,
          y: rect.top - 10,
          selectedText,
          paragraphId: paragraphId || undefined,
          startIndex,
          endIndex,
        });
      }
    }, 100); // Small delay to ensure selection is complete
  };

  const handleContextMenuAction = (action: string, text: string) => {
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(text);
        console.log('Copied original text to clipboard:', text);
        break;
      case 'copy-translation':
        navigator.clipboard.writeText(text);
        console.log('Copied French translation to clipboard:', text);
        break;
      case 'highlight':
        console.log('Highlight text:', text);
        // TODO: Implement highlighting functionality
        break;
      case 'note-created':
        console.log('Note created successfully for text:', text);
        // Reload notes after creation
        loadNotes();
        break;
      case 'note-error':
        console.log('Failed to create note for text:', text);
        // TODO: Show error notification
        break;
      case 'search':
        console.log('Search for text:', text);
        // TODO: Implement search functionality
        break;
      default:
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

  const renderParagraphWithNotes = (paragraph: any) => {
    const paragraphNotes = notes.filter(
      (note) => note.paragraphId === paragraph.id
    );

    if (paragraphNotes.length === 0) {
      // No notes for this paragraph, render normally
      return (
        <p className='mb-8' key={paragraph.id}>
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
        <span key={`note-${note.id}`} className='relative inline-block'>
          <span className='bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded'>
            {notedText}
          </span>
          <button
            onClick={() =>
              setSelectedNote(selectedNote?.id === note.id ? null : note)
            }
            className='absolute -right-2 top-0 w-3 h-3 bg-black dark:bg-white rounded-full cursor-pointer transform translate-x-full hover:scale-110 transition-transform'
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
      <p className='mb-8' key={paragraph.id}>
        {contentParts}
      </p>
    );
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    // Clear text selection
    window.getSelection()?.removeAllRanges();
  };

  // Close context menu when clicking elsewhere or when selection changes
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      // Close menu if clicking outside of it
      if (contextMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-context-menu]')) {
          setContextMenu(null);
        }
      }

      // Close note popup if clicking outside of it
      if (selectedNote) {
        const target = event.target as HTMLElement;
        if (
          !target.closest('.note-popup') &&
          !target.closest('button[title="Click to view note"]')
        ) {
          setSelectedNote(null);
        }
      }
    };

    const handleSelectionChange = () => {
      // Close menu if selection is cleared
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
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

  if (loading) {
    return (
      <div className='flex justify-center items-center h-full py-16'>
        <div className='animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full'></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className='text-center py-16 text-gray-500'>Book not found.</div>
    );
  }

  return (
    <div className='min-h-screen bg-white dark:bg-black lg:ml-72 transition-all duration-300'>
      <div className='max-w-4xl mx-auto px-8 py-12'>
        {/* Book Header */}
        <div className='border-b border-gray-100 dark:border-gray-800 pb-12 mb-16'>
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
        <div className='space-y-16'>
          {book.paragraphs && book.paragraphs.length > 0 ? (
            book.paragraphs.map((paragraph: any, index: number) => (
              <section key={paragraph.id} className='scroll-mt-24'>
                <div
                  data-paragraph-id={paragraph.id}
                  className='max-w-none text-black dark:text-white leading-loose tracking-wide font-light text-lg select-text text-justify'
                  onContextMenu={(e) => handleTextSelection(e, paragraph.id)}
                  onMouseUp={handleMouseUp}
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
      <div className='bg-gradient-to-t from-white to-white/10 w-full h-20 fixed bottom-0 left-0' />

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
      {selectedNote && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='note-popup bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl'>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-lg font-light text-black dark:text-white tracking-wide uppercase'>
                Note
              </h3>
              <button
                onClick={() => setSelectedNote(null)}
                className='text-gray-500 hover:text-black dark:hover:text-white transition-colors'
              >
                <svg
                  className='w-5 h-5'
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
            </div>

            {selectedNote.selectedText && (
              <div className='mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400'>
                <p className='text-sm font-light text-gray-700 dark:text-gray-300 italic'>
                  "{selectedNote.selectedText}"
                </p>
              </div>
            )}

            <div className='space-y-3'>
              {selectedNote.text && (
                <div>
                  <h4 className='text-sm font-light text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                    Note
                  </h4>
                  <p className='text-black dark:text-white font-light leading-relaxed'>
                    {selectedNote.text}
                  </p>
                </div>
              )}

              {selectedNote.firstContent && (
                <div>
                  <h4 className='text-sm font-light text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                    Additional Content
                  </h4>
                  <p className='text-black dark:text-white font-light leading-relaxed'>
                    {selectedNote.firstContent}
                  </p>
                </div>
              )}

              {selectedNote.secondContent && (
                <div>
                  <p className='text-black dark:text-white font-light leading-relaxed'>
                    {selectedNote.secondContent}
                  </p>
                </div>
              )}

              {selectedNote.thirdContent && (
                <div>
                  <p className='text-black dark:text-white font-light leading-relaxed'>
                    {selectedNote.thirdContent}
                  </p>
                </div>
              )}
            </div>

            <div className='mt-4 pt-4 border-t border-gray-100 dark:border-gray-800'>
              <p className='text-xs text-gray-400 dark:text-gray-500 font-light tracking-wide'>
                {selectedNote.noteType && (
                  <span className='capitalize'>{selectedNote.noteType} • </span>
                )}
                {new Date(selectedNote.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reading;
