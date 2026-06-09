export type PageRoute = 
  | { name: 'dashboard' }
  | { name: 'clients' }
  | { name: 'client', id: string }
  | { name: 'brands' }
  | { name: 'brand', id: string }
  | { name: 'tools' }
  | { name: 'audit' }
  | { name: 'search' };
