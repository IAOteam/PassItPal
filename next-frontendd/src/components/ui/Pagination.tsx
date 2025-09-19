import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }
  // console.log(currentPage)
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
    <div className="flex justify-center items-center gap-2 dark:text-white">
      {/*  Previous button goes backward */}
       
        <Button onClick={handlePrevious} disabled={currentPage === 1}>
      <ChevronLeft className="h-4 w-4 mr-2 hover:text-blue-500" />
        Previous
      </Button>

      {pageNumbers.map(number => (
        <Button
          key={number}
          onClick={() => onPageChange(number)}
          variant={currentPage === number ?  'outline' : 'default'}
          size="icon"
        >
          {number}
        </Button>
      ))}

      {/*  Next button goes forward */}
     
      <Button onClick={handleNext} disabled={currentPage === totalPages}>
        Next
        <ChevronRight className="h-4 w-4 ml-2 hover:text-blue-500" />
      </Button>
    </div>
  );
};
