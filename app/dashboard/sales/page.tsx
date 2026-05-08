'use client'

import { useState } from 'react'
import { submitSale } from './actions'

export default function SalesReport() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)

    const result = await submitSale(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Sale recorded successfully!' })
      // Reset form (optional)
      const form = document.getElementById('sales-form') as HTMLFormElement
      form?.reset()
    }

    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Sales Report</h1>

      <div className="max-w-2xl bg-[#1e293b] p-8 rounded-xl border border-[#334155]">
        <form id="sales-form" action={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Invoice Number *</label>
            <input 
              type="text" 
              name="invoiceNumber" 
              required 
              className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Store *</label>
              <input 
                type="text" 
                name="storeName" 
                required 
                placeholder="e.g. Downtown Store"
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white" 
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">SKU *</label>
              <input 
                type="text" 
                name="sku" 
                required 
                placeholder="e.g. SKU-001"
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Quantity Sold</label>
              <input 
                type="number" 
                name="quantity" 
                defaultValue={1} 
                min={1}
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white" 
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Date</label>
              <input 
                type="date" 
                name="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white" 
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Notes / Reason</label>
            <textarea 
              name="notes" 
              className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white h-20" 
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium disabled:opacity-70"
          >
            {loading ? 'Recording Sale...' : 'Submit Sales Entry'}
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