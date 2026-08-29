import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { toBanglaNumber, formatTaka, generateID } from '../utils';
import { useToast } from './Toast';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Wallet,
  Calendar,
  Filter,
  TrendingDown,
  Receipt,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseManagementProps {
  expenses: Expense[];
  onExpensesChange: (updatedExpenses: Expense[]) => void;
}

const CATEGORIES: Expense['category'][] = [
  'দোকান ভাড়া',
  'বিদ্যুৎ বিল',
  'স্টাফ বেতন',
  'পরিবহন',
  'আপ্যায়ন',
  'বিজ্ঞাপন',
  'অন্যান্য'
];

export default function ExpenseManagement({ expenses, onExpensesChange }: ExpenseManagementProps) {
  const toast = useToast();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সব');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'weekly'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form Field States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('আপ্যায়ন');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Number input parser supporting both English and Bangla numerals
  const parseNum = (val: string | number): number => {
    if (typeof val === 'number') return val;
    const banglaToEnglish: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const cleanVal = val.toString().split('').map((c) => banglaToEnglish[c] || c).join('');
    return parseFloat(cleanVal) || 0;
  };

  // Category badge color mapping
  const getCategoryBadgeStyle = (cat: Expense['category']) => {
    switch (cat) {
      case 'দোকান ভাড়া':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'বিদ্যুৎ বিল':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'স্টাফ বেতন':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'পরিবহন':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'আপ্যায়ন':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'বিজ্ঞাপন':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'অন্যান্য':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Calculate High-level Stats
  const totalExpensesAllTime = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [expenses]);

  const thisMonthExpenses = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    return expenses
      .filter((item) => item.date && item.date.startsWith(currentMonthPrefix))
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [expenses]);

  const totalExpenseCount = expenses.length;

  // Category-wise Expense Breakdown
  const categoryBreakdown = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = expenses.filter((e) => e.category === cat);
      const catTotal = items.reduce((sum, e) => sum + (e.amount || 0), 0);
      const percentage = totalExpensesAllTime > 0 ? (catTotal / totalExpensesAllTime) * 100 : 0;
      return {
        category: cat,
        total: catTotal,
        count: items.length,
        percentage
      };
    });
  }, [expenses, totalExpensesAllTime]);

  // Filter & Sort Logic
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return expenses
      .filter((item) => {
        // Category Filter
        if (selectedCategory !== 'সব' && item.category !== selectedCategory) {
          return false;
        }

        // Date Range Filter
        if (dateRange === 'today') {
          if (item.date !== todayStr) return false;
        } else if (dateRange === 'weekly') {
          const itemDate = new Date(item.date);
          const diffDays = (today.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays < 0 || diffDays > 7) return false;
        }

        // Search Query
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchNotes = item.notes ? item.notes.toLowerCase().includes(query) : false;
          const matchCategory = item.category.toLowerCase().includes(query);
          const matchAmount = item.amount.toString().includes(query);
          if (!matchTitle && !matchNotes && !matchCategory && !matchAmount) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedCategory, dateRange, searchQuery]);

  // Modal Open Handlers
  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('আপ্যায়ন');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expenseItem: Expense) => {
    setEditingExpense(expenseItem);
    setTitle(expenseItem.title);
    setCategory(expenseItem.category);
    setAmount(expenseItem.amount.toString());
    setDate(expenseItem.date);
    setNotes(expenseItem.notes || '');
    setIsModalOpen(true);
  };

  // Delete Handler
  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (window.confirm(`আপনি কি নিশ্চিত যে "${target?.title || 'এই খরচটি'}" মুছে ফেলতে চান?`)) {
      const updated = expenses.filter((e) => e.id !== id);
      onExpensesChange(updated);
      toast.info(`"${target?.title || id}" সফলভাবে মুছে ফেলা হয়েছে!`);
    }
  };

  // Form Submit Handler
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('দয়া করে খরচের বিবরণ/শিরোনাম লিখুন!');
      return;
    }

    const parsedAmount = parseNum(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('দয়া করে সঠিক খরচের পরিমাণ (টাকা) লিখুন!');
      return;
    }

    if (!date) {
      toast.error('দয়া করে খরচের তারিখ নির্বাচন করুন!');
      return;
    }

    if (editingExpense) {
      // Edit existing expense
      const updatedList = expenses.map((item) => {
        if (item.id === editingExpense.id) {
          return {
            ...item,
            title: title.trim(),
            category,
            amount: parsedAmount,
            date,
            notes: notes.trim() || undefined
          };
        }
        return item;
      });
      onExpensesChange(updatedList);
      toast.success(`"${title.trim()}" খরচের বিবরণী আপডেট করা হয়েছে!`);
    } else {
      // Add new expense
      const newExpense: Expense = {
        id: generateID('EXP'),
        title: title.trim(),
        category,
        amount: parsedAmount,
        date,
        notes: notes.trim() || undefined
      };
      onExpensesChange([...expenses, newExpense]);
      toast.success(`নতুন খরচ "${title.trim()}" সফলভাবে যোগ করা হয়েছে!`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-indigo-600" />
            খরচ ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            দোকানের সকল দৈনিক ও মাসিক খরচের হিসাব সহজে পরিচালনা ও ট্র্যাকিং করুন
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন খরচ যোগ করুন</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses All Time */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">সর্বমোট খরচ (সবসময়)</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">
              {formatTaka(totalExpensesAllTime)}
            </h3>
          </div>
        </div>

        {/* This Month Expenses */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600 shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">চলতি মাসের খরচ</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">
              {formatTaka(thisMonthExpenses)}
            </h3>
          </div>
        </div>

        {/* Total Expense Count */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">মোট খরচের এন্ট্রি</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">
              {toBanglaNumber(totalExpenseCount)} টি
            </h3>
          </div>
        </div>
      </div>

      {/* Category-wise Breakdown Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          ক্যাটাগরি ভিত্তিক খরচের সামারি
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categoryBreakdown.map((item) => (
            <div
              key={item.category}
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-full border font-bold text-[11px] ${getCategoryBadgeStyle(item.category)}`}>
                  {item.category}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {toBanglaNumber(item.count)} টি
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs pt-1">
                <span className="font-extrabold text-slate-800">
                  {formatTaka(item.total)}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {toBanglaNumber(item.percentage.toFixed(1))}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense List Section with Search & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-5">
        {/* Controls Bar: Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খরচের বিবরণ, নোট বা ক্যাটাগরি খুঁজুন..."
              className="w-full border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs pl-10 pr-4 py-2.5 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-500">ক্যাটাগরি:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="সব">সব ক্যাটাগরি</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setDateRange('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  dateRange === 'all'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সব
              </button>
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  dateRange === 'today'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                আজ
              </button>
              <button
                onClick={() => setDateRange('weekly')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  dateRange === 'weekly'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                এই সপ্তাহ
              </button>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-2xl">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-600">কোনো খরচের তথ্য পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">
              {searchQuery || selectedCategory !== 'সব' || dateRange !== 'all'
                ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন'
                : 'নতুন খরচ যোগ করতে উপরের বোতামে ক্লিক করুন'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden">
            {filteredExpenses.map((expenseItem) => (
              <div
                key={expenseItem.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-2xl transition-colors"
              >
                {/* Left Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs text-slate-800 truncate">
                      {expenseItem.title}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full border font-bold text-[10px] ${getCategoryBadgeStyle(
                        expenseItem.category
                      )}`}
                    >
                      {expenseItem.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span className="flex items-center gap-1 text-slate-500 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {toBanglaNumber(expenseItem.date)}
                    </span>
                    {expenseItem.notes && (
                      <span className="truncate text-slate-500 max-w-xs">
                        নোট: {expenseItem.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Info & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatTaka(expenseItem.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(expenseItem)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="সম্পাদনা করুন"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expenseItem.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl max-w-lg w-full space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  {editingExpense ? 'খরচের তথ্য আপডেট করুন' : 'নতুন খরচ যোগ করুন'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveExpense} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    খরচের বিবরণ / শিরোনাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="যেমন: আউটলেট নাস্তা, বিদ্যুৎ বিল, দোকান ভাড়া ইত্যাদি"
                    className="w-full border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs px-3 py-2.5 transition-all"
                    required
                  />
                </div>

                {/* Grid: Category & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      ক্যাটাগরি <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Expense['category'])}
                      className="w-full border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs px-3 py-2.5 bg-white transition-all cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      পরিমাণ (টাকা ৳) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="যেমন: ৫০০"
                      className="w-full border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs px-3 py-2.5 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    তারিখ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs px-3 py-2.5 transition-all cursor-pointer"
                    required
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">নোট / অতিরিক্ত তথ্য (ঐচ্ছিক)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="অতিরিক্ত কোনো তথ্য বা বিবরণ থাকলে লিখুন..."
                    rows={2}
                    className="w-full border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs px-3 py-2.5 transition-all resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingExpense ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
