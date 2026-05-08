'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ManualAdjustments() {
  const supabase = createClient()

  const [storeName, setStoreName] = useState('')
  const [sku, setSku] = useState('')
  const [quantityChange, setQuantityChange] = useState(0)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!storeName || !sku) {
      setMessage({ type: 'error', text: 'Store and SKU are required.' })
      setLoading(false)
      return
    }

    // Get or create store
    let { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('name', storeName.trim())
      .single()

    if (!store) {
      const { data: newStore } = await supabase
        .from('stores')
        .insert({ name: storeName.trim() })
        .select()
        .single()
      store = newStore
    }

    // Get or create SKU
    let { data: skuData } = await supabase
      .from('skus')
      .select('*')
      .eq('sku', sku.trim().toUpperCase())
      .single()

    if (!skuData) {
      const { data: newSku } = await supabase
        .from('skus')
        .insert({ sku: sku.trim().toUpperCase(), name: sku })
        .select()
        .single()
      skuData = newSku
    }

    // Insert transaction
    const { error: txError } = await supabase.from('transaction_logs').insert({
      invoice_number: `ADJ-${Date.now()}`,
      store_id: store.id,
      sku_id: skuData.id,
      change_type: 'adjustment',
      quantity_change: quantityChange,
      reason: reason || null,
      source: 'manual',
    })

    if (txError) {
      setMessage({ type: 'error', text: 'Failed to record adjustment.' })
      setLoading(false)
      return
    }

    // Update inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('store_id', store.id)
      .eq('sku_id', skuData.id)
      .single()

    if (inventory) {
      await supabase
        .from('inventory')
        .update({ quantity: inventory.quantity + quantityChange })
        .eq('id', inventory.id)
    } else {
      await supabase.from('inventory').insert({
        store_id: store.id,
        sku_id: skuData.id,
        quantity: quantityChange,
      })
    }

    setMessage({ type: 'success', text: 'Adjustment recorded successfully!' })
    setQuantityChange(0)
    setReason('')
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Manual Stock Adjustments</h1>

      <div className="max-w-2xl bg-[#1e293b] p-8 rounded-xl border border-[#334155]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Store *</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Downtown Store"
                required
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">SKU *</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-001"
                required
                className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Quantity Change</label>
            <input
              type="number"
              value={quantityChange}
              onChange={(e) => setQuantityChange(parseInt(e.target.value))}
              className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Use positive numbers to add stock, negative to reduce.</p>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Defective, Used as tester, Lost, etc."
              className="w-full bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white h-24"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium disabled:opacity-70"
          >
            {loading ? 'Applying Adjustment...' : 'Apply Adjustment'}
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