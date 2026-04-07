import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ColumnDef, PaginationState, SortingState, ColumnFiltersState } from "@tanstack/react-table"
import { 
  CheckCircle2, 
  HelpCircle, 
  XCircle,
  Code,
  Palette,
  Briefcase,
  ShieldCheck
} from "lucide-react"

import { DataTable } from "./DataTable"

interface User {
  id: string
  name: string
  email: string
  status: "pending" | "active" | "inactive"
  role: string
  department: string
  age: number
  salary: number
  lastActive: string
  createdAt: string
  updatedAt: string
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 150,
    enableSorting: true,
    enablePinning: true,
    meta: {
      filterType: "text",
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 250,
    meta: {
      filterType: "text",
    },
  },
  {
    accessorKey: "age",
    header: "Age",
    size: 80,
    enableSorting: true,
    cell: ({ getValue }) => <div className="text-right pr-4">{getValue<number>()}</div>,
    meta: {
      filterType: "number",
    },
    filterFn: "inNumberRange",
  },
  {
    accessorKey: "salary",
    header: "Salary",
    size: 120,
    enableSorting: true,
    cell: ({ getValue }) => (
      <div className="text-right font-mono pr-4 text-primary">
        ${getValue<number>().toLocaleString()}
      </div>
    ),
    meta: {
      filterType: "number",
    },
    filterFn: "inNumberRange",
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 100,
    enableSorting: true,
    enablePinning: true,
    meta: {
      faceted: {
        options: [
          { label: "Active", value: "active", icon: CheckCircle2 },
          { label: "Pending", value: "pending", icon: HelpCircle },
          { label: "Inactive", value: "inactive", icon: XCircle },
        ],
      },
    },
    filterFn: "faceted",
  },
  {
    accessorKey: "role",
    header: "Role",
    size: 150,
    enableSorting: true,
    enablePinning: true,
    meta: {
      faceted: {
        options: [
          { label: "Developer", value: "Developer", icon: Code },
          { label: "Designer", value: "Designer", icon: Palette },
          { label: "Manager", value: "Manager", icon: Briefcase },
          { label: "QA", value: "QA", icon: ShieldCheck },
        ],
      },
    },
    filterFn: "faceted",
  },
  {
    accessorKey: "department",
    header: "Department",
    size: 180,
  },
    {
    accessorKey: "createdAt",
    header: "Created At",
    size: 200,
    enableSorting: true,
    meta: {
      filterType: "date",
    },
    filterFn: "dateRange",
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    size: 200,
    enableSorting: true,
  },
  {
    accessorKey: "lastActive",
    header: "Last Active",
    size: 150,
  },
]

const manyData: User[] = Array.from({ length: 200 }, (_, i) => ({
  id: `${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  status: (["active", "pending", "inactive"] as const)[i % 3],
  role: (["Developer", "Designer", "Manager", "QA"] as const)[i % 4],
  department: (["Sales", "HR", "Engineering", "Marketing"] as const)[i % 4],
  age: 20 + (i % 30),
  salary: 50000 + (i * 1000) % 50000,
  lastActive: "2024-03-30",
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
  updatedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0],
}))

const meta: Meta<typeof DataTable<User>> = {
  title: "Table/DataTable",
  component: DataTable,
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => (
    <div className="p-8 w-full">
      <DataTable {...args} />
    </div>
  ),
  tags: ["autodocs"],
} satisfies Meta<typeof DataTable<User>>

export default meta

type Story = StoryObj<typeof DataTable<User>>

export const Default: Story = {
  args: {
    columns: columns,
    data: manyData,
    filterColumns: ["name", "email"],
    filterPlaceholder: "이름 또는 이메일로 검색...",
    enableRowSelection: true,
    enableRowPinning: true,
  },
}

export const ServerSide: Story = {
  render: () => {
    const [data, setData] = React.useState<User[]>([])
    const [totalCount, setTotalCount] = React.useState(0)
    const [loading, setLoading] = React.useState(false)
    const [pagination, setPagination] = React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    })
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = React.useState("")

    const fetchServerData = React.useCallback(async () => {
      setLoading(true)
      console.log("Fetching server data with:", {
        pagination,
        sorting,
        columnFilters,
        globalFilter,
      })

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      let filtered = [...manyData]

      // Filter
      if (globalFilter) {
        filtered = filtered.filter(row => 
          row.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
          row.email.toLowerCase().includes(globalFilter.toLowerCase())
        )
      }
      
      columnFilters.forEach(filter => {
        const value = filter.value
        if (!value) return
        
        if (filter.id === "status" || filter.id === "role") {
          filtered = filtered.filter(row => (value as string[]).includes(row[filter.id as keyof User] as string))
        } else if (filter.id === "age" || filter.id === "salary") {
          const [min, max] = value as [number, number]
          if (min !== undefined) filtered = filtered.filter(row => (row[filter.id as keyof User] as number) >= min)
          if (max !== undefined) filtered = filtered.filter(row => (row[filter.id as keyof User] as number) <= max)
        }
      })

      // Sort
      if (sorting.length > 0) {
        filtered.sort((a, b) => {
          for (const sort of sorting) {
            const { id, desc } = sort
            const valA = a[id as keyof User]
            const valB = b[id as keyof User]
            
            if (valA === valB) continue
            
            const result = valA < valB ? -1 : 1
            return desc ? -result : result
          }
          return 0
        })
      }

      setTotalCount(filtered.length)

      // Paginate
      const start = pagination.pageIndex * pagination.pageSize
      const paged = filtered.slice(start, start + pagination.pageSize)

      setData(paged)
      setLoading(false)
    }, [pagination, sorting, columnFilters, globalFilter])

    React.useEffect(() => {
      fetchServerData()
    }, [fetchServerData])

    return (
      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/10">
          <div>
            <h3 className="font-bold text-primary">Server-Side Simulation Mode</h3>
            <p className="text-xs text-muted-foreground">Check browser console to see raw server action calls.</p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-primary font-bold text-sm animate-pulse">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
              Fetching from Server...
            </div>
          )}
        </div>
        
        <DataTable
          columns={columns}
          data={data}
          rowCount={totalCount}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          onColumnFiltersChange={setColumnFilters}
          onGlobalFilterChange={setGlobalFilter}
          filterColumns={["name", "email"]}
          enableRowSelection
          enableRowPinning
        />
      </div>
    )
  }
}

export const Pagination: Story = {
  args: {
    columns: columns,
    data: manyData,
    filterColumns: ["name", "email"],
    enableRowSelection: true,
    enableRowPinning: true,
  },
}

export const RowPinning: Story = {
  args: {
    columns: columns,
    data: manyData,
    filterColumns: ["name", "email"],
    enableRowSelection: true,
    enableRowPinning: true,
  },
}

export const FixedParentHeight: Story = {
  args: {
    columns: columns,
    data: manyData,
    filterColumns: ["name", "email"],
    enableRowSelection: true,
    enableRowPinning: true,
  },
  render: (args) => (
    <div className="p-8 w-full">
      <div className="h-[400px] border rounded-lg overflow-auto bg-background p-4">
        <DataTable {...args} />
      </div>
    </div>
  ),
}

export const ColumnPinning: Story = {
  args: {
    columns: columns,
    data: manyData,
    enableRowSelection: true,
    enableRowPinning: true,
  },
}

export const Empty: Story = {
  args: {
    columns: columns,
    data: [] as User[],
  },
}
