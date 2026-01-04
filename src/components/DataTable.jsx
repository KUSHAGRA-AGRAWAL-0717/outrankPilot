import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function DataTable({
  data = [],
  columns = [],
  onBulkAction,
  bulkActionLabel = 'Bulk Action',
}) {
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;

  return (
    <div className="border border-[#8A94B3]/30 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Bulk Action Bar */}
      {onBulkAction && selectedRows.length > 0 && (
        <div className="p-4 border-b border-[#8A94B3]/30 bg-[#F6F8FC] flex justify-between items-center">
          <span className="text-sm font-medium text-[#0B1F3B]">
            {selectedRows.length} selected
          </span>
          <button
            onClick={() => onBulkAction(selectedRows.map(r => r.original))}
            className="px-4 py-2 rounded-lg bg-[#FFD84D] hover:bg-[#F5C842] text-[#0B1F3B] font-semibold transition-colors text-sm"
          >
            {bulkActionLabel}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F6F8FC] border-b border-[#8A94B3]/30">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-left px-6 py-4 font-semibold text-[#0B1F3B] cursor-pointer select-none hover:bg-[#F6F8FC]/80 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === 'asc' && (
                        <ChevronUp className="h-4 w-4 text-[#1B64F2]" />
                      )}
                      {header.column.getIsSorted() === 'desc' && (
                        <ChevronDown className="h-4 w-4 text-[#1B64F2]" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[#5B6B8A]">
                  No data available
                </td>
              </tr>
            )}

            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id} 
                className="border-b border-[#8A94B3]/20 hover:bg-[#F6F8FC]/50 transition-colors"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 text-[#5B6B8A]">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#8A94B3]/30 bg-white">
        <div className="text-sm text-[#5B6B8A] font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 border border-[#8A94B3]/30 rounded-lg text-sm font-medium text-[#0B1F3B] hover:bg-[#F6F8FC] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 border border-[#8A94B3]/30 rounded-lg text-sm font-medium text-[#0B1F3B] hover:bg-[#F6F8FC] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}