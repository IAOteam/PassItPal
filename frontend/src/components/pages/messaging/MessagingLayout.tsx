import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import ConversationsListPage from '@/pages/auth/ConversationsListPage';

const MessagingLayout: React.FC = () => {
  const { conversationId } = useParams();

  return (
    <div className="mt-14 h-[calc(100vh-120px)] w-full overflow-hidden">
      <div className="flex h-full w-full md:border md:rounded-lg shadow-md dark:border-neutral-800 bg-white dark:bg-black">

        {/* Show conversation list always on desktop, only on mobile if no active chat */}
        <div
          className={`
            w-full md:w-1/3 h-full border-r dark:border-neutral-800 overflow-y-auto
            ${conversationId ? 'hidden md:block' : 'block'}
          `}
        >
          <ConversationsListPage />
        </div>

        {/* Chat view */}
        <div
          className={`
            w-full h-full flex-col overflow-hidden
            ${conversationId ? 'flex' : 'hidden md:flex'}
          `}
        >
          <Outlet />
        </div>
        
      </div>
    </div>
  );
};

export default MessagingLayout;
