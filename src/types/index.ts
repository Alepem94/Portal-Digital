export type LegacyRole = 'Administrador' | 'Editor' | 'Consulta' | 'Head de Medios Digitales' | string;
export type AppRole = 'admin' | 'member';
export type PermissionKey =
  | 'canManageUsers'
  | 'canEditAccounts'
  | 'canManageTools'
  | 'canViewCredentials'
  | 'canRevealCredentials'
  | 'canViewFinance'
  | 'canEditFinance'
  | 'canViewAllAccounts';

export type ModulePermissions = Partial<Record<PermissionKey, boolean>>;

export interface UserPermissions extends ModulePermissions {
  allowedClientIds?: string[];
  allowedBrandIds?: string[];
}

export type Role = LegacyRole;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  appRole?: AppRole;
  permissions?: UserPermissions;
  active: boolean;
  canEdit?: boolean;
}

export interface Client {
  id: string;
  name: string;
  status: 'Activo' | 'Inactivo';
  dateAdded: string;
  notes: string;
}

export interface Brand {
  id: string;
  clientId: string;
  name: string;
  logo: string;
  website: string;
  notes: string;
  accountManager: string;
  analysts: string[];
  cms: string[];
  brandStrategist: string;
}

// Social & Ads
export interface SocialProfile {
  id: string;
  brandId: string;
  platform: 'Instagram' | 'TikTok' | 'X (Twitter)' | 'Shopify' | 'Facebook Page' | 'LinkedIn' | 'Pinterest' | 'Otra';
  username?: string; // The @handle or page name
  url?: string;
  loginUser?: string; // App login username
  password?: string;
  passwordDate?: string;
  emailLinked?: string;
  phoneLinked?: string;
  mfaMethod?: string;
  notes?: string;
  totpSecret?: string;
}

export interface AdAccount {
  id: string;
  brandId: string;
  platform: 'Meta Business' | 'Meta Ads' | 'TikTok Business' | 'TikTok Ads' | 'Google Ads' | 'Shopify' | 'Otra';
  accountId?: string;
  user?: string;
  email?: string;
  accessLevel?: string;
  notes?: string;
}

export interface MFACode {
  id: string;
  accountId: string;
  code: string;
  status: 'Disponible' | 'Utilizado';
  usedBy?: string;
  usedDate?: string;
  usedTime?: string;
}

export interface DigitalAsset {
  id: string;
  brandId: string;
  type: 'Dominio' | 'Hosting' | 'Cloudflare' | 'Meta Business' | 'Meta Ads' | 'TikTok Business Center' | 'TikTok Ads' | 'Google Ads' | 'Analytics' | 'Search Console' | 'Tag Manager' | 'Looker Studio' | 'Shopify' | 'Github' | 'Vercel' | 'Google Business Profile' | 'Otros';
  name: string;
  url: string;
  ownership: 'Cliente' | 'Agencia' | 'Mixta';
  status: 'Activo' | 'Pendiente' | 'Sin Acceso' | 'Desconocido';
  notes: string;
}

export interface SharedTool {
  id: string;
  name: string;
  utilidad?: string;
  loginType?: 'Asignación' | 'Correo y Contraseña';
  user: string;
  password?: string;
  emailLinked: string;
  mfaMethod: string;
  smsPhone?: string;
  smsResponsible?: string;
  authAppResponsible?: string;
  authAppEmail?: string;
  emailReceiver?: string;
  passwordDate: string;
  notes: string;
  totpSecret?: string;
}

export interface BrandLink {
  id: string;
  brandId: string;
  type: 'Dashboard' | 'Archivo Estrategia' | 'Drive' | 'Dropbox' | 'Sitio Web' | 'Looker Studio' | 'Carpeta Creativos' | 'Otros';
  url: string;
  name: string;
}

export interface AuditLog {
  id: string;
  date: string;
  time: string;
  user: string;
  action: 'Inicio sesión' | 'Visualización contraseña' | 'Creación' | 'Edición' | 'Eliminación' | 'Uso código MFA' | 'Consulta registro';
  record: string;
  module: string;
}

export interface ChangeLog {
  id: string;
  date: string;
  time: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface AppDatabase {
  users: User[];
  clients: Client[];
  brands: Brand[];
  socialProfiles: SocialProfile[];
  adAccounts: AdAccount[];
  mfaCodes: MFACode[];
  digitalAssets: DigitalAsset[];
  sharedTools: SharedTool[];
  brandLinks: BrandLink[];
  auditLogs: AuditLog[];
  changeLogs: ChangeLog[];
}
