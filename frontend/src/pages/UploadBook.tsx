import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../hooks/useBooks';

const UploadBook: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addBook } = useBooks();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !content) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const book = await addBook(title, author, content);
      navigate(`/book/${book.id}`);
    } catch (err) {
      setError('Failed to upload book');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
      };
      reader.readAsText(file);
    } else {
      setError('Please upload a text file (.txt)');
    }
  };

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-gray-900 mb-8'>Upload New Book</h1>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label
              htmlFor='title'
              className='block text-sm font-medium text-gray-700'
            >
              Book Title
            </label>
            <input
              id='title'
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='input-field mt-1'
              placeholder='Enter book title'
            />
          </div>

          <div>
            <label
              htmlFor='author'
              className='block text-sm font-medium text-gray-700'
            >
              Author
            </label>
            <input
              id='author'
              type='text'
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className='input-field mt-1'
              placeholder='Enter author name'
            />
          </div>
        </div>

        <div>
          <label
            htmlFor='file'
            className='block text-sm font-medium text-gray-700'
          >
            Upload Text File (Optional)
          </label>
          <input
            id='file'
            type='file'
            accept='.txt'
            onChange={handleFileUpload}
            className='mt-1 block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-medium
                       file:bg-primary-50 file:text-primary-700
                       hover:file:bg-primary-100'
          />
          <p className='text-sm text-gray-500 mt-1'>
            You can upload a .txt file or paste the content directly below.
          </p>
        </div>

        <div>
          <label
            htmlFor='content'
            className='block text-sm font-medium text-gray-700'
          >
            Book Content
          </label>
          <textarea
            id='content'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className='input-field mt-1 resize-y'
            placeholder='Paste your book content here. The system will automatically split it into chapters and paragraphs.'
          />
          <p className='text-sm text-gray-500 mt-1'>
            Format chapters with "Chapter 1", "Chapter 2", etc. for automatic
            detection.
          </p>
        </div>

        <div className='flex justify-between'>
          <button
            type='button'
            onClick={() => navigate('/')}
            className='btn-secondary'
          >
            Cancel
          </button>
          <button type='submit' disabled={loading} className='btn-primary'>
            {loading ? 'Uploading...' : 'Upload Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadBook;
