'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface Transaction {
  id: string
  invoice_number: string
  quantity_change: number
  change_type: string
  reason: string | null
  timestamp: string
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transaction_logs')
      .select(`
        id,
        invoice_number,
        quantity_change,
        change_type,
        reason,
        timestamp,
        stores (name),
        skus (sku)
      `)
      .order('timestamp', { ascending: false })

    if (data) setTransactions(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return

    const { error } = await supabase.from('transaction_logs').delete().eq('id', id)
    if (!error) {
      fetchTransactions() // Refresh list
    }
  }

  if (loading) {
    return <div className="text-white">Loading transactions...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Transaction Reports</h1>
        <button
          onClick={fetchTransactions}
          className="bg-[#334155] hover:bg-[#475569] px-4 py-2 rounded-md text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#0f172a]">
            <tr>
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Store</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Change</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#334155]/40">
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
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
