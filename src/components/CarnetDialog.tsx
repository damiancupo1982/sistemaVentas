import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, User, Users, Save } from 'lucide-react';
import { CarnetFormData, CarnetMember } from '../types/carnets';

interface CarnetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (carnetData: CarnetFormData) => void;
}

const BARRIOS = [
  'Santa Catalina',
  'San Isidro Labrador',
  'Santa Clara',
  'San Agustín',
  'San Marco',
  'Santa Teresa',
  'San Rafael',
  'San Gabriel',
  'San Francisco',
  'San Benito',
  'San Juan',
  'Santa Ana',
  'OTRO'
];

const CONDICIONES_INDIVIDUAL = ['Titular'];
const CONDICIONES_FAMILIAR = ['Titular', 'Familiar 1', 'Familiar 2', 'Familiar 3', 'Familiar Adherente'];

const CarnetDialog: React.FC<CarnetDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<CarnetFormData>({
    tipo: 'Individual',
    miembros: [{
      nombre: '',
      apellido: '',
      dni: '',
      barrio: '',
      numeroLote: '',
      telefono: '',
      condicion: 'Titular'
    }]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        tipo: 'Individual',
        miembros: [{
          nombre: '',
          apellido: '',
          dni: '',
          barrio: '',
          numeroLote: '',
          telefono: '',
          condicion: 'Titular'
        }]
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleTipoChange = (tipo: 'Individual' | 'Familiar') => {
    setFormData({
      tipo,
      miembros: [{
        nombre: '',
        apellido: '',
        dni: '',
        barrio: '',
        numeroLote: '',
        telefono: '',
        condicion: 'Titular'
      }]
    });
    setErrors({});
  };

  const addMiembro = () => {
    if (formData.miembros.length >= 5) return;
    
    const nextCondicion = getNextCondicion();
    if (!nextCondicion) return;

    setFormData({
      ...formData,
      miembros: [...formData.miembros, {
        nombre: '',
        apellido: '',
        dni: '',
        barrio: '',
        numeroLote: '',
        telefono: '',
        condicion: nextCondicion
      }]
    });
  };

  const removeMiembro = (index: number) => {
    if (index === 0) return; // No se puede eliminar el titular
    
    setFormData({
      ...formData,
      miembros: formData.miembros.filter((_, i) => i !== index)
    });
  };

  const updateMiembro = (index: number, field: keyof Omit<CarnetMember, 'id'>, value: string) => {
    const updatedMiembros = [...formData.miembros];
    updatedMiembros[index] = {
      ...updatedMiembros[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      miembros: updatedMiembros
    });
  };

  const getNextCondicion = (): string | null => {
    const usedCondiciones = formData.miembros.map(m => m.condicion);
    const availableCondiciones = CONDICIONES_FAMILIAR.filter(c => !usedCondiciones.includes(c));
    return availableCondiciones[0] || null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    formData.miembros.forEach((miembro, index) => {
      // Validaciones para el titular (todos los campos obligatorios)
      if (index === 0) {
        if (!miembro.nombre.trim()) {
          newErrors[`nombre-${index}`] = 'El nombre es obligatorio';
        }
        if (!miembro.apellido.trim()) {
          newErrors[`apellido-${index}`] = 'El apellido es obligatorio';
        }
        if (!miembro.dni.trim()) {
          newErrors[`dni-${index}`] = 'El DNI es obligatorio';
        } else if (!/^\d{7,8}$/.test(miembro.dni)) {
          newErrors[`dni-${index}`] = 'El DNI debe tener 7 u 8 dígitos';
        }
        if (!miembro.barrio.trim()) {
          newErrors[`barrio-${index}`] = 'El barrio es obligatorio';
        }
        if (!miembro.numeroLote.trim()) {
          newErrors[`numeroLote-${index}`] = 'El número de lote es obligatorio';
        }
        if (!miembro.telefono.trim()) {
          newErrors[`telefono-${index}`] = 'El teléfono es obligatorio';
        }
      } else {
        // Para el resto de miembros, solo nombre y teléfono son obligatorios
        if (!miembro.nombre.trim()) {
          newErrors[`nombre-${index}`] = 'El nombre es obligatorio';
        }
        if (!miembro.telefono.trim()) {
          newErrors[`telefono-${index}`] = 'El teléfono es obligatorio';
        }
        // Validar DNI si se proporciona
        if (miembro.dni.trim() && !/^\d{7,8}$/.test(miembro.dni)) {
          newErrors[`dni-${index}`] = 'El DNI debe tener 7 u 8 dígitos';
        }
      }
    });

    // Validar DNIs únicos (solo los que no estén vacíos)
    const dnis = formData.miembros.map(m => m.dni).filter(dni => dni.trim());
    const duplicatedDnis = dnis.filter((dni, index) => dnis.indexOf(dni) !== index);
    if (duplicatedDnis.length > 0) {
      duplicatedDnis.forEach(dni => {
        const index = formData.miembros.findIndex(m => m.dni === dni);
        newErrors[`dni-${index}`] = 'DNI duplicado';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const canAddMember = formData.tipo === 'Familiar' && formData.miembros.length < 5 && getNextCondicion();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600" />
            Nuevo Carnet de Socio
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Tipo de Carnet */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Carnet
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tipo"
                  value="Individual"
                  checked={formData.tipo === 'Individual'}
                  onChange={(e) => handleTipoChange(e.target.value as 'Individual')}
                  className="mr-3"
                />
                <User className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">Individual</span>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tipo"
                  value="Familiar"
                  checked={formData.tipo === 'Familiar'}
                  onChange={(e) => handleTipoChange(e.target.value as 'Familiar')}
                  className="mr-3"
                />
                <Users className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">Familiar (hasta 5 miembros)</span>
              </label>
            </div>
          </div>

          {/* Miembros */}
          <div className="space-y-6">
            {formData.miembros.map((miembro, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {miembro.condicion}
                    {index === 0 && <span className="ml-2 text-sm text-green-600">(Todos los campos obligatorios)</span>}
                    {index > 0 && <span className="ml-2 text-sm text-blue-600">(Solo nombre y teléfono obligatorios)</span>}
                  </h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeMiembro(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={miembro.nombre}
                      onChange={(e) => updateMiembro(index, 'nombre', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors[`nombre-${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingrese el nombre"
                    />
                    {errors[`nombre-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`nombre-${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido {index === 0 ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={miembro.apellido}
                      onChange={(e) => updateMiembro(index, 'apellido', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors[`apellido-${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ingrese el apellido"
                    />
                    {errors[`apellido-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`apellido-${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI {index === 0 ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={miembro.dni}
                      onChange={(e) => updateMiembro(index, 'dni', e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors[`dni-${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="12345678"
                      maxLength={8}
                    />
                    {errors[`dni-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`dni-${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barrio {index === 0 ? '*' : ''}
                    </label>
                    <select
                      value={miembro.barrio}
                      onChange={(e) => updateMiembro(index, 'barrio', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors[`barrio-${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar barrio</option>
                      {BARRIOS.map(barrio => (
                        <option key={barrio} value={barrio}>{barrio}</option>
                      ))}
                    </select>
                    {errors[`barrio-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`barrio-${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Lote {index === 0 ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={miembro.numeroLote}
                      onChange={(e) => updateMiembro(index, 'numeroLote', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors[`numeroLote-${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="123"
                    />
                    {errors[`numeroLote-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`numeroLote-${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="text"
                      value={miembro.telefono}
                      onChange={(e) => updateMiembro(index, 'telefono', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors[`telefono-${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="11-1234-5678"
                    />
                    {errors[`telefono-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`telefono-${index}`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Botón para agregar miembro */}
            {canAddMember && (
              <button
                type="button"
                onClick={addMiembro}
                className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar {getNextCondicion()}
              </button>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Crear Carnet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarnetDialog;