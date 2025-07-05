//frontend/src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-3xl font-semibold mt-4 mb-2 dark:text-white">Page Not Found</h2>
            <p className="text-muted-foreground mb-6">Sorry, we couldn't find the page you were looking for.</p>
            <div className="flex gap-4">
                <Button asChild>
                    <Link to="/">Go to Homepage</Link>
                </Button>
                <Button variant="ghost" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </div>
        </div>
    );
};

export default NotFoundPage;