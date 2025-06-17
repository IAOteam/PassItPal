// frontend/src/pages/messaging/MessagingLayout.tsx
import ConversationsListPage from '@/pages/auth/ConversationsListPage';
import React from 'react';
import { Outlet } from 'react-router-dom';


const MessagingLayout: React.FC = () => {
  return (
    <div className="container mx-auto p-4 h-[calc(100vh-120px)]">
      <div className="flex h-full border rounded-lg shadow-md bg-white dark:bg-black dark:border-neutral-800 overflow-hidden">
        
        {/* Left Panel: Conversation List */}
        <div className="w-full md:w-1/3 border-r dark:border-neutral-800 overflow-hidden">
          <ConversationsListPage /> {/* <-- REPLACE PLACEHOLDER WITH THIS */}
        </div>

        {/* Right Panel: Active Chat Window */}
        <div className="hidden md:flex flex-1 flex-col">
            <Outlet />
        </div>

      </div>
    </div>
  );
};

export default MessagingLayout;