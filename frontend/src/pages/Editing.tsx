import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { bookService } from '../services/bookService';

const Editing: React.FC = () => {
  // Debounce timer for auto-save
  const [debounceTimers, setDebounceTimers] = useState<{
    [key: string]: NodeJS.Timeout;
  }>({});

  // Auto-save chapter when content changes (debounced)
  const handleAutoSave = (chapterId: string, field: string, value: string) => {
    setEditedChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, [field]: value } : ch))
    );
    // Clear previous timer
    if (debounceTimers[chapterId]) {
      clearTimeout(debounceTimers[chapterId]);
    }
    // Set new timer
    const timer = setTimeout(async () => {
      setSaving((prev) => ({ ...prev, [chapterId]: true }));
      const chapter = editedChapters.find((ch) => ch.id === chapterId);
      try {
        await bookService.updateChapter(chapterId, {
          title: chapter.title,
          content: field === 'content' ? value : chapter.content,
        });
      } catch (err) {
        // Optionally show error
      } finally {
        setSaving((prev) => ({ ...prev, [chapterId]: false }));
      }
    }, 800); // 800ms debounce
    setDebounceTimers((prev) => ({ ...prev, [chapterId]: timer }));
  };
  const [editedChapters, setEditedChapters] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newOrder, setNewOrder] = useState<number | ''>('');
  const [addError, setAddError] = useState<string | null>(null);

  const handleEditClick = (chapterId: string) => {
    setIsEditing((prev) => ({ ...prev, [chapterId]: true }));
  };

  const handleCancel = (chapterId: string) => {
    // Reset to original chapter data
    const original = book.chapters.find((ch: any) => ch.id === chapterId);
    setEditedChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...original } : ch))
    );
    setIsEditing((prev) => ({ ...prev, [chapterId]: false }));
  };

  const handleChange = (chapterId: string, field: string, value: string) => {
    setEditedChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, [field]: value } : ch))
    );
  };

  const handleSave = async (chapterId: string) => {
    setSaving((prev) => ({ ...prev, [chapterId]: true }));
    const chapter = editedChapters.find((ch) => ch.id === chapterId);
    try {
      await bookService.updateChapter(chapterId, {
        title: chapter.title,
        content: chapter.content,
      });
      setIsEditing((prev) => ({ ...prev, [chapterId]: false }));
    } catch (err) {
      alert('Failed to save chapter');
    } finally {
      setSaving((prev) => ({ ...prev, [chapterId]: false }));
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newTitle || !newContent) {
      setAddError('Title and content are required');
      return;
    }
    setAdding(true);
    try {
      const newChapter = {
        title: newTitle,
        content: newContent,
        order: newOrder ? Number(newOrder) : undefined,
      };
      const chapter = await bookService.createChapter(bookId!, newChapter);
      setEditedChapters((prev) => [...prev, chapter]);
      setNewTitle('');
      setNewContent('');
      setNewOrder('');
    } catch (err) {
      setAddError('Failed to add chapter');
    } finally {
      setAdding(false);
    }
  };

  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (book && book.chapters) {
      setEditedChapters(book.chapters.map((ch: any) => ({ ...ch })));
    }
  }, [book]);

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
            {/* Add more metadata fields as needed */}
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

        <h2 className='text-xl font-semibold mb-4'>Chapters</h2>
        {editedChapters && editedChapters.length > 0 ? (
          <>
            {editedChapters.map((chapter: any) => (
              <section key={chapter.id} className='scroll-mt-24 mb-8'>
                <input
                  className='block w-full mb-2 px-3 py-2 border rounded text-lg font-semibold'
                  value={chapter.title}
                  onChange={(e) =>
                    handleAutoSave(chapter.id, 'title', e.target.value)
                  }
                  disabled={saving[chapter.id]}
                />
                <textarea
                  className='block w-full mb-2 px-3 py-2 border rounded prose-lg max-w-none text-gray-900 dark:text-gray-100 whitespace-pre-line'
                  value={chapter.content}
                  rows={8}
                  onChange={(e) =>
                    handleAutoSave(chapter.id, 'content', e.target.value)
                  }
                  disabled={saving[chapter.id]}
                />
                {saving[chapter.id] && (
                  <div className='text-primary-500 text-sm'>Saving...</div>
                )}
              </section>
            ))}
            {/* Add new chapter form after last chapter */}
            <form
              onSubmit={handleAddChapter}
              className='mb-8 p-4 border rounded bg-gray-50 dark:bg-gray-900'
            >
              <h3 className='text-lg font-semibold mb-2'>Add New Chapter</h3>
              {addError && <div className='text-red-500 mb-2'>{addError}</div>}
              <input
                className='block w-full mb-2 px-3 py-2 border rounded'
                placeholder='Chapter title'
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={adding}
              />
              <textarea
                className='block w-full mb-2 px-3 py-2 border rounded'
                placeholder='Chapter content'
                value={newContent}
                rows={6}
                onChange={(e) => setNewContent(e.target.value)}
                disabled={adding}
              />
              <input
                className='block w-32 mb-2 px-3 py-2 border rounded'
                type='number'
                placeholder='Order (optional)'
                value={newOrder}
                onChange={(e) =>
                  setNewOrder(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={adding}
              />
              <button
                type='submit'
                className='btn-primary px-4 py-2 rounded'
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add Chapter'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className='text-gray-500'>No chapters found.</div>
            {/* Add new chapter form if no chapters exist */}
            <form
              onSubmit={handleAddChapter}
              className='mb-8 p-4 border rounded bg-gray-50 dark:bg-gray-900'
            >
              <h3 className='text-lg font-semibold mb-2'>Add New Chapter</h3>
              {addError && <div className='text-red-500 mb-2'>{addError}</div>}
              <input
                className='block w-full mb-2 px-3 py-2 border rounded'
                placeholder='Chapter title'
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={adding}
              />
              <textarea
                className='block w-full mb-2 px-3 py-2 border rounded'
                placeholder='Chapter content'
                value={newContent}
                rows={6}
                onChange={(e) => setNewContent(e.target.value)}
                disabled={adding}
              />
              <input
                className='block w-32 mb-2 px-3 py-2 border rounded'
                type='number'
                placeholder='Order (optional)'
                value={newOrder}
                onChange={(e) =>
                  setNewOrder(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={adding}
              />
              <button
                type='submit'
                className='btn-primary px-4 py-2 rounded'
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add Chapter'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Editing;
