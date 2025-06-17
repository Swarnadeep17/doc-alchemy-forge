import React from 'react'

const TabLoadingState = () => {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-gray-800/50 border border-white/5" />
        ))}
      </div>
      <div className="h-96 rounded-lg bg-gray-800/50 border border-white/5" />
    </div>
  )
}

export default TabLoadingState
