'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  itemsOnCurrentPage: number;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemsOnCurrentPage,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = (currentPage - 1) * itemsPerPage + itemsOnCurrentPage;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return (
      <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Pokazano {itemsOnCurrentPage} z {totalItems}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Info */}
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Pokazano <span className="font-semibold">{startItem}</span> -{' '}
        <span className="font-semibold">{endItem}</span> z{' '}
        <span className="font-semibold">{totalItems}</span>
      </div>

      {/* Pages */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Poprzednia
        </button>

        {/* Page numbers */}
        <div className="hidden items-center gap-1 sm:flex">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page as number)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Następna
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

