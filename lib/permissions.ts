// lib/permissions.ts
// Definición centralizada de roles y matriz de permisos del marketplace

export type UserRole = 'guest' | 'buyer' | 'seller' | 'admin'

export interface RoleDefinition {
  name: string
  description: string
  color: string
  badge: string
  icon: string
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  guest: {
    name: 'Invitado',
    description: 'Navegante no autenticado en la plataforma',
    color: 'zinc',
    badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    icon: '👤',
  },
  buyer: {
    name: 'Comprador',
    description: 'Explora productos/servicios y contacta vendedores',
    color: 'blue',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    icon: '🛒',
  },
  seller: {
    name: 'Vendedor',
    description: 'Publica anuncios, gestiona catálogo y promociona mediante campañas',
    color: 'emerald',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    icon: '🏪',
  },
  admin: {
    name: 'Administrador',
    description: 'Control total de moderación, finanzas, cuentas y gestión de roles',
    color: 'purple',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    icon: '🛡️',
  },
}

export type Permission =
  | 'view_catalog'         // Ver feed, filtros y detalle de anuncios
  | 'contact_whatsapp'     // Contactar comercio por WhatsApp
  | 'manage_profile'       // Ver y editar perfil en /cuenta
  | 'publish_listings'     // Crear y publicar en /publicar
  | 'manage_own_listings'  // Ver y gestionar sus anuncios en /mis-publicaciones
  | 'manage_inventory'     // Control de stock, tiempos de servicio y ventas en /inventario
  | 'manage_campaigns'     // Historial de anuncios patrocinados en /mis-campanas
  | 'recharge_wallet'      // Recargar saldo y promocionar en /promocionar
  | 'moderate_content'     // Aprobar / rechazar anuncios en /admin
  | 'moderate_campaigns'   // Aprobar / rechazar campañas publicitarias en /admin
  | 'manage_recharges'     // Aprobar solicitudes de saldo en /admin
  | 'manage_user_roles'    // Quitar y poner roles de usuarios en /admin

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: [
    'view_catalog',
    'contact_whatsapp',
  ],
  buyer: [
    'view_catalog',
    'contact_whatsapp',
    'manage_profile',
  ],
  seller: [
    'view_catalog',
    'contact_whatsapp',
    'manage_profile',
    'publish_listings',
    'manage_own_listings',
    'manage_inventory',
    'manage_campaigns',
    'recharge_wallet',
  ],
  admin: [
    'view_catalog',
    'contact_whatsapp',
    'manage_profile',
    'publish_listings',
    'manage_own_listings',
    'manage_inventory',
    'manage_campaigns',
    'recharge_wallet',
    'moderate_content',
    'moderate_campaigns',
    'manage_recharges',
    'manage_user_roles',
  ],
}

/**
 * Determina si un rol cuenta con un permiso específico.
 */
export function hasPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  const normalizedRole: UserRole =
    role === 'admin'
      ? 'admin'
      : role === 'seller'
      ? 'seller'
      : role === 'buyer'
      ? 'buyer'
      : 'guest'

  return ROLE_PERMISSIONS[normalizedRole]?.includes(permission) ?? false
}
