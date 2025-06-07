import React from 'react'

const Footer: React.FC = () => {
  return (
    <div className="pagePadding">
        <div className="flex justify-between items-center h-96">
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="w-32 h-32" />
          </div>
          <div className="flex items-center">
            <p>Copyright 2025 PassItPal</p>
          </div>
        </div>
    </div>
  )
}

export default Footer