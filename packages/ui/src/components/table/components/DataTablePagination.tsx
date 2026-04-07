import { type Table } from '@tanstack/react-table';
import { ChevronLeft,
         ChevronRight,
         ChevronsLeft,
         ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select,
         SelectContent,
         SelectItem,
         SelectTrigger,
         SelectValue } from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  rowCount?: number
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  rowCount,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: Readonly<DataTablePaginationProps<TData>>) {
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  // Fixed 5 buttons logic
  const pageButtons: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(0, pageIndex - 2);
  const endPage = Math.min(pageCount - 1, startPage + maxButtons - 1);

  // Adjust start if we're near the end
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(0, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageButtons.push(i);
  }

  return (
    <div className="flex items-center justify-between py-2 text-muted-foreground pr-1 w-full shrink-0">
      {/* Left: Selection Count */}
      <div className="flex-1 text-sm whitespace-nowrap">
        {table.getFilteredSelectedRowModel().rows.length}
        {' '}
        of
        {' '}
        {rowCount ?? table.getFilteredRowModel().rows.length}
        {' '}
        row(s) selected.
      </div>

      {/* Center: Pagination */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(Math.max(0, pageIndex - 10))}
            disabled={pageIndex === 0}
            title="10 pages back (or jump to start)"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 mx-2">
          {pageButtons.map((index) => (
            <Button
              key={index}
              variant={pageIndex === index ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(Math.min(pageCount - 1, pageIndex + 10))}
            disabled={pageIndex === pageCount - 1}
            title="10 pages forward (or jump to end)"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right: Page Size Selector */}
      <div className="flex-1 flex items-center justify-end space-x-2">
        <span className="text-sm whitespace-nowrap">Rows per page</span>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-17.5">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
