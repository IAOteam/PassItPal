import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      <Button onClick={handlePrevious} disabled={currentPage <= 1}>Previous</Button>
      {pageNumbers.map(number => (
        <Button
          key={number}
          onClick={() => onPageChange(number)}
          variant={currentPage === number ? 'default' : 'outline'}
          size="icon"
        >
          {number}
        </Button>
      ))}
      <Button onClick={handleNext} disabled={currentPage >= totalPages}>Next</Button>
    </div>
  );
};
