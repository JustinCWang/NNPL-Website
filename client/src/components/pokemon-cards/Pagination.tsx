"use client";
/*
  Shared pagination control for Pokemon Cards browsing.
  - Shows first/last pages, pages near the current page, and ellipsis where appropriate
*/

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
};

function buildPagesToShow(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  const pages: Array<number | "ellipsis"> = [];

  pages.push(1);

  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);

  if (startPage > 2) pages.push("ellipsis");

  for (let i = startPage; i <= endPage; i++) pages.push(i);

  if (endPage < totalPages - 1) pages.push("ellipsis");

  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

export default function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  const pagesToShow = buildPagesToShow(currentPage, totalPages);

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="theme-button-subtle px-2 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Prev
      </button>

      <div className="flex items-center gap-1">
        {pagesToShow.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span key={`ellipsis-${index}`} className="px-1 text-gray-400 text-xs">
                ...
              </span>
            );
          }

          return (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={`px-2 py-1 min-w-[28px] rounded text-xs font-medium ${
                currentPage === item ? "theme-button" : "theme-button-subtle"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="theme-button-subtle px-2 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}


