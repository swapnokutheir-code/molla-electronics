import { useState, useEffect } from 'react';
import { Product, Invoice, Expense, PurchaseRequest } from './types';
import { storage, toBanglaNumber, formatTaka } from './utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

// Import newly created modular components
import CustomerHome from './components/CustomerHome';
import CustomerPortal from './components/CustomerPortal';
import Login from './components/Login';
import StockManagement from './components/StockManagement';
import BillingSystem from './components/BillingSystem';
import Reports from './components/Reports';
import CustomersList from './components/CustomersList';
import ExpenseManagement from './components/ExpenseManagement';
import SettingsPanel from './components/Settings';
import Logo from './components/Logo';

import { 
  Smartphone, 
  User, 
  Boxes, 
  FileText, 
  BarChart3, 
  LogOut, 
  Home, 
  LayoutDashboard, 
  AlertTriangle,
  MapPin,
  Clock,
  ExternalLink,
  Users,
  Wallet,
  Settings as SettingsIcon
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'customer' | 'login' | 'admin'>('customer');
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'billing' | 'reports' | 'customers' | 'expenses' | 'settings'>('overview');
  
  // State for products & invoices persisted via localstorage
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    // Read from persistent storage on load
    setProducts(storage.getProducts());
    setInvoices(storage.getInvoices());
    setExpenses(storage.getExpenses());
    setPurchaseRequests(storage.getPurchaseRequests());
    
    const loggedUser = localStorage.getItem('molla_admin_user');
    if (loggedUser) {
      setAdminUser(loggedUser);
      setCurrentView('admin');
    }
  }, []);

  // Live time ticker
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleProductsChange = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    storage.setProducts(updatedProducts);
  };

  const handleInvoicesChange = (updatedInvoices: Invoice[]) => {
    setInvoices(updatedInvoices);
    storage.setInvoices(updatedInvoices);
  };

  const handleExpensesChange = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses);
    storage.setExpenses(updatedExpenses);
  };

  const handlePurchaseRequestSubmit = (request: PurchaseRequest) => {
    const updated = [request, ...purchaseRequests];
    setPurchaseRequests(updated);
    storage.setPurchaseRequests(updated);
  };

  const handleClearAllData = () => {
    localStorage.clear();
    setProducts(storage.getProducts());
    setInvoices(storage.getInvoices());
    setExpenses(storage.getExpenses());
    setPurchaseRequests(storage.getPurchaseRequests());
    setActiveTab('overview');
  };

  const handleLoginSuccess = (userString: string) => {
    setAdminUser(userString);
    localStorage.setItem('molla_admin_user', userString);
    setCurrentView('admin');
    setActiveTab('overview');
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('molla_admin_user');
    setCurrentView('customer');
  };

  // Calculating administrative widgets
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalSalesThisMonth = invoices.reduce((sum, inv) => sum + inv.totalPayable, 0);
  const totalDues = invoices.reduce((sum, inv) => sum + inv.due, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Generate last 7 days sales data for the chart
  const getSevenDaysSalesData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const daySales = invoices
        .filter(inv => inv.date && inv.date.startsWith(dateStr))
        .reduce((sum, inv) => sum + inv.totalPayable, 0);
        
      const monthsBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
      const bnDay = toBanglaNumber(String(d.getDate()));
      const bnMonth = monthsBn[d.getMonth()];
      const label = `${bnDay} ${bnMonth}`;

      data.push({
        date: dateStr,
        name: label,
        sales: daySales,
      });
    }
    return data;
  };

  const chartData = getSevenDaysSalesData();

  // Custom QR scanner Verification check
  const [verificationCode, setVerificationCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('verify');
    if (code) {
      setVerificationCode(code);
    }
  }, []);

  if (verificationCode) {
    const matched = invoices.find(inv => inv.controlNumber.toLowerCase() === verificationCode.toLowerCase());
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans select-none leading-normal">
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500 rounded-full blur-3xl pointer-events-none opacity-10" />
        <div className="absolute left-0 bottom-0 w-80 h-80 bg-pink-500 rounded-full blur-3xl pointer-events-none opacity-10" />

        <div className="max-w-xl w-full mx-auto bg-slate-950/90 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 relative z-10 shadow-2xl my-auto animate-in zoom-in-95 duration-200">
          {/* Header Verified Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              অফিসিয়াল কপি শতভাগ ভেরিফাইড
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">মোল্লা ইলেকট্রনিক্স</h2>
            <p className="text-xs text-zinc-400">ডিজিটাল পাবলিক ভেরিফিকেশন ও ট্র্যাকিং পোর্টাল</p>
          </div>

          {matched ? (
            <div className="space-y-6">
              {/* Verification Details Box */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl relative overflow-hidden space-y-3.5">
                {/* Due Watermark */}
                <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-[0.06] select-none rotate-12">
                  <span className={`text-4xl font-black uppercase tracking-widest ${matched.due > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {matched.due > 0 ? 'বাকী আছে' : 'সম্পূর্ণ পরিশোধিত'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs z-10 relative">
                  <div>
                    <p className="text-zinc-500">মেমো আইডি:</p>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">{matched.id}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">কন্ট্রোল নম্বর:</p>
                    <p className="font-mono font-extrabold text-sky-450 mt-0.5">{matched.controlNumber}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">ক্রেতার নাম (Masked):</p>
                    <p className="font-bold text-slate-205 mt-0.5">
                      {matched.customerName.charAt(0) + '*'.repeat(matched.customerName.length - 2) + matched.customerName.slice(-1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">মোবাইল নম্বর (Masked):</p>
                    <p className="font-mono font-bold text-slate-205 mt-0.5">
                      {matched.customerPhone.slice(0, 4)}*****{matched.customerPhone.slice(-2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">তারিখ:</p>
                    <p className="font-bold text-slate-205 mt-0.5">{toBanglaNumber(matched.date)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 font-bold text-emerald-450">পেমেন্ট মেথড:</p>
                    <p className="font-bold text-emerald-400 mt-0.5">{matched.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Items Purchased */}
              <div className="space-y-2.5">
                <p className="text-xs font-black text-slate-400 tracking-wider uppercase">ক্রয়কৃত মালামাল এবং আইএমইআই (IMEI):</p>
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/20 max-h-48 overflow-y-auto">
                  <div className="divide-y divide-slate-850">
                    {matched.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center text-xs hover:bg-slate-900/30 transition-all">
                        <div>
                          <p className="font-bold text-slate-100">{item.productName}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            পরিমাণ: {toBanglaNumber(item.quantity)} পিস • দর: {formatTaka(item.price)}
                          </p>
                          {item.imeis && item.imeis.length > 0 && (
                            <div className="text-[9px] text-zinc-300 font-mono mt-1.5 flex flex-wrap gap-1 leading-none">
                              <span className="text-pink-400 font-bold uppercase text-[8px] bg-pink-500/10 px-1 py-0.5 rounded border border-pink-500/10">IMEI</span>
                              <span className="bg-slate-950/80 px-1.5 py-0.5 rounded-sm select-all">{item.imeis.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <p className="font-extrabold text-slate-200 text-sm whitespace-nowrap">{formatTaka(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financial Box */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/80 border border-slate-850 p-4 rounded-2xl text-xs shadow-inner">
                <div className="space-y-1.5 text-zinc-400">
                  <p>সর্বমোট মূল্য:</p>
                  <p>ডিসকাউন্ট বা ছাড়:</p>
                  <p className="font-bold text-white">সর্বমোট বিল:</p>
                  <p className="text-emerald-400">জমা/পরিশোধিত টাকা:</p>
                  <p className="font-black text-rose-400 border-t border-slate-800 pt-1.5 mt-1.5">বকেয়া (বাকি টাকা):</p>
                </div>
                <div className="space-y-1.5 text-right text-slate-200 font-bold">
                  <p>{formatTaka(matched.subtotal)}</p>
                  <p>- {formatTaka(matched.discount)}</p>
                  <p className="text-sky-400 font-black">{formatTaka(matched.totalPayable)}</p>
                  <p className="text-emerald-400">{formatTaka(matched.paid)}</p>
                  <p className={`font-black text-sm border-t border-slate-800 pt-1.5 mt-1.5 ${matched.due > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {formatTaka(matched.due)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <span className="inline-block bg-rose-500/10 text-rose-400 px-4 py-1.5 border border-rose-500/20 rounded-full text-xs font-bold leading-normal">
                ⚠️ মেমো সনাক্ত করা যায়নি!
              </span>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
                এই কন্ট্রোল নম্বরটির বিপরীতে কোনো বিল পাওয়া যায়নি। দয়া করে সঠিক কোড যাচাই করুন অথবা দোকানে যোগাযোগ করুন।
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setVerificationCode(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-cyan-600 text-white hover:opacity-90 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md w-full"
            >
              মোল্লা ইলেকট্রনিক্স এর ওয়েবসাইটে প্রবেশ করুন
            </button>
          </div>
        </div>

        {/* Public Footer */}
        <p className="text-center text-[10px] text-zinc-500 py-3">
          &copy; ২০২৬ মোল্লা ইলেকট্রনিক্স লিমিটেড। সর্বস্বত্ব সংরক্ষিত। ফরিদপুর, বাংলাদেশ।
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Customer website view */}
      {currentView === 'customer' && (
        <CustomerHome 
          products={products} 
          invoices={invoices}
          onAdminLoginClick={() => setCurrentView('login')}
          purchaseRequests={purchaseRequests}
          onPurchaseRequestSubmit={handlePurchaseRequestSubmit}
        />
      )}

      {/* Admin security login gate */}
      {currentView === 'login' && (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onBackClick={() => setCurrentView('customer')} 
        />
      )}

      {/* Admin Panel Workspace */}
      {currentView === 'admin' && adminUser && (
        <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col transition-all duration-300">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setCurrentView('customer')}
                title="কাস্টমার হোমপেজে যান"
              >
                <Logo size="sm" showText={false} className="group-hover:scale-105 transition-transform" />
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                    মোল্লা ইলেকট্রনিক্স
                    <span className="text-[9px] bg-gradient-to-r from-pink-600 to-cyan-500 text-white font-black px-2 py-0.5 rounded-full shadow-xs uppercase">অ্যাডমিন</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-1">
                    ম্যানেজমেন্ট সিস্টেম v১.০
                  </p>
                </div>
              </div>

              {/* Identity and signout button */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>প্রোপ্রাইটর: {adminUser}</span>
                </div>
                
                <button
                  onClick={() => setCurrentView('customer')}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                >
                  <Home className="w-4 h-4 text-indigo-600" />
                  <span className="hidden md:inline">মূল ওয়েবসাইট</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1.5"
                  title="লগআউট করুন"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">লগআউট</span>
                </button>
              </div>
            </div>
          </header>

          {/* Navigation layout */}
          <div className="bg-white border-b border-slate-200 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-1.5 py-2 overflow-x-auto scrollbar-none">
                {[
                  { id: 'overview', name: 'ওভারভিউ ড্যাশবোর্ড', icon: LayoutDashboard },
                  { id: 'stock', name: 'স্টক ম্যানেজমেন্ট', icon: Boxes },
                  { id: 'billing', name: 'বিল বা মেমো মেকার', icon: FileText },
                  { id: 'customers', name: 'কাস্টমার ও অর্ডার্স', icon: Users },
                  { id: 'reports', name: 'বিজনেস রির্পোট', icon: BarChart3 },
                  { id: 'expenses', name: 'খরচ ব্যবস্থাপনা', icon: Wallet },
                  { id: 'settings', name: 'সেটিংস', icon: SettingsIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 font-extrabold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main workspace panels */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-900">
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Visual greeting line */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                       আসসালামু আলাইকুম, <span className="text-indigo-600">{adminUser}</span>! 👋
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                      মোল্লা ইলেকট্রনিক্স লিমিটেড বিজনেস কন্ট্রোল ও ড্যাশবোর্ড প্যানেল।
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 text-slate-700 text-xs px-3.5 py-2 rounded-xl border border-slate-200 font-bold shrink-0">
                    <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span>
                       সার্ভার লাইভ টাইম: {toBanglaNumber(liveTime.toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }))} | {toBanglaNumber(liveTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }))}
                    </span>
                  </div>
                </div>

                {/* Main operational parameters overview - Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Total Stock Bento Card (3 col) */}
                  <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200">
                    <div>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-extrabold uppercase">মোট স্টকের হিসাব</span>
                      <p className="text-slate-500 font-semibold text-xs mt-3.5">মোট মজুদ পণ্য</p>
                    </div>
                    <div className="mt-6">
                      <h2 className="text-3xl sm:text-4.5xl font-black text-slate-800 tracking-tight">
                        {toBanglaNumber(products.reduce((acc, p) => acc + p.stock, 0))} <span className="text-lg font-bold text-slate-550">পিস</span>
                      </h2>
                      <p className="text-[11px] text-indigo-600 font-bold mt-1.5 flex items-center gap-1">
                        ↑ উপলব্ধ ক্যাটাগরি: {toBanglaNumber(new Set(products.map(p => p.category)).size)} টি
                      </p>
                    </div>
                  </div>

                  {/* Total Sales Indigo Bento Card (4 col) */}
                  <div className="md:col-span-4 bg-indigo-950 rounded-3xl p-6 flex flex-col justify-between text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-200 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-900 rounded-full blur-2xl pointer-events-none opacity-40" />
                    <div>
                      <span className="px-2.5 py-1 bg-white/10 text-indigo-200 rounded-lg text-[10px] font-extrabold uppercase">বিক্রয় রেসকিউ</span>
                      <p className="text-indigo-200/80 font-semibold text-xs mt-3.5">সর্বমোট মেমো বিক্রি</p>
                    </div>
                    <div className="mt-6">
                      <h2 className="text-3xl sm:text-4.5xl font-black tracking-tight text-white">
                        {formatTaka(totalSalesThisMonth)}
                      </h2>
                      <p className="text-[11px] text-indigo-300 font-bold mt-1.5 uppercase flex items-center gap-1">
                        📦 মোট বিক্রিত মেমো সংখ্যা: {toBanglaNumber(invoices.length)} টি
                      </p>
                    </div>
                  </div>

                  {/* Customer outstanding bento card (4 col) */}
                  <div className="md:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200">
                    <div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-extrabold uppercase">বকেয়া লেজার</span>
                      <p className="text-slate-500 font-semibold text-xs mt-3.5">কাস্টমার বকেয়া বিল</p>
                    </div>
                    <div className="mt-6">
                      <h2 className={`text-3xl sm:text-4.5xl font-black tracking-tight ${totalDues > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {formatTaka(totalDues)}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-bold mt-1.5 flex items-center gap-1">
                        ✓ মোট বিক্রিত আইটেম: {toBanglaNumber(products.reduce((acc, p) => acc + p.sold, 0))} পিস
                      </p>
                    </div>
                  </div>

                  {/* Total Expenses Bento Card (4 col) */}
                  <div className="md:col-span-4 bg-rose-50 rounded-3xl border border-rose-100 p-6 flex flex-col justify-between shadow-sm hover:border-rose-200 hover:shadow-md transition-all duration-200">
                    <div>
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-extrabold uppercase">মোট খরচ</span>
                      <p className="text-slate-500 font-semibold text-xs mt-3.5">ব্যবসায়িক খরচ মোট</p>
                    </div>
                    <div className="mt-6">
                      <h2 className="text-3xl sm:text-4.5xl font-black tracking-tight text-rose-600">
                        {formatTaka(totalExpenses)}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-bold mt-1.5 flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> খরচের রেকর্ড: {toBanglaNumber(expenses.length)} টি
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last 7 Days Sales Trend Line Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800">গত ৭ দিনের বিক্রয় চিত্র (Line Chart)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">দৈনিক ভিত্তিতে মোট অর্জিত সফল বিক্রয় ট্রেন্ড</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl text-xs font-bold leading-normal">
                      একটি সুন্দর ভিজ্যুয়াল রিপ্রেজেন্টেশন
                    </div>
                  </div>
                  <div className="h-[280px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(val) => toBanglaNumber(String(val))}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 border border-slate-800 text-white px-3.5 py-2 rounded-2xl shadow-xl text-xs font-bold leading-relaxed">
                                  <p className="text-slate-400 mb-1">{payload[0].payload.name}</p>
                                  <p className="text-emerald-400 font-extrabold text-sm">
                                    মোট বিক্রি: {formatTaka(Number(payload[0].value))}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#4f46e5" 
                          strokeWidth={3} 
                          activeDot={{ r: 6, strokeWidth: 0 }} 
                          dot={{ r: 4, strokeWidth: 1 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alerts, Actions, and Recent Transact bento layout block */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left block (Lg: 8 cols) - Alerts & Live Admin action items */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Fast Operation Actions Bento */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-800">কুইক অ্যাডমিন কন্ট্রোলস</h3>
                        <p className="text-xs text-slate-400 mt-0.5">সবচেয়ে সাধারণ বিজনেস অ্যাকশন প্যানেলসমূহ</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                          onClick={() => { setActiveTab('billing'); }}
                          className="p-4 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-2xl flex flex-col justify-between h-28 text-left cursor-pointer transition-all duration-150 hover:border-indigo-200 hover:scale-[1.01]"
                        >
                          <FileText className="w-7 h-7 text-indigo-600" />
                          <div>
                            <p className="font-extrabold text-xs">নতুন ইনভয়েস / বিল</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">কাস্টমার মেমো ক্রিয়েটর</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { setActiveTab('stock'); }}
                          className="p-4 bg-slate-50/60 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl flex flex-col justify-between h-28 text-left cursor-pointer transition-all duration-150 hover:scale-[1.01]"
                        >
                          <Boxes className="w-7 h-7 text-indigo-600" />
                          <div>
                            <p className="font-extrabold text-xs">আজকের স্টক আপডেট</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">নতুন ইলেকট্রনিক্স এন্ট্রি</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { setActiveTab('reports'); }}
                          className="p-4 bg-indigo-50/20 hover:bg-indigo-50/60 text-slate-800 border border-indigo-100/60 rounded-2xl flex flex-col justify-between h-28 text-left cursor-pointer transition-all duration-150 hover:scale-[1.01]"
                        >
                          <BarChart3 className="w-7 h-7 text-indigo-605" />
                          <div>
                            <p className="font-extrabold text-xs">লাভ প্রফিট রিপোর্টস</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">রিপোর্ট ও মেমোরি হিসাব</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Low Stock alerting List Bento */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                          সীমাবদ্ধ স্টক অ্যালার্ট তালিকা ({toBanglaNumber(lowStockProducts.length)} টি)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          নিচের প্রোডাক্টটির অবশিষ্টাংশ এলার্ট জোনে প্রবেশ করেছে। গ্রাহক অসন্তোষ রোধ করতে দ্রুত পুনরায় কালেকশন করুন।
                        </p>
                      </div>

                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {lowStockProducts.length > 0 ? (
                          lowStockProducts.map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => { setActiveTab('stock'); }}
                              className="bg-amber-50/40 hover:bg-amber-50 border border-amber-100/80 rounded-xl p-3.5 flex justify-between items-center transition-all cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-xs text-slate-800">{p.name}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">ব্র্যান্ড: {p.brand} | আইডি: {p.id}</p>
                              </div>
                              <div className="text-right">
                                <span className="block text-[9px] font-semibold text-amber-600">অবশিষ্ট স্টক</span>
                                <span className="font-extrabold text-xs text-amber-700">{toBanglaNumber(p.stock)} পিস</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-55/10">
                            <span className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">✓ সকল স্টক সম্পূর্ণ নিরাপদ!</span>
                            <p className="text-[11px] text-slate-400 mt-2">কোনো প্রোডাক্টে স্টক সংকট ধরা পড়েনি।</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right block (Lg: 4 cols) - Dynamic Recent Transactions Ledger */}
                  <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800">সাম্প্রতিক বিক্রি</h3>
                      <p className="text-xs text-slate-400 mt-0.5">শপের সর্বশেষ ইনভয়েসসমূহ</p>
                    </div>

                    <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                      {invoices.length > 0 ? (
                        invoices.slice(-4).reverse().map((inv) => (
                          <div 
                            key={inv.id} 
                            onClick={() => setActiveTab('billing')}
                            className="flex items-center justify-between p-3.5 bg-slate-50/40 rounded-xl border border-slate-150 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-extrabold text-slate-800 truncate max-w-[130px]">{inv.customerName}</p>
                              <p className="text-[9px] text-slate-400">{toBanglaNumber(inv.date.split(',')[0] || '')} • {inv.creator}</p>
                            </div>
                            <p className="text-xs font-extrabold text-indigo-600">{formatTaka(inv.totalPayable)}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                          <p className="text-xs font-semibold">কোনো সাম্প্রতিক মেমো নেই</p>
                          <p className="text-[9px] text-slate-400 mt-1">প্রথম বিলটি তৈরি করলেই এখানে আসবে।</p>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => { setActiveTab('billing'); }}
                      className="w-full mt-2 py-2 text-indigo-600 hover:text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-100 rounded-xl hover:bg-indigo-50/50 transition-all cursor-pointer"
                    >
                      সকল ইনভয়েস দেখুন
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stock' && (
              <StockManagement 
                products={products} 
                onProductsChange={handleProductsChange} 
              />
            )}

            {activeTab === 'billing' && (
              <BillingSystem 
                products={products} 
                invoices={invoices} 
                onProductsChange={handleProductsChange} 
                onInvoicesChange={handleInvoicesChange} 
                activeUser={adminUser}
              />
            )}

            {activeTab === 'reports' && (
              <Reports 
                products={products} 
                invoices={invoices} 
                expenses={expenses}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersList invoices={invoices} />
            )}

            {activeTab === 'expenses' && (
              <ExpenseManagement 
                expenses={expenses} 
                onExpensesChange={handleExpensesChange} 
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel onClearData={handleClearAllData} />
            )}
          </main>

          {/* Footer content matching Bento statusbar info */}
          <footer className="h-12 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between px-8 text-[11px] font-semibold text-slate-500 shrink-0 gap-1.5 py-2 sm:py-0">
            <div className="flex gap-4 items-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> সিস্টেম অনলাইন</span>
              <span className="hidden sm:inline">সার্ভার সময়: {toBanglaNumber(liveTime.toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }))}</span>
            </div>
            <div className="flex gap-4">
              <span>সহায়তা: {toBanglaNumber('০১৭১০-০০০০০০')}</span>
              <span className="text-slate-300">|</span>
              <span>তৈরী করেছেন: মোল্লা টেক</span>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
