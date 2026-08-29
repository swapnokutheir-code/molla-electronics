import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { toBanglaNumber, formatTaka, generateID, storage } from '../utils';
import { useToast } from './Toast';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle, 
  Boxes, 
  Database, 
  TrendingUp, 
  AlertCircle,
  Settings,
  FolderOpen,
  Trash
} from 'lucide-react';

interface StockManagementProps {
  products: Product[];
  onProductsChange: (updatedProducts: Product[]) => void;
}

export default function StockManagement({ products, onProductsChange }: StockManagementProps) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states for Add/Edit
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('৩');

  // Form categories tracker (select multiple checkboxes!)
  const [selectedFormCategories, setSelectedFormCategories] = useState<string[]>([]);

  // Quick Inline Stock Edit states
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineStockValue, setInlineStockValue] = useState('');

  // Categories managed state (loads from localStorage)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  useEffect(() => {
    setCategoryOptions(storage.getCategories());
  }, []);

  // Calculated Stats
  const totalItemsCount = products.length;
  const totalStockSum = products.reduce((sum, p) => sum + p.stock, 0);
  const totalSoldSum = products.reduce((sum, p) => sum + p.sold, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setName('');
    setBrand('');
    setPurchasePrice('');
    setSellPrice('');
    setStock('');
    setMinStock('৩');
    // Default to first category if available
    setSelectedFormCategories(categoryOptions.length > 0 ? [categoryOptions[0]] : []);
    setShowAddModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setName(product.name);
    // Load existing category lists
    setSelectedFormCategories(product.categories || [product.category]);
    setBrand(product.brand);
    setPurchasePrice(product.purchasePrice.toString());
    setSellPrice(product.sellPrice.toString());
    setStock(product.stock.toString());
    setMinStock(product.minStock.toString());
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (window.confirm('আপনি কি নিশ্চিত যে পণ্যটি মুছে ফেলতে চান?')) {
      const updated = products.filter((p) => p.id !== id);
      onProductsChange(updated);
      toast.info(`"${product?.name || id}" সফলভাবে মুছে ফেলা হয়েছে!`);
    }
  };

  // Categories CRUD operations
  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (categoryOptions.includes(trimmed)) {
      toast.warning('এই ক্যাটাগরি ইতিমধ্যে বিদ্যমান!');
      return;
    }
    const updated = [...categoryOptions, trimmed];
    setCategoryOptions(updated);
    storage.setCategories(updated);
    setNewCatInput('');
    toast.success(`"${trimmed}" ক্যাটাগরি সফলভাবে তৈরি করা হয়েছে!`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categoryOptions.length <= 1) {
      toast.error('কমপক্ষে একটি ক্যাটাগরি সিস্টেমে থাকতে হবে!');
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিত যে "${catToDelete}" ক্যাটাগরি মুছে ফেলতে চান?`)) {
      const updated = categoryOptions.filter(c => c !== catToDelete);
      setCategoryOptions(updated);
      storage.setCategories(updated);

      // Clean deleted categories on products too to safe-bound compatibility
      const updatedProducts = products.map(p => {
        let changed = false;
        let newCats = p.categories ? p.categories.filter(c => c !== catToDelete) : [];
        if (newCats.length === 0) {
          newCats = [updated[0]]; // fallback
          changed = true;
        }
        let primaryCat = p.category;
        if (p.category === catToDelete) {
          primaryCat = newCats[0];
          changed = true;
        }
        return changed ? { ...p, category: primaryCat, categories: newCats } : p;
      });

      onProductsChange(updatedProducts);
      toast.info(`"${catToDelete}" ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে!`);
    }
  };

  const handleStartRenameCategory = (cat: string) => {
    setEditingCatName(cat);
    setEditingCatValue(cat);
  };

  const handleSaveRenameCategory = () => {
    const trimmed = editingCatValue.trim();
    if (!trimmed || !editingCatName) return;
    if (categoryOptions.includes(trimmed) && trimmed !== editingCatName) {
      toast.error('এই নামের ক্যাটাগরি ইতিমধ্যে অন্যত্রে বিদ্যমান!');
      return;
    }

    const updated = categoryOptions.map(c => c === editingCatName ? trimmed : c);
    setCategoryOptions(updated);
    storage.setCategories(updated);

    // Dynamic product updating
    const updatedProducts = products.map(p => {
      let changed = false;
      let newCats = p.categories ? [...p.categories] : [p.category];
      if (p.category === editingCatName) {
        p.category = trimmed;
        changed = true;
      }
      if (newCats.includes(editingCatName)) {
        newCats = newCats.map(c => c === editingCatName ? trimmed : c);
        changed = true;
      }
      return changed ? { ...p, categories: newCats } : p;
    });

    onProductsChange(updatedProducts);
    toast.success(`"${editingCatName}" এর নাম পরিবর্তন করে "${trimmed}" করা হয়েছে!`);
    setEditingCatName(null);
  };

  // Toggle categories checkboxes in Form
  const handleToggleFormCategory = (cat: string) => {
    if (selectedFormCategories.includes(cat)) {
      // Keep at least one category selected
      if (selectedFormCategories.length > 1) {
        setSelectedFormCategories(selectedFormCategories.filter(c => c !== cat));
      }
    } else {
      setSelectedFormCategories([...selectedFormCategories, cat]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brand || !purchasePrice || !sellPrice || !stock) {
      alert('দয়া করে সব প্রয়োজনীয় তথ্য ঠিকঠাক পূরণ করুন।');
      return;
    }

    if (selectedFormCategories.length === 0) {
      alert('দয়া করে কমপক্ষে একটি ক্যাটাগরি প্রোডাক্টের জন্য নির্বাচন করুন।');
      return;
    }

    const parseNum = (val: string) => {
      const banglaToEnglish: Record<string, string> = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
      };
      const cleanVal = val.split('').map(c => banglaToEnglish[c] || c).join('');
      return parseFloat(cleanVal) || 0;
    };

    if (selectedProduct) {
      // Edit mode
      const updatedProducts = products.map((p) => {
        if (p.id === selectedProduct.id) {
          return {
            ...p,
            name,
            category: selectedFormCategories[0], // fallback singular string
            categories: selectedFormCategories, // multiple categories support
            brand,
            purchasePrice: parseNum(purchasePrice),
            sellPrice: parseNum(sellPrice),
            stock: parseNum(stock),
            minStock: parseNum(minStock),
          };
        }
        return p;
      });
      onProductsChange(updatedProducts);
      toast.success(`"${name}" এর বিবরণী ও তথ্য সফলভাবে আপডেট করা হয়েছে!`);
    } else {
      // Add mode
      const newProduct: Product = {
        id: generateID('PRD'),
        name,
        category: selectedFormCategories[0], // fallback singular string
        categories: selectedFormCategories, // multiple categories support
        brand,
        purchasePrice: parseNum(purchasePrice),
        sellPrice: parseNum(sellPrice),
        stock: parseNum(stock),
        sold: 0,
        minStock: parseNum(minStock),
      };
      onProductsChange([...products, newProduct]);
      toast.success(`"${name}" পণ্যটি সফলভাবে স্টকে যুক্ত করা হয়েছে!`);
    }

    setShowAddModal(false);
  };

  const handleQuickStockSave = (id: string) => {
    const banglaToEnglish: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const cleanVal = inlineStockValue.split('').map(c => banglaToEnglish[c] || c).join('');
    const num = parseInt(cleanVal);
    if (!isNaN(num) && num >= 0) {
      const targetP = products.find(p => p.id === id);
      const updated = products.map((p) => {
        if (p.id === id) {
          return { ...p, stock: num };
        }
        return p;
      });
      onProductsChange(updated);
      toast.success(`"${targetP?.name || 'নির্বাচিত পণ্য'}" এর স্টক সফলভাবে আপডেট করে ${toBanglaNumber(num)} পিস করা হয়েছে!`);
    } else {
      toast.error('দয়া করে সঠিক সংখ্যা ইনপুট দিন!');
    }
    setInlineEditId(null);
  };

  // Filter list supporting single matched or multi-matched categories
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'সব' || 
                            product.category === selectedCategory ||
                            (product.categories && product.categories.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Upper overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">মেমরিতে মোট ক্যাটাগরি</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-slate-850">
              {toBanglaNumber(categoryOptions.length)} টি
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">স্টকে মোট পণ্য</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-slate-850">
              {toBanglaNumber(totalStockSum)} পিস
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">মোট বিক্রিত পণ্য</span>
            <span className="text-xl sm:text-2xl font-black mt-1 text-emerald-600">
              {toBanglaNumber(totalSoldSum)} পিস
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
          <div>
            <span className="block text-xs font-semibold text-slate-400">সীমিত স্টক এলার্ট</span>
            <span className={`text-xl sm:text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              {toBanglaNumber(lowStockCount)} টি
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Stock Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {/* Table header operations */}
        <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-slate-900">পণ্য তালিকা ও ক্যাটাগরি ব্যবস্থাপনা</h3>
            <p className="text-xs text-slate-400">নতুন স্টক অ্যাড, একাধিক ক্যাটাগরি নির্বাচন এবং স্টক আপডেট</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="নাম, ব্র্যান্ড বা আইডি খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs w-full sm:w-48"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs text-slate-650"
            >
              <option value="সব">সকল ক্যাটাগরি</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Category settings panel button */}
            <button
              onClick={() => {
                setShowCategoryManager(!showCategoryManager);
                // Resync
                setCategoryOptions(storage.getCategories());
              }}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>ক্যাটাগরি কাস্টমাইজ</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্রোডাক্ট অ্যাড</span>
            </button>
          </div>
        </div>

        {/* Dynamic Category Manager Roster collapse section */}
        {showCategoryManager && (
          <div className="p-5 bg-slate-50 border-b border-slate-150 space-y-4 animate-in slide-in-from-top-1.5 duration-200 text-left">
            <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-xs text-slate-800">সিস্টেম ক্যাটাগরি কন্ট্রোল প্যানেল</h4>
                <p className="text-[10px] text-slate-400">এখান থেকে নতুন ক্যাটাগরি যোগ, বানান সংশোধন বা ডিলিট করতে পারেন।</p>
              </div>
              <button 
                onClick={() => setShowCategoryManager(false)}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                বন্ধ করুন ✖
              </button>
            </div>

            {/* Form row to add category */}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="নতুন ক্যাটাগরি নাম লিখুন (যেমন: কভার গ্লাস)"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shrink-0 cursor-pointer"
              >
                যোগ করুন
              </button>
            </div>

            {/* Badges layout list */}
            <div className="bg-white border rounded-2xl p-4.5 space-y-3">
              <span className="block text-[10px] font-bold text-slate-400">বিদ্যমান ক্যাটাগরিসমূহ (এডিট / ডিলিট করুন):</span>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <div 
                    key={cat} 
                    className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs"
                  >
                    {editingCatName === cat ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingCatValue}
                          onChange={(e) => setEditingCatValue(e.target.value)}
                          className="px-1.5 py-0.5 bg-white border border-indigo-400 rounded-md text-xs font-bold w-28"
                          autoFocus
                        />
                        <button 
                          onClick={handleSaveRenameCategory}
                          className="text-[10px] text-emerald-600 font-bold hover:underline"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => setEditingCatName(null)}
                          className="text-[10px] text-slate-405 font-bold hover:underline"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-800">{cat}</span>
                        <button 
                          onClick={() => handleStartRenameCategory(cat)}
                          className="p-0.5 text-slate-400 hover:text-indigo-650"
                          title="নাম সংশোধন করুন"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-0.5 text-slate-400 hover:text-rose-650"
                          title="মুছে ফেলুন"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* List table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">আইডি</th>
                <th className="py-3 px-5 text-left">প্রোডাক্টের নাম</th>
                <th className="py-3 px-5">ক্যাটাগরিসমূহ (ট্যাগস)</th>
                <th className="py-3 px-5">ব্র্যান্ড</th>
                <th className="py-3 px-5 text-right font-mono">ক্রয় মূল্য</th>
                <th className="py-3 px-5 text-right font-mono">বিক্রয় মূল্য</th>
                <th className="py-3 px-5 text-right">স্টক (পিস)</th>
                <th className="py-3 px-5 text-right">বিক্রিত</th>
                <th className="py-3 px-5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

                  const attachedCategories = product.categories || [product.category];

                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${isLowStock ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="py-4 px-5 font-mono text-slate-500 font-bold">{product.id}</td>
                      <td className="py-4 px-5 font-semibold text-slate-850">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {isLowStock && (
                            <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1 mt-0.5 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              স্টক সীমিত (মিনিমাম লিমিট: {toBanglaNumber(product.minStock)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1">
                          {attachedCategories.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-750 rounded-md font-extrabold text-[9px] border border-indigo-10/20">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-medium">{product.brand}</td>
                      <td className="py-4 px-5 text-right font-semibold text-slate-500 font-mono">
                        {formatTaka(product.purchasePrice)}
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-slate-900 font-mono">
                        {formatTaka(product.sellPrice)}
                      </td>
                      
                      {/* Interactive Stock Column */}
                      <td className="py-4 px-5 text-right">
                        {inlineEditId === product.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="text"
                              value={inlineStockValue}
                              onChange={(e) => setInlineStockValue(e.target.value)}
                              className="w-12 px-1 py-0.5 border border-indigo-400 rounded focus:outline-hidden text-right font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickStockSave(product.id)}
                              className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInlineEditId(null)}
                              className="p-1 bg-slate-200 text-slate-500 rounded hover:bg-slate-300 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setInlineEditId(product.id);
                              setInlineStockValue(product.stock.toString());
                            }}
                            className={`inline-flex items-center gap-1.5 cursor-pointer hover:bg-indigo-50 px-2 py-1 rounded transition-colors group ${
                              isOutOfStock ? 'text-red-600 font-bold' : isLowStock ? 'text-amber-600 font-bold' : 'text-slate-800 font-bold'
                            }`}
                            title="ক্লিক করে দ্রুত স্টক আপডেট করুন"
                          >
                            <span>{toBanglaNumber(product.stock)}</span>
                            <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right font-medium text-emerald-600">
                        {toBanglaNumber(product.sold)}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-650 text-slate-500 rounded-lg transition-colors cursor-pointer"
                            title="পণ্যের তথ্য সম্পাদনা করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    কোনো পণ্য খুঁজে পাওয়া যায়নি! নতুন পণ্য যুক্ত করুন।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modals */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-950 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">
                  {selectedProduct ? 'পণ্যের তথ্য সংশোধন করুন' : 'নতুন পণ্য যুক্ত করুন'}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {selectedProduct ? `আইডি নম্বর: ${selectedProduct.id}` : 'সবগুলি প্রয়োজনীয় তথ্য পূরণ করুন'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">প্রোডাক্টের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Xiaomi Redmi Note 13"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              {/* Multiple Categories Selection Matrix checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ক্যাটাগরি বা ক্যাটাগরিসমূহ পছন্দ করুন * (একাধিক বাছাইযোগ্য)</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                  {categoryOptions.map((cat) => {
                    const isChecked = selectedFormCategories.includes(cat);
                    return (
                      <label key={cat} className="flex items-center gap-2 text-xs font-medium text-slate-705 cursor-pointer selection-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleFormCategory(cat)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">ব্র্যান্ড নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Samsung, Vivo"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-850"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <label className="block text-xs font-bold text-slate-500 mb-1">ন্যূনতম স্টক এলার্ট লিমিট *</label>
                  <input
                    type="text"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="যেমন: ৩"
                    className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">ক্রয় মূল্য (৳) *</label>
                  <input
                    type="text"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="যেমন: ১৫০০০"
                    className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-850 font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">বিক্রয় মূল্য (৳) *</label>
                  <input
                    type="text"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="যেমন: ১৭৫০০"
                    className="w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-850 font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">স্টক (পিস) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!selectedProduct}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="যেমন: ১৫"
                    className={`w-full text-xs sm:text-sm px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-855 font-mono text-right ${selectedProduct ? 'bg-slate-50 cursor-not-allowed text-slate-400' : ''}`}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl cursor-pointer"
                >
                  {selectedProduct ? 'তথ্য আপডেট করুন' : 'পণ্য যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
