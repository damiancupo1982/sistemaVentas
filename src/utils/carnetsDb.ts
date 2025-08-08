import { get, set } from 'idb-keyval';
import { Carnet, CarnetMember } from '../types/carnets';

const CARNETS_KEY = 'villanueva-carnets';

// Fallback to localStorage if IndexedDB fails
const storage = {
  async get(key: string) {
    try {
      return await get(key);
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : undefined;
    }
  },
  
  async set(key: string, value: any) {
    try {
      await set(key, value);
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
};

export const getCarnets = async (): Promise<Carnet[]> => {
  const carnets = await storage.get(CARNETS_KEY);
  return carnets || [];
};

export const addCarnet = async (carnetData: Omit<Carnet, 'id' | 'fechaCreacion'>): Promise<Carnet> => {
  const carnets = await getCarnets();
  
  // Generate member IDs
  const miembrosConId: CarnetMember[] = carnetData.miembros.map(miembro => ({
    ...miembro,
    id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }));
  
  const newCarnet: Carnet = {
    ...carnetData,
    id: `carnet-${Date.now()}`,
    miembros: miembrosConId,
    fechaCreacion: new Date().toISOString(),
  };
  
  carnets.push(newCarnet);
  await storage.set(CARNETS_KEY, carnets);
  return newCarnet;
};

export const updateCarnet = async (id: string, updates: Partial<Carnet>): Promise<Carnet | null> => {
  const carnets = await getCarnets();
  const index = carnets.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  carnets[index] = {
    ...carnets[index],
    ...updates,
  };
  
  await storage.set(CARNETS_KEY, carnets);
  return carnets[index];
};

export const darDeBajaCarnet = async (id: string, motivoBaja: string, dadoDeBajaPor: string): Promise<Carnet | null> => {
  return await updateCarnet(id, {
    estado: 'Baja',
    fechaBaja: new Date().toISOString(),
    motivoBaja,
    dadoDeBajaPor
  });
};

export const exportCarnetsCSV = async (): Promise<string> => {
  const carnets = await getCarnets();
  
  const headers = [
    'ID Carnet',
    'Tipo',
    'Estado',
    'Nombre',
    'Apellido',
    'DNI',
    'Barrio',
    'Número de Lote',
    'Teléfono',
    'Condición',
    'Fecha Creación',
    'Fecha Baja',
    'Motivo Baja',
    'Creado Por',
    'Dado de Baja Por'
  ];
  
  const rows: string[][] = [];
  
  carnets.forEach(carnet => {
    carnet.miembros.forEach(miembro => {
      rows.push([
        carnet.id,
        carnet.tipo,
        carnet.estado,
        miembro.nombre,
        miembro.apellido,
        miembro.dni,
        miembro.barrio,
        miembro.numeroLote,
        miembro.telefono,
        miembro.condicion,
        new Date(carnet.fechaCreacion).toLocaleDateString('es-ES'),
        carnet.fechaBaja ? new Date(carnet.fechaBaja).toLocaleDateString('es-ES') : '',
        carnet.motivoBaja || '',
        carnet.creadoPor,
        carnet.dadoDeBajaPor || ''
      ]);
    });
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};