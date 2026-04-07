import { type Table } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { DropdownMenu,
         DropdownMenuCheckboxItem,
         DropdownMenuContent,
         DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterColumns?: (keyof TData)[]
  filterPlaceholder?: string
}

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number | undefined) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (value === initialValue) return;
      onChange(value === '' ? undefined : value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, onChange, debounce, initialValue]);

  return (
    <Input
      {...props}
      value={value ?? ''}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

export function DataTableToolbar<TData>({
  table,
  filterColumns,
  filterPlaceholder,
}: Readonly<DataTableToolbarProps<TData>>) {
  const globalFilter = table.getState().globalFilter as string | undefined;

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {filterColumns && filterColumns.length > 0 && (
        <DebouncedInput
          placeholder={filterPlaceholder ?? `Search in ${filterColumns.join(', ')}...`}
          value={globalFilter ?? ''}
          onChange={(val) => table.setGlobalFilter(val)}
          className="max-w-sm"
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Columns
            {' '}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
