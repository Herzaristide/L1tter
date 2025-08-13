import React from 'react';

interface NotePopupProps {
  note: any;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: (noteId: string) => void;
}

const NotePopup: React.FC<NotePopupProps> = ({
  note,
  position,
  onClose,
  onDelete,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 z-40' onClick={onClose} />

      {/* Popup positioned relative to the dot */}
      <div
        className='note-popup fixed z-50 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 max-w-xs w-64 shadow-xl'
        style={{
          left: `${position.x}px`,
          top: `${position.y + 10}px`,
          transform: 'translateX(-50%)',
        }}
      >
        <div className='flex justify-between items-start mb-3'>
          <h3 className='text-sm font-light text-black dark:text-white tracking-wide uppercase'>
            Note
          </h3>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-black dark:hover:text-white transition-colors'
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
        </div>

        {note.selectedText && (
          <div className='mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400'>
            <p className='text-xs font-light text-gray-700 dark:text-gray-300 italic'>
              "{note.selectedText}"
            </p>
          </div>
        )}

        <div className='space-y-2'>
          {note.text && (
            <div>
              <p className='text-xs text-black dark:text-white font-light leading-relaxed'>
                {note.text}
              </p>
            </div>
          )}

          {note.firstContent && (
            <div>
              <p className='text-xs text-black dark:text-white font-light leading-relaxed'>
                {note.firstContent}
              </p>
            </div>
          )}

          {note.secondContent && (
            <div>
              <p className='text-xs text-black dark:text-white font-light leading-relaxed'>
                {note.secondContent}
              </p>
            </div>
          )}

          {note.thirdContent && (
            <div>
              <p className='text-xs text-black dark:text-white font-light leading-relaxed'>
                {note.thirdContent}
              </p>
            </div>
          )}
        </div>

        <div className='mt-3 pt-2 border-t border-gray-100 dark:border-gray-800'>
          <div className='flex justify-between items-center'>
            <p className='text-xs text-gray-400 dark:text-gray-500 font-light tracking-wide'>
              {note.noteType && (
                <span className='capitalize'>{note.noteType} • </span>
              )}
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
            <button
              onClick={() => onDelete(note.id)}
              className='text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1'
              title='Delete note'
            >
              <svg
                className='w-3 h-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotePopup;
