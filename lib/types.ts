// lib/types.ts
// Tipos para el modelo de datos basado en 001_auth_and_core.sql, 002_listing.sql y 005_ads_v1.sql

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

// ------------------------------------------------------------------
// Módulo de Inventario y Ventas (009_inventory_and_sales_management.sql)
// ------------------------------------------------------------------

export type SaleStatus = 'completed' | 'in_progress' | 'pending' | 'cancelled'

export interface Sale {
  id: string
  seller_id: string
  listing_id: string
  buyer_id?: string | null
  buyer_name?: string | null
  buyer_phone?: string | null
  buyer_email?: string | null
  quantity: number
  unit_price: number
  total_amount: number
  type: ListingType
  status: SaleStatus
  service_duration?: string | null
  service_scheduled_for?: string | null
  notes?: string | null
  has_reviewed?: boolean
  created_at: string
  listing?: ListingWithRelations | null
}

// ------------------------------------------------------------------
// Módulo de Reseñas y Calificaciones (010_reviews_ratings_and_seller_reputation.sql)
// ------------------------------------------------------------------

export interface Review {
  id: string
  listing_id: string
  seller_id: string
  buyer_user_id: string
  sale_id?: string | null
  rating: number // 1 to 5
  comment: string
  recommend?: boolean
  status: 'published' | 'hidden'
  created_at: string
  buyer?: AppUser | null
  listing?: Listing | null
}

// ------------------------------------------------------------------
// Módulo de Anuncios y Publicidad (005_ads_v1.sql)
// ------------------------------------------------------------------

export interface Advertiser {
  id: string
  seller_id: string
  legal_name: string
  status: string
  created_at: string
}

export interface AdAccount {
  id: string
  advertiser_id: string
  balance: number
  created_at: string
}

export interface WalletTransaction {
  id: number
  ad_account_id: string
  kind: 'topup' | 'spend' | 'refund'
  amount: number
  balance_after: number
  ref_type?: string | null
  ref_id?: string | null
  idempotency_key?: string | null
  created_at: string
}

export interface AdSlot {
  id: string
  surface: string
  formats: string[]
  max_ads: number
}

export interface AdPackage {
  id: string
  name: string
  slot_id: string
  duration_days: number
  price: number
  max_active_slots: number
  active: boolean
}

export type AdOrderStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'scheduled'
  | 'live'
  | 'rejected'
  | 'paused'
  | 'ended'
  | 'cancelled'

export interface AdOrder {
  id: string
  ad_account_id: string
  package_id: string
  listing_id: string | null
  headline: string
  body: string | null
  image_url: string
  cta_label: string | null
  target_city: string | null
  target_category: string | null
  status: AdOrderStatus
  reject_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  starts_at: string | null
  ends_at: string | null
  price_paid: number
  created_at: string
  submitted_at: string | null
}

export interface AdOrderWithRelations extends AdOrder {
  package?: AdPackage | null
  listing?: Listing | null
  account?: AdAccount | null
}

export interface AdAccountWithRelations extends AdAccount {
  advertiser?: (Advertiser & { seller?: Seller | null }) | null
}

export interface WalletTransactionWithRelations extends WalletTransaction {
  ad_account?: AdAccountWithRelations | null
}

export type RechargeRequestStatus = 'pending' | 'approved' | 'rejected'

export interface AdRechargeRequest {
  id: string
  ad_account_id: string
  seller_id: string
  package_id?: string | null
  amount: number
  payment_method: string
  reference_code?: string | null
  proof_image_url?: string | null
  notes?: string | null
  status: RechargeRequestStatus
  admin_notes?: string | null
  approved_by?: string | null
  approved_at?: string | null
  created_at: string
}

export interface AdRechargeRequestWithRelations extends AdRechargeRequest {
  package?: AdPackage | null
  seller?: Seller | null
  ad_account?: AdAccountWithRelations | null
}
