// frontend/src/components/ui/table.tsx (Basic Placeholder)
import React from 'react';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ children, className, ...props }) => (
  <table className={`min-w-full divide-y divide-gray-200 dark:divide-neutral-700 ${className || ''}`} {...props}>{children}</table>
);
export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <thead className={`bg-gray-50 dark:bg-neutral-700 ${className || ''}`} {...props}>{children}</thead>
);
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <tbody className={`bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700 ${className || ''}`} {...props}>{children}</tbody>
);
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...props }) => (
  <tr className={`${className || ''}`} {...props}>{children}</tr>
);
export const TableHead: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className || ''}`} {...props}>{children}</th>
);
export const TableCell: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${className || ''}`} {...props}>{children}</td>
);