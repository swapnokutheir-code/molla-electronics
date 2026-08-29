import React, { useState, useEffect } from 'react';
import { Product, PurchaseRequest, PurchaseRequestItem, Customer } from '../types';
import { toBanglaNumber, formatTaka, storage, generateID } from '../utils';
import { useToast } from './Toast';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Phone,
  MapPin,
  Mail,
  User,
  Smartphone,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
  X,
  Stamp
} from 'lucide-react';

interface CustomerPortalProps {
  products: Product[];
  customer: Customer;
  purchaseRequests: PurchaseRequest[];
  onPurchaseRequestSubmit: (request: PurchaseRequest) => void;
}

export default function CustomerPortal({
  products,
  customer,
  purchaseRequests,
  onPurchaseRequestSubmit
}: CustomerPortalProps) {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<'request' | 'history'>('request');

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [cartItems, setCartItems] = useState<PurchaseRequestItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invoice preview modal
  const [previewInvoice, setPreviewInvoice] = useState<PurchaseRequest | null>(null);

  // Customer's requests (only theirs)
  const myRequests = purchaseRequests.filter(
    r => r.customerPhone === customer.phone
  );
  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const approvedRequests = myRequests.filter(r => r.status === 'approved');

  const stockProducts = products.filter(p => p.stock > 0);

  const handleAddToCart = () => {
    if (!selectedProductId) {
      toast.warning('দয়া করে একটি পণ্য নির্বাচন করুন।');
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (product.stock < quantity) {
      toast.warning(`স্টকে মাত্র ${toBanglaNumber(product.stock)} পিস আছে।`);
      return;
    }

    // Check if already in cart
    const existing = cartItems.findIndex(item => item.productId === selectedProductId);
    if (existing > -1) {
      const updated = [...cartItems];
      updated[existing] = {
        ...updated[existing],
        quantity: updated[existing].quantity + quantity
      };
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          productName: product.name,
          quantity
        }
      ]);
    }

    toast.success(`${product.name} কার্টে যোগ করা হয়েছে!`);
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = () => {
    if (cartItems.length === 0) {
      toast.error('কার্টে অন্তত একটি পণ্য যোগ করুন।');
      return;
    }

    setIsSubmitting(true);

    const newRequest: PurchaseRequest = {
      id: generateID('REQ'),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAddress: customer.address,
      date: new Date().toISOString(),
      items: cartItems,
      notes: notes || undefined,
      status: 'pending'
    };

    onPurchaseRequestSubmit(newRequest);

    setTimeout(() => {
      setCartItems([]);
      setNotes('');
      setIsSubmitting(false);
      toast.success('আপনার অনুরোধ সফলভাবে জমা হয়েছে! অ্যাডমিন অনুমোদনের পর আপনি ইনভয়েস দেখতে পারবেন।');
      setActiveSection('history');
    }, 800);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-bold">
          <Clock className="w-3 h-3" />
          অপেক্ষমাণ
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold">
          <CheckCircle className="w-3 h-3" />
          অনুমোদিত
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-[10px] font-bold">
        <XCircle className="w-3 h-3" />
        বাতিল
      </span>
    );
  };

  // ===== Invoice Preview Modal with Letterhead & Watermark =====
  const InvoicePreviewModal = ({ request }: { request: PurchaseRequest }) => {
    if (!request || !request.invoiceId) return null;
    const subtotal = request.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discount = 0;
    const totalPayable = subtotal - discount;

    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 my-8">
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              অনুমোদিত ইনভয়েস প্রিভিউ
            </h3>
            <button
              onClick={() => setPreviewInvoice(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Invoice body with letterhead */}
          <div className="p-6 sm:p-8 relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
              <div className="text-center -rotate-12">
                <p className="text-5xl font-black text-slate-900 tracking-widest uppercase">মোল্লা ইলেকট্রনিক্স</p>
                <p className="text-2xl font-bold text-slate-700 mt-2">অফিসিয়াল ইনভয়েস</p>
                <p className="text-lg text-slate-500 mt-1">Molla Electronics - Verified Copy</p>
              </div>
            </div>

            {/* Letterhead Header */}
            <div className="relative z-10 border-b-2 border-slate-800 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                      মে
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-900">মোল্লা ইলেকট্রনিক্স</h1>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Molla Electronics</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    স্বত্বাধিকারী: নুরুল ইসলাম মোল্লা<br />
                    ফরিদপুর, বাংলাদেশ · মোবাইল: {toBanglaNumber('01710-000000')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    ✓ অনুমোদিত ইনভয়েস
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">ইনভয়েস: {request.invoiceId}</p>
                  <p className="text-[10px] text-slate-400 font-mono">অনুরোধ: {request.id}</p>
                </div>
              </div>
            </div>

            {/* Customer info */}
            <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">গ্রাহক</p>
                <p className="text-sm font-bold text-slate-800">{request.customerName}</p>
                <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                  <p className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {toBanglaNumber(request.customerPhone)}</p>
                  {request.customerEmail && <p className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {request.customerEmail}</p>}
                  {request.customerAddress && <p className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {request.customerAddress}</p>}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">ইনভয়েস তথ্য</p>
                <p className="text-[10px] text-slate-600">তারিখ: {toBanglaNumber(request.approvedDate?.split('T')[0] || '')}</p>
                <p className="text-[10px] text-slate-600">অনুমোদনকারী: {request.approvedBy}</p>
                <p className="text-[10px] text-slate-600 mt-1">আইটেম: {toBanglaNumber(request.items.length)} টি</p>
              </div>
            </div>

            {/* Items table */}
            <div className="relative z-10 mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-2 text-[10px] font-black text-slate-600 uppercase">#</th>
                    <th className="text-left py-2 text-[10px] font-black text-slate-600 uppercase">পণ্যের নাম</th>
                    <th className="text-center py-2 text-[10px] font-black text-slate-600 uppercase">পরিমাণ</th>
                    <th className="text-left py-2 text-[10px] font-black text-slate-600 uppercase">IMEI</th>
                    <th className="text-right py-2 text-[10px] font-black text-slate-600 uppercase">দর</th>
                    <th className="text-right py-2 text-[10px] font-black text-slate-600 uppercase">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2.5 text-slate-400 font-bold">{toBanglaNumber(String(idx + 1))}</td>
                      <td className="py-2.5 font-bold text-slate-800">{item.productName}</td>
                      <td className="py-2.5 text-center text-slate-600">{toBanglaNumber(item.quantity)} পিস</td>
                      <td className="py-2.5 text-[9px] font-mono text-slate-500">
                        {item.imeis && item.imeis.length > 0 ? (
                          item.imeis.map((imei, i) => (
                            <div key={i} className="bg-slate-100 px-1.5 py-0.5 rounded mb-0.5 inline-block mr-1">
                              {imei}
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">{item.price ? formatTaka(item.price) : '—'}</td>
                      <td className="py-2.5 text-right font-bold text-slate-800">{item.total ? formatTaka(item.total) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial summary */}
            <div className="relative z-10 flex justify-end mb-6">
              <div className="w-56 space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>সর্বমোট:</span>
                  <span className="font-bold">{formatTaka(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>ছাড়:</span>
                  <span className="font-bold">- {formatTaka(discount)}</span>
                </div>
                <div className="flex justify-between border-t-2 border-slate-300 pt-2 text-sm font-black text-slate-900">
                  <span>সর্বমোট বিল:</span>
                  <span>{formatTaka(totalPayable)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 border-t border-slate-200 pt-4 mt-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-slate-400">এই ইনভয়েসটি কম্পিউটার জেনারেটেড এবং মোল্লা ইলেকট্রনিক্সের পক্ষ থেকে অনুমোদিত।</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">© ২০২৬ মোল্লা ইলেকট্রনিক্স। সর্বস্বত্ব সংরক্ষিত।</p>
                </div>
                <div className="text-right">
                  <div className="w-28 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                    <span className="text-[9px] font-bold text-slate-300 uppercase">সিগনেচার</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">প্রোপ্রাইটর: নুরুল ইসলাম মোল্লা</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              প্রিন্ট / ডাউনলোড
            </button>
            <button
              onClick={() => setPreviewInvoice(null)}
              className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Customer info banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-3xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-lg">
              {customer.name[0]}
            </div>
            <div>
              <p className="font-black text-base">{customer.name}</p>
              <p className="text-[11px] text-indigo-100 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {toBanglaNumber(customer.phone)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-white/15 rounded-xl text-[10px] font-bold">
              অপেক্ষমাণ: {toBanglaNumber(pendingRequests.length)}
            </span>
            <span className="px-3 py-1.5 bg-white/15 rounded-xl text-[10px] font-bold">
              অনুমোদিত: {toBanglaNumber(approvedRequests.length)}
            </span>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('request')}
          className={`flex-1 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'request'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          নতুন ক্রয় অনুরোধ
        </button>
        <button
          onClick={() => setActiveSection('history')}
          className={`flex-1 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          আমার ইনভয়েস ও অনুরোধ
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center text-[9px] font-black">
              {toBanglaNumber(pendingRequests.length)}
            </span>
          )}
        </button>
      </div>

      {/* ===== New Purchase Request Form ===== */}
      {activeSection === 'request' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-800 mb-1">ক্রয় অনুরোধ ফর্ম</h3>
            <p className="text-xs text-slate-400 mb-4">আপনি যে পণ্যগুলো কিনতে চান তা নির্বাচন করুন। অ্যাডমিন অনুমোদনের পর ইনভয়েস তৈরি হবে।</p>

            {/* Product selection */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">পণ্য নির্বাচন করুন</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs bg-white cursor-pointer"
                >
                  <option value="">-- পণ্য বাছুন --</option>
                  {stockProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand}) — স্টক: {toBanglaNumber(p.stock)} পিস — {formatTaka(p.sellPrice)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">পরিমাণ</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs"
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button
                  onClick={handleAddToCart}
                  className="w-full px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  যোগ করুন
                </button>
              </div>
            </div>

            {/* Cart items */}
            {cartItems.length > 0 ? (
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">নির্বাচিত পণ্যসমূহ</div>
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-[10px] font-black">
                        {toBanglaNumber(String(idx + 1))}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.productName}</p>
                        <p className="text-[10px] text-slate-400">পরিমাণ: {toBanglaNumber(item.quantity)} পিস</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl mb-4">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">কার্ট খালি — পণ্য যোগ করুন</p>
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">অতিরিক্ত মন্তব্য (ঐচ্ছিক)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="রঙ, ভেরিয়েন্ট, বা বিশেষ অনুরোধ লিখুন..."
                className="w-full px-3 py-2.5 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmitRequest}
              disabled={cartItems.length === 0 || isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  জমা হচ্ছে...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  অনুরোধ জমা দিন
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== History & Invoices ===== */}
      {activeSection === 'history' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">কোনো অনুরোধ বা ইনভয়েস নেই</p>
              <p className="text-[11px] text-slate-400 mt-1">নতুন ক্রয় অনুরোধ জমা দিলে এখানে দেখা যাবে।</p>
            </div>
          ) : (
            myRequests.slice().reverse().map((req) => (
              <div key={req.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Request header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                      req.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {req.status === 'approved' ? <CheckCircle className="w-5 h-5" /> :
                       req.status === 'pending' ? <Clock className="w-5 h-5" /> :
                       <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">অনুরোধ: {req.id}</p>
                      <p className="text-[10px] text-slate-400">
                        {toBanglaNumber(new Date(req.date).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' }))}
                        {' · '}আইটেম: {toBanglaNumber(req.items.length)} টি
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                {/* Items list */}
                <div className="p-4">
                  <div className="space-y-2">
                    {req.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{item.productName}</p>
                          <p className="text-[10px] text-slate-400">পরিমাণ: {toBanglaNumber(item.quantity)} পিস</p>
                          {item.imeis && item.imeis.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.imeis.map((imei, i) => (
                                <span key={i} className="text-[8px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                  IMEI: {imei}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {item.total && (
                          <p className="text-xs font-bold text-slate-700">{formatTaka(item.total)}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total & action for approved */}
                  {req.status === 'approved' && req.items.some(i => i.total) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">সর্বমোট বিল:</span>
                      <span className="text-sm font-black text-indigo-600">
                        {formatTaka(req.items.reduce((sum, i) => sum + (i.total || 0), 0))}
                      </span>
                    </div>
                  )}

                  {/* View invoice button for approved */}
                  {req.status === 'approved' && req.invoiceId && (
                    <button
                      onClick={() => setPreviewInvoice(req)}
                      className="w-full mt-3 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      ইনভয়েস দেখুন (লেটারহেডসহ)
                    </button>
                  )}

                  {/* Notes display */}
                  {req.notes && (
                    <div className="mt-2 text-[10px] text-slate-400 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <span className="font-bold">আপনার মন্তব্য:</span> {req.notes}
                    </div>
                  )}
                  {req.adminNotes && (
                    <div className="mt-1 text-[10px] text-indigo-600 bg-indigo-50 rounded-lg p-2 border border-indigo-100">
                      <span className="font-bold">অ্যাডমিন মন্তব্য:</span> {req.adminNotes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewInvoice && <InvoicePreviewModal request={previewInvoice} />}
    </div>
  );
}
