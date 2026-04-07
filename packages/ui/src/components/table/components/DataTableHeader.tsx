import { type Table } from '@tanstack/react-table';

import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { DataTableColumnHeader } from './DataTableColumnHeader';

interface DataTableHeaderProps<TData> {
  table: Table<TData>
  enableColumnPinning?: boolean
}

export function DataTableHeader<TData>({
  table,
  enableColumnPinning,
}: Readonly<DataTableHeaderProps<TData>>) {
  return (
    <TableHeader className="z-40">
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const isAction = header.column.id === 'select';
            const isPin = header.column.id === 'pin';

            return (
              <TableHead
                key={header.id}
                className={cn(
                  'relative h-11 transition-colors group/head whitespace-nowrap',
                  'sticky top-0 bg-card/95 backdrop-blur-sm', // Solid base for all headers
                  (isAction || isPin) && 'p-0! text-center font-normal',
                  header.column.getIsPinned() ? 'z-70' : 'z-50',
                  header.column.getIsPinned() === 'left' && 'border-r',
                  header.column.getIsPinned() === 'right' && 'border-l',
                  header.column.getIsPinned() === 'left'
                  && table.getLeftLeafColumns().at(-1)?.id === header.column.id
                  && 'shadow-[6px_0_15px_-6px_rgba(0,0,0,0.1)]',
                  header.column.getIsPinned() === 'right'
                  && table.getRightLeafColumns().at(0)?.id === header.column.id
                  && 'shadow-[-6px_0_15px_-6px_rgba(0,0,0,0.1)]',
                )}
                style={{
                  width: (isAction || isPin) ? 30 : header.column.getSize(),
                  minWidth: (isAction || isPin) ? 30 : Math.max(header.column.getSize(), 140),
                  left: header.column.getIsPinned() === 'left' ? `${header.column.getStart('left')}px` : undefined,
                  right: header.column.getIsPinned() === 'right' ? `${header.column.getAfter('right')}px` : undefined,
                }}
              >
                <DataTableColumnHeader
                  header={header}
                  enableColumnPinning={enableColumnPinning}
                />
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}
