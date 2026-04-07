import { flexRender, type Header } from '@tanstack/react-table';
import { ArrowLeftToLine,
         ArrowRightToLine,
         Calendar,
         ChevronDown,
         ChevronUp,
         Filter,
         MoreVertical,
         PinOff,
         RotateCcw,
         Search } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { DropdownMenu,
         DropdownMenuCheckboxItem,
         DropdownMenuContent,
         DropdownMenuItem,
         DropdownMenuSeparator,
         DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColumnMeta {
  faceted?: {
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
    facetCounts?: Record<string, number>
  }
  filterType?: 'number' | 'date' | 'text'
}

interface DataTableColumnHeaderProps<TData, TValue> {
  header: Header<TData, TValue>
  enableColumnPinning?: boolean
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
      onChange={(e) => {
        const val = e.target.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
        setValue(val);
      }}
    />
  );
}

export function DataTableColumnHeader<TData, TValue>({
  header,
  enableColumnPinning = true,
}: Readonly<DataTableColumnHeaderProps<TData, TValue>>) {
  const isAction = header.column.id === 'select';
  const column = header.column;

  const meta = column.columnDef.meta as ColumnMeta;
  const facetedConfig = meta?.faceted;
  const filterType = meta?.filterType;

  const filterValue = column.getFilterValue();
  const selectedValues = facetedConfig ? new Set(filterValue as string[]) : new Set();
  const facetValues = facetedConfig ? column.getFacetedUniqueValues() : undefined;

  if (header.isPlaceholder) {
    return null;
  }

  if (isAction) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </div>
    );
  }

  const isFiltered = filterValue !== undefined
    && (Array.isArray(filterValue) ? filterValue.some((v) => v !== undefined && v !== '') : filterValue !== '');

  return (
    <div className="flex items-center gap-1 h-full w-full px-2.5 overflow-hidden">
      <div
        className="flex-1 min-w-0 flex items-center gap-1.5 cursor-pointer group/title h-full"
        onClick={() => header.column.toggleSorting(undefined, true)}
      >
        <div className="truncate font-bold text-[11px] uppercase tracking-wide text-muted-foreground group-hover/title:text-foreground transition-colors whitespace-nowrap">
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>

        {header.column.getIsSorted() && (
          <div className="shrink-0">
            {header.column.getIsSorted() === 'asc'
              ? (
                <ChevronUp className="h-3.5 w-3.5 text-primary" />
              )
              : (
                <ChevronDown className="h-3.5 w-3.5 text-primary" />
              )}
          </div>
        )}

        {isFiltered && (
          <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
        )}
      </div>

      <div
        className={cn(
          'shrink-0 flex items-center gap-0.5',
          (!header.column.getIsPinned() && !isFiltered) && 'invisible group-hover/head:visible',
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6 rounded-sm p-0 text-muted-foreground/60 hover:text-foreground hover:bg-accent',
                (header.column.getIsPinned() || isFiltered) && 'text-primary bg-primary/5 visible',
              )}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-1">
            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
              Sorting
            </div>

            <DropdownMenuCheckboxItem
              checked={header.column.getIsSorted() === 'asc'}
              onCheckedChange={() => header.column.toggleSorting(false)}
            >
              <ChevronUp className="mr-2 h-4 w-4 text-muted-foreground/70" />
              Sort Ascending
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={header.column.getIsSorted() === 'desc'}
              onCheckedChange={() => header.column.toggleSorting(true, true)}
            >
              <ChevronDown className="mr-2 h-4 w-4 text-muted-foreground/70" />
              Sort Descending
            </DropdownMenuCheckboxItem>

            {header.column.getIsSorted() && (
              <DropdownMenuItem
                onClick={() => header.column.clearSorting()}
                className="text-destructive focus:text-destructive"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear Sorting
              </DropdownMenuItem>
            )}

            {/* Faceted Filter Section */}
            {facetedConfig && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none flex items-center gap-1.5">
                  <Filter className="h-3 w-3" />
                  Filter:
                  {' '}
                  {header.column.columnDef.header as string}
                </div>
                <div className="max-h-50 overflow-y-auto">
                  {facetedConfig.options.map((option) => {
                    const isSelected = selectedValues.has(option.value);
                    const count = facetedConfig.facetCounts
                      ? facetedConfig.facetCounts[option.value]
                      : facetValues?.get(option.value);

                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={isSelected}
                        onCheckedChange={() => {
                          if (isSelected) {
                            selectedValues.delete(option.value);
                          }
                          else {
                            selectedValues.add(option.value);
                          }
                          const filterValues = Array.from(selectedValues);
                          column.setFilterValue(
                            filterValues.length ? filterValues : undefined,
                          );
                        }}
                      >
                        {option.icon && (
                          <option.icon className="mr-2 h-4 w-4 text-muted-foreground/70" />
                        )}
                        <span className="flex-1 text-xs">{option.label}</span>
                        {count !== undefined && (
                          <span className="ml-2 text-[10px] font-mono text-muted-foreground/50">
                            {count}
                          </span>
                        )}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </div>
              </>
            )}

            {/* Number Range Filter Section */}
            {filterType === 'number' && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none flex items-center gap-1.5">
                  <Filter className="h-3 w-3" />
                  Range:
                  {' '}
                  {header.column.columnDef.header as string}
                </div>
                <div className="px-2 py-2 flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                  <DebouncedInput
                    placeholder="Min"
                    type="number"
                    value={(filterValue as [number, number])?.[0] ?? ''}
                    onChange={(val) => {
                      column.setFilterValue((old: [number, number]) => [val as number, old?.[1]]);
                    }}
                    className="h-8 text-xs bg-muted/30"
                  />
                  <span className="text-muted-foreground text-xs">-</span>
                  <DebouncedInput
                    placeholder="Max"
                    type="number"
                    value={(filterValue as [number, number])?.[1] ?? ''}
                    onChange={(val) => {
                      column.setFilterValue((old: [number, number]) => [old?.[0], val as number]);
                    }}
                    className="h-8 text-xs bg-muted/30"
                  />
                </div>
              </>
            )}

            {/* Date Range Filter Section */}
            {filterType === 'date' && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Date Range:
                  {' '}
                  {header.column.columnDef.header as string}
                </div>
                <div className="px-2 py-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="date"
                    value={(filterValue as [string, string])?.[0] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value || undefined;
                      column.setFilterValue((old: [string, string]) => [val, old?.[1]]);
                    }}
                    className="h-8 text-[11px] bg-muted/30"
                  />
                  <Input
                    type="date"
                    value={(filterValue as [string, string])?.[1] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value || undefined;
                      column.setFilterValue((old: [string, string]) => [old?.[0], val]);
                    }}
                    className="h-8 text-[11px] bg-muted/30"
                  />
                </div>
              </>
            )}

            {/* Text Search Filter Section */}
            {filterType === 'text' && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none flex items-center gap-1.5">
                  <Search className="h-3 w-3" />
                  Search:
                  {' '}
                  {header.column.columnDef.header as string}
                </div>
                <div className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                  <DebouncedInput
                    placeholder={`Search ${header.column.columnDef.header as string}...`}
                    value={(filterValue as string) ?? ''}
                    onChange={(val) => column.setFilterValue(val)}
                    className="h-8 text-xs bg-muted/30"
                  />
                </div>
              </>
            )}

            {isFiltered && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => column.setFilterValue(undefined)}
                  className="justify-center text-center font-bold text-xs text-destructive focus:text-destructive py-2"
                >
                  Clear Column Filter
                </DropdownMenuItem>
              </>
            )}

            {enableColumnPinning
              && header.column.getCanPin()
              && header.column.id !== 'pin'
              && header.column.id !== 'select' && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
                  Pinning
                </div>

                <DropdownMenuCheckboxItem
                  checked={header.column.getIsPinned() === 'left'}
                  onCheckedChange={() =>
                    header.column.pin(header.column.getIsPinned() === 'left' ? false : 'left')}
                >
                  <ArrowLeftToLine className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  Pin Left
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={header.column.getIsPinned() === 'right'}
                  onCheckedChange={() =>
                    header.column.pin(header.column.getIsPinned() === 'right' ? false : 'right')}
                >
                  <ArrowRightToLine className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  Pin Right
                </DropdownMenuCheckboxItem>

                {header.column.getIsPinned() && (
                  <DropdownMenuItem
                    onClick={() => header.column.pin(false)}
                    className="text-destructive focus:text-destructive"
                  >
                    <PinOff className="mr-2 h-4 w-4" />
                    Remove Pin
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
