import { type Table } from '@tanstack/react-table';

import { TableBody, TableCell, TableRow } from '@/components/ui/table';

import { DataTableCell } from './DataTableCell';

interface DataTableBodyProps<TData> {
  table: Table<TData>
  filterColumns?: (keyof TData)[]
  globalFilter?: string
  totalColumns: number
}

export function DataTableBody<TData>({
  table,
  filterColumns,
  globalFilter,
  totalColumns,
}: Readonly<DataTableBodyProps<TData>>) {
  const topRows = table.getTopRows();
  const centerRows = table.getCenterRows();
  const bottomRows = table.getBottomRows();

  return (
    <TableBody>
      {/* Top Pinned Rows */}
      {topRows.map((row, index) => (
        <TableRow
          key={row.id}
          data-state={row.getIsSelected() && 'selected'}
          className="bg-card hover:bg-muted/50 transition-colors group/pinned h-12"
        >
          {row.getVisibleCells().map((cell) => (
            <DataTableCell
              key={cell.id}
              cell={cell}
              globalFilter={globalFilter}
              filterColumns={filterColumns}
              isPinnedRow={true}
              pinnedRowType="top"
              pinnedRowIndex={index}
              totalPinnedRows={topRows.length}
            />
          ))}
        </TableRow>
      ))}

      {/* Center Rows */}
      {centerRows.length > 0 && (
        centerRows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && 'selected'}
            className="hover:bg-muted/50 transition-colors h-12"
          >
            {row.getVisibleCells().map((cell) => (
              <DataTableCell
                key={cell.id}
                cell={cell}
                globalFilter={globalFilter}
                filterColumns={filterColumns}
              />
            ))}
          </TableRow>
        ))
      )}

      {centerRows.length === 0 && topRows.length === 0 && (
        <TableRow>
          <TableCell colSpan={totalColumns} className="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      )}

      {/* Bottom Pinned Rows */}
      {bottomRows.map((row, index) => (
        <TableRow
          key={row.id}
          data-state={row.getIsSelected() && 'selected'}
          className="bg-card hover:bg-muted/50 transition-colors h-12"
        >
          {row.getVisibleCells().map((cell) => (
            <DataTableCell
              key={cell.id}
              cell={cell}
              globalFilter={globalFilter}
              filterColumns={filterColumns}
              isPinnedRow={true}
              pinnedRowType="bottom"
              pinnedRowIndex={index}
              totalPinnedRows={bottomRows.length}
            />
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
