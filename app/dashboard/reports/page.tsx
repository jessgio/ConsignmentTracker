'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateTransaction, deleteTransaction } from './actions'

interface LineItem {
  sku: string
  quantity: number
}

interface SKU {
  id: string
  sku: string
  name: string | null
}

export default function SalesReport() {
  const supabase = createClient()

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [storeName, setStoreName] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ sku: '', quantity: 1 }])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [skus, setSkus] = useState<SKU[]>([])

  // Fetch SKUs from database
  useEffect(() => {
    fetchSKUs()
  }, [])

  const fetchSKUs = async () => {
    const { data, error } = await supabase
      .from('skus')
      .select('id, sku, name')
      .order('sku')

    if (data) setSkus(data)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { sku: '', quantity: 1 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return
    const newItems = lineItems.filter((_, i) => i !== index)
    setLineItems(newItems)
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems]
    if (field === 'sku') {
      newItems[index].sku = value as string
    } else {
      newItems[index].quantity = value as number
    }
    setLineItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Basic validation
    if (!invoiceNumber || !storeName) {
      setMessage({ type: 'error', text: 'Please fill in Invoice Number and Store.' })
      setLoading(false)
      return
    }

    const hasEmptySku = lineItems.some(item => !item.sku.trim())
    if (hasEmptySku) {
      setMessage({ type: 'error', text: 'Please select a SKU for all line items.' })
      setLoading(false)
      return
    }

    const result = await submitSale(
      invoiceNumber.trim().toUpperCase(),
      storeName.trim(),
      lineItems,
      notes
    )

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Sale recorded successfully!' })
      // Reset form
      setInvoiceNumber('')
      setStoreName('')
      setLineItems([{ sku: '', quantity: 1 }])
      setNotes('')
    }

    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Sales Report</h1>

      <div className="max-w-4xl bg-[#1e293b] p-8 rounded-xl border border-[#334155]">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Invoice & Store */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Invoice Number *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
                placeholder="INV-2025-00123"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Store *</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
                placeholder="Store Name"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-300">Line Items (SKU + Quantity) *</label>
              <button type="button" onClick={addLineItem} className="text-sm bg-[#334155] hover:bg-[#475569] px-3 py-1 rounded">
                + Add SKU
              </button>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="flex gap-3 mb-3 items-center">
                <select
                  value={item.sku}
                  onChange={(e) => updateLineItem(index, 'sku', e.target.value)}
                  className="flex-1 bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
                  required
                >
                  <option value="">Select SKU</option>
                  {skus.map((sku) => (
                    <option key={sku.id} value={sku.sku}>
                      {sku.sku} {sku.name ? `- ${sku.name}` : ''}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-24 bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
                  min={1}
                  required
                />

                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                  className="px-3 text-red-400 hover:text-red-300 disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Notes / Reason</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white h-20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium disabled:opacity-70"
          >
            {loading ? 'Submitting...' : 'Submit Sales Entry'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
