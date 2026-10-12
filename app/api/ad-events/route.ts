// app/api/ad-events/route.ts
// Registra en tiempo real impresiones, clics y contactos directos por WhatsApp para las campañas

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { adOrderId, eventType, listingId } = body

    if (!eventType || !['impression', 'click', 'whatsapp'].includes(eventType)) {
      return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
    }

    // Limpiar prefijo 'ad-' o 'listing-' si viene desde componentes cliente
    let cleanAdOrderId: string | null = null
    let cleanListingId: string | null = listingId || null

    if (adOrderId && typeof adOrderId === 'string') {
      if (adOrderId.startsWith('ad-')) {
        cleanAdOrderId = adOrderId.replace('ad-', '')
      } else if (adOrderId.startsWith('listing-')) {
        cleanListingId = cleanListingId || adOrderId.replace('listing-', '')
      } else {
        cleanAdOrderId = adOrderId
      }
    }

    const supabase = await createClient()

    // 1. Intentar llamar a la función RPC record_ad_event
    if (cleanAdOrderId) {
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('record_ad_event', {
          p_ad_order_id: cleanAdOrderId,
          p_event_type: eventType,
          p_listing_id: cleanListingId,
        })

        if (!rpcErr && rpcData?.success) {
          return NextResponse.json({ success: true, via: 'rpc', data: rpcData })
        }
      } catch (rpcCatch) {
        // Fallback a actualización directa
        console.warn('Aviso ejecutando RPC record_ad_event:', rpcCatch)
      }

      // 2. Fallback: Actualización directa en ad_order
      try {
        const { data: currentOrder } = await supabase
          .from('ad_order')
          .select('id, clicks_count, impressions_count, contacts_count')
          .eq('id', cleanAdOrderId)
          .maybeSingle()

        if (currentOrder) {
          const updates: Record<string, any> = {}
          if (eventType === 'impression') {
            updates.impressions_count = (Number(currentOrder.impressions_count) || 0) + 1
          } else if (eventType === 'click') {
            updates.clicks_count = (Number(currentOrder.clicks_count) || 0) + 1
          } else if (eventType === 'whatsapp') {
            updates.contacts_count = (Number(currentOrder.contacts_count) || 0) + 1
            updates.clicks_count = (Number(currentOrder.clicks_count) || 0) + 1
          }

          await supabase.from('ad_order').update(updates).eq('id', cleanAdOrderId)
        }
      } catch (updErr) {
        console.warn('Aviso en fallback ad_order:', updErr)
      }
    }

    // 3. Registrar evento de contacto si fue WhatsApp
    if (eventType === 'whatsapp' && cleanListingId) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        await supabase.from('contact_event').insert({
          listing_id: cleanListingId,
          buyer_user_id: user?.id || null,
          channel: 'whatsapp',
          ad_order_id: cleanAdOrderId || null,
        })
      } catch (contactErr) {
        // No bloquear la respuesta si contact_event falla
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error procesando ad event:', err?.message || err)
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}
