import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { paragraphsService } from '../services/paragraphsService';

const Editing: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<any | null>(null);
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [bookSaving, setBookSaving] = useState(false);

  // Book editing state
  const [editedBook, setEditedBook] = useState<any>({});
  const [bookDebounceTimer, setBookDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Paragraph editing state
  const [editedParagraphs, setEditedParagraphs] = useState<any[]>([]);
  const [debounceTimers, setDebounceTimers] = useState<{
    [key: string]: NodeJS.Timeout;
  }>({});
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newOrder, setNewOrder] = useState<number | ''>('');
  const [newChapterNumber, setNewChapterNumber] = useState<number | ''>('');
  const [newReadingTime, setNewReadingTime] = useState<number | ''>('');
  const [addError, setAddError] = useState<string | null>(null);

  // Auto-save book information when it changes
  const handleBookAutoSave = (field: string, value: any) => {
    setEditedBook((prev: any) => ({ ...prev, [field]: value }));

    // Clear previous timer
    if (bookDebounceTimer) {
      clearTimeout(bookDebounceTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      setBookSaving(true);
      try {
        await bookService.updateBook(bookId!, { [field]: value });
      } catch (err) {
        console.error('Failed to save book field:', field, err);
      } finally {
        setBookSaving(false);
      }
    }, 800);

    setBookDebounceTimer(timer);
  };
  // Auto-save paragraph when content changes (debounced)
  const handleAutoSave = (
    paragraphId: string,
    field: string,
    value: string
  ) => {
    setEditedParagraphs((prev) =>
      prev.map((p) => (p.id === paragraphId ? { ...p, [field]: value } : p))
    );
    // Clear previous timer
    if (debounceTimers[paragraphId]) {
      clearTimeout(debounceTimers[paragraphId]);
    }
    // Set new timer
    const timer = setTimeout(async () => {
      setSaving((prev) => ({ ...prev, [paragraphId]: true }));
      const paragraph = editedParagraphs.find((p) => p.id === paragraphId);
      try {
        await paragraphsService.updateParagraph(paragraphId, {
          content: field === 'content' ? value : paragraph.content,
          order: paragraph.order,
          chapterNumber: paragraph.chapterNumber,
          readingTimeEst: paragraph.readingTimeEst,
        });
      } catch (err) {
        console.error('Failed to save paragraph:', err);
      } finally {
        setSaving((prev) => ({ ...prev, [paragraphId]: false }));
      }
    }, 800); // 800ms debounce
    setDebounceTimers((prev) => ({ ...prev, [paragraphId]: timer }));
  };

  const handleAddParagraph = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newContent) {
      setAddError('Content is required');
      return;
    }
    setAdding(true);
    try {
      const newParagraph = {
        bookId: bookId!,
        content: newContent,
        order: newOrder ? Number(newOrder) : undefined,
        chapterNumber: newChapterNumber ? Number(newChapterNumber) : undefined,
        readingTimeEst: newReadingTime ? Number(newReadingTime) : undefined,
      };
      const paragraph = await paragraphsService.createParagraph(newParagraph);
      setEditedParagraphs((prev) => [...prev, paragraph]);
      setNewContent('');
      setNewOrder('');
      setNewChapterNumber('');
      setNewReadingTime('');
      // Refresh paragraphs
      await fetchParagraphs();
    } catch (err) {
      setAddError('Failed to add paragraph');
    } finally {
      setAdding(false);
    }
  };

  const fetchParagraphs = async () => {
    if (!bookId) return;
    try {
      const data = await paragraphsService.getParagraphs(bookId);
      setParagraphs(data.paragraphs || []);
      setEditedParagraphs(data.paragraphs?.map((p: any) => ({ ...p })) || []);
    } catch (err) {
      console.error('Failed to fetch paragraphs:', err);
      setParagraphs([]);
      setEditedParagraphs([]);
    }
  };

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const data = await bookService.getBook(bookId!);
        setBook(data);
        setEditedBook({ ...data }); // Initialize edited book state
        await fetchParagraphs();
      } catch (err) {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };
    if (bookId) fetchBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-white dark:bg-black lg:ml-72 flex justify-center items-center'>
        <div className='animate-spin h-8 w-8 border-4 border-black dark:border-white border-t-transparent rounded-full'></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className='min-h-screen bg-white dark:bg-black lg:ml-72 flex justify-center items-center'>
        <div className='text-center text-gray-500 dark:text-gray-400'>
          <p className='text-xl font-light tracking-wider uppercase'>
            Book not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white dark:bg-black lg:ml-72 transition-all duration-300'>
      <div className='max-w-5xl mx-auto px-8 py-12'>
        {/* Header */}
        <div className='flex items-center justify-between mb-16 border-b border-gray-100 dark:border-gray-800 pb-8'>
          <div>
            <h1 className='text-3xl font-light text-black dark:text-white tracking-wider uppercase'>
              Edit Book
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-2 font-light tracking-wide'>
              {book.title}
            </p>
          </div>
          {bookSaving && (
            <div className='flex items-center gap-2 text-gray-500 dark:text-gray-400'>
              <div className='animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full'></div>
              <span className='text-sm font-light tracking-wide uppercase'>
                Saving...
              </span>
            </div>
          )}
        </div>

        {/* Book Information Form */}
        <div className='space-y-12 mb-16'>
          <div>
            <h2 className='text-lg font-light text-black dark:text-white tracking-wider uppercase mb-8'>
              Book Information
            </h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Title */}
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Title
                </label>
                <input
                  type='text'
                  value={editedBook.title || ''}
                  onChange={(e) => handleBookAutoSave('title', e.target.value)}
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                />
              </div>

              {/* Language */}
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Language
                </label>
                <select
                  value={editedBook.language || ''}
                  onChange={(e) =>
                    handleBookAutoSave('language', e.target.value)
                  }
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

              {/* Edition */}
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Edition
                </label>
                <input
                  type='text'
                  value={editedBook.edition || ''}
                  onChange={(e) =>
                    handleBookAutoSave('edition', e.target.value)
                  }
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                />
              </div>

              {/* Edition Published */}
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Edition Published Year
                </label>
                <input
                  type='number'
                  value={editedBook.editionPublished || ''}
                  onChange={(e) =>
                    handleBookAutoSave(
                      'editionPublished',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                />
              </div>

              {/* Original Language */}
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Original Language
                </label>
                <select
                  value={editedBook.originalLanguage || ''}
                  onChange={(e) =>
                    handleBookAutoSave('originalLanguage', e.target.value)
                  }
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
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

              {/* Original Published */}
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Original Published Year
                </label>
                <input
                  type='number'
                  value={editedBook.originalPublished || ''}
                  onChange={(e) =>
                    handleBookAutoSave(
                      'originalPublished',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                />
              </div>

              {/* Genre */}
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Genre
                </label>
                <input
                  type='text'
                  value={editedBook.genre || ''}
                  onChange={(e) => handleBookAutoSave('genre', e.target.value)}
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                />
              </div>

              {/* Image URL */}
              <div className='space-y-3'>
                <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                  Cover Image URL
                </label>
                <input
                  type='url'
                  value={editedBook.imageUrl || ''}
                  onChange={(e) =>
                    handleBookAutoSave('imageUrl', e.target.value)
                  }
                  className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                    text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                />
              </div>
            </div>

            {/* Description - Full Width */}
            <div className='space-y-3 mt-8'>
              <label className='block text-sm font-light text-black dark:text-white tracking-wide uppercase'>
                Description
              </label>
              <textarea
                value={editedBook.description || ''}
                onChange={(e) =>
                  handleBookAutoSave('description', e.target.value)
                }
                className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                  text-black dark:text-white font-light text-sm h-32 resize-none focus:outline-none focus:border-black dark:focus:border-white'
              />
            </div>

            {/* Public Status */}
            <div className='flex items-center mt-8'>
              <input
                type='checkbox'
                id='isPublic'
                checked={editedBook.isPublic || false}
                onChange={(e) =>
                  handleBookAutoSave('isPublic', e.target.checked)
                }
                className='mr-3'
              />
              <label
                htmlFor='isPublic'
                className='text-sm font-light text-black dark:text-white tracking-wide uppercase'
              >
                Make this book public
              </label>
            </div>
          </div>
        </div>

        {/* Paragraphs Section */}
        <div className='border-t border-gray-100 dark:border-gray-800 pt-12'>
          <h2 className='text-lg font-light text-black dark:text-white tracking-wider uppercase mb-8'>
            Paragraphs ({editedParagraphs.length})
          </h2>

          {editedParagraphs && editedParagraphs.length > 0 ? (
            <div className='space-y-8'>
              {editedParagraphs.map((paragraph: any) => (
                <div
                  key={paragraph.id}
                  className='border border-gray-200 dark:border-gray-800 p-6'
                >
                  {/* Paragraph metadata */}
                  <div className='flex items-center gap-6 mb-4 text-xs font-light text-gray-500 dark:text-gray-400 tracking-wide uppercase'>
                    <span>Order: {paragraph.order}</span>
                    {paragraph.chapterNumber && (
                      <span>Chapter: {paragraph.chapterNumber}</span>
                    )}
                    {paragraph.readingTimeEst && (
                      <span>Reading: {paragraph.readingTimeEst}s</span>
                    )}
                    {saving[paragraph.id] && (
                      <span className='text-black dark:text-white flex items-center gap-2'>
                        <div className='animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full'></div>
                        Saving
                      </span>
                    )}
                  </div>

                  {/* Paragraph content */}
                  <textarea
                    value={paragraph.content}
                    onChange={(e) =>
                      handleAutoSave(paragraph.id, 'content', e.target.value)
                    }
                    disabled={saving[paragraph.id]}
                    className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                      text-black dark:text-white font-light text-sm leading-loose resize-none h-32
                      focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-50'
                  />
                </div>
              ))}

              {/* Add new paragraph form */}
              <div className='border border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/20'>
                <h3 className='text-sm font-light text-black dark:text-white tracking-wide uppercase mb-6'>
                  Add New Paragraph
                </h3>

                {addError && (
                  <div className='text-red-500 dark:text-red-400 text-sm mb-4 font-light'>
                    {addError}
                  </div>
                )}

                <form onSubmit={handleAddParagraph} className='space-y-6'>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    disabled={adding}
                    placeholder='Paragraph content...'
                    className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                      text-black dark:text-white font-light text-sm leading-loose resize-none h-32
                      focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-50'
                  />

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <input
                      type='number'
                      value={newOrder}
                      onChange={(e) =>
                        setNewOrder(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={adding}
                      placeholder='Order'
                      className='p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                        text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                    />

                    <input
                      type='number'
                      value={newChapterNumber}
                      onChange={(e) =>
                        setNewChapterNumber(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={adding}
                      placeholder='Chapter Number'
                      className='p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                        text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                    />

                    <input
                      type='number'
                      value={newReadingTime}
                      onChange={(e) =>
                        setNewReadingTime(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={adding}
                      placeholder='Reading Time (s)'
                      className='p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                        text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                    />
                  </div>

                  <button
                    type='submit'
                    disabled={adding || !newContent.trim()}
                    className='px-8 py-3 bg-black dark:bg-white text-white dark:text-black 
                      disabled:bg-gray-300 disabled:cursor-not-allowed
                      hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200
                      font-light tracking-wider text-sm uppercase border border-black dark:border-white'
                  >
                    {adding ? 'Adding...' : 'Add Paragraph'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className='text-center py-16 text-gray-500 dark:text-gray-400'>
              <p className='text-lg font-light tracking-wider uppercase mb-4'>
                No Paragraphs
              </p>
              <p className='text-sm font-light tracking-wide mb-8'>
                Start by adding your first paragraph
              </p>

              {/* Add first paragraph form */}
              <div className='border border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/20 max-w-2xl mx-auto'>
                <h3 className='text-sm font-light text-black dark:text-white tracking-wide uppercase mb-6'>
                  Add First Paragraph
                </h3>

                {addError && (
                  <div className='text-red-500 dark:text-red-400 text-sm mb-4 font-light'>
                    {addError}
                  </div>
                )}

                <form onSubmit={handleAddParagraph} className='space-y-6'>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    disabled={adding}
                    placeholder='Paragraph content...'
                    className='w-full p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                      text-black dark:text-white font-light text-sm leading-loose resize-none h-32
                      focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-50'
                  />

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <input
                      type='number'
                      value={newOrder}
                      onChange={(e) =>
                        setNewOrder(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={adding}
                      placeholder='Order'
                      className='p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                        text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                    />

                    <input
                      type='number'
                      value={newChapterNumber}
                      onChange={(e) =>
                        setNewChapterNumber(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={adding}
                      placeholder='Chapter Number'
                      className='p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                        text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                    />

                    <input
                      type='number'
                      value={newReadingTime}
                      onChange={(e) =>
                        setNewReadingTime(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      disabled={adding}
                      placeholder='Reading Time (s)'
                      className='p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black
                        text-black dark:text-white font-light text-sm focus:outline-none focus:border-black dark:focus:border-white'
                    />
                  </div>

                  <button
                    type='submit'
                    disabled={adding || !newContent.trim()}
                    className='px-8 py-3 bg-black dark:bg-white text-white dark:text-black 
                      disabled:bg-gray-300 disabled:cursor-not-allowed
                      hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200
                      font-light tracking-wider text-sm uppercase border border-black dark:border-white'
                  >
                    {adding ? 'Adding...' : 'Add Paragraph'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editing;
