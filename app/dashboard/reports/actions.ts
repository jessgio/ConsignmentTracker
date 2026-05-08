'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTransaction(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const type = formData.get('type') as string
  const reason = formData.get('reason') as string | null

  const { data: original } = await supabase
    .from('transaction_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (!original) return { error: 'Transaction not found' }

  const newQuantityChange = type === 'sale' ? -quantity : quantity

  // Update transaction
  const { error } = await supabase
    .from('transaction_logs')
    .update({
      quantity_change: newQuantityChange,
      reason: reason || null,
      change_type: type,
    })
    .eq('id', id)

  if (error) return { error: 'Failed to update transaction' }

  // Adjust inventory
  const difference = newQuantityChange - original.quantity_change

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('store_id', original.store_id)
    .eq('sku_id', original.sku_id)
    .single()

  if (inventory) {
    await supabase
      .from('inventory')
      .update({ quantity: inventory.quantity + difference })
      .eq('id', inventory.id)
  }

  revalidatePath('/dashboard/reports')
  revalidatePath('/dashboard/inventory')

  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()

  const { data: transaction } = await supabase
    .from('transaction_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (transaction) {
    // Restore inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('store_id', transaction.store_id)
      .eq('sku_id', transaction.sku_id)
      .single()

    if (inventory) {
      await supabase
        .from('inventory')
        .update({ quantity: inventory.quantity - transaction.quantity_change })
        .eq('id', inventory.id)
    }

    await supabase.from('transaction_logs').delete().eq('id', id)
  }

  revalidatePath('/dashboard/reports')
  revalidatePath('/dashboard/inventory')

  return { success: true }
}