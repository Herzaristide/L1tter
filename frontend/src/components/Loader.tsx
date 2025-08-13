import React from 'react';

const Loader = () => {
  return (
    <div className='flex justify-center py-8'>
      <div className='animate-spin h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full'></div>
    </div>
  );
};

export default Loader;
