import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, TrendingUp, Home, Shield, LogOut, Calendar, DollarSign, Receipt, Clock, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import AdminLogin from './AdminLogin';

const Layout: React.FC = () => {
  const { isAdmin, setAdmin } = useStore();
  
  const handleLogout = () => {
    setAdmin(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Villanueva Pádel</h1>
                {isAdmin && (
                  <span className="text-xs text-green-600 font-medium">Modo Administrador</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Ventas
              </NavLink>
              
              <NavLink
                to="/courts"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                Canchas
              </NavLink>
              
              <NavLink
                to="/turno-actual"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Clock className="h-4 w-4 mr-1.5" />
                Turno Actual
              </NavLink>
              
              <NavLink
                to="/carnets"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Users className="h-4 w-4 mr-1.5" />
                Carnets
              </NavLink>
              
              {isAdmin && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Dashboard
              </NavLink>
              )}
              
              {isAdmin && (
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Package className="h-4 w-4 mr-1.5" />
                Productos
              </NavLink>
              )}
              
              {isAdmin && (
              <NavLink
                to="/arqueo"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <DollarSign className="h-4 w-4 mr-1.5" />
                Arqueo de Caja
              </NavLink>
              )}
              
              {isAdmin && (
              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Receipt className="h-4 w-4 mr-1.5" />
                Transacciones
              </NavLink>
              )}
              
              {isAdmin && (
              <NavLink
                to="/stock"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Package className="h-4 w-4 mr-1.5" />
                Stock
              </NavLink>
              )}
              
              {isAdmin && (
              <NavLink
                to="/movements"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <TrendingUp className="h-4 w-4 mr-1.5" />
                Movimientos
              </NavLink>
              )}
              
              <div className="flex items-center space-x-2">
                {!isAdmin ? (
                  <AdminLogin />
                ) : (
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-1.5" />
                    Salir Admin
                  </button>
                )}
                
                {isAdmin && (
                  <div className="flex items-center px-2 py-1 bg-green-100 rounded-full">
                    <Shield className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-green-700">Admin</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
