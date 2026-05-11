"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActionButton } from "./action-button";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const pages = getPageWindow(safePage, safeTotalPages);

  if (safeTotalPages <= 1) return null;

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-2"
      aria-label="페이지 이동"
    >
      <ActionButton
        type="button"
        variant="subtle"
        size="sm"
        disabled={safePage <= 1}
        iconStart={<ChevronLeft size={14} />}
        onClick={() => onPageChange(safePage - 1)}
      >
        이전
      </ActionButton>

      <div className="flex items-center gap-1">
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`${item}-${index}`}
              className="px-2 text-sm font-semibold text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={
                item === safePage
                  ? "h-8 min-w-8 rounded-lg bg-[var(--brand)] px-2 text-sm font-bold text-white"
                  : "h-8 min-w-8 rounded-lg px-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }
              aria-current={item === safePage ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <ActionButton
        type="button"
        variant="subtle"
        size="sm"
        disabled={safePage >= safeTotalPages}
        iconEnd={<ChevronRight size={14} />}
        onClick={() => onPageChange(safePage + 1)}
      >
        다음
      </ActionButton>
    </nav>
  );
}

function getPageWindow(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("ellipsis");
  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    pages.push(pageNumber);
  }
  if (end < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);

  return pages;
}
