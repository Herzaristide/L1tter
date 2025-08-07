import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../services/bookService';
import ContextMenu from '../components/ContextMenu';

const Reading: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
  } | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const data = await bookService.getBook(bookId!);
        setBook(data);
      } catch (err) {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    if (bookId) fetchBook();
  }, [bookId]);

  const handleTextSelection = (event: React.MouseEvent) => {
    // Handle right-click context menu
    event.preventDefault();
    const selection = window.getSelection();

    if (selection && selection.toString().trim().length > 0) {
      const selectedText = selection.toString().trim();

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        selectedText,
      });
    }
  };

  const handleMouseUp = () => {
    // Auto-show context menu on text selection
    setTimeout(() => {
      const selection = window.getSelection();

      if (selection && selection.toString().trim().length > 0) {
        const selectedText = selection.toString().trim();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position menu near the end of selection
        setContextMenu({
          x: rect.right + 10,
          y: rect.top - 10,
          selectedText,
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
      case 'note':
        console.log('Add note for text:', text);
        // TODO: Implement note creation
        break;
      case 'search':
        console.log('Search for text:', text);
        // TODO: Implement search functionality
        break;
      default:
        break;
    }
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
  }, [contextMenu]);

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
                  className='max-w-none text-black dark:text-white leading-loose tracking-wide font-light text-lg select-text text-justify'
                  onContextMenu={handleTextSelection}
                  onMouseUp={handleMouseUp}
                >
                  <p className='mb-8'>{paragraph.content}</p>
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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedText={contextMenu.selectedText}
          onClose={closeContextMenu}
          onAction={handleContextMenuAction}
        />
      )}
    </div>
  );
};

export default Reading;
