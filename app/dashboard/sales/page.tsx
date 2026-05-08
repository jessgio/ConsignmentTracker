'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitSale } from './actions'

interface LineItem {
  sku: string
  quantity: number
}

interface SKU {
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
    const fetchSKUs = async () => {
      const { data } = await supabase.from('skus').select('sku, name').order('sku')
      if (data) setSkus(data)
    }
    fetchSKUs()
  }, [])

  const addLineItem = () => {
    setLineItems([...lineItems, { sku: '', quantity: 1 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems]
    newItems[index][field] = value as any
    setLineItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // ... (validation code stays the same)
    const result = await submitSale(invoiceNumber.trim(), storeName.trim(), lineItems, notes)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Sale recorded successfully!' })
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
          
          {/* Invoice + Store */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300">Invoice Number *</label>
              <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Store *</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white" />
            </div>
          </div>

          {/* Line Items with Dropdown */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-300">Line Items *</label>
              <button type="button" onClick={addLineItem} className="text-sm bg-[#334155] px-3 py-1 rounded">+ Add SKU</button>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="flex gap-3 mb-3">
                <select
                  value={item.sku}
                  onChange={(e) => updateLineItem(index, 'sku', e.target.value)}
                  className="flex-1 bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
                  required
                >
                  <option value="">Select SKU</option>
                  {skus.map((sku) => (
                    <option key={sku.sku} value={sku.sku}>
                      {sku.sku} {sku.name ? `— ${sku.name}` : ''}
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

                <button type="button" onClick={() => removeLineItem(index)} disabled={lineItems.length === 1}
                  className="px-3 text-red-400 hover:text-red-300 disabled:opacity-40">✕</button>
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm text-gray-300">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white h-20" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium disabled:opacity-70">
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