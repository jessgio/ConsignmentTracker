'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitSale(formData: FormData) {
  const supabase = await createClient()

  const invoiceNumber = formData.get('invoiceNumber') as string
  const storeName = formData.get('storeName') as string
  const sku = formData.get('sku') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const notes = formData.get('notes') as string | null

  if (!invoiceNumber || !storeName || !sku) {
    return { error: 'Invoice Number, Store, and SKU are required.' }
  }

  // 1. Get or create Store
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

  // 2. Get or create SKU
  let { data: skuData } = await supabase
    .from('skus')
    .select('*')
    .eq('sku', sku.trim().toUpperCase())
    .single()

  if (!skuData) {
    const { data: newSku, error } = await supabase
      .from('skus')
      .insert({
        sku: sku.trim().toUpperCase(),
        name: sku.trim(),
      })
      .select()
      .single()

    if (error) return { error: 'Failed to create SKU' }
    skuData = newSku
  }

  // 3. Check if invoice number already exists
  const { data: existingInvoice } = await supabase
    .from('transaction_logs')
    .select('id')
    .eq('invoice_number', invoiceNumber.trim().toUpperCase())
    .single()

  if (existingInvoice) {
    return { error: `Invoice number ${invoiceNumber} already exists.` }
  }

  // 4. Insert transaction
  const { error } = await supabase.from('transaction_logs').insert({
    invoice_number: invoiceNumber.trim().toUpperCase(),
    store_id: store.id,
    sku_id: skuData.id,
    change_type: 'sale',
    quantity_change: -quantity,
    reason: notes || null,
    source: 'manual',
  })

  if (error) {
    console.error(error)
    return { error: 'Failed to record sale.' }
  }

  // 5. Update inventory
  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('store_id', store.id)
    .eq('sku_id', skuData.id)
    .single()

  if (inventory) {
    await supabase
      .from('inventory')
      .update({ quantity: inventory.quantity - quantity })
      .eq('id', inventory.id)
  } else {
    await supabase.from('inventory').insert({
      store_id: store.id,
      sku_id: skuData.id,
      quantity: -quantity,
    })
  }

  revalidatePath('/dashboard/inventory')
  revalidatePath('/dashboard/reports')

  return { success: true }
}