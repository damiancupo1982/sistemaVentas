import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  Users, 
  User, 
  Filter,
  AlertTriangle,
  Phone,
  MapPin,
  X,
  Upload,
  FileText,
  CheckCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getCarnets, addCarnet, darDeBajaCarnet, exportCarnetsCSV } from '../utils/carnetsDb';
import { Carnet, CarnetFormData } from '../types/carnets';
import CarnetDialog from '../components/CarnetDialog';
import CarnetDetailModal from '../components/CarnetDetailModal';

interface ImportError {
  row: number;
  reason: string;
}

interface ImportResult {
  success: number;
  errors: ImportError[];
}

const Carnets: React.FC = () => {
  const { isAdmin } = useStore();
  const [carnets, setCarnets] = useState<Carnet[]>([]);
  const [filteredCarnets, setFilteredCarnets] = useState<Carnet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barrioFilter, setBarrioFilter] = useState('');
  const [condicionFilter, setCondicionFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('activos');
  const [loteFilter, setLoteFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCarnet, setSelectedCarnet] = useState<Carnet | null>(null);
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [carnetToBaja, setCarnetToBaja] = useState<Carnet | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    loadCarnets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [carnets, searchTerm, barrioFilter, condicionFilter, estadoFilter, loteFilter]);

  const loadCarnets = async () => {
    try {
      const carnetsList = await getCarnets();
      setCarnets(carnetsList);
    } catch (error) {
      console.error('Error loading carnets:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...carnets];

    // Filtro por estado
    if (estadoFilter === 'activos') {
      filtered = filtered.filter(c => c.estado === 'Activo');
    } else if (estadoFilter === 'bajas') {
      filtered = filtered.filter(c => c.estado === 'Baja');
    }

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(carnet =>
        carnet.miembros.some(miembro =>
          miembro.nombre.toLowerCase().includes(term) ||
          miembro.apellido.toLowerCase().includes(term) ||
          miembro.dni.includes(term) ||
          miembro.numeroLote.includes(term)
        ) ||
        carnet.id.toLowerCase().includes(term)
      );
    }

    // Filtro por número de lote (independiente del estado)
    if (loteFilter) {
      // Primero obtenemos todos los carnets sin filtro de estado
      const allCarnets = [...carnets];
      filtered = allCarnets.filter(carnet =>
        carnet.miembros.some(miembro => 
          miembro.numeroLote.includes(loteFilter)
        )
      );
      // Si hay filtro de lote, ignoramos otros filtros excepto barrio y condición
      if (barrioFilter) {
        filtered = filtered.filter(carnet =>
          carnet.miembros.some(miembro => miembro.barrio === barrioFilter)
        );
      }
      if (condicionFilter) {
        filtered = filtered.filter(carnet =>
          carnet.miembros.some(miembro => miembro.condicion === condicionFilter)
        );
      }
      setFilteredCarnets(filtered);
      return;
    }

    // Filtro por barrio
    if (barrioFilter) {
      filtered = filtered.filter(carnet =>
        carnet.miembros.some(miembro => miembro.barrio === barrioFilter)
      );
    }

    // Filtro por condición
    if (condicionFilter) {
      filtered = filtered.filter(carnet =>
        carnet.miembros.some(miembro => miembro.condicion === condicionFilter)
      );
    }

    setFilteredCarnets(filtered);
  };

  const handleSaveCarnet = async (carnetData: CarnetFormData) => {
    try {
      await addCarnet({
        ...carnetData,
        estado: 'Activo',
        creadoPor: isAdmin ? 'Administrador' : 'Usuario'
      });
      await loadCarnets();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving carnet:', error);
      alert('Error al guardar el carnet');
    }
  };

  const handleDarDeBaja = async () => {
    if (!carnetToBaja || !motivoBaja.trim()) {
      alert('Debe ingresar un motivo para dar de baja el carnet');
      return;
    }

    try {
      await darDeBajaCarnet(
        carnetToBaja.id,
        motivoBaja.trim(),
        'Administrador'
      );
      await loadCarnets();
      setShowBajaModal(false);
      setCarnetToBaja(null);
      setMotivoBaja('');
    } catch (error) {
      console.error('Error dando de baja carnet:', error);
      alert('Error al dar de baja el carnet');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await exportCarnetsCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `carnets-socios-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting carnets:', error);
      alert('Error al exportar carnets');
    }
  };

  const parseCSVContent = (content: string): string[][] => {
    const lines = content.split('\n').filter(line => line.trim());
    const result: string[][] = [];
    
    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      row.push(current.trim());
      result.push(row);
    }
    
    return result;
  };

  const convertCondicion = (condicion: string): string => {
    const cond = condicion.trim().toUpperCase();
    switch (cond) {
      case 'T': return 'Titular';
      case 'F1': return 'Familiar 1';
      case 'F2': return 'Familiar 2';
      case 'F3': return 'Familiar 3';
      case 'FA': return 'Familiar Adherente';
      default: return 'Titular';
    }
  };

  const splitNombreApellido = (nombreCompleto: string): { nombre: string; apellido: string } => {
    const parts = nombreCompleto.trim().split(' ');
    if (parts.length === 1) {
      return { nombre: parts[0], apellido: '' };
    } else if (parts.length === 2) {
      return { apellido: parts[0], nombre: parts[1] };
    } else {
      // Si hay más de 2 palabras, tomar la primera como apellido y el resto como nombre
      return { apellido: parts[0], nombre: parts.slice(1).join(' ') };
    }
  };

  const handleProcessFile = async () => {
    if (!importFile) {
      alert('Por favor seleccione un archivo');
      return;
    }

    setIsProcessing(true);
    
    try {
      const content = await importFile.text();
      const rows = parseCSVContent(content);
      
      // Saltar la primera fila si parece ser encabezado
      const dataRows = rows.length > 0 && 
        (rows[0].some(cell => cell.toLowerCase().includes('lote') || 
                             cell.toLowerCase().includes('nombre') ||
                             cell.toLowerCase().includes('apellido'))) 
        ? rows.slice(1) : rows;
      
      const errors: ImportError[] = [];
      const validRows: any[] = [];
      let dniCounter = 1;
      
      // Procesar cada fila
      dataRows.forEach((row, index) => {
        const rowNumber = index + 2; // +2 porque empezamos desde 1 y saltamos encabezado
        
        if (row.length < 3) {
          errors.push({ row: rowNumber, reason: 'Fila incompleta - faltan columnas' });
          return;
        }
        
        const lote = row[0]?.trim();
        const condicionRaw = row[1]?.trim();
        const nombreCompleto = row[2]?.trim();
        const edad = row[3]?.trim();
        
        if (!nombreCompleto) {
          errors.push({ row: rowNumber, reason: 'Falta "Apellido y Nombre"' });
          return;
        }
        
        if (!lote) {
          errors.push({ row: rowNumber, reason: 'Falta número de LOTE' });
          return;
        }
        
        const { nombre, apellido } = splitNombreApellido(nombreCompleto);
        const condicion = convertCondicion(condicionRaw || 'T');
        
        validRows.push({
          lote,
          condicion,
          nombre,
          apellido,
          edad,
          dni: String(dniCounter).padStart(8, '0'),
          telefono: 'Sin Teléfono',
          barrio: 'OTRO'
        });
        
        dniCounter++;
      });
      
      // Agrupar por lote
      const loteGroups: { [key: string]: any[] } = {};
      validRows.forEach(row => {
        if (!loteGroups[row.lote]) {
          loteGroups[row.lote] = [];
        }
        loteGroups[row.lote].push(row);
      });
      
      let successCount = 0;
      
      // Crear carnets por lote
      for (const [lote, members] of Object.entries(loteGroups)) {
        try {
          // Determinar tipo de carnet
          const tipo = members.length > 1 ? 'Familiar' : 'Individual';
          
          // Asegurar que hay un titular
          let hasTitular = members.some(m => m.condicion === 'Titular');
          if (!hasTitular && members.length > 0) {
            members[0].condicion = 'Titular';
          }
          
          // Crear miembros del carnet
          const miembros = members.map(member => ({
            nombre: member.nombre,
            apellido: member.apellido,
            dni: member.dni,
            barrio: member.barrio,
            numeroLote: member.lote,
            telefono: member.telefono,
            condicion: member.condicion
          }));
          
          // Crear el carnet
          await addCarnet({
            tipo,
            miembros,
            estado: 'Activo',
            creadoPor: 'Importación CSV'
          });
          
          successCount++;
        } catch (error) {
          errors.push({ 
            row: 0, 
            reason: `Error al crear carnet para lote ${lote}: ${error}` 
          });
        }
      }
      
      // Mostrar resultados
      setImportResult({
        success: successCount,
        errors
      });
      
      setShowImportModal(false);
      setShowResultModal(true);
      await loadCarnets();
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error al procesar el archivo. Verifique que sea un archivo CSV válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImportModal = () => {
    setImportFile(null);
    setIsProcessing(false);
    setShowImportModal(false);
  };

  const resetResultModal = () => {
    setImportResult(null);
    setShowResultModal(false);
  };
  const getBarrios = () => {
    const barrios = new Set<string>();
    carnets.forEach(carnet => {
      carnet.miembros.forEach(miembro => {
        if (miembro.barrio) barrios.add(miembro.barrio);
      });
    });
    return Array.from(barrios).sort();
  };

  const getCondiciones = () => {
    const condiciones = new Set<string>();
    carnets.forEach(carnet => {
      carnet.miembros.forEach(miembro => {
        condiciones.add(miembro.condicion);
      });
    });
    return Array.from(condiciones).sort();
  };

  const getTitular = (carnet: Carnet) => {
    return carnet.miembros.find(m => m.condicion === 'Titular');
  };

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
    <>
      <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Carnets</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra los carnets de socios del complejo
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
          >
            📥 Importar Carnets
          </button>
          
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Carnet
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Carnets</p>
              <p className="text-2xl font-bold text-gray-900">{carnets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Carnets Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {carnets.filter(c => c.estado === 'Activo').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Carnets Familiares</p>
              <p className="text-2xl font-bold text-gray-900">
                {carnets.filter(c => c.tipo === 'Familiar').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Carnets de Baja</p>
              <p className="text-2xl font-bold text-gray-900">
                {carnets.filter(c => c.estado === 'Baja').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        {/* Filtro rápido por número de lote */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Búsqueda rápida por número de lote
          </label>
          <div className="relative max-w-md">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ingrese número de lote..."
              value={loteFilter}
              onChange={(e) => setLoteFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {loteFilter && (
            <p className="mt-2 text-sm text-blue-600">
              Mostrando todas las personas del lote {loteFilter} (activos y dados de baja)
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!!loteFilter}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            disabled={!!loteFilter}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="activos">Solo Activos</option>
            <option value="bajas">Solo Dados de Baja</option>
            <option value="todos">Todos los Estados</option>
          </select>

          <select
            value={barrioFilter}
            onChange={(e) => setBarrioFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los Barrios</option>
            {getBarrios().map(barrio => (
              <option key={barrio} value={barrio}>{barrio}</option>
            ))}
          </select>

          <select
            value={condicionFilter}
            onChange={(e) => setCondicionFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas las Condiciones</option>
            {getCondiciones().map(condicion => (
              <option key={condicion} value={condicion}>{condicion}</option>
            ))}
          </select>

          <div className="flex items-center justify-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">{filteredCarnets.length} resultados</span>
          </div>
        </div>
      </div>

      {/* Tabla de Carnets */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carnet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titular
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miembros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCarnets.map((carnet) => {
                const titular = getTitular(carnet);
                return (
                  <tr key={carnet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {carnet.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {titular && (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {titular.nombre} {titular.apellido}
                          </div>
                          <div className="text-sm text-gray-500">DNI: {titular.dni || 'No especificado'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {carnet.tipo === 'Individual' ? (
                          <User className="h-4 w-4 text-blue-600 mr-2" />
                        ) : (
                          <Users className="h-4 w-4 text-green-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-900">{carnet.tipo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {carnet.miembros.map((miembro, index) => (
                          <span
                            key={miembro.id}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCondicionColor(miembro.condicion)}`}
                          >
                            {miembro.condicion}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {titular && (
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          {titular.barrio || 'No especificado'} 
                          {titular.numeroLote && ` - Lote ${titular.numeroLote}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        carnet.estado === 'Activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {carnet.estado === 'Baja' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {carnet.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(carnet.fechaCreacion).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCarnet(carnet);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {isAdmin && carnet.estado === 'Activo' && (
                          <button
                            onClick={() => {
                              setCarnetToBaja(carnet);
                              setShowBajaModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Dar de baja"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredCarnets.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay carnets</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || barrioFilter || condicionFilter || estadoFilter !== 'activos'
                ? 'No se encontraron carnets con los filtros aplicados'
                : 'Comienza creando un nuevo carnet de socio'
              }
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Modal para crear carnet */}
      <CarnetDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveCarnet}
      />

      {/* Modal de detalle */}
      <CarnetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        carnet={selectedCarnet}
      />

      {/* Modal de importación */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={resetImportModal} />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                Importar Carnets desde CSV
              </h2>
              <button
                onClick={resetImportModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Explicación del formato */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Formato esperado del archivo CSV:</h3>
                <div className="bg-white border rounded p-3 font-mono text-sm">
                  <div className="text-gray-600 mb-1">LOTE, Columna1, Apellido y Nombre, Edad</div>
                  <div className="text-gray-800">123, T, García Juan, 45</div>
                  <div className="text-gray-800">123, F1, García María, 42</div>
                  <div className="text-gray-800">456, T, López Pedro, 38</div>
                </div>
                <div className="mt-3 text-xs text-blue-700">
                  <p><strong>Columna1:</strong> T=Titular, F1=Familiar 1, F2=Familiar 2, etc.</p>
                  <p><strong>Campos autocompletados:</strong> DNI (incremental), Teléfono ("Sin Teléfono"), Barrio ("OTRO")</p>
                </div>
              </div>
              
              {/* Selector de archivo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo CSV o XLSX
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo
                      </p>
                      <p className="text-xs text-gray-500">CSV o XLSX (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {importFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">
                        Archivo seleccionado: <strong>{importFile.name}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={resetImportModal}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessFile}
                  disabled={!importFile || isProcessing}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Procesar Archivo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resultados */}
      {showResultModal && importResult && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={resetResultModal} />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Resultado de la Importación
              </h2>
              <button
                onClick={resetResultModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Carnets Importados</p>
                      <p className="text-2xl font-bold text-green-900">{importResult.success}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Errores</p>
                      <p className="text-2xl font-bold text-red-900">{importResult.errors.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lista de errores */}
              {importResult.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Errores Encontrados:</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-red-800">
                            {error.row > 0 && <span className="font-medium">Fila {error.row}: </span>}
                            {error.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mensaje de éxito */}
              {importResult.success > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-800">
                      Se han importado <strong>{importResult.success}</strong> carnets correctamente.
                      Los nuevos carnets aparecerán en la lista principal.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={resetResultModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    resetResultModal();
                    // Opcional: scroll hacia arriba para ver los carnets
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Ver Carnets Cargados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal para dar de baja */}
      {showBajaModal && carnetToBaja && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowBajaModal(false)} />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Dar de Baja Carnet
              </h2>
              <button
                onClick={() => setShowBajaModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  ¿Está seguro que desea dar de baja el carnet de:
                </p>
                <p className="font-medium text-gray-900">
                  {getTitular(carnetToBaja)?.nombre} {getTitular(carnetToBaja)?.apellido}
                </p>
                <p className="text-sm text-gray-500">
                  Carnet ID: {carnetToBaja.id}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la baja *
                </label>
                <textarea
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Ingrese el motivo de la baja..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBajaModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDarDeBaja}
                  disabled={!motivoBaja.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmar Baja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Carnets;