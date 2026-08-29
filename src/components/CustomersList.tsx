import React, { useState, useEffect, FormEvent } from 'react';
import { Customer, Invoice } from '../types';
import { toBanglaNumber, formatTaka, storage, generateID } from '../utils';
import { useToast } from './Toast';
import { 
  User, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  Calendar, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  X,
  PlusCircle,
  Clock,
  Printer
} from 'lucide-react';

interface CustomersListProps {
  invoices: Invoice[];
}

export default function CustomersList({ invoices }: CustomersListProps) {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'highest_due'>('recent');
  
  // Show / hide order history for specific card
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Selected customer for summary modal
  const [selectedCustomerForSummary, setSelectedCustomerForSummary] = useState<Customer | null>(null);
  
  // Add direct customer creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('password123'); // Default password for new customers

  useEffect(() => {
    // Sync starting customer database
    setCustomers(storage.getCustomers());
  }, []);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error('দয়া করে নাম ও মোবাইল নম্বর সঠিকভাবে প্রদান করুন।');
      return;
    }

    const exists = customers.some(c => c.phone === phone);
    if (exists) {
      toast.warning('এই মোবাইল নম্বরটি দিয়ে ইতিপূর্বে গ্রাহক অ্যাকাউন্ট নিবন্ধন করা হয়েছে।');
      return;
    }

    const newCustomer: Customer = {
      id: generateID('CST'),
      name,
      phone,
      email,
      address,
      password,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    const updated = [...customers, newCustomer];
    setCustomers(updated);
    storage.setCustomers(updated);
    setShowAddModal(false);
    toast.success(`গ্রাহক "${name}" অ্যাকাউন্টটি সফলভাবে সিস্টেমে যুক্ত করা হয়েছে!`);
    
    // Clear fields
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setPassword('password123');
  };

  const toggleExpandCustomer = (id: string) => {
    if (expandedCustomerId === id) {
      setExpandedCustomerId(null);
    } else {
      setExpandedCustomerId(id);
    }
  };

  const getCustomerDue = (phone: string) => {
    return invoices
      .filter(inv => inv.customerPhone.trim() === phone.trim())
      .reduce((sum, inv) => sum + inv.due, 0);
  };

  const filteredCustomers = customers
    .filter(c => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'highest_due') {
        const dueA = getCustomerDue(a.phone);
        const dueB = getCustomerDue(b.phone);
        return dueB - dueA; // highest first
      }
      return 0; // Default order
    });

  return (
    <div className="space-y-6">
      {/* Search and control bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-1.5">
            <User className="w-5 h-5 text-indigo-650" />
            সম্মানিত গ্রাহক তালিকা ও ক্রয় খতিয়ান
          </h3>
          <p className="text-xs text-slate-400">নিবন্ধিত কাস্টমার ডাটাবেজ পরিচালনা ও তাদের অর্ডার হিস্ট্রি ট্র্যাকিং প্যানেল</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="নাম বা মোবাইল নম্বর খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs w-full"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'highest_due')}
              className="py-2 px-3 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs bg-white cursor-pointer"
            >
              <option value="recent">সাম্প্রতিক</option>
              <option value="highest_due">সর্বোচ্চ বকেয়া</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন মেম্বার যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Roster database cards container */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const customerInvoices = invoices.filter(
              inv => inv.customerPhone.trim() === customer.phone.trim()
            );
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.totalPayable, 0);
            const totalDue = customerInvoices.reduce((sum, inv) => sum + inv.due, 0);

            return (
              <div 
                key={customer.id} 
                onClick={() => setSelectedCustomerForSummary(customer)}
                className="bg-white border border-slate-200 hover:border-indigo-450 hover:shadow-[0_12px_32px_rgba(99,102,241,0.08)] rounded-3xl transition-all overflow-hidden cursor-pointer group"
              >
                {/* Upper compact profile overview row */}
                <div 
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none duration-150"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* User profile picture decorator */}
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm ring-4 ring-indigo-50/20 shrink-0 transition-colors">
                      {customer.name[0]}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-extrabold text-slate-800 text-sm sm:text-base group-hover:text-indigo-750 transition-colors">{customer.name}</h4>
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-mono">{customer.id}</span>
                        {totalDue > 0 && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-100">
                            <AlertCircle className="w-3 h-3" />
                            বকেয়া: {formatTaka(totalDue)}
                          </span>
                        )}
                      </div>
                      
                      {/* Customer core contacts */}
                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-slate-450 mt-1 font-semibold">
                        <span className="flex items-center gap-1 font-mono text-xs">
                          <Phone className="w-3 h-3 text-indigo-600" />
                          {toBanglaNumber(customer.phone)}
                        </span>
                        {customer.email && (
                          <span className="hidden sm:flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {customer.email}
                          </span>
                        )}
                        {customer.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {customer.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operational financial indicators */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-6 shrink-0 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0 text-xs">
                    <div className="text-left md:text-right">
                      <span className="block text-[10px] font-extrabold text-slate-400">মোট কেনাকাটা</span>
                      <span className="font-extrabold text-slate-850 text-sm">{formatTaka(totalSpent)}</span>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="block text-[10px] font-extrabold text-slate-400">বকেয়া লেজার</span>
                      <span className={`font-extrabold text-sm ${totalDue > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                        {formatTaka(totalDue)}
                      </span>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="block text-[10px] font-extrabold text-slate-400">বিল সংখ্যা</span>
                      <span className="font-bold text-slate-700 bg-slate-100/80 px-2 rounded-lg py-0.5">{toBanglaNumber(customerInvoices.length)} টি মেমো</span>
                    </div>

                    {/* Expanse toggler arrow - now summary modal trigger */}
                    <div className="p-1 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px] group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-200">
                      <span className="flex items-center gap-1.5">সারসংক্ষেপ ও অবশিষ্টাংশ 📋</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl text-sm text-slate-400 max-w-md mx-auto">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-750">কোনো গ্রাহক খুঁজে পাওয়া যায়নি!</p>
            <p className="text-xs text-slate-450 mt-1 leading-relaxed">অনুগ্রহ করে ভিন্ন কোনো নাম বা মোবাইল নম্বর টাইপ করে সার্চ করুন।</p>
          </div>
        )}
      </div>

      {/* Customer summary details modal */}
      {selectedCustomerForSummary && (() => {
        const customer = selectedCustomerForSummary;
        const customerInvoices = invoices.filter(
          inv => inv.customerPhone.trim() === customer.phone.trim()
        );
        const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.totalPayable, 0);
        const totalDue = customerInvoices.reduce((sum, inv) => sum + inv.due, 0);

        // Prepare outstanding dues copy reminder text
        const reminderText = `আন্তরিক শুভেচ্ছা মোল্লা ইলেকট্রনিক্স থেকে। প্রিয় গ্রাহক ${customer.name}, আপনার নিকট আমাদের হিসাব অনুযায়ী বকেয়া রয়েছে ${formatTaka(totalDue)}। অনুগ্রহ করে বকেয়া পরিশোধ করে আমাদিগকে সহযোগিতা করুন। ধন্যবাদ!`;

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header with gradient and dark style */}
              <div className="bg-slate-900 text-white p-5 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 left-10 w-24 h-24 bg-cyan-500/15 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
                      {customer.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-white">{customer.name}</h4>
                        <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-md font-mono">{customer.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        নিবন্ধিত ডেট: {toBanglaNumber(customer.registeredAt || '২০২৬-০৬-০৫')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCustomerForSummary(null)} 
                    className="p-1.5 bg-white/10 hover:bg-white/20 transition-all rounded-full text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Modal Scrolling Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* 1. Bento Dashboard Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Purchases Metric */}
                  <div className="bg-gradient-to-tr from-indigo-50/40 to-indigo-100/20 border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-indigo-700/80 mb-1 flex items-center gap-1">
                      🛍️ মোট ক্রয় পরিমাণ
                    </span>
                    <div>
                      <div className="font-black text-slate-905 text-base sm:text-lg tracking-tight leading-none mt-2">
                        {formatTaka(totalSpent)}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold">
                        মোট বিল সংখ্যা: {toBanglaNumber(customerInvoices.length)} টি মেমো
                      </p>
                    </div>
                  </div>

                  {/* Remaining Dues Metric */}
                  <div className={`border rounded-2xl p-4 flex flex-col justify-between ${
                    totalDue > 0 
                      ? 'bg-gradient-to-tr from-rose-50/40 to-rose-100/20 border-rose-100 text-rose-900' 
                      : 'bg-gradient-to-tr from-emerald-50/40 to-emerald-100/20 border-emerald-100 text-emerald-950'
                  }`}>
                    <span className={`text-[11px] font-bold mb-1 flex items-center gap-1 ${
                      totalDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}>
                      {totalDue > 0 ? '⚠️ বকেয়া অবশিষ্টাংশ' : '💪 পরিশোধিত স্ট্যাটাস'}
                    </span>
                    <div>
                      <div className={`font-black text-base sm:text-lg tracking-tight leading-none mt-2 ${
                        totalDue > 0 ? 'text-rose-750' : 'text-emerald-750'
                      }`}>
                        {formatTaka(totalDue)}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold font-sans">
                        {totalDue > 0 ? 'দ্রুত পরিশোধ করা আবশ্যক' : 'সব বকেয়া ক্লিয়ার রয়েছে'}
                      </p>
                    </div>
                  </div>

                  {/* Total Invoices Average Metric */}
                  <div className="bg-gradient-to-tr from-slate-50 to-slate-100/40 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                      📊 গড় বিলিং ভ্যালু
                    </span>
                    <div>
                      <div className="font-black text-slate-850 text-base sm:text-lg tracking-tight leading-none mt-2">
                        {formatTaka(customerInvoices.length > 0 ? Math.round(totalSpent / customerInvoices.length) : 0)}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold">
                        প্রতি ট্রানজ্যাকশন গড় ক্রয়
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Custom Information & Call-To-Actions Container */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
                  <h5 className="font-extrabold text-[12px] text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <User className="w-3.5 h-3.5 text-indigo-650" />
                    যোগাযোগের বিস্তারিত তথ্য
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    {/* Phone block */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold">মোবাইল নম্বর</span>
                        <a href={`tel:${customer.phone}`} className="font-mono text-[11px] text-indigo-700 hover:underline">
                          {customer.phone}
                        </a>
                      </div>
                    </div>

                    {/* Email block */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold">ইমেইল ঠিকানা</span>
                        {customer.email ? (
                          <a href={`mailto:${customer.email}`} className="text-slate-700 hover:underline text-[11px] truncate block max-w-[180px]">
                            {customer.email}
                          </a>
                        ) : (
                          <span className="text-slate-450 text-[11px] italic">প্রদান করা হয়নি</span>
                        )}
                      </div>
                    </div>

                    {/* Address block */}
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold">স্থায়ী বা বর্তমান ঠিকানা</span>
                        <span className="text-slate-705 leading-normal text-[11px]">
                          {customer.address || "মোল্লা ইলেকট্রনিক্স রেজিস্ট্রেশন ডেক্স (ফরিদপুর সদর)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Outstanding Due Auto-WhatsApp Reminder (Only if outstanding due > 0) */}
                {totalDue > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-800 font-extrabold flex items-center gap-1">
                        📢 তাগাদা মেসেজ (SMS/WhatsApp)
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(reminderText);
                          toast.success('মেসেজটি সফলভাবে ক্লিপবোর্ডে কপি করা হয়েছে!');
                        }}
                        className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg transition-all font-bold cursor-pointer"
                      >
                        কপি করুন 📋
                      </button>
                    </div>
                    <div className="bg-white/80 p-3 rounded-xl border border-amber-105 text-[11px] leading-relaxed font-semibold text-slate-700 font-mono">
                      "{reminderText}"
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/88${customer.phone}?text=${encodeURIComponent(reminderText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        WhatsApp-এ পাঠান 💬
                      </a>
                    </div>
                  </div>
                )}

                {/* 4. Complete Associated Purchase Orders */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-1.5">
                    🛒 মেমো ও অর্ডার খতিয়ান ({toBanglaNumber(customerInvoices.length)} টি ক্রয় বিল)
                  </h5>

                  {customerInvoices.length > 0 ? (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/30">
                      {customerInvoices.map((inv) => (
                        <div 
                          key={inv.id} 
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                        >
                          <div className="space-y-0.5">
                            <span className="font-mono font-black text-indigo-700 tracking-wide block text-[11px]">{inv.id}</span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {toBanglaNumber(inv.date)}
                            </span>
                          </div>

                          <div className="max-w-xs shrink-0 flex-1">
                            {inv.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10.5px] text-slate-600 leading-normal font-semibold">
                                <span className="truncate max-w-[170px] text-slate-750 font-medium">{item.productName}</span>
                                <span className="text-[10px] text-slate-400 shrink-0 select-none">({toBanglaNumber(item.quantity)} পিস)</span>
                              </div>
                            ))}
                          </div>

                          <div className="text-right flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 sm:gap-0.5">
                            <div>
                              <span className="font-black text-slate-800 block text-[11px]">{formatTaka(inv.totalPayable)}</span>
                            </div>
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded-md ${
                              inv.due === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {inv.due === 0 ? 'পরিশোধিত' : `বকেয়া: ${formatTaka(inv.due)}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                      <ShoppingBag className="w-6 h-6 text-slate-350 mx-auto mb-1.5" />
                      <p className="font-semibold text-slate-500">এই কাস্টমারের কোনো স্থায়ী ক্রয় বিল মেলেনি!</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Footer Panel */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const invoicesHtml = customerInvoices.map(inv => `
                        <tr style="border-bottom: 1px solid #ddd;">
                          <td style="padding: 8px; font-family: monospace;">${inv.id}</td>
                          <td style="padding: 8px;">${inv.date}</td>
                          <td style="padding: 8px;">${inv.items.map(i => `${i.productName} (${i.quantity} পিস)`).join(', ')}</td>
                          <td style="padding: 8px; text-align: right;">৳ ${inv.totalPayable.toLocaleString()}</td>
                          <td style="padding: 8px; text-align: right;">${inv.due > 0 ? `<span style="color: red;">বকেয়া: ৳ ${inv.due.toLocaleString()}</span>` : '<span style="color: green;">পরিশোধিত</span>'}</td>
                        </tr>
                      `).join('');

                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>গ্রাহক লেজার স্টেটমেন্ট - ${customer.name}</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; }
                              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
                              .shop-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                              .title { font-size: 18px; margin-bottom: 2px; text-decoration: underline; }
                              .customer-info { margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 6px; }
                              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                              th { background-color: #f2f2f2; border-bottom: 2px solid #ddd; padding: 8px; text-align: left; }
                              td { border-bottom: 1px solid #eee; padding: 8px; }
                              .totals { float: right; width: 250px; margin-top: 20px; font-weight: bold; }
                              .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
                              .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div class="shop-title">মোল্লা ইলেকট্রনিক্স</div>
                              <div style="font-size: 13px;">ফরিদপুর সদর, ফরিদপুর। মোবাইল: ০১৭১২৩৪৫৬৭৮</div>
                              <h2 class="title">গ্রাহক অ্যাকাউন্ট খতিয়ান (Statement)</h2>
                            </div>
                            
                            <div class="customer-info" style="font-size: 14px;">
                              <strong>গ্রাহকের নাম:</strong> ${customer.name}<br>
                              <strong>মোবাইল নম্বর:</strong> ${customer.phone}<br>
                              <strong>ঠিকানা:</strong> ${customer.address || "ফরিদপুর"}<br>
                              <strong>ইমেইল:</strong> ${customer.email || "N/A"}<br>
                              <strong>গ্রাহক আইডি:</strong> ${customer.id}<br>
                            </div>

                            <table>
                              <thead>
                                <tr>
                                  <th>বিল আইডি</th>
                                  <th>তারিখ</th>
                                  <th>আইটেম ও বিবরণ</th>
                                  <th style="text-align: right;">মোট বিল</th>
                                  <th style="text-align: right;">স্ট্যাটাস</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${invoicesHtml.length > 0 ? invoicesHtml : '<tr><td colspan="5" style="text-align: center; padding: 20px;">কোনো ট্রানজ্যাকশন নেই</td></tr>'}
                              </tbody>
                            </table>

                            <div class="totals">
                              <div class="totals-row">
                                <span>মোট কেনাকাটা:</span>
                                <span>৳ ${totalSpent.toLocaleString()}</span>
                              </div>
                              <div class="totals-row" style="border-top: 1px solid #333; margin-top: 4px; padding-top: 4px; color: ${totalDue > 0 ? 'red' : 'green'};">
                                <span>বকেয়া লেজার:</span>
                                <span>৳ ${totalDue.toLocaleString()}</span>
                              </div>
                            </div>

                            <div style="clear: both;"></div>

                            <div class="footer">
                              এটি মোল্লা ইলেকট্রনিক্স স্মার্ট অ্যাকাউন্টিং প্যানেল কর্তৃক স্বয়ংক্রিয়ভাবে তৈরি বিবরণী।
                            </div>
                            <script>
                              window.onload = function() { window.print(); }
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    } else {
                      toast.error('প্রিন্টিং পপআপ উইন্ডোটি ব্লক করা হয়েছে। দয়া করে ব্রাউজারের পপআপ পারমিশন দিন।');
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-300" />
                  বিবরণী প্রিন্ট করুন (Statement) 🖨️
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCustomerForSummary(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs cursor-pointer text-right"
                >
                  বন্ধ করুন
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Manual customer creation modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">নতুন কাস্টমার নিবন্ধন</h4>
                <p className="text-[10px] text-indigo-305 mt-0.5">গ্রাহকের প্রোফাইল ও সেশন আইডি তৈরি করুন</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">কাস্টমারের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রাসেল আহমেদ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: 01712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 font-mono tracking-wide"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">ইমেইল (ঐচ্ছিক)</label>
                <input
                  type="email"
                  placeholder="যেমন: client@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">ঠিকানা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: ফরিদপুর সদর"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">পোর্টাল পাসওয়ার্ড (টোকেন)</label>
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড লিখুন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-850"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer"
                >
                  গ্রাহক যুক্ত করুন ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
