export interface Product {
  id: string;
  name: string;
  category: string;
  categories?: string[]; // Multiple categories assignment support
  brand: string;
  purchasePrice: number;
  sellPrice: number;
  stock: number;
  sold: number;
  minStock: number;
  imeiNumbers?: string[]; // Optional pre-stored physical IMEI lists
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  password?: string;
  registeredAt?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  imeis?: string[]; // Logged IMEIs for devices sold
  buyingPrice?: number; // Froze original wholesale cost at transaction moment for exact metrics
}

export interface Invoice {
  id: string;
  controlNumber: string; // Global uniquely searchable and QR-scan verifiable tracking number
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalPayable: number;
  paid: number;
  due: number;
  paymentMethod: 'ক্যাশ (নগদ)' | 'বিকাশ' | 'রকেট' | 'নগদ মোবাইল ব্যাংকিং' | 'কার্ড';
  creator: string;
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  category: 'দোকান ভাড়া' | 'বিদ্যুৎ বিল' | 'স্টাফ বেতন' | 'পরিবহন' | 'আপ্যায়ন' | 'বিজ্ঞাপন' | 'অন্যান্য';
  amount: number;
  notes?: string;
}

export interface SalesReport {
  startDate: string;
  endDate: string;
  totalSales: number;
  totalProfit: number;
  totalInvoices: number;
  itemsSold: number;
}

// ===== Customer Purchase Request System =====
// Customer submits a form → Admin reviews → Admin adds IMEI & price → Approves → Invoice generated

export interface PurchaseRequestItem {
  productId: string;
  productName: string;
  quantity: number;
  imeis?: string[]; // Added by admin during approval
  price?: number; // Added by admin during approval
  total?: number; // Calculated after admin sets price
}

export type PurchaseRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PurchaseRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  date: string; // Submission date
  items: PurchaseRequestItem[];
  notes?: string; // Customer notes about the request
  status: PurchaseRequestStatus;
  approvedDate?: string; // When admin approved
  approvedBy?: string; // Admin who approved
  invoiceId?: string; // Generated invoice ID after approval
  adminNotes?: string; // Admin notes during approval
}
