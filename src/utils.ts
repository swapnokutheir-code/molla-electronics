import { Product, Invoice, Customer, PurchaseRequest } from './types';

// Convert English numbers to Bengali numerals
export function toBanglaNumber(num: number | string): string {
  if (num === undefined || num === null) return '';
  const numStr = num.toString();
  const englishToBangla: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
    '.': '.',
  };
  return numStr
    .split('')
    .map((char) => englishToBangla[char] || char)
    .join('');
}

// Format currency to Bengali Taka format
export function formatTaka(amount: number): string {
  return `৳ ${toBanglaNumber(amount.toLocaleString('en-IN'))}`;
}

// Generate unique ID
export function generateID(prefix: string = 'ID'): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}-${toBanglaNumber(randomSuffix)}`;
}

// Initial default categories for product categorization
export const DEFAULT_CATEGORIES: string[] = [
  'মোবাইল',
  'গ্যাজেট',
  'এক্সেসরিজ',
  'চার্জার',
  'হেডফোন'
];

// Initial registered customers matched to existing invoice names and phones
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CST-১০১',
    name: 'রাসেল আহমেদ',
    phone: '01712345678',
    email: 'rasel@example.com',
    address: 'নিউ মার্কেট রোড, ফরিদপুর',
    password: 'password123',
    registeredAt: '2026-06-05',
  },
  {
    id: 'CST-১০২',
    name: 'মো: হাসান মিজি',
    phone: '01987654321',
    address: 'মজিব সড়ক, ফরিদপুর',
    password: 'password123',
    registeredAt: '2026-06-06',
  }
];

// Initial mockup data for Mobile & Electronics Shop
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-১০১',
    name: 'Samsung Galaxy A15 5G (8/128GB)',
    category: 'মোবাইল',
    categories: ['মোবাইল'],
    brand: 'Samsung',
    purchasePrice: 19500,
    sellPrice: 22499,
    stock: 12,
    sold: 5,
    minStock: 2,
  },
  {
    id: 'PRD-১০২',
    name: 'Realme C67 (8/128GB)',
    category: 'মোবাইল',
    categories: ['মোবাইল'],
    brand: 'Realme',
    purchasePrice: 16200,
    sellPrice: 18499,
    stock: 8,
    sold: 3,
    minStock: 3,
  },
  {
    id: 'PRD-১০৩',
    name: 'Vivo Y17s (6/128GB)',
    category: 'মোবাইল',
    categories: ['মোবাইল'],
    brand: 'Vivo',
    purchasePrice: 13200,
    sellPrice: 14999,
    stock: 15,
    sold: 4,
    minStock: 4,
  },
  {
    id: 'PRD-১০৪',
    name: 'Xiaomi Redmi Note 13 (8/256GB)',
    category: 'মোবাইল',
    categories: ['মোবাইল'],
    brand: 'Xiaomi',
    purchasePrice: 20500,
    sellPrice: 22999,
    stock: 10,
    sold: 6,
    minStock: 3,
  },
  {
    id: 'PRD-১০৫',
    name: 'Mi Fast Charger 33W (Type-C Adapter)',
    category: 'চার্জার',
    categories: ['চার্জার'],
    brand: 'Xiaomi',
    purchasePrice: 750,
    sellPrice: 1250,
    stock: 35,
    sold: 12,
    minStock: 5,
  },
  {
    id: 'PRD-১০৬',
    name: 'Remax RM-512 Wired Earphone',
    category: 'হেডফোন',
    categories: ['হেডফোন'],
    brand: 'Remax',
    purchasePrice: 180,
    sellPrice: 350,
    stock: 50,
    sold: 22,
    minStock: 10,
  },
  {
    id: 'PRD-১০৭',
    name: 'Joyroom JR-T03S Pro TWS',
    category: 'হেডফোন',
    categories: ['হেডফোন'],
    brand: 'Joyroom',
    purchasePrice: 1450,
    sellPrice: 1950,
    stock: 18,
    sold: 8,
    minStock: 4,
  },
  {
    id: 'PRD-১০৮',
    name: 'Anker PowerCore 20000mAh Power Bank',
    category: 'গ্যাজেট',
    categories: ['গ্যাজেট'],
    brand: 'Anker',
    purchasePrice: 2800,
    sellPrice: 3650,
    stock: 7,
    sold: 2,
    minStock: 2,
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'MEMO-১০২৪',
    controlNumber: 'ME-C-20260605-1024',
    customerName: 'রাসেল আহমেদ',
    customerPhone: '01712345678',
    customerEmail: 'rasel@example.com',
    date: '2026-06-05',
    items: [
      {
        productId: 'PRD-১০১',
        productName: 'Samsung Galaxy A15 5G (8/128GB)',
        price: 22499,
        quantity: 1,
        total: 22499,
        buyingPrice: 19500
      },
      {
        productId: 'PRD-১০৬',
        productName: 'Remax RM-512 Wired Earphone',
        price: 350,
        quantity: 1,
        total: 350,
        buyingPrice: 180
      },
    ],
    subtotal: 22849,
    discount: 349,
    totalPayable: 22500,
    paid: 22500,
    due: 0,
    paymentMethod: 'বিকাশ',
    creator: 'নুরুল ইসলাম মোল্লা',
  },
  {
    id: 'MEMO-১০২৫',
    controlNumber: 'ME-C-20260606-1025',
    customerName: 'মো: হাসান মিজি',
    customerPhone: '01987654321',
    date: '2026-06-06',
    items: [
      {
        productId: 'PRD-১০৫',
        productName: 'Mi Fast Charger 33W (Type-C Adapter)',
        price: 1250,
        quantity: 2,
        total: 2500,
        buyingPrice: 750
      },
    ],
    subtotal: 2500,
    discount: 0,
    totalPayable: 2500,
    paid: 2000,
    due: 500,
    paymentMethod: 'ক্যাশ (নগদ)',
    creator: 'নুরুল ইসলাম মোল্লা',
  },
];

// Initial pre-loaded physical expenses
export const INITIAL_EXPENSES = [
  {
    id: 'EXP-১০০১',
    date: '2026-06-05',
    title: 'আউটলেট নাস্তা ও গেস্ট আপ্যায়ন',
    category: 'আপ্যায়ন',
    amount: 320,
    notes: 'সিঙ্গারা, চা এবং বিস্কুট'
  },
  {
    id: 'EXP-১০০২',
    date: '2026-06-06',
    title: 'বিদ্যুৎ বিল (মে মাস)',
    category: 'বিদ্যুৎ বিল',
    amount: 1850,
    notes: 'বিকাশ দিয়ে পে করা হয়েছে'
  }
];

// Localstorage state management helpers
export const storage = {
  getProducts(): Product[] {
    const data = localStorage.getItem('molla_products');
    let productsList: Product[];
    if (!data) {
      localStorage.setItem('molla_products', JSON.stringify(INITIAL_PRODUCTS));
      productsList = INITIAL_PRODUCTS;
    } else {
      productsList = JSON.parse(data);
    }
    
    // Strict dynamic migration to filter out Television and sync old category names
    const filteredAndMapped = productsList
      .filter((p: any) => p.category !== 'টেলিভিশন' && !p.name.toLowerCase().includes('tv') && !p.name.toLowerCase().includes('television'))
      .map((p: any) => {
        let category = p.category;
        if (category === 'স্মার্টফোন') category = 'মোবাইল';
        if (category === 'পাওয়ার ব্যাংক') category = 'গ্যাজেট';
        if (category === 'ক্যাসিং ও গ্লাস') category = 'এক্সেসরিজ';
        
        return {
          ...p,
          category,
          categories: [category]
        };
      });

    // Save back the migrated array to prevent persistence lag
    localStorage.setItem('molla_products', JSON.stringify(filteredAndMapped));
    return filteredAndMapped;
  },
  setProducts(products: Product[]) {
    const filtered = products.filter((p: any) => p.category !== 'টেলিভিশন' && !p.name.toLowerCase().includes('tv') && !p.name.toLowerCase().includes('television'));
    localStorage.setItem('molla_products', JSON.stringify(filtered));
  },
  getInvoices(): Invoice[] {
    const data = localStorage.getItem('molla_invoices');
    let rawInvoices: any[];
    if (!data) {
      localStorage.setItem('molla_invoices', JSON.stringify(INITIAL_INVOICES));
      rawInvoices = INITIAL_INVOICES;
    } else {
      rawInvoices = JSON.parse(data);
    }

    const products = this.getProducts();
    return rawInvoices.map((inv: any) => {
      const cleanId = (inv.id || '1000').replace(/\D/g, '') || Math.floor(1000 + Math.random() * 8999).toString();
      const cleanDate = (inv.date || '2026-06-06').replace(/-/g, '');
      const fallbackControl = `ME-C-${cleanDate}-${cleanId}`;

      const updatedItems = (inv.items || []).map((item: any) => {
        const matchingProduct = products.find(p => p.id === item.productId);
        return {
          ...item,
          buyingPrice: item.buyingPrice !== undefined 
            ? item.buyingPrice 
            : (matchingProduct ? matchingProduct.purchasePrice : (item.price * 0.8))
        };
      });

      return {
        ...inv,
        controlNumber: inv.controlNumber || fallbackControl,
        items: updatedItems
      };
    });
  },
  setInvoices(invoices: Invoice[]) {
    localStorage.setItem('molla_invoices', JSON.stringify(invoices));
  },
  getCategories(): string[] {
    localStorage.setItem('molla_categories', JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  },
  setCategories(categories: string[]) {
    localStorage.setItem('molla_categories', JSON.stringify(categories));
  },
  getCustomers(): Customer[] {
    const data = localStorage.getItem('molla_customers');
    if (!data) {
      localStorage.setItem('molla_customers', JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(data);
  },
  setCustomers(customers: Customer[]) {
    localStorage.setItem('molla_customers', JSON.stringify(customers));
  },
  getExpenses(): any[] {
    const data = localStorage.getItem('molla_expenses');
    if (!data) {
      localStorage.setItem('molla_expenses', JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(data);
  },
  setExpenses(expenses: any[]) {
    localStorage.setItem('molla_expenses', JSON.stringify(expenses));
  },
  // Purchase Request storage
  getPurchaseRequests(): PurchaseRequest[] {
    const data = localStorage.getItem('molla_purchase_requests');
    if (!data) {
      localStorage.setItem('molla_purchase_requests', JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  },
  setPurchaseRequests(requests: PurchaseRequest[]) {
    localStorage.setItem('molla_purchase_requests', JSON.stringify(requests));
  }
};
