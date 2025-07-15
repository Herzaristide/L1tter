import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../hooks/useBooks';
import { bookService } from '../services/bookService';

const UploadBook: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addBook } = useBooks();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) {
      setError('Please fill in title and author');
      return;
    }

    if (uploadMethod === 'text' && !content) {
      setError('Please provide book content');
      return;
    }

    if (uploadMethod === 'file' && !file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let book;
      if (uploadMethod === 'file' && file) {
        // Use file upload
        book = await bookService.uploadBookFile(title, author, file);
      } else {
        // Use text content
        book = await addBook(title, author, content);
      }

      navigate(`/book/${book.id}`);
    } catch (err) {
      setError('Failed to upload book');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['text/plain', 'application/pdf'];
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');

        // If it's a text file, also read and set content for preview
        if (selectedFile.type === 'text/plain') {
          const reader = new FileReader();
          reader.onload = (event) => {
            const text = event.target?.result as string;
            setContent(text);
          };
          reader.readAsText(selectedFile);
        } else {
          // For PDF files, clear content as we can't preview
          setContent('');
        }
      } else {
        setError('Please upload a PDF or text file (.pdf, .txt)');
        setFile(null);
      }
    }
  };

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Upload New Book
        </h1>
        <p className='text-gray-600'>
          Add books to your library by uploading PDF files, text files, or
          pasting content directly.
        </p>
      </div>

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
              required
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
              required
            />
          </div>
        </div>

        {/* Upload Method Toggle */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            How would you like to add your book?
          </label>
          <div className='flex space-x-4'>
            <button
              type='button'
              onClick={() => setUploadMethod('file')}
              className={`px-4 py-2 rounded-lg border ${
                uploadMethod === 'file'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              📁 Upload File (PDF/TXT)
            </button>
            <button
              type='button'
              onClick={() => setUploadMethod('text')}
              className={`px-4 py-2 rounded-lg border ${
                uploadMethod === 'text'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              ✏️ Paste Text
            </button>
          </div>
        </div>

        {/* File Upload Section */}
        {uploadMethod === 'file' && (
          <div>
            <label
              htmlFor='file'
              className='block text-sm font-medium text-gray-700'
            >
              Select Book File
            </label>
            <input
              id='file'
              type='file'
              accept='.txt,.pdf'
              onChange={handleFileUpload}
              className='mt-1 block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0
                         file:text-sm file:font-medium
                         file:bg-primary-50 file:text-primary-700
                         hover:file:bg-primary-100'
            />
            <p className='text-sm text-gray-500 mt-1'>
              Supported formats: PDF (.pdf) and Text (.txt) files
            </p>
            {file && (
              <div className='mt-2 p-3 bg-green-50 border border-green-200 rounded'>
                <p className='text-sm text-green-700'>
                  ✅ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Text Content Section */}
        {uploadMethod === 'text' && (
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
              placeholder='Paste your book content here. The system will automatically split it into paragraphs.'
              required
            />
            <p className='text-sm text-gray-500 mt-1'>
              The text will be automatically divided into paragraphs based on
              line breaks.
            </p>
          </div>
        )}

        {/* Preview for text files */}
        {uploadMethod === 'file' && file?.type === 'text/plain' && content && (
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              File Preview
            </label>
            <div className='mt-1 p-4 bg-gray-50 border border-gray-200 rounded max-h-40 overflow-y-auto'>
              <p className='text-sm text-gray-700 whitespace-pre-line'>
                {content.substring(0, 500)}
                {content.length > 500 && '...'}
              </p>
            </div>
          </div>
        )}

        <div className='flex justify-between'>
          <button
            type='button'
            onClick={() => navigate('/')}
            className='btn-secondary'
          >
            Cancel
          </button>
          <button type='submit' disabled={loading} className='btn-primary'>
            {loading
              ? 'Uploading...'
              : uploadMethod === 'file'
              ? `Upload ${file?.name || 'File'}`
              : 'Add Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadBook;
