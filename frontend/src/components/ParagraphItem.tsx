import React, { memo, useCallback } from 'react';

interface Paragraph {
  id: string;
  content: string;
  order: number;
  chapterNumber?: number;
  readingTimeEst?: number;
  selected: boolean;
}

const ParagraphItem = memo(
  ({
    paragraph,
    onContentChange,
    onToggleSelect,
  }: {
    paragraph: Paragraph;
    onContentChange: (id: string, content: string) => void;
    onToggleSelect: (id: string) => void;
  }) => {
    const adjustTextareaHeight = useCallback(
      (textarea: HTMLTextAreaElement) => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(textarea.scrollHeight, 80) + 'px';
      },
      []
    );

    const handleToggle = useCallback(() => {
      onToggleSelect(paragraph.id);
    }, [paragraph.id, onToggleSelect]);

    const handleContentChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onContentChange(paragraph.id, e.target.value);
        adjustTextareaHeight(e.target);
      },
      [paragraph.id, onContentChange, adjustTextareaHeight]
    );

    return (
      <div
        className={`relative flex mt-2 mr-2 ${
          !paragraph.selected ? 'opacity-50' : ''
        }`}
      >
        {/* Selection checkbox */}
        <div className='absolute -left-8 top-3 z-10'>
          <input
            type='checkbox'
            checked={paragraph.selected}
            onChange={handleToggle}
            className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
            title={
              paragraph.selected ? 'Unselect paragraph' : 'Select paragraph'
            }
          />
        </div>

        <textarea
          value={paragraph.content}
          onChange={handleContentChange}
          onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
          ref={(el) => {
            if (el) {
              setTimeout(() => adjustTextareaHeight(el), 0);
            }
          }}
          className={`w-full px-6 py-3 border rounded-2xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 resize-none text-sm overflow-hidden ${
            !paragraph.selected ? 'bg-gray-100 dark:bg-gray-800' : ''
          }`}
          placeholder='Paragraph content...'
          style={{ height: 'auto' }}
          disabled={!paragraph.selected}
        />
      </div>
    );
  }
);

export default ParagraphItem;
