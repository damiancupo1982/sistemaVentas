import { get, set, del, keys, clear } from 'idb-keyval';
import { Product, Movement, Sale, Court, CourtService, CourtReservation, CourtBill, Expense, StockLevel, ExpenseTransaction } from '../types';

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
  },
  
  async del(key: string) {
    try {
      await del(key);
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      localStorage.removeItem(key);
    }
  },
  
  async keys() {
    try {
      return await keys();
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      return Object.keys(localStorage);
    }
  },
  
  async clear() {
    try {
      await clear();
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      localStorage.clear();
    }
  }
};

const PRODUCTS_KEY = 'villanueva-products';
const MOVEMENTS_KEY = 'villanueva-movements';
const SALES_KEY = 'villanueva-sales';
const RECEIPT_COUNTER_KEY = 'villanueva-receipt-counter';
const COURTS_KEY = 'villanueva-courts';
const COURT_SERVICES_KEY = 'villanueva-court-services';
const RESERVATIONS_KEY = 'villanueva-reservations';
const COURT_BILLS_KEY = 'villanueva-court-bills';
const EXPENSES_KEY = 'villanueva-expenses';
const ADMIN_TURNS_KEY = 'villanueva-admin-turns';
const TURN_CLOSURES_KEY = 'villanueva-turn-closures';
const WITHDRAWAL_COUNTER_KEY = 'villanueva-withdrawal-counter';

// Receipt number generator
const getNextReceiptNumber = async (): Promise<string> => {
  const counter = await storage.get(RECEIPT_COUNTER_KEY) || 0;
  const nextCounter = counter + 1;
  await storage.set(RECEIPT_COUNTER_KEY, nextCounter);
  
  // Format: VP-YYYY-NNNNNN (Villanueva Pádel)
  const year = new Date().getFullYear();
  const paddedNumber = nextCounter.toString().padStart(6, '0');
  return `VP-${year}-${paddedNumber}`;
};

// Withdrawal ID generator
const getNextWithdrawalId = async (): Promise<string> => {
  const counter = await storage.get(WITHDRAWAL_COUNTER_KEY) || 0;
  const nextCounter = counter + 1;
  await storage.set(WITHDRAWAL_COUNTER_KEY, nextCounter);
  
  const paddedNumber = nextCounter.toString().padStart(4, '0');
  return `RETIRO-${paddedNumber}`;
};

// Initialize default data
export const initializeDefaultData = async () => {
  // Initialize courts
  const existingCourts = await getCourts();
  if (existingCourts.length === 0) {
    const defaultCourts = [
      { id: 'court-1', name: 'SILICON (Cancha 1)', isActive: true, turnRate: 0 },
      { id: 'court-2', name: 'REMAX (Cancha 2)', isActive: true, turnRate: 0 },
      { id: 'court-3', name: 'PHIA RENTAL (Cancha 3)', isActive: true, turnRate: 0 },
    ];
    await storage.set(COURTS_KEY, defaultCourts);
  }
  
  // Initialize court services
  const existingServices = await getCourtServices();
  if (existingServices.length === 0) {
    const defaultServices = [
      { id: 'service-1', name: 'Alquiler de Paletas', price: 2000, category: 'equipment', description: 'Par de paletas por turno' },
      { id: 'service-2', name: 'Uso de Luz', price: 1500, category: 'facility', description: 'Iluminación nocturna' },
      { id: 'service-3', name: 'Entrada Invitado', price: 1000, category: 'entry', description: 'Acceso para no socios' },
      { id: 'service-4', name: 'Toallas', price: 500, category: 'equipment', description: 'Toalla de cortesía' },
      { id: 'service-5', name: 'Pelotas', price: 800, category: 'equipment', description: 'Tubo de pelotas' },
    ];
    await storage.set(COURT_SERVICES_KEY, defaultServices);
  }
  
  // Initialize default products if none exist
  const existingProducts = await getProducts();
  if (existingProducts.length === 0) {
    const defaultProducts = [
      { name: 'Agua Mineral', category: 'Bebidas', price: 500, stock: 20, minStock: 5 },
      { name: 'Gatorade', category: 'Bebidas', price: 800, stock: 15, minStock: 3 },
      { name: 'Coca Cola', category: 'Bebidas', price: 600, stock: 25, minStock: 5 },
      { name: 'Barrita Cereal', category: 'Snacks', price: 400, stock: 30, minStock: 10 },
      { name: 'Toalla Deportiva', category: 'Deportes', price: 1500, stock: 10, minStock: 2 },
    ];
    
    for (const product of defaultProducts) {
      await addProduct(product);
    }
  }
};

