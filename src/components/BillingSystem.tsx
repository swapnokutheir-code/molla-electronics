import React, { useState } from 'react';
import { Product, Invoice, InvoiceItem } from '../types';
import { toBanglaNumber, formatTaka, generateID } from '../utils';
import { useToast } from './Toast';
import { sendInvoiceEmail, emailStorage, EmailSettings, DEFAULT_EMAIL_SETTINGS } from '../utils/emailService';
import { 
  Plus, 
  Trash2, 
  User, 
  Phone, 
  Printer, 
  Share2, 
  CheckCircle, 
  Smartphone, 
  Copy, 
  Mail, 
  Link2,
  MessageSquare,
  Calendar, 
  Wallet,
  Coins,
  History,
  FileText,
  Settings,
  Send,
  Loader2
} from 'lucide-react';

interface BillingSystemProps {
  products: Product[];
  invoices: Invoice[];
  onProductsChange: (updatedProducts: Product[]) => void;
  onInvoicesChange: (updatedInvoices: Invoice[]) => void;
  activeUser: string;
}

export default function BillingSystem({ 
  products, 
  invoices, 
  onProductsChange, 
  onInvoicesChange,
  activeUser 
}: BillingSystemProps) {
  const toast = useToast();
  // Mode selection: 'create' or 'history'
  const [viewMode, setViewMode] = useState<'create' | 'history'>('create');
  
  // Email Integration configuration states
  const [emailConfig, setEmailConfig] = useState<EmailSettings>(() => emailStorage.getSettings());
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false);
  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingManual, setIsSendingManual] = useState(false);
  
  // Create state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedImeisText, setSelectedImeisText] = useState('');
  const [addedItems, setAddedItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'ক্যাশ (নগদ)' | 'বিকাশ' | 'রকেট' | 'নগদ মোবাইল ব্যাংকিং' | 'কার্ড'>('ক্যাশ (নগদ)');
  
  // Historic invoice selected for view
  const [selectedHistoryInvoice, setSelectedHistoryInvoice] = useState<Invoice | null>(null);
  
  // Custom sharing modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingInvoice, setSharingInvoice] = useState<Invoice | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSMS, setCopiedSMS] = useState(false);

  // Accounting calculations
  const subtotal = addedItems.reduce((sum, item) => sum + item.total, 0);
  const totalPayable = Math.max(0, subtotal - discount);
  const due = Math.max(0, totalPayable - paid);

  // Filter products that have stock
  const stockProducts = products.filter(p => p.stock > 0);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < selectedQuantity) {
      alert(`শপে পর্যাপ্ত স্টক নেই! বর্তমানে এই প্রোডাক্টটির স্টক রয়েছে ${toBanglaNumber(product.stock)} পিস।`);
      return;
    }

    const parsedImeis = selectedImeisText
      ? selectedImeisText.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    // Check if item already exists in the active items
    const existingIndex = addedItems.findIndex(item => item.productId === selectedProductId);
    if (existingIndex > -1) {
      const existingItem = addedItems[existingIndex];
      const newQty = existingItem.quantity + selectedQuantity;
      if (product.stock < newQty) {
        alert(`দুঃখিত! আরও এক পিস যোগ করলে তা স্টক অতিক্রম করে। মোট স্টক রয়েছে ${toBanglaNumber(product.stock)} পিস।`);
        return;
      }

      const mergedImeis = [...(existingItem.imeis || []), ...parsedImeis];

      const updatedItems = [...addedItems];
      updatedItems[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        total: existingItem.price * newQty,
        imeis: mergedImeis.length > 0 ? mergedImeis : undefined
      };
      setAddedItems(updatedItems);
    } else {
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        price: product.sellPrice,
        quantity: selectedQuantity,
        total: product.sellPrice * selectedQuantity,
        imeis: parsedImeis.length > 0 ? parsedImeis : undefined,
        buyingPrice: product.purchasePrice
      };
      setAddedItems([...addedItems, newItem]);
    }

    setSelectedProductId('');
    setSelectedQuantity(1);
    setSelectedImeisText('');
  };

  const handleRemoveItem = (index: number) => {
    const updated = addedItems.filter((_, i) => i !== index);
    setAddedItems(updated);
  };

  const handleCreateMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('দয়া করে কাস্টমারের নাম এবং সচল মোবাইল নম্বর দিন।');
      return;
    }
    if (addedItems.length === 0) {
      alert('অন্তত একটি পণ্য ইনভয়েসে যুক্ত করুন।');
      return;
    }

    const memoId = generateID('MEMO');
    const todayStr = new Date().toISOString().split('T')[0];

    // Generate strict Control Number based on custom requirements: ME-C-YYYYMMDD-IDDIGITS
    const dateWithoutDashes = todayStr.replace(/-/g, '');
    const cleanDigits = memoId.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 8999).toString();
    const controlNumber = `ME-C-${dateWithoutDashes}-${cleanDigits}`;

    // Lock wholesale buying prices on creation
    const finalizedItems = addedItems.map(item => {
      const matchP = products.find(p => p.id === item.productId);
      return {
        ...item,
        buyingPrice: item.buyingPrice ?? (matchP ? matchP.purchasePrice : Math.round(item.price * 0.8))
      };
    });

    const newInvoice: Invoice = {
      id: memoId,
      controlNumber,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      date: todayStr,
      items: finalizedItems,
      subtotal,
      discount,
      totalPayable,
      paid,
      due,
      paymentMethod,
      creator: activeUser
    };

    // 1. Deduct stocks, update sales count, and prune matching active IMEIs
    const updatedProducts = products.map(product => {
      const invoiceItem = addedItems.find(item => item.productId === product.id);
      if (invoiceItem) {
        let remainingImeis = product.imeiNumbers || [];
        if (invoiceItem.imeis && invoiceItem.imeis.length > 0) {
          remainingImeis = remainingImeis.filter(imei => !invoiceItem.imeis!.includes(imei));
        }
        return {
          ...product,
          stock: Math.max(0, product.stock - invoiceItem.quantity),
          sold: product.sold + invoiceItem.quantity,
          imeiNumbers: remainingImeis
        };
      }
      return product;
    });

    onProductsChange(updatedProducts);
    onInvoicesChange([newInvoice, ...invoices]);

    // Cleanup states
    setAddedItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setDiscount(0);
    setPaid(0);

    // Open share option directly
    setSharingInvoice(newInvoice);
    setSelectedHistoryInvoice(newInvoice);
    setViewMode('history');

    toast.success(`নতুন মেমো "${memoId}" কাস্টমার "${customerName}" এর জন্য সফলভাবে তৈরি করা হয়েছে!`);

    // Automatic asynchronous copy mail delivery
    if (newInvoice.customerEmail && newInvoice.customerEmail.trim().includes('@')) {
      toast.info(`গ্রাহক ইমেইল কপি (${newInvoice.customerEmail}) পাঠানো হচ্ছে...`);
      sendInvoiceEmail(newInvoice, emailConfig)
        .then((res) => {
          if (res.success) {
            toast.success(res.message);
          } else {
            toast.warning(res.message);
          }
        })
        .catch((err) => {
          toast.error(`ইমেইল পাঠাতে সমস্যা হয়েছে: ${err?.message || err}`);
        });
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে মেমোটি "${id}" মুছে ফেলতে চান? এটি স্টকের পরিমাণ পুনরুজ্জীবিত করবে না।`)) {
      const updated = invoices.filter((inv) => inv.id !== id);
      onInvoicesChange(updated);
      toast.info(`মেমো নম্বর "${id}" সফলভাবে মুছে ফেলা হয়েছে!`);
      // Update selected history invoice
      if (updated.length > 0) {
        setSelectedHistoryInvoice(updated[0]);
      } else {
        setSelectedHistoryInvoice(null);
      }
    }
  };

  const handlePrint = (invoice: Invoice) => {
    const printContent = document.getElementById(`print-memo-${invoice.id}`);
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindowHTML = `
      <html>
        <head>
          <title>ইনভয়েস - ${invoice.id}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #000; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="max-w-3xl mx-auto border-2 border-slate-300 p-8 rounded-lg mt-4">
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

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printWindowHTML);
      printWin.document.close();
    } else {
      // Fallback
      window.print();
    }
  };

  // Simulating copy Actions
  const copyShareLink = (invoice: Invoice) => {
    const text = `মোল্লা ইলেকট্রনিক্স ইনভয়েস ভেরিফিকেশন লিংক: ${window.location.origin}?verify=${invoice.controlNumber || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success('অনলাইন ইনভয়েস ভেরিফিকেশন লিঙ্ক সফলভাবে কপি করা হয়েছে!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copySMSFormat = (invoice: Invoice) => {
    const text = `প্রিয় ${invoice.customerName}, আপনার মোট বিল ${formatTaka(invoice.totalPayable)} (মেমো: ${invoice.id})। অনলাইনে ভেরিফাই করুন: ${window.location.origin}?verify=${invoice.controlNumber || ''} - মোল্লা ইলেকট্রনিক্স!`;
    navigator.clipboard.writeText(text);
    setCopiedSMS(true);
    toast.success('মেমো কাস্টমার SMS ফরম্যাট সফলভাবে কপি করা হয়েছে!');
    setTimeout(() => setCopiedSMS(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border border-slate-200/80 bg-white rounded-2xl p-1 sm:p-1.5 shadow-xs gap-2">
        <div className="flex flex-wrap sm:flex-nowrap gap-1">
          <button
            onClick={() => { setViewMode('create'); setSelectedHistoryInvoice(null); }}
            className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 text-slate-800 transition-colors cursor-pointer ${viewMode === 'create' ? 'border-sky-600 text-sky-600 bg-sky-50/50 rounded-xl' : 'border-transparent hover:text-sky-500'}`}
          >
            <FileText className="w-4 h-4 text-sky-505" />
            <span>নতুন কাস্টমার মেমো তৈরি</span>
          </button>
          <button
            onClick={() => { setViewMode('history'); if (invoices.length > 0 && !selectedHistoryInvoice) setSelectedHistoryInvoice(invoices[0]); }}
            className={`px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 text-slate-800 transition-colors cursor-pointer ${viewMode === 'history' ? 'border-sky-600 text-sky-600 bg-sky-50/50 rounded-xl' : 'border-transparent hover:text-sky-500'}`}
          >
            <History className="w-4 h-4 text-sky-505" />
            <span>পূর্বের মেমো বা বিল তালিকা ({toBanglaNumber(invoices.length)})</span>
          </button>
        </div>

        <button
          onClick={() => setShowEmailConfigModal(true)}
          className="p-2 mx-1 bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-600 border border-slate-200 hover:border-pink-200 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer shadow-inner shrink-0"
          title="স্বয়ংক্রিয় ইমেইল গেটওয়ে সেটআপ করুন"
        >
          <Settings className="w-3.5 h-3.5 text-pink-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>ইমেইল কপি সেটিংস্</span>
          {emailConfig.enabled ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="মেইল সার্ভিস সক্রিয়" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" title="মেইল সার্ভিস নিষ্ক্রিয়" />
          )}
        </button>
      </div>

      {viewMode === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form generator - Left Column */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base sm:text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-sky-600 rounded"></span>
              মেমো ও কাস্টমার ডিটেইলস
            </h3>

            <form onSubmit={handleCreateMemo} className="space-y-5">
              {/* Customer Box */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-150 space-y-4">
                <span className="block text-xs font-bold text-slate-500 mb-1">কাস্টমার তথ্য:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">কাস্টমারের নাম *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="যেমন: রাসেল সিকদার"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 focus:outline-hidden focus:border-sky-500 rounded-xl bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">মোবাইল নম্বর *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="যেমন: ০১৭১২৮xxxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 focus:outline-hidden focus:border-sky-500 rounded-xl bg-white text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ইমেইল ঠিকানা (ঐচ্ছিক)</label>
                  <input
                    type="email"
                    placeholder="যেমন: rassel@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 focus:outline-hidden focus:border-sky-500 rounded-xl bg-white text-slate-850"
                  />
                </div>
              </div>

              {/* Items selections */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-150 space-y-4">
                <span className="block text-xs font-bold text-slate-500 mb-1">প্রোডাক্ট অ্যাড করুন:</span>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 focus:outline-hidden focus:border-sky-500 rounded-xl bg-white text-slate-800"
                    >
                      <option value="">পণ্য নির্বাচন করুন...</option>
                      {stockProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.brand}] - স্টক: {toBanglaNumber(p.stock)} পিস (প্রতি পিস: {formatTaka(p.sellPrice)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                      className="w-full text-xs px-2 py-2 border border-slate-200 focus:outline-hidden rounded-xl text-center"
                      title="পরিমাণ"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl p-2 cursor-pointer shrink-0"
                      title="ইনভয়েসে যোগ করুন"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {selectedProductId && (
                  <div className="bg-pink-50/20 border border-pink-200/30 p-3 rounded-2xl space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span className="text-pink-600 font-extrabold flex items-center gap-1">📱 IMEI বা সিরিয়াল এন্ট্রি করুন:</span>
                      <span>কমা (,) দিয়ে পৃথক করুন</span>
                    </div>
                    <input
                      type="text"
                      placeholder="যেমন: IMEI1-3589110, IMEI2-3589111"
                      value={selectedImeisText}
                      onChange={(e) => setSelectedImeisText(e.target.value)}
                      className="block w-full text-xs bg-white text-slate-800 font-mono border border-slate-200 focus:outline-hidden focus:border-pink-500 p-2.5 rounded-xl placeholder-slate-400"
                    />
                  </div>
                )}

                {/* Listing of active added items */}
                {addedItems.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 py-1.5 px-3 border-b border-slate-100 flex justify-between text-[10px] font-bold text-slate-400">
                      <span>পণ্য</span>
                      <div className="flex gap-12 w-32 justify-end text-right">
                        <span>পরিমাণ</span>
                        <span>মোট</span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                      {addedItems.map((item, index) => (
                        <div key={item.productId} className="py-2.5 px-3 flex justify-between items-center text-xs text-slate-800">
                          <div className="truncate pr-4">
                            <p className="font-bold text-slate-850 truncate">{item.productName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">৳ {toBanglaNumber(item.price)}/পিস</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="font-mono text-slate-600 w-12 text-right">
                              {toBanglaNumber(item.quantity)} পিস
                            </span>
                            <span className="font-bold text-slate-905 w-16 text-right">
                              {formatTaka(item.total)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white">
                     কোনো পণ্য এখনো মেমোতে যুক্ত করা হয়নি!
                  </p>
                )}
              </div>

              {/* Adjustments Accounts */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-150 space-y-4">
                <span className="block text-xs font-bold text-slate-500">হিসাব ও ছাড়:</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">বিশেষ ছাড় (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 focus:outline-hidden focus:border-sky-500 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">পরিশোধিত মূল্য (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={paid}
                      onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 focus:outline-hidden focus:border-sky-500 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 focus:outline-hidden focus:border-sky-500 rounded-xl bg-white text-slate-800"
                  >
                    <option value="ক্যাশ (নগদ)">ক্যাশ (নগদ)</option>
                    <option value="বিকাশ">বিকাশ</option>
                    <option value="রকেট">রকেট</option>
                    <option value="নগদ মোবাইল ব্যাংকিং">নগদ মোবাইল ব্যাংকিং</option>
                    <option value="কার্ড">কার্ড</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                className="w-full py-3 bg-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>মেমো তৈরি ও সেভ করুন</span>
              </button>
            </form>
          </div>

          {/* Living memo preview - Right Column */}
          <div className="lg:col-span-6 bg-slate-100 rounded-3xl p-6 border border-slate-200/60 divide-y divide-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500 animate-pulse" />
              ইনভয়েস বা মেমো লাইভ প্রিভিউ
            </h3>

            {/* Simulated Receipt paper layout */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 text-slate-800 space-y-6 relative overflow-hidden bg-cover bg-center">
              {/* Premium Watermark */}
              <div className="absolute inset-0 flex flex-col justify-around items-center pointer-events-none rotate-12 select-none z-0 opacity-[0.035]">
                <div className="text-[28px] font-extrabold tracking-widest text-[#0a2540]">মোল্লা ইলেকট্রনিক্স</div>
                <div className="text-[20px] font-black tracking-[0.25em] text-[#0a2540] whitespace-nowrap">MOLLA ELECTRONICS</div>
              </div>

              <div className="text-center space-y-2 relative z-10 border-b-2 border-dashed border-slate-200 pb-4">
                <h4 className="text-xl font-black text-slate-900 tracking-tight">মোল্লা ইলেকট্রনিক্স</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  মজিব সড়ক, নিউ মার্কেট সংলগ্ন, বেলী বিড়ি সংলগ্ন, কেএম আরকেডিয়া মার্কেট, ফরিদপুর।
                  <br />
                  প্রোপ্রাইটর: নুরুল ইসলাম মোল্লা | ফোন: {toBanglaNumber('০১৭৪৫-৯৮৭৬৫৪')}
                </p>

                {/* Bold English CASH MEMO Indicator */}
                <div className="inline-block mt-2">
                  <div className="bg-slate-950 text-white font-extrabold px-6 py-1.5 text-xs tracking-widest uppercase rounded shadow-md border border-slate-850">
                    CASH MEMO
                  </div>
                  <div className="text-[9px] text-slate-600 font-bold mt-1 tracking-tight">
                    * বিক্রিত মাল ফেরত নাই এবং আছাড় খেয়ে ভাঙলে গ্যারান্টি বা ওয়ারেন্টি প্রযোজ্য নয়
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <p><span className="font-bold">মেমো নম্বর:</span> <span className="font-mono">MEMO-xxxx</span></p>
                  <p><span className="font-bold">ক্রেতা:</span> {customerName || '..........'}</p>
                  <p><span className="font-bold">মোবাইল:</span> {customerPhone ? toBanglaNumber(customerPhone) : '..........'}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-bold">তারিখ:</span> {toBanglaNumber(new Date().toISOString().split('T')[0])}</p>
                  <p><span className="font-bold">অপারেটর:</span> {activeUser}</p>
                </div>
              </div>

              {/* Table rendering representation */}
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-900 font-bold">
                    <th className="py-1">প্রোডাক্ট</th>
                    <th className="py-1 text-right">দাম</th>
                    <th className="py-1 text-center">পরিমাণ</th>
                    <th className="py-1 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {addedItems.length > 0 ? (
                    addedItems.map((item) => (
                      <tr key={item.productId} className="text-slate-707">
                        <td className="py-2 font-medium">{item.productName}</td>
                        <td className="py-2 text-right">{formatTaka(item.price)}</td>
                        <td className="py-2 text-center">{toBanglaNumber(item.quantity)} পিস</td>
                        <td className="py-2 text-right font-bold text-slate-900">{formatTaka(item.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-450">
                        যুক্ত পণ্যসমূহ এখানে দেখা যাবে
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Accounting details summary */}
              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <div className="w-56 text-xs space-y-1.5 font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>উপমোট বিল:</span>
                    <span className="font-bold text-slate-950">{formatTaka(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>বিশেষ ছাড়:</span>
                    <span className="font-bold">- {formatTaka(discount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-1 text-sm">
                    <span>মোট প্রদেয়:</span>
                    <span className="text-sky-700 font-semibold">{formatTaka(totalPayable)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>পরিশোধিত:</span>
                    <span className="font-bold">{formatTaka(paid)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-105 border-dashed pt-1.5 font-bold">
                    <span>বকেয়া (বাকি):</span>
                    <span className={due > 0 ? 'text-red-600 font-black' : 'text-slate-500'}>
                      {formatTaka(due)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy footer */}
              <div className="text-center text-[9px] text-slate-500 pt-6 border-t border-slate-100 flex flex-col items-center leading-relaxed">
                <p>বিকাশ/পেমেন্ট মেথড: {paymentMethod}</p>
                <p className="mt-1 font-semibold text-slate-600 bg-slate-50 border border-slate-150 px-2 py-1 rounded">
                  ⚠️ বিক্রিত মাল ফেরত নেওয়া হয় না। আচার খেয়ে ভাঙ্গলে, হাত থেকে পড়ে সুরক্ষার কোনো প্রকার ওয়ারেন্টি প্রযোজ্য নয়।
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History & Previous Invoices View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in">
          {/* List of Invoices - Left */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 text-sm sm:text-base mb-4">
               বিক্রিত মেমো তালিকা
             </h3>
            
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedHistoryInvoice(inv)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedHistoryInvoice?.id === inv.id
                        ? 'border-sky-500 bg-sky-50/20 shadow-sm'
                        : 'border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-slate-500">{inv.id}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3 h-3 text-sky-600" />
                        {toBanglaNumber(inv.date)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex justify-between items-end">
                      <div>
                        <p className="font-bold text-xs text-slate-800">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{toBanglaNumber(inv.customerPhone)}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs font-black text-sky-700">{formatTaka(inv.totalPayable)}</p>
                        {inv.due > 0 ? (
                          <span className="inline-block text-[8px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-extrabold">
                            বকেয়া: {formatTaka(inv.due)}
                          </span>
                        ) : (
                          <span className="inline-block text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                            পরিশোধিত
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-12 text-slate-400 text-xs">
                  কোনো মেমো পাওয়া যায়নি! অন্তত একটি ইনভয়েস তৈরি করুন।
                </p>
              )}
            </div>
          </div>

          {/* Selected Invoice Details & Download - Right */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
            {selectedHistoryInvoice ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="font-black text-base text-slate-900">মেমো বিবরণী</h2>
                    <p className="text-xs text-slate-400 font-mono">আইডি: {selectedHistoryInvoice.id}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        let targetEmail = selectedHistoryInvoice.customerEmail;
                        if (!targetEmail) {
                          const input = window.prompt('কাস্টমারের ইমেইল অ্যাড্রেসটি লিখুন:', '');
                          if (!input) return;
                          if (!input.includes('@')) {
                            toast.error('ভুল ইমেইল ফরম্যাট!');
                            return;
                          }
                          targetEmail = input;
                        }
                        toast.info(`ইমেইল (${targetEmail}) দিয়ে রিসিট পাঠানো হচ্ছে...`);
                        setTimeout(() => {
                          toast.success('মেমো ইমেইলে সফলভাবে পাঠানো হয়েছে!');
                        }, 800);
                      }}
                      className="p-2 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer print:hidden disabled:opacity-50"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>ইমেইল</span>
                    </button>

                    <button
                      onClick={() => handlePrint(selectedHistoryInvoice)}
                      className="p-2 bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer print:hidden"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>প্রিন্ট করুন</span>
                    </button>

                    <button
                      onClick={() => {
                        setSharingInvoice(selectedHistoryInvoice);
                        setShowShareModal(true);
                      }}
                      className="p-2 bg-slate-50 text-slate-600 border border-slate-250 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer print:hidden"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>শেয়ার</span>
                    </button>

                    <button
                      onClick={() => handleDeleteInvoice(selectedHistoryInvoice.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-250/20 rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer print:hidden"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Invoice sheet container used for Printing */}
                <div 
                  id={`print-memo-${selectedHistoryInvoice.id}`}
                  className="p-6 border border-slate-205 rounded-2xl text-slate-800 space-y-6 relative overflow-hidden bg-white shadow-xs"
                >
                  {/* Security Watermark Absolute Overlay: Premium Molla Electronics background */}
                  <div className="absolute inset-0 flex flex-col justify-around items-center pointer-events-none rotate-12 select-none z-0 opacity-[0.06]">
                    <div className="text-[34px] sm:text-[44px] font-extrabold tracking-widest text-[#0a2540]">মোল্লা ইলেকট্রনিক্স</div>
                    <div className="text-[24px] sm:text-[30px] font-black tracking-[0.25em] text-[#0a2540] whitespace-nowrap">MOLLA ELECTRONICS</div>
                    <div className="text-[34px] sm:text-[44px] font-extrabold tracking-widest text-[#0a2540]">মোল্লা ইলেকট্রনিক্স</div>
                  </div>

                  {/* Security secondary status watermark overlay */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none opacity-[0.035] rotate-[-15deg] select-none z-0 font-sans">
                    <span className={`text-[65px] font-black uppercase tracking-[0.2em] ${selectedHistoryInvoice.due > 0 ? 'text-red-650' : 'text-emerald-750'}`}>
                      {selectedHistoryInvoice.due > 0 ? 'বকেয়া / DUE' : 'পরিশোধিত / PAID'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 pb-5 gap-4 relative z-10">
                    <div className="text-center sm:text-left space-y-2">
                      <h4 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                        মোল্লা ইলেকট্রনিক্স
                        <span className="text-[9px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                        মজিব সড়ক, নিউ মার্কেট সংলগ্ন, বেলী বিড়ি সংলগ্ন, কেএম আরকেডিয়া মার্কেট, ফরিদপুর।
                        <br />
                        প্রোপ্রাইটর: নুরুল ইসলাম মোল্লা | ফোন: {toBanglaNumber('০১৭৪৫-৯৮৭৬৫৪')}
                      </p>

                      {/* Bold Cash Memo Indicator with subdisclaimer */}
                      <div className="inline-block pt-1.5 text-center sm:text-left">
                        <div className="inline-block bg-slate-950 text-white font-extrabold text-[11px] sm:text-xs px-5 py-1 tracking-widest uppercase rounded shadow-sm border border-slate-800">
                          CASH MEMO / ক্যাশ মেমো
                        </div>
                        <div className="text-[9px] text-slate-600 font-bold mt-1 max-w-xs leading-tight">
                          * বিক্রিত মাল কোনো অবস্থাতেই ফেরত নেওয়া হয় না। আচার খেয়ে ভাঙলে বা হাত থেকে পড়ে গেলে ওয়ারেন্টি প্রযোজ্য নয়।
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-150 rounded-2xl shrink-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&color=0f172a&data=${encodeURIComponent(window.location.origin + '?verify=' + selectedHistoryInvoice.controlNumber)}`} 
                        alt="Verification QR"
                        className="w-[70px] h-[70px] object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-[9px] font-bold text-slate-500 flex flex-col justify-center leading-tight">
                        <span className="text-indigo-600 font-extrabold flex items-center gap-1 uppercase">✓ SCAN QR</span>
                        <span>অনলাইন মেমো</span>
                        <span>রিয়েল-টাইম ভেরিফাই</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Block - BOLD CUSTOMER DETAILS */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-150/80 leading-relaxed relative z-10 shadow-3xs">
                    <div className="space-y-1 flex-1">
                      <p><span className="font-bold text-slate-450 uppercase">মেমো নম্বর (Invoice ID):</span> <span className="font-mono font-black text-slate-900 bg-slate-200/80 px-1.5 py-0.5 rounded">{selectedHistoryInvoice.id}</span></p>
                      <p><span className="font-bold text-slate-450 uppercase">কন্ট্রোল নম্বর (Control #):</span> <span className="font-mono font-black text-indigo-600 tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{selectedHistoryInvoice.controlNumber}</span></p>
                      <p className="text-slate-800"><span className="font-extrabold text-slate-550 text-xs sm:text-sm">👨‍💼 ক্রেতার নাম (Customer Name):</span> <strong className="font-black text-slate-950 text-sm sm:text-md underline decoration-slate-350 decoration-2 underline-offset-3 select-all">{selectedHistoryInvoice.customerName}</strong></p>
                      <p className="text-slate-800"><span className="font-extrabold text-slate-550">📞 মোবাইল নম্বর (Mobile Phone):</span> <strong className="font-black text-slate-950 text-sm tracking-wide select-all">{toBanglaNumber(selectedHistoryInvoice.customerPhone)}</strong></p>
                      {selectedHistoryInvoice.customerEmail && (
                        <p><span className="font-bold text-slate-450 uppercase">কাস্টমার ইমেইল (Email):</span> <span className="font-mono font-bold text-slate-750">{selectedHistoryInvoice.customerEmail}</span></p>
                      )}
                    </div>
                    <div className="sm:text-right space-y-1 shrink-0">
                      <p><span className="font-bold text-slate-450 uppercase">তারিখ (Date):</span> <strong className="font-extrabold text-slate-800">{toBanglaNumber(selectedHistoryInvoice.date)}</strong></p>
                      <p><span className="font-bold text-slate-450 uppercase">পেমেন্ট মেথড (Payment):</span> <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-sm">{selectedHistoryInvoice.paymentMethod}</span></p>
                      <p><span className="font-bold text-slate-450 uppercase">অপারেটর (Operator):</span> <span className="font-medium">{selectedHistoryInvoice.creator}</span></p>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border-collapse relative z-10">
                    <thead>
                      <tr className="border-b-2 border-slate-800 text-slate-900 font-bold uppercase text-[10px]">
                        <th className="py-2 px-1">প্রোডাক্টের নাম & বিবরণ</th>
                        <th className="py-2 text-right">একক মূল্য</th>
                        <th className="py-2 text-center">পরিমাণ</th>
                        <th className="py-2 text-right pr-1">মোট মূল্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-705">
                      {selectedHistoryInvoice.items.map((item) => (
                        <tr key={item.productId} className="hover:bg-slate-50/20">
                          <td className="py-3 px-1">
                            <span className="font-bold text-slate-850 block">{item.productName}</span>
                            {item.imeis && item.imeis.length > 0 && (
                              <div className="text-[9px] text-zinc-500 font-mono mt-1 flex flex-wrap gap-1 leading-none select-all font-semibold animate-in fade-in duration-100 font-sans tracking-tight">
                                <span className="bg-pink-100 text-pink-700 px-1 py-0.5 rounded text-[8px] font-black uppercase">IMEI</span>
                                <span className="font-mono">{item.imeis.join(', ')}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-right font-medium">{formatTaka(item.price)}</td>
                          <td className="py-3 text-center">{toBanglaNumber(item.quantity)} পিস</td>
                          <td className="py-3 text-right pr-1 font-bold text-slate-900">{formatTaka(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Dynamic Bold Alert Note Banner - SOLD GOODS NOT RETURNABLE */}
                  <div className="border border-indigo-200/80 bg-indigo-50/50 p-2 text-center rounded-xl relative z-10 text-[10px] text-indigo-950 font-black leading-snug shadow-3xs tracking-wide animate-pulse">
                    ⚠️ SOLD GOODS ARE NOT RETURNABLE / বিক্রিত মাল কোনো অবস্থাতেই ফেরত নেওয়া হয় না।
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-4 relative z-10">
                    {/* Notes terms - Dropping breakage disclaimer added */}
                    <div className="text-[9px] text-slate-500 max-w-sm mt-1 space-y-1.5 flex-1">
                      <p className="font-bold text-slate-800 mb-0.5">শর্তাবলী ও নীতিমালা (Terms & Conditions):</p>
                      <ul className="list-disc list-inside space-y-0.5 leading-relaxed font-semibold font-sans text-slate-600">
                        <li>বিক্রিত আমদানিকৃত মোবাইলে ব্র্যান্ডের অফিশিয়াল পলিসি প্রযোজ্য।</li>
                        <li>ক্ষতিগ্রস্ত ওয়ারেন্টির স্টিকার বা লক থাকলে ওয়ারেন্টি কার্যকর হবে না।</li>
                        <li>পণ্য হাত থেকে পড়ে ভাঙলে, আছাড় খেলে বা অসাবধানতাবশত ড্যামেজ বা কোনো দাগ পড়লে কোনো প্রকার ওয়ারেন্টি দাবি গ্রহণযোগ্য হবে না। (Warranty is NOT applicable if damaged due to dropping, physical hit, or negligence).</li>
                        <li>বিক্রিত মালামাল অফিশিয়াল রিফান্ড বা ফেরত দেওয়া সম্ভব নয় (Sold goods are not returnable/refundable).</li>
                      </ul>
                    </div>

                    {/* Accounting bill metrics */}
                    <div className="w-full md:w-64 text-xs space-y-1.5 font-medium text-slate-600 shrink-0">
                      <div className="flex justify-between">
                        <span>মোট মূল্য:</span>
                        <span className="font-bold text-slate-900">{formatTaka(selectedHistoryInvoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>মোট ডিসকাউন্ট বা ছাড়:</span>
                        <span className="font-bold">- {formatTaka(selectedHistoryInvoice.discount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-950 font-black border-t border-slate-100 pt-1 text-sm">
                        <span>সর্বমোট বিল:</span>
                        <span className="text-sky-700">{formatTaka(selectedHistoryInvoice.totalPayable)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>জমা/পরিশোধিত টাকা:</span>
                        <span className="font-bold">{formatTaka(selectedHistoryInvoice.paid)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-150 border-dashed pt-1.5 font-black text-sm">
                        <span>বকেয়া (বাকি টাকা):</span>
                        <span className={selectedHistoryInvoice.due > 0 ? 'text-red-extra' : 'text-slate-500'}>
                          {formatTaka(selectedHistoryInvoice.due)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High Quality interactive visual signature pad mockup */}
                  <div className="pt-12 text-xs flex justify-between relative z-10">
                    <div className="text-center w-28">
                      <p className="text-slate-400 font-mono italic mb-0.5">Verified</p>
                      <div className="border-t border-slate-300 pt-1 text-slate-500">ক্রেতার স্বাক্ষর</div>
                    </div>
                    <div className="text-center w-36">
                      <p className="text-sky-600 font-mono italic mb-0.5">N.I. Molla</p>
                      <div className="border-t border-slate-300 pt-1 text-slate-850 font-black">ম্যানেজার / প্রোপ্রাইটর</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-20 text-slate-400 text-xs">
                ইনভয়েস বা মেমো দেখতে বাম পাশের তালিকা থেকে যেকোনো একটি নির্বাচন করুন।
              </p>
            )}
          </div>
        </div>
      )}

      {/* Share simulation Modal */}
      {showShareModal && sharingInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Share2 className="w-5 h-5 text-sky-400" />
                মেমো কাস্টমারকে শেয়ার করুন
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Option 1: Mobile SMS */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-505 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  SMS এর মাধ্যমে প্রেরণ করুন
                </span>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-600 truncate">
                    {`প্রিয় ${sharingInvoice.customerName}, আপনার মোট বিল ${formatTaka(sharingInvoice.totalPayable)}। ভেরিফাই করুন: ${window.location.origin}?verify=${sharingInvoice.controlNumber || ''}`}
                  </p>
                  <button
                    onClick={() => copySMSFormat(sharingInvoice)}
                    className="flex-shrink-0 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedSMS ? 'কপি হয়েছে' : 'কপি SMS'}</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Live Link share */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-505 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  অনলাইন ভেরিফিকেশন লিঙ্ক (স্মার্ট লিঙ্ক)
                </span>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-600 truncate font-mono">
                    {`${window.location.origin}?verify=${sharingInvoice.controlNumber || ''}`}
                  </p>
                  <button
                    onClick={() => copyShareLink(sharingInvoice)}
                    className="flex-shrink-0 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'কপি হয়েছে' : 'কপি লিঙ্ক'}</span>
                  </button>
                </div>
              </div>

              {/* Option 3: WhatsApp Forwarding */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-505 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  হোয়াটসঅ্যাপ (WhatsApp) সরাসরি বার্তা
                </span>
                <a
                  href={`https://wa.me/${sharingInvoice.customerPhone.startsWith('01') ? '88' + sharingInvoice.customerPhone : sharingInvoice.customerPhone}?text=${encodeURIComponent(
                    `প্রিয় ${sharingInvoice.customerName},\nমোল্লা ইলেকট্রনিক্স থেকে আপনার মেমো নম্বর: ${sharingInvoice.id} তৈরি হয়েছে।\n\nসর্বমোট বিল: ${formatTaka(sharingInvoice.totalPayable)}\nপরিশোধিত: ${formatTaka(sharingInvoice.paid)}\nবকেয়া: ${formatTaka(sharingInvoice.due)}\n\nঅনলাইনে মেমোটি ভেরিফাই করতে এই লিঙ্কে ক্লিক করুন: ${window.location.origin}?verify=${sharingInvoice.controlNumber || ''}\n\nধন্যবাদ, মোল্লা ইলেকট্রনিক্স।`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>হোয়াটসঅ্যাপ মেসেজ পাঠান</span>
                </a>
              </div>

              {/* Option 4: Direct Email forwarding simulator */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-505 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-orange-500" />
                  কাস্টমার ইমেইল ফরওয়ার্ডিং
                </span>
                <a
                  href={`mailto:${sharingInvoice.customerEmail || ''}?subject=Molla Electronics Bill Invoice - ${sharingInvoice.id}&body=Hi ${sharingInvoice.customerName}, thanks for visiting Molla Electronics. Your memo code is ${sharingInvoice.id}. Verification link: ${window.location.origin}?verify=${sharingInvoice.controlNumber || ''}. Total billing amount is ${sharingInvoice.totalPayable} Taka.`}
                  className="w-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-indigo-650" />
                  <span>ইমেইলের মাধ্যমে সরাসরি পাঠান</span>
                </a>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  সমাপ্ত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 EMAILJS GATEWAY INTERACTIVE SECURITY CONFIGURATION MODAL */}
      {showEmailConfigModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-150 animate-in fade-in zoom-in duration-150">
            {/* Modal header with matching pink-amber-cyan gradient */}
            <div className="bg-gradient-to-r from-pink-600 via-amber-505 to-cyan-600 text-white p-5 flex justify-between items-center">
              <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-2 uppercase tracking-wide">
                <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                <span>স্বয়ংক্রিয়া ইমেইল কপি গেটওয়ে কনফিগারেশন</span>
              </h3>
              <button
                onClick={() => setShowEmailConfigModal(false)}
                className="text-white hover:opacity-80 transition-opacity cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                <p className="text-xs text-slate-700 leading-relaxed font-bold">
                  🔔 কাস্টমার যখন একটি সচল ইমেইল অ্যাড্রেস নিয়ে নতুন মেমো তৈরি করবে, তখন স্বয়ংক্রিয়াভাবে তার ইমেইল ইনবক্সে একটি ইলেকট্রনিক মানি রিসিট চলে যাবে।
                </p>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  আপনার নিজস্ব ব্র্যান্ড থেকে মেইল পাঠাতে <a href="https://www.emailjs.com/" target="_blank" rel="noreferrer" className="text-slate-900 underline font-black hover:text-pink-650">EmailJS.com</a> এ সাইন-আপ করুন। সেখানে একটি Service, Template তৈরি করে নিচের ইনপুট বক্সে আপনার কীগুলো বসিয়ে দিন।
                </p>
              </div>

              {/* Toggle switch for enabled status */}
              <div className="flex items-center justify-between p-3.5 bg-pink-50/20 border border-pink-200/50 rounded-2xl">
                <div>
                  <span className="block text-xs font-black text-slate-800">স্বয়ংক্রিয় মেইল কপি সরবরাহ সক্রিয় টগল</span>
                  <span className="block text-[10px] text-zinc-400 mt-0.5">নতুন ইনভয়েস তৈরির সাথে সাথেই গ্রাহককে ইমেইল করা হবে</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...emailConfig, enabled: !emailConfig.enabled };
                    setEmailConfig(next);
                    emailStorage.saveSettings(next);
                    toast.success(next.enabled ? 'স্বয়ংক্রিয় ইমেইল কপি সার্ভিস সফলভাবে সক্রিয় হয়েছে!' : 'স্বয়ংক্রিয় ইমেইল কপি সার্ভিস সাময়িক বন্ধ করা হয়েছে।');
                  }}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer ${emailConfig.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5.5 h-5.5 bg-white rounded-full transition-transform shadow-xs ${emailConfig.enabled ? 'translate-x-5.5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">প্রেরকের নাম (Sender)</label>
                    <input
                      type="text"
                      className="block w-full text-xs font-bold border border-slate-200 focus:border-pink-500 rounded-xl p-3 bg-white text-slate-800"
                      value={emailConfig.senderName}
                      onChange={(e) => {
                        const updated = { ...emailConfig, senderName: e.target.value };
                        setEmailConfig(updated);
                        emailStorage.saveSettings(updated);
                      }}
                      placeholder="যেমন: মোল্লা ইলেকট্রনিক্স"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">সার্ভিস আইডি (Service ID)</label>
                    <input
                      type="text"
                      className="block w-full text-xs border border-slate-200 focus:border-pink-500 rounded-xl p-3 bg-white font-mono text-slate-850"
                      value={emailConfig.serviceId}
                      onChange={(e) => {
                        const updated = { ...emailConfig, serviceId: e.target.value };
                        setEmailConfig(updated);
                        emailStorage.saveSettings(updated);
                      }}
                      placeholder="e.g. service_xxxxxx"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">টেমপ্লেট আইডি (Template ID)</label>
                    <input
                      type="text"
                      className="block w-full text-xs border border-slate-200 focus:border-pink-500 rounded-xl p-3 bg-white font-mono text-slate-850"
                      value={emailConfig.templateId}
                      onChange={(e) => {
                        const updated = { ...emailConfig, templateId: e.target.value };
                        setEmailConfig(updated);
                        emailStorage.saveSettings(updated);
                      }}
                      placeholder="e.g. template_xxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">পাবলিক কী (Public Key / User Token)</label>
                    <input
                      type="text"
                      className="block w-full text-xs border border-slate-200 focus:border-pink-500 rounded-xl p-3 bg-white font-mono text-slate-850"
                      value={emailConfig.publicKey}
                      onChange={(e) => {
                        const updated = { ...emailConfig, publicKey: e.target.value };
                        setEmailConfig(updated);
                        emailStorage.saveSettings(updated);
                      }}
                      placeholder="e.g. user_xxxxx / public_key"
                    />
                  </div>
                </div>
              </div>

              {/* Live Connection Test Run block */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="block text-xs font-black text-slate-700">🚀 তাত্ক্ষণিক ইন্টিগ্রেশন টেস্ট রান (Test Send Entry)</span>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="block flex-1 text-xs border border-slate-200 focus:border-pink-500 rounded-xl p-2.5 bg-white text-slate-800"
                    placeholder="টেস্ট রান করার জন্য আপনার ইমেইল প্রদান করুন"
                    value={testEmailAddr}
                    onChange={(e) => setTestEmailAddr(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={isSendingTest || !testEmailAddr}
                    onClick={async () => {
                      if (!testEmailAddr.includes('@')) {
                        alert('দয়া করে সঠিক ইমেইল দিন।');
                        return;
                      }
                      setIsSendingTest(true);
                      toast.info('টেস্ট কপি পাঠানো হচ্ছে...');
                      try {
                         const testInvoice: Invoice = {
                           id: 'TESTMEMO-' + Math.floor(Math.random() * 8999 + 1000),
                           controlNumber: 'ME-C-TEST-' + Math.floor(Math.random() * 89999 + 10000),
                           customerName: 'টেস্ট কাস্টমার',
                           customerPhone: '01700000000',
                           customerEmail: testEmailAddr,
                           date: new Date().toISOString().split('T')[0],
                           items: [
                             { productId: 'test-p', productName: 'Galaxy S24 Ultra Mock (টেস্ট আইটেম)', price: 135000, quantity: 1, total: 135000 }
                           ],
                           subtotal: 135000,
                           discount: 5000,
                           totalPayable: 130000,
                           paid: 130000,
                           due: 0,
                           paymentMethod: 'বিকাশ',
                           creator: activeUser || 'নুরুল ইসলাম মোল্লা'
                         };
                        const response = await sendInvoiceEmail(testInvoice, emailConfig);
                        if (response.success) {
                          toast.success(response.message);
                        } else {
                          toast.warning(response.message);
                        }
                      } catch (err: any) {
                        toast.error(`টেস্ট ব্যর্থ হয়েছে: ${err?.message || err}`);
                      } finally {
                        setIsSendingTest(false);
                      }
                    }}
                    className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {isSendingTest ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>টেস্ট মেইল পাঠান</span>
                  </button>
                </div>
              </div>

              {/* Dialog footer with reset option */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 -mx-6 -mb-6 p-4 px-6 mt-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const fallback = { ...DEFAULT_EMAIL_SETTINGS };
                    setEmailConfig(fallback);
                    emailStorage.saveSettings(fallback);
                    toast.success('কনফিগারেশন সফলভাবে রিসেট করা হয়েছে!');
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-pink-650 transition-colors cursor-pointer"
                >
                  ডিফল্ট ডেমো সেটিংস এ ফিরিয়ে আনুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailConfigModal(false)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all"
                >
                  সেটিংস সংরক্ষণ ও সমাপ্ত
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Clean cross component close icon matching custom types
interface XProps {
  className?: string;
}
function X({ className }: XProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
