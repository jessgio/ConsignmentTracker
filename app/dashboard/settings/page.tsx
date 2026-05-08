'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Store {
  id: string
  name: string
  created_at: string
}

interface SKU {
  id: string
  sku: string
  name: string | null
  category: string | null
  created_at: string
}

export default function SettingsPage() {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'stores' | 'skus'>('stores')
  
  // Stores state
  const [stores, setStores] = useState<Store[]>([])
  const [newStoreName, setNewStoreName] = useState('')
  
  // SKUs state
  const [skus, setSkus] = useState<SKU[]>([])
  const [newSkuCode, setNewSkuCode] = useState('')
  const [newSkuName, setNewSkuName] = useState('')
  const [newSkuCategory, setNewSkuCategory] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load data on mount
  const fetchData = async () => {
    const { data: storesData } = await supabase.from('stores').select('*').order('created_at', { ascending: false })
    const { data: skusData } = await supabase.from('skus').select('*').order('created_at', { ascending: false })

    if (storesData) setStores(storesData)
    if (skusData) setSkus(skusData)
  }

  // Run once on load
  useState(() => {
    fetchData()
  })

  // ====================== STORES ======================
  const handleAddStore = async () => {
    if (!newStoreName.trim()) return
    setLoading(true)

    const { error } = await supabase.from('stores').insert({
      name: newStoreName.trim()
    })

    if (error) {
      setMessage({ type: 'error', text: 'Store already exists or failed to create.' })
    } else {
      setMessage({ type: 'success', text: 'Store created successfully!' })
      setNewStoreName('')
      fetchData()
    }
    setLoading(false)
  }

  const handleDeleteStore = async (id: string) => {
    if (!confirm('Delete this store? This may affect existing records.')) return

    const { error } = await supabase.from('stores').delete().eq('id', id)
    
    if (error) {
      setMessage({ type: 'error', text: 'Failed to delete store.' })
    } else {
      fetchData()
      setMessage({ type: 'success', text: 'Store deleted.' })
    }
  }

  // ====================== SKUs ======================
  const handleAddSku = async () => {
    if (!newSkuCode.trim()) return
    setLoading(true)

    const { error } = await supabase.from('skus').insert({
      sku: newSkuCode.trim().toUpperCase(),
      name: newSkuName.trim() || null,
      category: newSkuCategory.trim() || null
    })

    if (error) {
      setMessage({ type: 'error', text: 'SKU already exists or failed to create.' })
    } else {
      setMessage({ type: 'success', text: 'SKU created successfully!' })
      setNewSkuCode('')
      setNewSkuName('')
      setNewSkuCategory('')
      fetchData()
    }
    setLoading(false)
  }

  const handleDeleteSku = async (id: string) => {
    if (!confirm('Delete this SKU? This may affect existing inventory.')) return

    const { error } = await supabase.from('skus').delete().eq('id', id)
    
    if (error) {
      setMessage({ type: 'error', text: 'Failed to delete SKU.' })
    } else {
      fetchData()
      setMessage({ type: 'success', text: 'SKU deleted.' })
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#334155] mb-8">
        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-3 px-5 text-sm font-medium transition-all ${activeTab === 'stores' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
        >
          Stores
        </button>
        <button
          onClick={() => setActiveTab('skus')}
          className={`pb-3 px-5 text-sm font-medium transition-all ${activeTab === 'skus' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
        >
          SKUs
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* STORES TAB */}
      {activeTab === 'stores' && (
        <div>
          <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] mb-6">
            <h3 className="font-semibold text-white mb-4">Add New Store</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Store Name"
                className="flex-1 bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
              />
              <button onClick={handleAddStore} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md font-medium">
                Add Store
              </button>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-[#334155]">
            <table className="w-full text-sm">
              <thead className="bg-[#0f172a]">
                <tr>
                  <th className="px-6 py-4 text-left">Store Name</th>
                  <th className="px-6 py-4 text-left">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id} className="border-t border-[#334155]">
                    <td className="px-6 py-4 text-white font-medium">{store.name}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(store.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteStore(store.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No stores found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SKUs TAB */}
      {activeTab === 'skus' && (
        <div>
          <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] mb-6">
            <h3 className="font-semibold text-white mb-4">Add New SKU</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={newSkuCode}
                onChange={(e) => setNewSkuCode(e.target.value)}
                placeholder="SKU Code *"
                className="bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
              />
              <input
                type="text"
                value={newSkuName}
                onChange={(e) => setNewSkuName(e.target.value)}
                placeholder="SKU Name"
                className="bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
              />
              <input
                type="text"
                value={newSkuCategory}
                onChange={(e) => setNewSkuCategory(e.target.value)}
                placeholder="Category"
                className="bg-[#0f172a] border border-[#475569] px-4 py-2 rounded-md text-white"
              />
              <button onClick={handleAddSku} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md font-medium">
                Add SKU
              </button>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-[#334155]">
            <table className="w-full text-sm">
              <thead className="bg-[#0f172a]">
                <tr>
                  <th className="px-6 py-4 text-left">SKU</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Category</th>
                  <th className="px-6 py-4 text-left">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((skuItem) => (
                  <tr key={skuItem.id} className="border-t border-[#334155]">
                    <td className="px-6 py-4 font-mono text-white">{skuItem.sku}</td>
                    <td className="px-6 py-4 text-gray-300">{skuItem.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-300">{skuItem.category || '—'}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(skuItem.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteSku(skuItem.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {skus.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No SKUs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}