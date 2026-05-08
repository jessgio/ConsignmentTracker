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

  // 1. Check if invoice number already exists
  const { data: existingInvoice } = await supabase
    .from('transaction_logs')
    .select('id')
    .eq('invoice_number', invoiceNumber)
    .single()

  if (existingInvoice) {
    return { error: `Invoice number ${invoiceNumber} already exists.` }
  }

  // 2. Get or create the store
  let { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('name', storeName)
    .single()

  if (!store) {
    const { data: newStore, error } = await supabase
      .from('stores')
      .insert({ name: storeName })
      .select()
      .single()

    if (error) return { error: 'Failed to create store' }
    store = newStore
  }

  // 3. Process each line item
  for (const item of lineItems) {
    // Get or create SKU
    let { data: skuData } = await supabase
      .from('skus')
      .select('*')
      .eq('sku', item.sku)
      .single()

    if (!skuData) {
      const { data: newSku } = await supabase
        .from('skus')
        .insert({ sku: item.sku })
        .select()
        .single()

      if (!newSku) return { error: 'Failed to create SKU' }
      skuData = newSku
    }

    // Insert transaction log
    await supabase.from('transaction_logs').insert({
      invoice_number: invoiceNumber,
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
