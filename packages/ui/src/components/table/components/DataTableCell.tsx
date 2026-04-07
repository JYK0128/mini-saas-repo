import { type Cell, flexRender } from '@tanstack/react-table';

import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { HighlightedText } from './HighlightedText';

interface DataTableCellProps<TData, TValue> {
  cell: Cell<TData, TValue>
  globalFilter?: string
  filterColumns?: (keyof TData)[]
  isPinnedRow?: boolean
  pinnedRowType?: 'top' | 'bottom'
  pinnedRowIndex?: number
  totalPinnedRows?: number
}

/**
 * Calculates the z-index for a cell based on its pinning status.
 */
function getCellZIndex(isPinnedColumn: string | false, isPinnedRow: boolean): number {
  if (isPinnedColumn && isPinnedRow) return 60;
  if (isPinnedColumn) return 45;
  if (isPinnedRow) return 40;
  return 1;
}

/**
 * Calculates the style object for a table cell, including pinning offsets and z-index.
 */
function getCellStyles<TData, TValue>(
  cell: Cell<TData, TValue>,
  isActionColumn: boolean,
  isPinnedColumn: string | false,
  isPinnedRow: boolean,
  pinnedRowType?: 'top' | 'bottom',
  pinnedRowIndex: number = 0,
): React.CSSProperties {
  const zIndex = getCellZIndex(isPinnedColumn, isPinnedRow);
  const size = cell.column.getSize();

  return {
    width: isActionColumn ? 30 : size,
    minWidth: isActionColumn ? 30 : Math.max(size, 140),
    maxWidth: isActionColumn ? 30 : undefined,
    left: isPinnedColumn === 'left' ? `${cell.column.getStart('left')}px` : undefined,
    right: isPinnedColumn === 'right' ? `${cell.column.getAfter('right')}px` : undefined,
    top: pinnedRowType === 'top' ? `calc(2.75rem + ${pinnedRowIndex * 3}rem)` : undefined,
    bottom: pinnedRowType === 'bottom' ? `calc(${pinnedRowIndex * 3}rem)` : undefined,
    zIndex,
  };
}

/**
 * Generates the class name for a table cell based on its state and position.
 */
function getCellClassName<TData, TValue>(
  cell: Cell<TData, TValue>,
  isActionColumn: boolean,
  isPinnedRow: boolean,
  isPinnedColumn: string | false,
  isLastPinnedRow: boolean,
  isFirstBottomRow: boolean,
): string {
  const table = cell.getContext().table;
  const columnId = cell.column.id;

  const isLastLeftPinned = isPinnedColumn === 'left' && table.getLeftLeafColumns().at(-1)?.id === columnId;
  const isFirstRightPinned = isPinnedColumn === 'right' && table.getRightLeafColumns().at(0)?.id === columnId;

  return cn(
    'transition-colors relative',
    isActionColumn ? 'p-0! text-center' : 'px-4 align-middle',
    (isPinnedRow || isPinnedColumn) && 'sticky bg-card/95 backdrop-blur-sm',
    isLastPinnedRow && 'border-b border-border/80 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)]',
    isFirstBottomRow && 'border-t border-border/80 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.1)]',
    isPinnedColumn === 'left' && 'border-r',
    isPinnedColumn === 'right' && 'border-l',
    isLastLeftPinned && 'shadow-[6px_0_15px_-6px_rgba(0,0,0,0.1)]',
    isFirstRightPinned && 'shadow-[-6px_0_15px_-6px_rgba(0,0,0,0.1)]',
  );
}

export function DataTableCell<TData, TValue>({
  cell,
  globalFilter,
  filterColumns,
  isPinnedRow = false,
  pinnedRowType,
  pinnedRowIndex = 0,
  totalPinnedRows = 0,
}: Readonly<DataTableCellProps<TData, TValue>>) {
  const value = cell.getValue();
  const isActionColumn = cell.column.id === 'select' || cell.column.id === 'pin';
  const isPinnedColumn = cell.column.getIsPinned();

  const isLastPinnedRow = pinnedRowType === 'top' && pinnedRowIndex === totalPinnedRows - 1;
  const isFirstBottomRow = pinnedRowType === 'bottom' && pinnedRowIndex === 0;

  const style = getCellStyles(cell, isActionColumn, isPinnedColumn, isPinnedRow, pinnedRowType, pinnedRowIndex);
  const cellClassName = getCellClassName(cell, isActionColumn, isPinnedRow, isPinnedColumn, isLastPinnedRow, isFirstBottomRow);

  const isHighlighterEnabled = filterColumns?.includes(cell.column.id as keyof TData);
  const renderedContent = flexRender(cell.column.columnDef.cell, cell.getContext());

  return (
    <TableCell key={cell.id} className={cellClassName} style={style}>
      <div className={cn(
        'truncate w-full font-medium',
        isActionColumn ? 'flex justify-center' : '',
      )}
      >
        {isHighlighterEnabled && typeof value === 'string' && globalFilter
          ? (
            <HighlightedText text={value} highlight={globalFilter} />
          )
          : (
            renderedContent
          )}
      </div>
    </TableCell>
  );
}
