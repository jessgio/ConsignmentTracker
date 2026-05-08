'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitSale(
  invoiceNumber: string,
  storeName: string,
  lineItems: { sku: string; quantity: number }[],
  notes: string
) {
  const supabase = await createClient()

  // Check if invoice already exists
  const { data: existing } = await supabase
    .from('transaction_logs')
    .select('id')
    .eq('invoice_number', invoiceNumber.trim().toUpperCase())
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: `Invoice number ${invoiceNumber} already exists.` }
  }

  // Get or create store
  let { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('name', storeName.trim())
    .single()

  if (!store) {
    const { data: newStore, error } = await supabase
      .from('stores')
      .insert({ name: storeName.trim() })
      .select()
      .single()
    if (error) return { error: 'Failed to create store' }
    store = newStore
  }

  // Process each line item
  for (const item of lineItems) {
    // Get or create SKU
    let { data: skuData } = await supabase
      .from('skus')
      .select('*')
      .eq('sku', item.sku.trim().toUpperCase())
      .single()

    if (!skuData) {
      const { data: newSku } = await supabase
        .from('skus')
        .insert({ sku: item.sku.trim().toUpperCase() })
        .select()
        .single()
      skuData = newSku
    }

    // Insert transaction
    await supabase.from('transaction_logs').insert({
      invoice_number: invoiceNumber.trim().toUpperCase(),
      store_id: store.id,
      sku_id: skuData.id,
      change_type: 'sale',
      quantity_change: -item.quantity,
      reason: notes || null,
      source: 'manual',
    })

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
        .update({ quantity: inventory.quantity - item.quantity })
        .eq('id', inventory.id)
    } else {
      await supabase.from('inventory').insert({
        store_id: store.id,
        sku_id: skuData.id,
        quantity: -item.quantity,
      })
    }
  }

  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard/reports')

  return { success: true }
}