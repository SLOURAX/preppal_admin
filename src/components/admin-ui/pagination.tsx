import { cn } from "@/lib/utils";

interface PaginationProps {
  readonly currentPage: number;
  readonly itemLabel?: string;
  readonly onPageChange: (page: number) => void;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export function Pagination({
  currentPage,
  itemLabel = "items",
  onPageChange,
  pageSize,
  totalItems,
  totalPages,
}: PaginationProps) {
  if (!totalItems) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const visiblePages = pages.filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  return (
    <div className="border-border mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-[.6rem]">
        Showing{" "}
        <span className="text-foreground font-semibold">{firstItem}</span>–
        <span className="text-foreground font-semibold">{lastItem}</span> of{" "}
        <span className="text-foreground font-semibold">{totalItems}</span>{" "}
        {itemLabel}
      </p>
      <nav
        aria-label={`${itemLabel} pagination`}
        className="flex items-center gap-1"
      >
        <button
          className="border-border text-muted-foreground hover:bg-surface-subtle h-8 rounded-lg border px-2.5 text-[.6rem] font-semibold disabled:cursor-not-allowed disabled:opacity-35"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          Previous
        </button>
        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          return (
            <span className="contents" key={page}>
              {previousPage && page - previousPage > 1 ? (
                <span className="text-muted-foreground grid size-8 place-items-center text-[.6rem]">
                  …
                </span>
              ) : null}
              <button
                aria-current={currentPage === page ? "page" : undefined}
                className={cn(
                  "grid size-8 place-items-center rounded-lg text-[.6rem] font-bold transition",
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
                )}
                onClick={() => onPageChange(page)}
                type="button"
              >
                {page}
              </button>
            </span>
          );
        })}
        <button
          className="border-border text-muted-foreground hover:bg-surface-subtle h-8 rounded-lg border px-2.5 text-[.6rem] font-semibold disabled:cursor-not-allowed disabled:opacity-35"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
