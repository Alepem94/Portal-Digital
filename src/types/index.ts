export type Role = 'Administrador' | 'Editor' | 'Consulta' | 'Head de Medios Digitales' | string;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
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
export interface InstagramAcc {
  id: string;
  brandId: string;
  username: string;
  password?: string;
  passwordDate: string;
  emailLinked: string;
  phoneLinked: string;
  mfaMethod: string;
  authEmail?: string;
  authPassword?: string;
  notes: string;
  totpSecret?: string;
}

export interface TikTokAcc {
  id: string;
  brandId: string;
  username: string;
  password?: string;
  passwordDate: string;
  emailLinked: string;
  phoneLinked: string;
  mfaMethod: string;
  authEmail?: string;
  authPassword?: string;
  notes: string;
  totpSecret?: string;
}

export interface FacebookPage {
  id: string;
  brandId: string;
  pageName: string;
  url: string;
  pageId: string;
  notes: string;
}

export interface MetaBusiness {
  id: string;
  brandId: string;
  user: string;
  email: string;
  accessLevel: 'Administrador' | 'Empleado' | 'Analista' | 'Personalizado';
  notes: string;
}

export interface MetaAds {
  id: string;
  brandId: string;
  user: string;
  email: string;
  accessLevel: string;
  notes: string;
}

// Other generic access structures
export interface GenericAccess {
  id: string;
  brandId: string;
  user: string;
  email: string;
  accessLevel: string;
  notes: string;
}

export interface GoogleAds {
  id: string;
  brandId: string;
  email: string;
  accessLevel: string;
  accountId: string;
  notes: string;
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
  instagram: InstagramAcc[];
  tiktok: TikTokAcc[];
  facebookPages: FacebookPage[];
  metaBusiness: MetaBusiness[];
  metaAds: MetaAds[];
  tiktokBusiness: GenericAccess[];
  tiktokAds: GenericAccess[];
  googleAds: GoogleAds[];
  mfaCodes: MFACode[];
  digitalAssets: DigitalAsset[];
  sharedTools: SharedTool[];
  brandLinks: BrandLink[];
  auditLogs: AuditLog[];
  changeLogs: ChangeLog[];
}
