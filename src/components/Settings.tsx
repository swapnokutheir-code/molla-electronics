import React, { useState, useRef } from 'react';
import { useToast } from './Toast';
import { toBanglaNumber } from '../utils';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Lock,
  Key,
  Database,
  AlertTriangle,
  Check,
  X,
  Info,
  ShieldCheck,
  FileJson,
  HardDriveDownload,
  HardDriveUpload,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsProps {
  onClearData: () => void;
}

const STORAGE_KEYS = [
  'molla_products',
  'molla_invoices',
  'molla_customers',
  'molla_expenses',
  'molla_categories',
  'molla_email_config_v1',
  'molla_proprietor_image',
  'molla_proprietor_image_locked',
  'molla_admin_password',
  'molla_purchase_requests',
  'molla_active_customer',
  'molla_admin_user',
];

export default function SettingsPanel({ onClearData }: SettingsProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Confirm clear data modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');

  // ===== Data Export =====
  const handleExportData = () => {
    const data: Record<string, any> = {};
    STORAGE_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });

    data['_export_info'] = {
      app: 'মোল্লা ইলেকট্রনিক্স',
      version: '2.0',
      exportDate: new Date().toISOString(),
      totalKeys: Object.keys(data).length - 1,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `molla_electronics_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('ব্যাকআপ ফাইল ডাউনলোড করা হয়েছে!');
  };

  // ===== Data Import =====
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (!window.confirm('ইম্পোর্ট করলে বর্তমান সকল ডেটা প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?')) {
          let importedCount = 0;
          Object.keys(data).forEach(key => {
            if (key.startsWith('_')) return;
            if (STORAGE_KEYS.includes(key)) {
              const value = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
              localStorage.setItem(key, value);
              importedCount++;
            }
          });

          toast.success(`${toBanglaNumber(importedCount)} টি ডেটা কী সফলভাবে ইম্পোর্ট করা হয়েছে! পেজ রিলোড হচ্ছে...`);
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        toast.error('ফাইল পড়তে সমস্যা হয়েছে। সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ===== Password Change =====
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const storedPassword = localStorage.getItem('molla_admin_password') || 'admin';

    if (currentPassword !== storedPassword) {
      setPasswordError('বর্তমান পাসওয়ার্ড সঠিক নয়।');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    localStorage.setItem('molla_admin_password', newPassword);
    toast.success('অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // ===== Clear All Data =====
  const handleClearData = () => {
    if (clearConfirmText !== 'মুছে ফেলুন') {
      toast.error('নিশ্চিত করতে "মুছে ফেলুন" লিখুন।');
      return;
    }
    onClearData();
    setShowClearConfirm(false);
    setClearConfirmText('');
    toast.info('সমস্ত ডেটা রিসেট করা হয়েছে। পেজ রিলোড হচ্ছে...');
    setTimeout(() => window.location.reload(), 1500);
  };

  // ===== Storage size estimate =====
  const getStorageSize = () => {
    let totalBytes = 0;
    STORAGE_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) totalBytes += val.length;
    });
    return totalBytes;
  };

  const storageSize = getStorageSize();
  const storageKB = (storageSize / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      {/* ===== Data Backup & Restore ===== */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">ডেটা ব্যাকআপ ও রিস্টোর</h3>
            <p className="text-xs text-slate-400 mt-0.5">আপনার সমস্ত ব্যবসায়িক ডেটা এক্সপোর্ট বা ইম্পোর্ট করুন</p>
          </div>
        </div>

        {/* Storage info */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDriveDownload className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs font-bold text-slate-700">স্টোরেজ ব্যবহৃত</p>
              <p className="text-[10px] text-slate-400">{toBanglaNumber(storageKB)} KB · {toBanglaNumber(STORAGE_KEYS.length)} কী</p>
            </div>
          </div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (storageKB as unknown as number) / 50 * 100)}%` }}
            />
          </div>
        </div>

        {/* Export & Import buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2.5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <p>ব্যাকআপ ডাউনলোড</p>
              <p className="text-[9px] opacity-80">JSON ফাইল হিসেবে সংরক্ষণ</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2.5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Upload className="w-5 h-5" />
            <div className="text-left">
              <p>ব্যাকআপ রিস্টোর</p>
              <p className="text-[9px] opacity-80">JSON ফাইল থেকে ইম্পোর্ট</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="hidden"
          />
        </div>

        {/* Clear all data */}
        <div className="pt-4 border-t border-slate-100">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              সমস্ত ডেটা মুছে ফেলুন
            </button>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-bold leading-relaxed">
                  সতর্কতা! এই কাজটি অপরিবর্তনীয়। সমস্ত পণ্য, ইনভয়েস, কাস্টমার, খরচ ও অন্যান্য ডেটা স্থায়ীভাবে মুছে যাবে।
                </p>
              </div>
              <p className="text-[11px] text-rose-600 font-semibold">
                নিশ্চিত করতে নিচে <span className="font-black">"মুছে ফেলুন"</span> লিখুন:
              </p>
              <input
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                placeholder="মুছে ফেলুন"
                className="w-full px-3 py-2 border border-rose-200 focus:outline-hidden focus:border-rose-500 rounded-xl text-slate-800 text-xs bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowClearConfirm(false); setClearConfirmText(''); }}
                  className="flex-1 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500 cursor-pointer"
                >
                  নিশ্চিত মুছুন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Admin Password Change ===== */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">অ্যাডমিন পাসওয়ার্ড পরিবর্তন</h3>
            <p className="text-xs text-slate-400 mt-0.5">লগইন নিরাপত্তা শক্তিশালী করুন</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">বর্তমান পাসওয়ার্ড</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="বর্তমান পাসওয়ার্ড দিন"
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">নতুন পাসওয়ার্ড</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড দিন"
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">নতুন পাসওয়ার্ড (আবার)</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড আবার দিন"
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-slate-800 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-xs text-rose-600">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Check className="w-4 h-4" />
            পাসওয়ার্ড আপডেট করুন
          </button>
        </form>
      </div>

      {/* ===== About Section ===== */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">অ্যাপ্লিকেশন সম্পর্কে</h3>
            <p className="text-xs text-slate-400 mt-0.5">মোল্লা ইলেকট্রনিক্স ম্যানেজমেন্ট সিস্টেম</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">ভার্সন</p>
            <p className="text-sm font-black text-slate-700 mt-0.5">v২.০.০</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">প্রোপ্রাইটর</p>
            <p className="text-sm font-black text-slate-700 mt-0.5">নুরুল ইসলাম মোল্লা</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">অবস্থান</p>
            <p className="text-sm font-black text-slate-700 mt-0.5">ফরিদপুর, বাংলাদেশ</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">প্রযুক্তি</p>
            <p className="text-sm font-black text-slate-700 mt-0.5">React + Vite</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">
            © ২০২৬ মোল্লা ইলেকট্রনিক্স। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="text-[9px] text-slate-300 mt-0.5">তৈরি করেছে: মোল্লা টেক</p>
        </div>
      </div>
    </div>
  );
}
