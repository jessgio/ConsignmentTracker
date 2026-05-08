'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { updateTransaction, deleteTransaction } from './actions'

interface Transaction {
  id: string
  invoice_number: string
  quantity_change: number
  change_type: string
  reason: string | null
  timestamp: string
  stores: { name: string }
  skus: { sku: string }
  current_stock: number
}

interface ReportsPageProps {
  initialTransactions: Transaction[]
  stores: { name: string }[]
  skus: { sku: string }[]
}

export default function ReportsPage({ initialTransactions, stores, skus }: ReportsPageProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this transaction?')) return

  setLoading(true)
  await deleteTransaction(id)
  window.location.reload()
}

  // Toggle single checkbox
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Select / Deselect all
  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(transactions.map(t => t.id))
    }
  }

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} transactions?`)) return

    setLoading(true)
    for (const id of selectedIds) {
      await deleteTransaction(id)
    }
    setSelectedIds([])
    setTransactions(transactions.filter(t => !selectedIds.includes(t.id)))
    setLoading(false)
  }

  // Export to CSV
  const exportToCSV = () => {
    if (transactions.length === 0) return

    const headers = ['Invoice', 'Date', 'Store', 'SKU', 'Qty Change', 'Current Stock', 'Reason']
    
    const rows = transactions.map(tx => [
      tx.invoice_number,
      format(new Date(tx.timestamp), 'yyyy-MM-dd'),
      tx.stores?.name || '',
      tx.skus?.sku || '',
      tx.quantity_change,
      tx.current_stock,
      tx.reason || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Transaction Reports</h1>
        
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="bg-[#334155] hover:bg-[#475569] px-4 py-2 rounded-md text-sm font-medium"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Filters would go here */}

      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0f172a]">
            <tr>
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length === transactions.length && transactions.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Store</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Change</th>
              <th className="px-6 py-4">Current Stock</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#334155]/40">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-6 py-4 font-mono text-white">{tx.invoice_number}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {format(new Date(tx.timestamp), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-white">{tx.stores?.name}</td>
                  <td className="px-6 py-4 font-mono text-white">{tx.skus?.sku}</td>
                  <td className="px-6 py-4">
                    <span className={tx.quantity_change < 0 ? 'text-red-400' : 'text-green-400'}>
                      {tx.quantity_change}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={tx.current_stock <= 0 ? 'bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs' : 'bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs'}>
                      {tx.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3 text-right">
                    <button 
                      onClick={() => setEditingTx(tx)} 
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this transaction?')) {
                          await deleteTransaction(tx.id)
                          window.location.reload()
                        }
                      }} 
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal (same as before) */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] p-8 rounded-xl border border-[#475569] w-full max-w-md">
            <form onSubmit={async (e) => {
              e.preventDefault()
              setLoading(true)
              const formData = new FormData(e.currentTarget)
              const result = await updateTransaction(formData)
              if (result.success) {
                setEditingTx(null)
                window.location.reload()
              }
              setLoading(false)
            }}>
              <input type="hidden" name="id" value={editingTx.id} />
              {/* form fields same as before */}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingTx(null)} className="text-gray-400">Cancel</button>
                <button type="submit" disabled={loading} className="bg-blue-600 px-5 py-2 rounded-md">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}