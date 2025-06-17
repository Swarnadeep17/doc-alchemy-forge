import React from 'react'

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-16 w-16 bg-gray-300 dark:bg-gray-700 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  )
}

export default LoadingScreen
