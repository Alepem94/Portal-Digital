import { AppDatabase } from '../types';

export const initialData: AppDatabase = {
  users: [
    {
      id: 'u1',
      email: 'admin@marketingagency.com',
      name: 'Admin Principal',
      role: 'Administrador',
      active: true,
    },
    {
      id: 'u2',
      email: 'editor@marketingagency.com',
      name: 'Editor Operativo',
      role: 'Editor',
      active: true,
    },
    {
      id: 'u3',
      email: 'viewer@marketingagency.com',
      name: 'Cliente o Consulta',
      role: 'Consulta',
      active: true,
    }
  ],
  clients: [
    {
      id: 'c1',
      name: 'Acme Corp',
      status: 'Activo',
      dateAdded: new Date().toISOString().split('T')[0],
      notes: 'Cliente principal del sector retail.',
    },
    {
      id: 'c2',
      name: 'Tech Solutions LLC',
      status: 'Activo',
      dateAdded: new Date().toISOString().split('T')[0],
      notes: 'Planes B2B software.',
    }
  ],
  brands: [
    {
      id: 'b1',
      clientId: 'c1',
      name: 'Acme Shoes',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Acme',
      website: 'https://acmeshoes.com',
      notes: 'Submarca enfocada en calzado deportivo.',
      accountManager: 'admin@marketingagency.com',
      analyst: 'Ana Pérez',
      cm: 'Carlos Muñoz',
      brandStrategist: 'Juan Perez',
    },
    {
      id: 'b2',
      clientId: 'c1',
      name: 'Acme Apparel',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Apparel',
      website: 'https://acmeapparel.com',
      notes: 'Línea de ropa urbana.',
      accountManager: 'admin@marketingagency.com',
      analyst: 'Ana Pérez',
      cm: 'Carlos Muñoz',
      brandStrategist: 'Juan Perez',
    },
    {
      id: 'b3',
      clientId: 'c2',
      name: 'TechFlow',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=TechFlow',
      website: 'https://techflow.io',
      notes: 'Producto SaaS principal.',
      accountManager: 'editor@marketingagency.com',
      analyst: 'Laura Gómez',
      cm: 'Pedro Santos',
      brandStrategist: 'Maria Sanchez',
    }
  ],
  instagram: [
    {
      id: 'ig1',
      brandId: 'b1',
      username: '@acmeshoes_official',
      password: 'SecurePassword123!',
      passwordDate: '2023-10-01',
      emailLinked: 'social@acmeshoes.com',
      phoneLinked: '+1234567890',
      mfaMethod: 'Google Authenticator',
      notes: 'Acceso principal de la agencia.'
    }
  ],
  tiktok: [],
  facebookPages: [],
  metaBusiness: [],
  metaAds: [],
  tiktokBusiness: [],
  tiktokAds: [],
  googleAds: [],
  mfaCodes: [
    {
      id: 'm1',
      accountId: 'ig1',
      code: '827364',
      status: 'Disponible'
    },
    {
      id: 'm2',
      accountId: 'ig1',
      code: '192837',
      status: 'Utilizado',
      usedBy: 'admin@marketingagency.com',
      usedDate: '2023-11-20',
      usedTime: '10:30:00'
    }
  ],
  digitalAssets: [
    {
      id: 'da1',
      brandId: 'b1',
      type: 'Dominio',
      name: 'acmeshoes.com',
      url: 'https://godaddy.com',
      ownership: 'Cliente',
      status: 'Activo',
      notes: 'Renovación en Dic 2024'
    }
  ],
  sharedTools: [
    {
      id: 't1',
      name: 'Semrush',
      user: 'seo@marketingagency.com',
      password: 'SemrushPassword2024',
      emailLinked: 'seo@marketingagency.com',
      mfaMethod: 'SMS',
      passwordDate: '2024-01-15',
      notes: 'Plan Guru compartido con equipo de contenidos.'
    }
  ],
  brandLinks: [
    {
      id: 'bl1',
      brandId: 'b1',
      type: 'Dashboard',
      name: 'Looker Studio Shoes',
      url: 'https://lookerstudio.google.com'
    }
  ],
  auditLogs: [
    {
      id: 'a1',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      user: 'admin@marketingagency.com',
      action: 'Creación',
      record: 'Cliente Acme Corp',
      module: 'Clientes'
    }
  ],
  changeLogs: []
};
