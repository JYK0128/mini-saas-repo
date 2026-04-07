'use client';

import { type ColumnDef,
         type ColumnFiltersState,
         type ColumnPinningState,
         type FilterFn,
         getCoreRowModel,
         getFacetedRowModel,
         getFacetedUniqueValues,
         getFilteredRowModel,
         getPaginationRowModel,
         getSortedRowModel,
         type PaginationState,
         type RowPinningState,
         type SortingState,
         type Updater,
         useReactTable,
         type VisibilityState } from '@tanstack/react-table';
import * as React from 'react';

declare module '@tanstack/react-table' {
  interface FilterFns {
    faceted: FilterFn<unknown>
    dateRange: FilterFn<unknown>
  }
}
import { Pin,
         PinOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { DataTableBody } from './components/DataTableBody';
import { DataTableHeader } from './components/DataTableHeader';
import { DataTablePagination } from './components/DataTablePagination';
// New Sub-components
import { DataTableToolbar } from './components/DataTableToolbar';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  filterColumns?: (keyof TData)[] // Columns to include in global filter
  filterPlaceholder?: string
  enableRowSelection?: boolean
  // Server-side props
  rowCount?: number
  pageCount?: number
  onPaginationChange?: (pagination: PaginationState) => void
  onSortingChange?: (sorting: SortingState) => void
  onGlobalFilterChange?: (globalFilter: string) => void
  onColumnFiltersChange?: (columnFilters: ColumnFiltersState) => void
  defaultPageSize?: number
  pageSizeOptions?: number[]
  enableRowPinning?: boolean
  enableColumnPinning?: boolean
}

export function DataTable<TData>({
  columns,
  data,
  filterColumns,
  filterPlaceholder,
  enableRowSelection = false,
  rowCount,
  pageCount: pageCountProp,
  onPaginationChange: onPaginationChangeProp,
  onSortingChange: onSortingChangeProp,
  onGlobalFilterChange: onGlobalFilterChangeProp,
  onColumnFiltersChange: onColumnFiltersChangeProp,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 30, 50, 100],
  enableRowPinning = false,
  enableColumnPinning = true,
}: Readonly<DataTableProps<TData>>) {
  'use no memo';
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const [rowPinning, setRowPinning] = React.useState<RowPinningState>({
    top: [],
    bottom: [],
  });
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: [],
    right: [],
  });

  const finalColumns = React.useMemo(() => {
    const selectionColumn: ColumnDef<TData> | null = enableRowSelection
      ? {
        id: 'select',
        size: 20,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
              || (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        enableGlobalFilter: false,
        ...(enableColumnPinning ? { pinned: 'left' } : {}),
      }
      : null;

    const pinColumn: ColumnDef<TData> | null = enableRowPinning
      ? {
        id: 'pin',
        size: 20,
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 transition-colors',
              row.getIsPinned()
                ? 'text-primary hover:text-primary/80'
                : 'text-muted-foreground/50 hover:text-muted-foreground',
            )}
            onClick={() => row.pin(row.getIsPinned() ? false : 'top')}
            title={row.getIsPinned() ? 'Unpin row' : 'Pin to top'}
          >
            {row.getIsPinned()
              ? (
                <PinOff className="h-4 w-4" />
              )
              : (
                <Pin className="h-4 w-4" />
              )}
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
        enableGlobalFilter: false,
        ...(enableColumnPinning ? { pinned: 'left' } : {}),
      }
      : null;

    // Process base columns
    const processedBaseColumns = columns.map((col) => {
      const colId = ('accessorKey' in col ? col.accessorKey : col.id) as keyof TData;
      if (filterColumns && colId) {
        return {
          ...col,
          enableGlobalFilter: filterColumns.includes(colId),
        };
      }
      return col;
    });

    return [
      ...(selectionColumn ? [selectionColumn] : []),
      ...processedBaseColumns,
      ...(pinColumn ? [pinColumn] : []),
    ];
  }, [enableRowSelection, enableRowPinning, enableColumnPinning, columns, filterColumns]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    rowCount,
    pageCount: pageCountProp,
    manualPagination: !!onPaginationChangeProp,
    manualSorting: !!onSortingChangeProp,
    manualFiltering: !!onGlobalFilterChangeProp || !!onColumnFiltersChangeProp,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: (updater: Updater<SortingState>) => {
      const nextValue = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(nextValue);
      onSortingChangeProp?.(nextValue);
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const nextValue = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(nextValue);
      onPaginationChangeProp?.(nextValue);
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      const nextValue = typeof updater === 'function' ? updater(globalFilter) : updater;
      setGlobalFilter(nextValue);
      onGlobalFilterChangeProp?.(nextValue);
    },
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      const nextValue = typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(nextValue);
      onColumnFiltersChangeProp?.(nextValue);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
      rowPinning,
      columnPinning,
    },
    onRowPinningChange: setRowPinning,
    onColumnPinningChange: setColumnPinning,
    enablePinning: true,
    enableSorting: true,
    enableMultiSort: true,
    defaultColumn: {
      enableSorting: false,
      enablePinning: false,
      size: 150,
      minSize: 120,
    },
    filterFns: {
      faceted: (row, id, value) => {
        return (value as unknown[]).includes(row.getValue(id));
      },
      dateRange: (row, id, value) => {
        const [start, end] = value as [string, string];
        const date = row.getValue(id);
        if (start && (date as string) < start) return false;
        if (end && (date as string) > end) return false;
        return true;
      },
    },
    keepPinnedRows: true,
  });

  return (
    <div className="space-y-4 w-full h-full flex flex-col overflow-hidden">
      <DataTableToolbar
        table={table}
        filterColumns={filterColumns}
        filterPlaceholder={filterPlaceholder}
      />

      <div className="rounded-md border bg-card overflow-auto relative flex-1 min-h-0">
        <Table className="w-full table-fixed border-separate border-spacing-0">
          <DataTableHeader
            table={table}
            enableColumnPinning={enableColumnPinning}
          />
          <DataTableBody
            table={table}
            filterColumns={filterColumns}
            globalFilter={globalFilter}
            totalColumns={finalColumns.length}
          />
        </Table>
      </div>

      <DataTablePagination
        table={table}
        rowCount={rowCount}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
