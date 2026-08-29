import { useState } from 'react';
import { Product, Invoice, Expense } from '../types';
import { toBanglaNumber, formatTaka } from '../utils';
import { 
  TrendingUp, 
  Database, 
  BarChart3, 
  Printer, 
  Calendar, 
  Coins, 
  CheckCircle,
  AlertCircle,
  Download,
  CreditCard,
  Wallet,
  Search,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';

interface ReportsProps {
  products: Product[];
  invoices: Invoice[];
  expenses?: Expense[];
}

export default function Reports({ products, invoices, expenses = [] }: ReportsProps) {
  const [reportRange, setReportRange] = useState<'today' | 'weekly' | 'all'>('all');
  const [analysisSortField, setAnalysisSortField] = useState<'quantitySold' | 'totalSales' | 'totalCost' | 'totalProfit' | 'profitMargin'>('totalProfit');
  const [analysisSortOrder, setAnalysisSortOrder] = useState<'asc' | 'desc'>('desc');
  const [analysisSearchQuery, setAnalysisSearchQuery] = useState('');

  // Filter invoices based on date ranges
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredInvoices = invoices.filter(inv => {
    if (reportRange === 'today') {
      return inv.date === todayStr;
    } else if (reportRange === 'weekly') {
      const invDate = new Date(inv.date);
      const diffTime = Math.abs(new Date().getTime() - invDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return true; // Represents 'all'
  });

  // Calculate gross sales, net cost & profits for filtered invoices
  let totalSales = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let itemsSold = 0;

  filteredInvoices.forEach(inv => {
    totalSales += inv.totalPayable;
    inv.items.forEach(item => {
      itemsSold += item.quantity;
      const originalProduct = products.find(p => p.id === item.productId);
      if (originalProduct) {
        totalCost += originalProduct.purchasePrice * item.quantity;
      } else {
        // Fallback to roughly 80% if deleted
        totalCost += (item.price * 0.8) * item.quantity;
      }
    });
  });

  totalProfit = Math.max(0, totalSales - totalCost);

  // Calculate expenses for the filtered period
  const filteredExpenses = expenses.filter(exp => {
    if (reportRange === 'today') {
      return exp.date === todayStr;
    } else if (reportRange === 'weekly') {
      const expDate = new Date(exp.date);
      const diffTime = Math.abs(new Date().getTime() - expDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return true;
  });
  const totalExpensesAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = Math.max(0, totalProfit - totalExpensesAmount);

  // 📈 Product-wise Cost-Price vs Sale-Price Analysis List
  const productProfitAnalysis: Record<string, {
    productId: string;
    productName: string;
    category: string;
    quantitySold: number;
    totalCost: number;
    totalSales: number;
    totalProfit: number;
    avgUnitCost: number;
    avgUnitSale: number;
    profitMargin: number;
  }> = {};

  filteredInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const originalProduct = products.find(p => p.id === item.productId);
      const unitCost = originalProduct ? originalProduct.purchasePrice : (item.price * 0.8);
      
      if (!productProfitAnalysis[item.productId]) {
        productProfitAnalysis[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          category: originalProduct ? originalProduct.category : 'অন্যান্য',
          quantitySold: 0,
          totalCost: 0,
          totalSales: 0,
          totalProfit: 0,
          avgUnitCost: unitCost,
          avgUnitSale: item.price,
          profitMargin: 0
        };
      }
      
      const analysis = productProfitAnalysis[item.productId];
      analysis.quantitySold += item.quantity;
      analysis.totalSales += item.price * item.quantity;
      analysis.totalCost += unitCost * item.quantity;
    });
  });

  const parsedAnalysisList = Object.values(productProfitAnalysis).map(item => {
    const totalProfit = Math.max(0, item.totalSales - item.totalCost);
    const avgUnitCost = item.quantitySold > 0 ? (item.totalCost / item.quantitySold) : item.avgUnitCost;
    const avgUnitSale = item.quantitySold > 0 ? (item.totalSales / item.quantitySold) : item.avgUnitSale;
    const profitMargin = item.totalSales > 0 ? (totalProfit / item.totalSales) * 100 : 0;
    return {
      ...item,
      totalProfit,
      avgUnitCost,
      avgUnitSale,
      profitMargin
    };
  });

  const filteredAnalysisList = parsedAnalysisList
    .filter(item => 
      item.productName.toLowerCase().includes(analysisSearchQuery.toLowerCase()) ||
      item.productId.toLowerCase().includes(analysisSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(analysisSearchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[analysisSortField];
      let valB = b[analysisSortField];
      if (analysisSortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

  // Calculate cumulative invoice discounts for filtered range
  const totalInvoicesDiscount = filteredInvoices.reduce((sum, inv) => sum + inv.discount, 0);
  const grossItemsSales = parsedAnalysisList.reduce((sum, item) => sum + item.totalSales, 0);

  // Initialize and calculate payment breakdown for daily reconciliation
  const paymentBreakdown: Record<string, { count: number; totalSales: number; totalPaid: number; totalDue: number }> = {
    'ক্যাশ (নগদ)': { count: 0, totalSales: 0, totalPaid: 0, totalDue: 0 },
    'বিকাশ': { count: 0, totalSales: 0, totalPaid: 0, totalDue: 0 },
    'রকেট': { count: 0, totalSales: 0, totalPaid: 0, totalDue: 0 },
    'নগদ মোবাইল ব্যাংকিং': { count: 0, totalSales: 0, totalPaid: 0, totalDue: 0 },
    'কার্ড': { count: 0, totalSales: 0, totalPaid: 0, totalDue: 0 },
  };

  filteredInvoices.forEach(inv => {
    const method = inv.paymentMethod || 'ক্যাশ (নগদ)';
    if (!paymentBreakdown[method]) {
      paymentBreakdown[method] = { count: 0, totalSales: 0, totalPaid: 0, totalDue: 0 };
    }
    paymentBreakdown[method].count += 1;
    paymentBreakdown[method].totalSales += inv.totalPayable;
    paymentBreakdown[method].totalPaid += inv.paid;
    paymentBreakdown[method].totalDue += inv.due;
  });

  // Stock status distributions
  const categoriesMap: Record<string, { count: number; stock: number; sold: number }> = {};
  products.forEach(p => {
    if (!categoriesMap[p.category]) {
      categoriesMap[p.category] = { count: 0, stock: 0, sold: 0 };
    }
    categoriesMap[p.category].count += 1;
    categoriesMap[p.category].stock += p.stock;
    categoriesMap[p.category].sold += p.sold;
  });

  const handlePrintReport = () => {
    const printContent = document.getElementById('report-print-container');
    if (!printContent) return;

    const printWin = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>মোল্লা ইলেকট্রনিক্স - রিপোর্ট</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; padding: 30px; color: #000; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="p-4 mt-2">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    } else {
      window.print();
    }
  };

  const handleDownloadCSV = () => {
    // UTF-8 BOM for Excel Bengali rendering alignment
    const BOM = '\uFEFF';
    
    // Headers for external accounting formats
    const headers = [
      'Memo / Invoice ID',
      'Control Number',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Date',
      'Payment Method',
      'Operator / Creator',
      'Subtotal (Tk)',
      'Discount (Tk)',
      'Total Payable (Tk)',
      'Paid Amount (Tk)',
      'Due Amount (Tk)',
      'Items Summary'
    ];

    const rows = filteredInvoices.map(inv => {
      // Create a friendly summary listing names and quantities of products sold
      const itemsSummary = inv.items
        .map(item => {
          const detail = `${item.productName} (${item.quantity} পিস)`;
          const imeiDetail = item.imeis && item.imeis.length > 0 ? ` [IMEI: ${item.imeis.join(', ')}]` : '';
          return detail + imeiDetail;
        })
        .join('; ');

      return [
        inv.id,
        inv.controlNumber || '',
        inv.customerName || '',
        inv.customerPhone || '',
        inv.customerEmail || '',
        inv.date,
        inv.paymentMethod,
        inv.creator,
        inv.subtotal,
        inv.discount,
        inv.totalPayable,
        inv.paid,
        inv.due,
        itemsSummary
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = String(val);
        // Safely wrap text that contains commas, quotes or new lines
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create clean file naming incorporating active filters
    const rangeName = reportRange === 'all' ? 'All' : reportRange === 'weekly' ? 'Weekly' : 'Today';
    link.setAttribute('download', `molla_electronics_invoices_${rangeName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllInvoicesCSV = () => {
    const BOM = '\uFEFF';
    const headers = [
      'Memo / Invoice ID',
      'Control Number',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Date',
      'Payment Method',
      'Operator / Creator',
      'Subtotal (Tk)',
      'Discount (Tk)',
      'Total Payable (Tk)',
      'Paid Amount (Tk)',
      'Due Amount (Tk)',
      'Items Summary'
    ];

    const rows = invoices.map(inv => {
      const itemsSummary = inv.items
        .map(item => {
          const detail = `${item.productName} (${item.quantity} পিস)`;
          const imeiDetail = item.imeis && item.imeis.length > 0 ? ` [IMEI: ${item.imeis.join(', ')}]` : '';
          return detail + imeiDetail;
        })
        .join('; ');

      return [
        inv.id,
        inv.controlNumber || '',
        inv.customerName || '',
        inv.customerPhone || '',
        inv.customerEmail || '',
        inv.date,
        inv.paymentMethod,
        inv.creator,
        inv.subtotal,
        inv.discount,
        inv.totalPayable,
        inv.paid,
        inv.due,
        itemsSummary
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `molla_electronics_all_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadStockCSV = () => {
    const BOM = '\uFEFF';
    const headers = [
      'Product ID (আইডি)',
      'Product Name (পণ্যের নাম)',
      'Category (ক্যাটাগরি)',
      'Brand (ব্র্যান্ড)',
      'Wholesale Cost Price (ক্রয়মূল্য - Tk)',
      'Retail Selling Price (বিক্রয়মূল্য - Tk)',
      'Remaining Stock (বর্তমান মজুদ - Qty)',
      'Sold Quantity (বিক্রিত সংখ্যা - Qty)',
      'Total Wholesale Stock Valuation (মোট ক্রয়মূল্য হিসাব - Tk)',
      'Potential Store Retail Valuation (মোট বিক্রয়মূল্য হিসাব - Tk)'
    ];

    const rows = products.map(p => {
      const totalCostValue = p.purchasePrice * p.stock;
      const totalSaleValue = p.sellPrice * p.stock;

      return [
        p.id,
        p.name,
        p.category,
        p.brand,
        p.purchasePrice,
        p.sellPrice,
        p.stock,
        p.sold,
        totalCostValue,
        totalSaleValue
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `molla_electronics_stock_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Date selector panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-0.5">
          <h3 className="font-extrabold text-base text-slate-900">দোকানের বিজনেস রিপোর্ট জেনারেটর</h3>
          <p className="text-xs text-slate-400">ফিল্টার করে আপনার দৈনিক বা সাপ্তাহিক লাভ-ক্ষতি রিপোর্ট জেনারেট করুন</p>
        </div>

        <div className="flex gap-2">
          {['all', 'weekly', 'today'].map((range) => (
            <button
              key={range}
              onClick={() => setReportRange(range as any)}
              className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                reportRange === range
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150'
              }`}
            >
              {range === 'all' ? 'সর্বমোট সময়' : range === 'weekly' ? 'সাপ্তাহিক রিপোর্ট' : 'আজকের রিপোর্ট'}
            </button>
          ))}
          
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-2"
          >
            <Printer className="w-4 h-4" />
            <span>PDF ডাউনলোড</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-2"
            title="ইনভয়েস বা মেমো হিস্ট্রি CSV ফাইল ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            <span>CSV ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Main Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">মোট বিক্রয় (বিক্রয় মূল্য)</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-slate-850">
              {formatTaka(totalSales)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">মোট ক্রয়মূল্য (পণ্যের খরচ)</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-indigo-650">
              {formatTaka(totalCost)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">গ্রস লাভ (গ্রোস প্রফিট)</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-emerald-600">
              {formatTaka(totalProfit)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5/6" />
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">মোট খরচ</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-rose-600">
              {formatTaka(totalExpensesAmount)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 rounded-3xl flex items-center justify-between shadow-lg">
          <div>
            <span className="block text-xs font-semibold text-indigo-200">নিট লাভ (খরচ বাদে)</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-white">
              {formatTaka(netProfit)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">মোট বিক্রিত আইটেম সংখ্যা</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-indigo-650">
              {toBanglaNumber(itemsSold)} পিস
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 📊 PRODUCT-WISE COST-PRICE VS SALE-PRICE DETAILED MODULE */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              ক্রয়মূল্য বনাম বিক্রয়মূল্য প্রফিট বিশ্লেষণ (Cost vs Sale Price Profit Analysis)
            </h3>
            <p className="text-xs text-slate-400">
              নির্দিষ্ট সময়ের প্রতিটি বিক্রিত পণ্যের হোলসেল ক্রয়মূল্য এবং কাস্টমার বিক্রয়মূল্য তুলনা করে অর্জিত মুনাফা ও লাভ্যাংশের হার হিসাব করুন।
            </p>
          </div>

          {/* Interactive Search inside the analysis list */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="প্রোডাক্ট নাম, আইডি বা ক্যাটাগরি..."
                value={analysisSearchQuery}
                onChange={(e) => setAnalysisSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 hover:border-slate-305 focus:border-indigo-500 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 transition-all text-left"
              />
              {analysisSearchQuery && (
                <button 
                  onClick={() => setAnalysisSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-extrabold text-[10px] bg-slate-200/60 px-1 rounded hover:cursor-pointer"
                >
                  X
                </button>
              )}
            </div>

            <div className="flex gap-1.5 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-bold hidden sm:inline whitespace-nowrap pt-1.5">সর্টিং:</span>
              <select
                value={analysisSortField}
                onChange={(e) => setAnalysisSortField(e.target.value as any)}
                className="flex-1 sm:flex-none py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer outline-none hover:bg-slate-100 transition-all border-r-8 border-r-transparent"
              >
                <option value="totalProfit">সর্বোচ্চ লাভ (Net Profit)</option>
                <option value="quantitySold">বিক্রির সংখ্যা (Qty Sold)</option>
                <option value="totalSales">মোট বিক্রয়মূল্য (Sales Value)</option>
                <option value="totalCost">মোট ক্রয়মূল্য (Cost Value)</option>
                <option value="profitMargin">প্রফিট মার্জিন % (Margin %)</option>
              </select>
              
              <button
                onClick={() => setAnalysisSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center"
                title={analysisSortOrder === 'asc' ? 'নিম্নক্রম অনুযায়ী সাজান' : 'উচ্চক্রম অনুযায়ী সাজান'}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50/70 border border-slate-150 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">মোট আইটেম বিক্রয় পরিমাণ</span>
            <span className="text-lg font-black text-slate-805 block mt-0.5">{formatTaka(grossItemsSales)}</span>
            <span className="text-[10px] text-slate-450 mt-1 block">ক্রেতাদের কেনা আসল পণ্যের সর্বমোট সাবটোটাল বিল।</span>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl">
            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">কমপ্লিটেড মেমোর মোট ডিসকাউন্ট (-)</span>
            <span className="text-lg font-black text-rose-600 block mt-0.5">{formatTaka(totalInvoicesDiscount)}</span>
            <span className="text-[10px] text-rose-450 mt-1 block">মেমোর সম্পূর্ণ বিল থেকে দেওয়া মোট রিবেট ছাড়।</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 p-4 rounded-2xl">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">প্রকৃত নিট শপ প্রফিট (Net Store Profit)</span>
            <span className="text-lg font-black text-emerald-700 block mt-0.5">{formatTaka(Math.max(0, grossItemsSales - totalInvoicesDiscount - totalCost))}</span>
            <span className="text-[10px] text-emerald-500/90 font-bold mt-1 block">
              মোট প্রফিট মার্জিন: {grossItemsSales > 0 ? toBanglaNumber(Math.round(((grossItemsSales - totalInvoicesDiscount - totalCost) / (grossItemsSales - totalInvoicesDiscount || 1)) * 100)) : '০'}%
            </span>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto border border-slate-150 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-150 select-none">
                <th className="py-3 px-4">প্রোডাক্টের বিবরণ (Product Details)</th>
                <th className="py-3 px-4 text-center">বিক্রিত সংখ্যা</th>
                <th className="py-3 px-4 text-right">একক ক্রয়মূল্য (হোলসেল)</th>
                <th className="py-3 px-4 text-right">একক বিক্রয়মূল্য (গড়)</th>
                <th className="py-3 px-4 text-right">মোট ক্রয় খরচ (Cost)</th>
                <th className="py-3 px-4 text-right">মোট বিক্রয় (Revenue)</th>
                <th className="py-3 px-4 text-right bg-emerald-50/30 text-emerald-800 font-extrabold pr-4">নিট লাভ (Profit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-105 text-slate-700">
              {filteredAnalysisList.length > 0 ? (
                filteredAnalysisList.map((item) => {
                  const marginColorClass = item.profitMargin >= 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : item.profitMargin >= 10 ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-slate-50 text-slate-600 border-slate-150';
                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block leading-tight">{item.productName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400 font-bold">{item.productId}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-bold">{item.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-800 text-sm">
                        {toBanglaNumber(item.quantitySold)} <span className="text-[10px] font-normal text-slate-400">পিস</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-550 font-mono">
                        {formatTaka(item.avgUnitCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800 font-mono">
                        {formatTaka(item.avgUnitSale)}
                      </td>
                      <td className="py-3 px-4 text-right text-indigo-650 font-semibold font-mono">
                        {formatTaka(item.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900 font-bold font-mono">
                        {formatTaka(item.totalSales)}
                      </td>
                      <td className="py-3 px-4 text-right bg-emerald-50/15 pr-4">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-black text-emerald-600 text-sm font-mono">{formatTaka(item.totalProfit)}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${marginColorClass}`}>
                            মার্জিন: {toBanglaNumber(Math.round(item.profitMargin))}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {analysisSearchQuery ? 'এই সার্চ কি-ওয়ার্ডের জন্য কোনো প্রোডাক্ট বিক্রয় হিসাব পাওয়া যায়নি!' : 'এই সময়ে কোনো প্রোডাক্টের বিক্রয় হিসেব জেনারেট করা সম্ভব হয়নি।'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Method Breakdown & Cash Reconciliation Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              পেমেন্ট মাধ্যম ভিত্তিক আদায় ও ক্যাশ মেলানো (Daily Accounts Reconciliation)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              যেকোনো তারিখের ফিল্টার বা আজকের রিপোর্ট অনুযায়ী কোন মোবাইল ওয়ালেট বা ক্যাশে কত টাকা আদায় হয়েছে তা মিলিয়ে নিন।
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold leading-normal">
            মোট আদায়: {formatTaka(filteredInvoices.reduce((sum, inv) => sum + inv.paid, 0))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(paymentBreakdown).map(([method, data]) => {
            // Pick custom distinct branding highlights for various payment methods
            let bgClass = "bg-slate-50/70 border-slate-150 text-slate-800";
            let accentColorClass = "text-slate-600";
            let dotColor = "bg-slate-400";

            if (method.includes('ক্যাশ')) {
              bgClass = "bg-emerald-50/60 border-emerald-100/80 text-slate-800";
              accentColorClass = "text-emerald-700";
              dotColor = "bg-emerald-500";
            } else if (method.includes('বিকাশ')) {
              bgClass = "bg-pink-50/60 border-pink-100/80 text-slate-800";
              accentColorClass = "text-pink-700";
              dotColor = "bg-pink-500";
            } else if (method.includes('নগদ')) {
              bgClass = "bg-orange-50/60 border-orange-100/80 text-slate-800";
              accentColorClass = "text-orange-700";
              dotColor = "bg-orange-500";
            } else if (method.includes('রকেট')) {
              bgClass = "bg-purple-50/60 border-purple-100/80 text-slate-800";
              accentColorClass = "text-purple-700";
              dotColor = "bg-purple-500";
            } else if (method.includes('কার্ড')) {
              bgClass = "bg-sky-50/60 border-sky-100/80 text-slate-800";
              accentColorClass = "text-sky-700";
              dotColor = "bg-sky-500";
            }

            return (
              <div 
                key={method} 
                className={`p-4 rounded-2xl border ${bgClass} transition-all hover:shadow-2xs flex flex-col justify-between gap-3`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black tracking-tight flex items-center gap-1.5 truncate">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      {method}
                    </span>
                    <span className="text-[10px] font-black bg-white/90 border border-slate-200/50 px-2 py-0.5 rounded-md">
                      {toBanglaNumber(data.count)} টি
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] block text-slate-400 font-bold uppercase">আদায় হয়েছে:</span>
                    <span className={`text-base font-black ${accentColorClass} block leading-tight`}>
                      {formatTaka(data.totalPaid)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/50 space-y-1 text-[11px] font-medium text-slate-500">
                  <div className="flex justify-between">
                    <span>মোট বিক্রি:</span>
                    <span className="font-bold text-slate-700">{formatTaka(data.totalSales)}</span>
                  </div>
                  {data.totalDue > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold bg-rose-50 px-1 rounded">
                      <span>বকেয়া (Due):</span>
                      <span>{formatTaka(data.totalDue)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Reconcile Assistance Tip */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-650 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-slate-800">মোল্লা ইলেকট্রনিক্স ক্যাশিয়ার ও প্রোপাইটার রিকনসিলিয়েশন সহায়তা</h4>
            <p className="text-slate-600 leading-relaxed">
              দিনের হিসাব মেলানোর সময় বা ক্যাশ হস্তান্তরকালে ক্যাশ ড্রয়ারে নগদ <span className="font-black text-emerald-600">{formatTaka(paymentBreakdown['ক্যাশ (নগদ)']?.totalPaid || 0)}</span> টাকা, এবং মেমো অনুযায়ী বিকাশ ওয়ালেটে <span className="font-black text-pink-600">{formatTaka(paymentBreakdown['বিকাশ']?.totalPaid || 0)}</span> টাকা ও নগদ মোবাইল ব্যাংকিংয়ে <span className="font-black text-orange-600">{formatTaka(paymentBreakdown['নগদ মোবাইল ব্যাংকিং']?.totalPaid || 0)}</span> টাকার সফল পেমেন্ট মেসেজগুলোর সাথে ব্যালেন্স ক্লিয়ার মিলিয়ে নিন।
            </p>
          </div>
        </div>
      </div>

      {/* External Accounting Data Export Center (CSV Bundle) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl border border-indigo-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
              <Database className="w-3.5 h-3.5" />
              হিসাবরক্ষণ ডাটা এক্সপোর্ট সেন্টার
            </div>
            <h3 className="font-black text-xl tracking-tight text-white mt-1">বাহ্যিক অ্যাকাউন্ট ও স্টক রেকর্ড ব্যাকআপ (CSV)</h3>
            <p className="text-xs text-indigo-200/80 leading-relaxed max-w-2xl">
              দোকানের বাহ্যিক বুককিপিং, ভ্যাট/ট্যাক্স রিটার্ন হিসেব এবং এক্সেল এনালাইসিস ফাইলের জন্য আপনার সকল মেমো লেনদেন এবং ইনভেন্টরি স্টক ডাটা সম্পূর্ণ অফলাইনে ডাউনলোড করুন।
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block animate-pulse">লাস্ট আপডেট সময়</span>
            <span className="text-xs font-mono font-bold text-indigo-300">{toBanglaNumber(new Date().toISOString().split('T')[0])}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Card 1: Invoice Records */}
          <div className="bg-slate-900/60 border border-indigo-900/45 p-5 rounded-2xl flex flex-col justify-between gap-5 hover:border-indigo-500/30 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold text-indigo-450 uppercase tracking-wider">রিসিপ্ট ও মেমো ডাটা</span>
                <span className="bg-sky-500/20 text-sky-450 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/25">
                  {toBanglaNumber(invoices.length)} টি মেমো
                </span>
              </div>
              <h4 className="font-extrabold text-base text-slate-100">বিক্রয় ও কাস্টমার মেমো হিস্ট্রি</h4>
              <p className="text-xs text-slate-400 leading-normal">
                সকল মেমো আইডি, ক্রেতার ফোন নম্বর, পেমেন্ট মেথড, অপারেটর আইডি, ডিসকাউন্ট, পেইড এবং বকেয়া টাকা সহ পণ্যের তালিকা একীভূত এক্সপোর্ট করুন।
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleDownloadAllInvoicesCSV}
                className="flex-1 py-1.5 px-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-indigo-500"
              >
                <Download className="w-4 h-4" />
                <span>সম্পূর্ণ মেমো এক্সপোর্ট (CSV)</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                title="শুধুমাত্র ফিল্টার করা তারিখের মেমো ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>ফিল্টারড এক্সপোর্ট</span>
              </button>
            </div>
          </div>

          {/* Card 2: Stock & Inventory Records */}
          <div className="bg-slate-900/60 border border-indigo-900/45 p-5 rounded-2xl flex flex-col justify-between gap-5 hover:border-indigo-500/30 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-extrabold text-indigo-450 uppercase tracking-wider">মজুদ ও ইনভেন্টরি ডাটা</span>
                <span className="bg-emerald-500/20 text-emerald-450 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/25">
                  {toBanglaNumber(products.length)} টি পণ্য তালিকা
                </span>
              </div>
              <h4 className="font-extrabold text-base text-slate-100">মাল্টিপল ব্রান্ড স্টক ও ইনভেনটরি শিট</h4>
              <p className="text-xs text-slate-400 leading-normal">
                পণ্যের নাম, ক্রয়মূল্য (হোলসেল), বিক্রয়মূল্য (রিটেইল), বর্তমান মজুদ স্টক ও মোট স্টকের আর্থিক ভ্যালুয়েশন ভ্যালু এনালাইসিস শিট একীভূত এক্সপোর্ট করুন।
              </p>
            </div>
            
            <button
              onClick={handleDownloadStockCSV}
              className="w-full py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
            >
              <Download className="w-4 h-4" />
              <span>সম্পূর্ণ স্টক ইনভেন্টরি ডাউনলোড (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report sheet used for both Display and Print compiling */}
      <div id="report-print-container" className="bg-white p-6 sm:p-8 border border-slate-200 rounded-3xl space-y-6 shadow-xs text-slate-800">
        <div className="text-center space-y-1">
          <h4 className="text-2xl font-black text-slate-900 tracking-tight">মোল্লা ইলেকট্রনিক্স</h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            মজিব সড়ক, নিউ মার্কেট সংলগ্ন, বেলী বিড়ি সংলগ্ন, কেএম আরকেডিয়া মার্কেট, ফরিদপুর।
            <br />
            রিপোর্ট ক্যাটাগরি: <span className="font-bold underline">{reportRange === 'all' ? 'সর্বমোট সময়কাল' : reportRange === 'weekly' ? 'সাপ্তাহিক হিসাব' : 'আজকের হিসাব'}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 border border-slate-150 rounded-2xl p-4 bg-slate-50/60 text-center">
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">মোট বিক্রয় বা মেমো আয়</span>
            <span className="font-bold text-sm text-slate-800">{formatTaka(totalSales)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">পণ্য খরচ (হোলসেল মূল্য)</span>
            <span className="font-bold text-sm text-slate-650">{formatTaka(totalCost)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">মোট মুনাফা বা প্রফিট</span>
            <span className="font-extrabold text-sm text-emerald-600">{formatTaka(totalProfit)}</span>
          </div>
        </div>

        {/* Categories Analysis and Stack Visualizer */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            ক্যাটাগরি ভিত্তিক বিক্রয় ও মজুদ গ্রাফ
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
            {/* Visual graph chart using styled pure CSS bar loops */}
            <div className="space-y-3.5 bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 mb-1">ক্যাটাগরি ভিত্তিক বিক্রিত পণ্য অনুপাত</span>
              {(() => {
                const totalSoldSum = Object.values(categoriesMap).reduce((sum, s) => sum + s.sold, 0);
                return Object.entries(categoriesMap).map(([category, stats]) => {
                  const percentage = totalSoldSum > 0 ? (stats.sold / totalSoldSum) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-705">
                        <span>{category}</span>
                        <span>{toBanglaNumber(stats.sold)} পিস ({toBanglaNumber(Math.round(percentage)) || '০'}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-sky-600 h-full rounded-full" 
                          style={{ width: `${Math.max(4, percentage)}%` }} 
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="space-y-3.5 bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 mb-1">ক্যাটাগরি ভিত্তিক শপ স্টক অনুপাত</span>
              {Object.entries(categoriesMap).map(([category, stats]) => {
                const totalStockCategorySum = Object.values(categoriesMap).reduce((sum, s) => sum + s.stock, 0);
                const percentageOfStock = totalStockCategorySum > 0 ? (stats.stock / totalStockCategorySum) * 100 : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-705">
                      <span>{category}</span>
                      <span>{toBanglaNumber(stats.stock)} পিস ({toBanglaNumber(Math.round(percentageOfStock)) || '০'}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${Math.max(4, percentageOfStock)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 📊 Printable Product-wise Cost-Price vs Sale-Price Profit Statement */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            পণ্য ভিত্তিক ক্রয়মূল্য, বিক্রয়মূল্য ও লাভ্যাংশ বিবরণী (Product Cost vs Sale Price Profit Analysis)
          </h4>
          <div className="overflow-x-auto border border-slate-150 rounded-2xl">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-150">
                  <th className="py-2 px-3">পণ্যের বিবরণ</th>
                  <th className="py-2 px-3 text-center">বিক্রিত সংখ্যা</th>
                  <th className="py-2 px-3 text-right">ক্রয়মূল্য (একক)</th>
                  <th className="py-2 px-3 text-right">বিক্রয়মূল্য (একক)</th>
                  <th className="py-2 px-3 text-right">মোট ক্রয় খরচ</th>
                  <th className="py-2 px-3 text-right">মোট বিক্রয়মূল্য</th>
                  <th className="py-2 px-3 text-right bg-emerald-50/30 text-emerald-800 pr-3">মোট মুনাফা (লাভ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 text-slate-700">
                {parsedAnalysisList.length > 0 ? (
                  parsedAnalysisList.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/20">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {item.productName} <span className="text-[9px] text-slate-400 font-mono">({item.productId})</span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-700">{toBanglaNumber(item.quantitySold)} পিস</td>
                      <td className="py-2 px-3 text-right font-mono">{formatTaka(item.avgUnitCost)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatTaka(item.avgUnitSale)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{formatTaka(item.totalCost)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">{formatTaka(item.totalSales)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600 bg-emerald-50/5 pr-3 font-mono">
                        {formatTaka(item.totalProfit)} ({toBanglaNumber(Math.round(item.profitMargin))}%)
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-400">
                      কোনো প্রোডাক্ট বিক্রয় হিসাব পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold border-t border-slate-150 text-[11px] text-slate-900">
                  <td className="py-2.5 px-3">সর্বমোট হিসাব (Gross Total)</td>
                  <td className="py-2.5 px-3 text-center">{toBanglaNumber(itemsSold)} পিস</td>
                  <td className="py-2.5 px-3 text-right">-</td>
                  <td className="py-2.5 px-3 text-right">-</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatTaka(totalCost)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatTaka(grossItemsSales)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 bg-emerald-50/20 pr-3 font-mono">
                    {formatTaka(Math.max(0, grossItemsSales - totalCost))} (মার্জিন: {grossItemsSales > 0 ? toBanglaNumber(Math.round(((grossItemsSales - totalCost) / grossItemsSales) * 100)) : '০'}%)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Payment Methods Reconciliation Summary */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            পেমেন্ট মাধ্যম ভিত্তিক আদায় ও রিকনসিলিয়েশন বিবরণী
          </h4>
          <div className="overflow-x-auto border border-slate-150 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-150">
                  <th className="py-2.5 px-4">পেমেন্ট মাধ্যম</th>
                  <th className="py-2.5 px-4 text-center">মেমো সংখ্যা</th>
                  <th className="py-2.5 px-4 text-right">মোট বিক্রয় পরিমাণ</th>
                  <th className="py-2.5 px-4 text-right bg-emerald-50/40 text-emerald-800">আদায়কৃত টাকা (Paid)</th>
                  <th className="py-2.5 px-4 text-right text-rose-700">বকেয়া পরিমাণ (Due)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 text-slate-700">
                {Object.entries(paymentBreakdown).map(([method, data]) => (
                  <tr key={method} className="hover:bg-slate-50/40">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{method}</td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600">{toBanglaNumber(data.count)} টি</td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-600">{formatTaka(data.totalSales)}</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-emerald-600 bg-emerald-50/10">{formatTaka(data.totalPaid)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-500">{formatTaka(data.totalDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Sold list during this range */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
             রিপোর্ট সময়ের সকল লেনদেন মেমো তালিকা ({toBanglaNumber(filteredInvoices.length)} টি)
          </h4>

          <div className="overflow-x-auto border border-slate-150 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-150">
                  <th className="py-2.5 px-4 font-bold data-key">মেমো আইডি</th>
                  <th className="py-2.5 px-4">কাস্টমার নাম</th>
                  <th className="py-2.5 px-4">মোবাইল নম্বর</th>
                  <th className="py-2.5 px-4">তারিখ</th>
                  <th className="py-2.5 px-4 text-right">ডিসকাউন্ট</th>
                  <th className="py-2.5 px-4 text-right pr-4">মোট বিল</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 text-slate-700">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{inv.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{inv.customerName}</td>
                      <td className="py-3 px-4 text-slate-600">{toBanglaNumber(inv.customerPhone)}</td>
                      <td className="py-3 px-4 text-slate-400 font-medium">{toBanglaNumber(inv.date)}</td>
                      <td className="py-3 px-4 text-right text-rose-500 font-semibold">{formatTaka(inv.discount)}</td>
                      <td className="py-3 px-4 text-right pr-4 font-extrabold text-slate-900">{formatTaka(inv.totalPayable)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                       এই সময়ে কোনো লেনদেন বা মেমো তৈরি হয়নি!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verifications stamp at report prints */}
        <div className="pt-16 flex justify-between text-xs text-slate-500 font-semibold">
          <div className="text-center w-28 border-t border-slate-300 pt-1">
             রিপোর্ট ডেটা যাচাইকারী
          </div>
          <div className="text-center w-36 border-t border-slate-300 pt-1 text-slate-800 font-bold">
            নুরুল ইসলাম মোল্লা <span className="block text-[9px] font-normal text-slate-400">(প্রোপ্রাইটর স্বাক্ষর)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
