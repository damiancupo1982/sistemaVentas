export interface CarnetMember {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  barrio: string;
  numeroLote: string;
  telefono: string;
  condicion: 'Titular' | 'Familiar 1' | 'Familiar 2' | 'Familiar 3' | 'Familiar Adherente';
}

export interface Carnet {
  id: string;
  tipo: 'Individual' | 'Familiar';
  estado: 'Activo' | 'Baja';
  miembros: CarnetMember[];
  fechaCreacion: string;
  fechaBaja?: string;
  motivoBaja?: string;
  creadoPor: string;
  dadoDeBajaPor?: string;
}

export interface CarnetFormData {
  tipo: 'Individual' | 'Familiar';
  miembros: Omit<CarnetMember, 'id'>[];
}