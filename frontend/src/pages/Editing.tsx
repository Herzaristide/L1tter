import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { paragraphsService } from '../services/paragraphsService';

const Editing: React.FC = () => {
  // Debounce timer for auto-save
  const [debounceTimers, setDebounceTimers] = useState<{
    [key: string]: NodeJS.Timeout;
  }>({});

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
        // Optionally show error
      } finally {
        setSaving((prev) => ({ ...prev, [paragraphId]: false }));
      }
    }, 800); // 800ms debounce
    setDebounceTimers((prev) => ({ ...prev, [paragraphId]: timer }));
  };

  const [editedParagraphs, setEditedParagraphs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newOrder, setNewOrder] = useState<number | ''>('');
  const [newChapterNumber, setNewChapterNumber] = useState<number | ''>('');
  const [newReadingTime, setNewReadingTime] = useState<number | ''>('');
  const [addError, setAddError] = useState<string | null>(null);

  const handleEditClick = (paragraphId: string) => {
    setIsEditing((prev) => ({ ...prev, [paragraphId]: true }));
  };

  const handleCancel = (paragraphId: string) => {
    // Reset to original paragraph data
    const original = paragraphs.find((p: any) => p.id === paragraphId);
    setEditedParagraphs((prev) =>
      prev.map((p) => (p.id === paragraphId ? { ...original } : p))
    );
    setIsEditing((prev) => ({ ...prev, [paragraphId]: false }));
  };

  const handleChange = (paragraphId: string, field: string, value: string) => {
    setEditedParagraphs((prev) =>
      prev.map((p) => (p.id === paragraphId ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async (paragraphId: string) => {
    setSaving((prev) => ({ ...prev, [paragraphId]: true }));
    const paragraph = editedParagraphs.find((p) => p.id === paragraphId);
    try {
      await paragraphsService.updateParagraph(paragraphId, {
        content: paragraph.content,
        order: paragraph.order,
        chapterNumber: paragraph.chapterNumber,
        readingTimeEst: paragraph.readingTimeEst,
      });
      setIsEditing((prev) => ({ ...prev, [paragraphId]: false }));
    } catch (err) {
      alert('Failed to save paragraph');
    } finally {
      setSaving((prev) => ({ ...prev, [paragraphId]: false }));
    }
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

  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<any | null>(null);
  const [paragraphs, setParagraphs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className='max-w-3xl mx-auto py-8 px-4'>
      <div className='flex items-center gap-6 mb-8'>
        <img
          src={book.imageUrl || '/default-book.png'}
          alt={book.title}
          className='w-24 h-36 object-cover rounded border'
        />
        <div>
          <h1 className='text-2xl font-bold mb-2'>{book.title}</h1>
          {book.authors && book.authors.length > 0 && (
            <p className='text-gray-600'>
              by {book.authors.map((a: any) => a.author.name).join(', ')}
            </p>
          )}
          <div className='mt-2 text-sm text-gray-500'>
            <div>
              <strong>ID:</strong> {book.id}
            </div>
            <div>
              <strong>Work ID:</strong> {book.workId}
            </div>
            <div>
              <strong>Collection ID:</strong> {book.collectionId}
            </div>
            <div>
              <strong>Publisher ID:</strong> {book.publisherId}
            </div>
            <div>
              <strong>Edition:</strong> {book.edition}
            </div>
            <div>
              <strong>Edition Published:</strong> {book.editionPublished}
            </div>
            <div>
              <strong>Original Language:</strong> {book.originalLanguage}
            </div>
            <div>
              <strong>Original Published:</strong> {book.originalPublished}
            </div>
            <div>
              <strong>Language:</strong> {book.language}
            </div>
            <div>
              <strong>Slug:</strong> {book.slug}
            </div>
            <div>
              <strong>Genre:</strong> {book.genre}
            </div>
            <div>
              <strong>Description:</strong> {book.description}
            </div>
            <div>
              <strong>Is Public:</strong> {book.isPublic ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Created By:</strong> {book.createdBy}
            </div>
            <div>
              <strong>Updated By:</strong> {book.updatedBy}
            </div>
            <div>
              <strong>User ID:</strong> {book.userId}
            </div>
            <div>
              <strong>Created At:</strong> {book.createdAt}
            </div>
            <div>
              <strong>Updated At:</strong> {book.updatedAt}
            </div>
            <div>
              <strong>Deleted At:</strong>{' '}
              {book.deletedAt ? book.deletedAt : 'N/A'}
            </div>
          </div>
        </div>
      </div>
      <div className='space-y-12'>
        <h2 className='text-xl font-semibold mb-4'>Tags</h2>
        {book.tags && book.tags.length > 0 ? (
          <ul className='mb-6'>
            {book.tags.map((tagObj: any) => (
              <li key={tagObj.tag.id} className='text-gray-700'>
                {tagObj.tag.name} - {tagObj.tag.description}
              </li>
            ))}
          </ul>
        ) : (
          <div className='text-gray-500 mb-6'>No tags found.</div>
        )}

        <h2 className='text-xl font-semibold mb-4'>Paragraphs</h2>
        {editedParagraphs && editedParagraphs.length > 0 ? (
          <>
            {editedParagraphs.map((paragraph: any) => (
              <section key={paragraph.id} className='scroll-mt-24 mb-8'>
                <div className='mb-2 text-sm text-gray-500'>
                  <span>Order: {paragraph.order}</span>
                  {paragraph.chapterNumber && (
                    <span className='ml-4'>
                      Chapter: {paragraph.chapterNumber}
                    </span>
                  )}
                  {paragraph.readingTimeEst && (
                    <span className='ml-4'>
                      Reading Time: {paragraph.readingTimeEst}s
                    </span>
                  )}
                </div>
                <textarea
                  className='block w-full mb-2 px-3 py-2 border rounded prose-lg max-w-none text-gray-900 dark:text-gray-100 whitespace-pre-line'
                  value={paragraph.content}
                  rows={8}
                  onChange={(e) =>
                    handleAutoSave(paragraph.id, 'content', e.target.value)
                  }
                  disabled={saving[paragraph.id]}
                />
                {saving[paragraph.id] && (
                  <div className='text-primary-500 text-sm'>Saving...</div>
                )}
              </section>
            ))}
            {/* Add new paragraph form after last paragraph */}
            <form
              onSubmit={handleAddParagraph}
              className='mb-8 p-4 border rounded bg-gray-50 dark:bg-gray-900'
            >
              <h3 className='text-lg font-semibold mb-2'>Add New Paragraph</h3>
              {addError && <div className='text-red-500 mb-2'>{addError}</div>}
              <textarea
                className='block w-full mb-2 px-3 py-2 border rounded'
                placeholder='Paragraph content'
                value={newContent}
                rows={6}
                onChange={(e) => setNewContent(e.target.value)}
                disabled={adding}
              />
              <div className='flex gap-4 mb-2'>
                <input
                  className='block w-32 px-3 py-2 border rounded'
                  type='number'
                  placeholder='Order'
                  value={newOrder}
                  onChange={(e) =>
                    setNewOrder(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  disabled={adding}
                />
                <input
                  className='block w-32 px-3 py-2 border rounded'
                  type='number'
                  placeholder='Chapter #'
                  value={newChapterNumber}
                  onChange={(e) =>
                    setNewChapterNumber(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  disabled={adding}
                />
                <input
                  className='block w-32 px-3 py-2 border rounded'
                  type='number'
                  placeholder='Reading Time (s)'
                  value={newReadingTime}
                  onChange={(e) =>
                    setNewReadingTime(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  disabled={adding}
                />
              </div>
              <button
                type='submit'
                className='btn-primary px-4 py-2 rounded'
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add Paragraph'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className='text-gray-500'>No paragraphs found.</div>
            {/* Add new paragraph form if no paragraphs exist */}
            <form
              onSubmit={handleAddParagraph}
              className='mb-8 p-4 border rounded bg-gray-50 dark:bg-gray-900'
            >
              <h3 className='text-lg font-semibold mb-2'>Add New Paragraph</h3>
              {addError && <div className='text-red-500 mb-2'>{addError}</div>}
              <textarea
                className='block w-full mb-2 px-3 py-2 border rounded'
                placeholder='Paragraph content'
                value={newContent}
                rows={6}
                onChange={(e) => setNewContent(e.target.value)}
                disabled={adding}
              />
              <div className='flex gap-4 mb-2'>
                <input
                  className='block w-32 px-3 py-2 border rounded'
                  type='number'
                  placeholder='Order'
                  value={newOrder}
                  onChange={(e) =>
                    setNewOrder(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  disabled={adding}
                />
                <input
                  className='block w-32 px-3 py-2 border rounded'
                  type='number'
                  placeholder='Chapter #'
                  value={newChapterNumber}
                  onChange={(e) =>
                    setNewChapterNumber(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  disabled={adding}
                />
                <input
                  className='block w-32 px-3 py-2 border rounded'
                  type='number'
                  placeholder='Reading Time (s)'
                  value={newReadingTime}
                  onChange={(e) =>
                    setNewReadingTime(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                  disabled={adding}
                />
              </div>
              <button
                type='submit'
                className='btn-primary px-4 py-2 rounded'
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add Paragraph'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Editing;
