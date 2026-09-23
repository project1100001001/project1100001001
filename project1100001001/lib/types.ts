// lib/types.ts
// Tipos para el modelo de datos basado en 001_auth_and_core.sql y 002_listing.sql

export type UserRole = 'buyer' | 'seller' | 'admin'

export interface AppUser {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  city: string | null
  avatar_url: string | null
  created_at: string
}

export interface Seller {
  id: string
  owner_user_id: string
  business_name: string
  business_type: string | null
  city: string | null
  description: string | null
  phone: string | null
  whatsapp: string | null
  verified: boolean
  verified_at: string | null
  rating_avg: number
  rating_count: number
  status: string
  created_at: string
}

export type CategoryAppliesTo = 'product' | 'service' | 'both'

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  applies_to: CategoryAppliesTo
}

export type ListingType = 'product' | 'service' | 'article'

export type ListingStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'paused'
  | 'archived'

export interface ListingMedia {
  id: string
  listing_id: string
  url: string
  kind: 'image' | 'video'
  position: number
}

export interface Listing {
  id: string
  seller_id: string
  category_id: string
  type: ListingType
  title: string
  description: string | null
  price: number | null
  price_unit: string | null
  city: string | null
  status: ListingStatus
  reject_reason: string | null
  stock: number | null
  attrs: Record<string, any>
  views_count: number
  contact_count: number
  created_at: string
  published_at: string | null
}

export interface ListingWithRelations extends Listing {
  category?: Category | null
  seller?: Seller | null
  listing_media?: ListingMedia[]
}
