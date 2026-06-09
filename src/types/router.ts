export type PageRoute = 
  | { name: 'dashboard' }
  | { name: 'clients' }
  | { name: 'client', id: string }
  | { name: 'brand', id: string }
  | { name: 'team' }
  | { name: 'tools' }
  | { name: 'audit' }
  | { name: 'search' };
