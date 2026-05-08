'use client'

import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

interface InventoryItem {
  store_name: string
  sku: string
  sku_name: string | null
  category: string | null
  quantity: number
  last_updated: string
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; sku?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all stores, skus, and categories for filters
  const { data: stores } = await supabase.from('stores').select('name').order('name')
  const { data: skus } = await supabase.from('skus').select('sku').order('sku')
  const { data: categoriesData } = await supabase.from('skus').select('category').not('category', 'is', null)
  const uniqueCategories = [...new Set(categoriesData?.map(c => c.category).filter(Boolean) || [])]

  // Build query with filters
  let query = supabase
    .from('inventory')
    .select(`
      quantity,
      last_updated,
      stores (name),
      skus (sku, name, category)
    `)

  if (params.store) {
    query = query.eq('stores.name', params.store)
  }
  if (params.sku) {
    query = query.eq('skus.sku', params.sku)
  }
  if (params.category) {
    query = query.eq('skus.category', params.category)
  }

  const { data: inventoryData } = await query.order('last_updated', { ascending: false })

  const inventory: InventoryItem[] = (inventoryData || []).map((item: any) => ({
    store_name: item.stores?.name || 'Unknown',
    sku: item.skus?.sku || 'Unknown',
    sku_name: item.skus?.name,
    category: item.skus?.category,
    quantity: item.quantity,
    last_updated: item.last_updated,
  }))

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Current Inventory</h1>
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] mb-6">
        <form className="flex flex-wrap gap-4">
          <select 
            name="store" 
            defaultValue={params.store || ''}
            className="bg-[#0f172a] border border-[#475569] text-white px-4 py-2 rounded-md"
          >
            <option value="">All Stores</option>
            {stores?.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>

          <select 
            name="sku" 
            defaultValue={params.sku || ''}
            className="bg-[#0f172a] border border-[#475569] text-white px-4 py-2 rounded-md"
          >
            <option value="">All SKUs</option>
            {skus?.map(s => (
              <option key={s.sku} value={s.sku}>{s.sku}</option>
            ))}
          </select>

          <select 
            name="category" 
            defaultValue={params.category || ''}
            className="bg-[#0f172a] border border-[#475569] text-white px-4 py-2 rounded-md"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md text-sm font-medium"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#0f172a]">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-gray-300">Store</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-300">SKU</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-300">SKU Name</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-300">Category</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-300">Current Stock</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-300">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {inventory.length > 0 ? (
              inventory.map((item, index) => (
                <tr key={index} className="hover:bg-[#334155]/50">
                  <td className="px-6 py-4 text-white">{item.store_name}</td>
                  <td className="px-6 py-4 font-mono text-white">{item.sku}</td>
                  <td className="px-6 py-4 text-gray-300">{item.sku_name || '-'}</td>
                  <td className="px-6 py-4 text-gray-300">{item.category || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      item.quantity <= 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {format(new Date(item.last_updated), 'MMM dd, yyyy HH:mm')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No inventory records found with the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}