// Products
export const getProducts = async (): Promise<Product[]> => {
  const products = await storage.get(PRODUCTS_KEY);
  return products || [];
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  const products = await getProducts();
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  products.push(newProduct);
  await storage.set(PRODUCTS_KEY, products);
  return newProduct;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product | null> => {
  const products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await storage.set(PRODUCTS_KEY, products);
  return products[index];
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  
  if (filtered.length === products.length) return false;
  
  await storage.set(PRODUCTS_KEY, filtered);
  return true;
};

// Movements
export const getMovements = async (): Promise<Movement[]> => {
  const movements = await storage.get(MOVEMENTS_KEY);
  return movements || [];
};

export const addMovement = async (movement: Omit<Movement, 'id' | 'createdAt'>): Promise<Movement> => {
  const movements = await getMovements();
  const newMovement: Movement = {
    ...movement,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  movements.push(newMovement);
  await storage.set(MOVEMENTS_KEY, movements);
  
  // Update product stock
  if (movement.type === 'entrada') {
    await updateProductStock(movement.productId, movement.quantity);
  } else if (movement.type === 'salida' || movement.type === 'venta' || movement.type === 'merma') {
    await updateProductStock(movement.productId, -movement.quantity);
  }
  
  return newMovement;
};

const updateProductStock = async (productId: string, delta: number): Promise<void> => {
  const products = await getProducts();
  const productIndex = products.findIndex(p => p.id === productId);
  
  if (productIndex !== -1) {
    products[productIndex].stock = Math.max(0, products[productIndex].stock + delta);
    products[productIndex].updatedAt = new Date().toISOString();
    await storage.set(PRODUCTS_KEY, products);
  }
};

// Sales
export const getSales = async (): Promise<Sale[]> => {
  const sales = await storage.get(SALES_KEY);
  return sales || [];
};

export const addSale = async (sale: Omit<Sale, 'id' | 'receiptNumber' | 'createdAt'>): Promise<Sale> => {
  const sales = await getSales();
  const receiptNumber = await getNextReceiptNumber();
  
  const newSale: Sale = {
    ...sale,
    receiptNumber,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  sales.push(newSale);
  await storage.set(SALES_KEY, sales);
  
  // Add movements for each sale item
  for (const item of sale.items) {
    await addMovement({
      productId: item.product.id,
      productName: item.product.name,
      type: 'venta',
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.subtotal,
      courtId: sale.courtId,
      notes: `Venta ${receiptNumber}`,
    });
  }
  
  return newSale;
};

// Courts
export const getCourts = async (): Promise<Court[]> => {
  const courts = await storage.get(COURTS_KEY);
  return courts || [];
};

export const updateCourt = async (id: string, updates: Partial<Court>): Promise<Court | null> => {
  const courts = await getCourts();
  const index = courts.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  courts[index] = {
    ...courts[index],
    ...updates,
  };
  
  await storage.set(COURTS_KEY, courts);
  return courts[index];
};

// Court Services
export const getCourtServices = async (): Promise<CourtService[]> => {
  const services = await storage.get(COURT_SERVICES_KEY);
  return services || [];
};

export const updateCourtService = async (id: string, updates: Partial<CourtService>): Promise<CourtService | null> => {
  const services = await getCourtServices();
  const index = services.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  services[index] = {
    ...services[index],
    ...updates,
  };
  
  await storage.set(COURT_SERVICES_KEY, services);
  return services[index];
};

// Reservations
export const getReservations = async (): Promise<CourtReservation[]> => {
  const reservations = await storage.get(RESERVATIONS_KEY);
  return reservations || [];
};

export const addReservation = async (reservation: Omit<CourtReservation, 'id' | 'createdAt'>): Promise<CourtReservation> => {
  const reservations = await getReservations();
  const newReservation: CourtReservation = {
    ...reservation,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  reservations.push(newReservation);
  await storage.set(RESERVATIONS_KEY, reservations);
  return newReservation;
};

export const updateReservation = async (id: string, updates: Partial<CourtReservation>): Promise<CourtReservation | null> => {
  const reservations = await getReservations();
  const index = reservations.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  reservations[index] = {
    ...reservations[index],
    ...updates,
  };
  
  await storage.set(RESERVATIONS_KEY, reservations);
  return reservations[index];
};

// Court Bills
export const getCourtBills = async (): Promise<CourtBill[]> => {
  const bills = await storage.get(COURT_BILLS_KEY);
  return bills || [];
};

export const addCourtBill = async (bill: Omit<CourtBill, 'id' | 'receiptNumber' | 'createdAt'> & {
  paymentBreakdown?: { efectivo: number; transferencia: number; expensa: number; }
}): Promise<CourtBill> => {
  const bills = await getCourtBills();
  const receiptNumber = await getNextReceiptNumber();
  
  const newBill: CourtBill = {
    ...bill,
    receiptNumber,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  bills.push(newBill);
  await storage.set(COURT_BILLS_KEY, bills);
  
  // Add movements for kiosk items if any
  for (const item of bill.kioskItems) {
    await addMovement({
      productId: item.product.id,
      productName: item.product.name,
      type: 'venta',
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.subtotal,
      courtId: bill.courtId,
      notes: `Venta cancha ${bill.courtName} - ${receiptNumber}`,
    });
  }
  
  return newBill;
};

// Expenses
export const getExpenses = async (): Promise<Expense[]> => {
  const expenses = await storage.get(EXPENSES_KEY);
  return expenses || [];
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
  const expenses = await getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  expenses.push(newExpense);
  await storage.set(EXPENSES_KEY, expenses);
  return newExpense;
};

// Admin Turns
export const getAdminTurns = async (): Promise<AdminTurn[]> => {
  const turns = await storage.get(ADMIN_TURNS_KEY);
  return turns || [];
};

export const addAdminTurn = async (turn: Omit<AdminTurn, 'id' | 'createdAt'>): Promise<AdminTurn> => {
  const turns = await getAdminTurns();
  const newTurn: AdminTurn = {
    ...turn,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  turns.push(newTurn);
  await storage.set(ADMIN_TURNS_KEY, turns);
  return newTurn;
};

export const updateAdminTurn = async (id: string, updates: Partial<AdminTurn>): Promise<AdminTurn | null> => {
  const turns = await getAdminTurns();
  const index = turns.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  turns[index] = {
    ...turns[index],
    ...updates,
  };
  
  await storage.set(ADMIN_TURNS_KEY, turns);
  return turns[index];
};

export const getActiveTurn = async (): Promise<AdminTurn | null> => {
  const turns = await getAdminTurns();
  return turns.find(turn => turn.status === 'active') || null;
};

// Turn Closures
export const getTurnClosures = async (): Promise<TurnClosure[]> => {
  const closures = await storage.get(TURN_CLOSURES_KEY);
  return closures || [];
};

export const addTurnClosure = async (closure: Omit<TurnClosure, 'id' | 'createdAt'>): Promise<TurnClosure> => {
  const closures = await getTurnClosures();
  const newClosure: TurnClosure = {
    ...closure,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  closures.push(newClosure);
  await storage.set(TURN_CLOSURES_KEY, closures);
  return newClosure;
};

// Expense Transactions
export const addExpenseTransaction = async (expense: Omit<ExpenseTransaction, 'id' | 'receiptNumber' | 'createdAt'>): Promise<ExpenseTransaction> => {
  const receiptNumber = await getNextReceiptNumber();
  const withdrawalId = expense.type === 'retiro' ? await getNextWithdrawalId() : undefined;
  
  const newExpense: ExpenseTransaction = {
    ...expense,
    id: Date.now().toString(),
    receiptNumber,
    withdrawalId,
    createdAt: new Date().toISOString(),
  };
  
  return newExpense;
};

// Stock levels
export const getStockLevels = async (): Promise<StockLevel[]> => {
  const products = await getProducts();
  return products.map(product => {
    const minStock = product.minStock || 5;
    const level = 
      product.stock === 0 ? 'empty' :
      product.stock < minStock ? 'low' :
      product.stock < minStock * 2 ? 'medium' : 'high';
    
    const percentage = Math.min(100, (product.stock / (minStock * 2)) * 100);
    
    return {
      product,
      level,
      percentage
    };
  });
};

// Backup/Restore
export const exportData = async () => {
  const products = await getProducts();
  const movements = await getMovements();
  const sales = await getSales();
  const courts = await getCourts();
  const courtServices = await getCourtServices();
  const reservations = await getReservations();
  const courtBills = await getCourtBills();
  const expenses = await getExpenses();
  
  return {
    products,
    movements,
    sales,
    courts,
    courtServices,
    reservations,
    courtBills,
    expenses,
    exportedAt: new Date().toISOString(),
  };
};

export const importData = async (data: any) => {
  if (data.products) {
    await storage.set(PRODUCTS_KEY, data.products);
  }
  if (data.movements) {
    await storage.set(MOVEMENTS_KEY, data.movements);
  }
  if (data.sales) {
    await storage.set(SALES_KEY, data.sales);
  }
  if (data.courts) {
    await storage.set(COURTS_KEY, data.courts);
  }
  if (data.courtServices) {
    await storage.set(COURT_SERVICES_KEY, data.courtServices);
  }
  if (data.reservations) {
    await storage.set(RESERVATIONS_KEY, data.reservations);
  }
  if (data.courtBills) {
    await storage.set(COURT_BILLS_KEY, data.courtBills);
  }
  if (data.expenses) {
    await storage.set(EXPENSES_KEY, data.expenses);
  }
};

export const clearAllData = async () => {
  await storage.clear();
};