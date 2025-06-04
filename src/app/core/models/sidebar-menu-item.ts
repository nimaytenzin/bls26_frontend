export interface SidebarMenuItem {
  section?: string;
  label: string;
  icon: string; // PrimeNG icon class like 'pi pi-home'
  route: string;
  roles: string[];
}
