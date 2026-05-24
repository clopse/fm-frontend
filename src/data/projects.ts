export interface ProjectConfig {
  id: string;
  name: string;
  location: string;
  brand: string;
  status: 'pre-opening' | 'operational';
  href: string;
  rooms?: number;
  sustainability?: string[];
}

export const PROJECTS: ProjectConfig[] = [
  {
    id: 'galway',
    name: 'Aloft Bohermore',
    location: 'Galway, Ireland',
    brand: 'Marriott Aloft',
    status: 'pre-opening',
    href: '/projects/galway',
    rooms: 163,
    sustainability: ['LEED Gold', 'BREEAM Excellent'],
  },
  {
    id: 'cork',
    name: 'South Terrace',
    location: 'Cork, Ireland',
    brand: 'TBC',
    status: 'pre-opening',
    href: '/projects/cork',
  },
  {
    id: 'penlondon',
    name: 'Peninsular House',
    location: 'London, UK',
    brand: 'TBC',
    status: 'pre-opening',
    href: '/projects/penlondon',
  },
  {
    id: 'clemence',
    name: 'Clemence Lane',
    location: 'London, UK',
    brand: 'TBC',
    status: 'pre-opening',
    href: '/projects/clemence',
  },
];
