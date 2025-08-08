import React from 'react';
import { X, User, Phone, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { Carnet } from '../types/carnets';

interface CarnetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  carnet: Carnet | null;
}

const CarnetDetailModal: React.FC<CarnetDetailModalProps> = ({ isOpen, onClose, carnet }) => {
  if (!isOpen || !carnet) return null;

  const getCondicionColor = (condicion: string) => {
    switch (condicion) {
      case 'Titular':
        return 'bg-blue-100 text-blue-800';
      case 'Familiar 1':
        return 'bg-green-100 text-green-800';
      case 'Familiar 2':
        return 'bg-yellow-100 text-yellow-800';
      case 'Familiar 3':
        return 'bg-purple-100 text-purple-800';
      case 'Familiar Adherente':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <User className="h-5 w-5 mr-2 text-green-600" />
            Detalle del Carnet - {carnet.tipo}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Información del Carnet */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">ID del Carnet</p>
                <p className="text-lg font-semibold text-gray-900">{carnet.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tipo</p>
                <p className="text-lg font-semibold text-gray-900">{carnet.tipo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  carnet.estado === 'Activo' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {carnet.estado === 'Baja' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {carnet.estado}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cantidad de Miembros</p>
                <p className="text-lg font-semibold text-gray-900">{carnet.miembros.length}</p>
              </div>
            </div>
          </div>

          {/* Información de Fechas */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Fecha de Creación</p>
                  <p className="text-sm text-blue-700">
                    {new Date(carnet.fechaCreacion).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-xs text-blue-600">Creado por: {carnet.creadoPor}</p>
                </div>
              </div>
              
              {carnet.estado === 'Baja' && carnet.fechaBaja && (
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Fecha de Baja</p>
                    <p className="text-sm text-red-700">
                      {new Date(carnet.fechaBaja).toLocaleDateString('es-ES')}
                    </p>
                    {carnet.dadoDeBajaPor && (
                      <p className="text-xs text-red-600">Por: {carnet.dadoDeBajaPor}</p>
                    )}
                    {carnet.motivoBaja && (
                      <p className="text-xs text-red-600 mt-1">Motivo: {carnet.motivoBaja}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Miembros del Carnet */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Miembros del Carnet ({carnet.miembros.length})
            </h3>
            
            <div className="space-y-4">
              {carnet.miembros.map((miembro, index) => (
                <div key={miembro.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-900">
                        {miembro.nombre} {miembro.apellido}
                      </h4>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCondicionColor(miembro.condicion)}`}>
                      {miembro.condicion}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">DNI</p>
                      <p className="text-sm text-gray-900">{miembro.dni || 'No especificado'}</p>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ubicación</p>
                        <p className="text-sm text-gray-900">
                          {miembro.barrio || 'No especificado'} 
                          {miembro.numeroLote && ` - Lote ${miembro.numeroLote}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Teléfono</p>
                        <p className="text-sm text-gray-900">{miembro.telefono}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600">Posición</p>
                      <p className="text-sm text-gray-900">#{index + 1}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarnetDetailModal;