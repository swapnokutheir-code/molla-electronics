import React, { useState, useEffect, FormEvent } from 'react';
import { Product, Invoice, Customer, PurchaseRequest } from '../types';
import { toBanglaNumber, formatTaka, storage, generateID } from '../utils';
import Logo from './Logo';
import CustomerPortal from './CustomerPortal';
// @ts-ignore
const defaultProprietorPhoto = 'https://base44.app/api/apps/6a7c4932fc99670f477f810c/files/mp/public/6a7c4932fc99670f477f810c/36eaa5b6c_proprietor_real_photo_1780799680231.png';
import { 
  Phone, 
  MapPin, 
  User, 
  Search, 
  Cpu, 
  Smartphone, 
  Tv, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Lock,
  Mail,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  LogOut,
  Edit2,
  Check,
  X,
  CreditCard,
  UserPlus,
  Camera,
  Upload,
  RefreshCw
} from 'lucide-react';

interface CustomerHomeProps {
  products: Product[];
  invoices: Invoice[];
  onAdminLoginClick: () => void;
  purchaseRequests?: PurchaseRequest[];
  onPurchaseRequestSubmit?: (request: PurchaseRequest) => void;
}

export default function CustomerHome({ products, invoices, onAdminLoginClick, purchaseRequests = [], onPurchaseRequestSubmit }: CustomerHomeProps) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব');
  const [selectedBrand, setSelectedBrand] = useState('সব');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Custom Category list from storage
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  
  // Active Customer Session State
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  
  // Modal controllers
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountTab, setAccountTab] = useState<'login' | 'register' | 'profile' | 'orders' | 'portal'>('login');
  const [showPortal, setShowPortal] = useState(false);
  
  // Portal Form States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Proprietor direct image state & upload handler - load from localStorage if exists
  const [proprietorImg, setProprietorImg] = useState<string>(() => {
    return localStorage.getItem('molla_proprietor_image') || defaultProprietorPhoto;
  });

  const [isImageLocked, setIsImageLocked] = useState<boolean>(() => {
    return localStorage.getItem('molla_proprietor_image_locked') !== 'false'; // Default to true (locked)
  });

  const [showPhotoUnlockModal, setShowPhotoUnlockModal] = useState(false);
  const [photoPasscode, setPhotoPasscode] = useState('');
  const [photoPasscodeErr, setPhotoPasscodeErr] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingAction, setPendingAction] = useState<'upload' | 'reset' | 'toggle_lock' | null>(null);
  const [copiedImageCode, setCopiedImageCode] = useState(false);

  const handleCopyImageCode = () => {
    if (proprietorImg) {
      navigator.clipboard.writeText(proprietorImg);
      setCopiedImageCode(true);
      setTimeout(() => setCopiedImageCode(false), 3000);
    }
  };

  const isAdminLoggedIn = !!localStorage.getItem('molla_admin_user');

  const executeImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProprietorImg(base64String);
      localStorage.setItem('molla_proprietor_image', base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isImageLocked && !isAdminLoggedIn) {
        setPendingFile(file);
        setPendingAction('upload');
        setShowPhotoUnlockModal(true);
        setPhotoPasscode('');
        setPhotoPasscodeErr('');
        e.target.value = ''; // Reset element
      } else {
        executeImageUpload(file);
      }
    }
  };

  const handleResetImage = () => {
    if (isImageLocked && !isAdminLoggedIn) {
      setPendingFile(null);
      setPendingAction('reset');
      setShowPhotoUnlockModal(true);
      setPhotoPasscode('');
      setPhotoPasscodeErr('');
    } else {
      if (window.confirm('আপনি কি পূর্বনির্ধারিত ছবিতে ফিরে যেতে চান?')) {
        setProprietorImg(defaultProprietorPhoto);
        localStorage.removeItem('molla_proprietor_image');
      }
    }
  };

  const handleToggleLock = () => {
    if (isImageLocked) {
      if (!isAdminLoggedIn) {
        setPendingFile(null);
        setPendingAction('toggle_lock');
        setShowPhotoUnlockModal(true);
        setPhotoPasscode('');
        setPhotoPasscodeErr('');
      } else {
        setIsImageLocked(false);
        localStorage.setItem('molla_proprietor_image_locked', 'false');
      }
    } else {
      setIsImageLocked(true);
      localStorage.setItem('molla_proprietor_image_locked', 'true');
    }
  };

  const handlePhotoUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = ['৭১৮৯', '7189', '২০২৬', '2026', 'admin'];
    if (validCodes.includes(photoPasscode.trim())) {
      setPhotoPasscodeErr('');
      setShowPhotoUnlockModal(false);

      if (pendingAction === 'upload' && pendingFile) {
        executeImageUpload(pendingFile);
      } else if (pendingAction === 'reset') {
        setProprietorImg(defaultProprietorPhoto);
        localStorage.removeItem('molla_proprietor_image');
      } else if (pendingAction === 'toggle_lock') {
        setIsImageLocked(false);
        localStorage.setItem('molla_proprietor_image_locked', 'false');
      }
      
      setPendingFile(null);
      setPendingAction(null);
    } else {
      setPhotoPasscodeErr('ভুল পাসকোড! অনুগ্রহ করে সঠিক অ্যাডমিন পাসকোডটি দিন।');
    }
  };

  // Hidden admin access gate state controls
  const [logoClicks, setLogoClicks] = useState(0);
  const [showPasscodeGate, setShowPasscodeGate] = useState(false);
  const [passcodeVal, setPasscodeVal] = useState('');
  const [passcodeErr, setPasscodeErr] = useState('');
  const [secretKeysPressed, setSecretKeysPressed] = useState('');

  useEffect(() => {
    // Dynamic categories list matching admin custom categories
    setCategoriesList(storage.getCategories());
    
    // Check if customer is already logged in
    const cachedCustomer = localStorage.getItem('molla_active_customer');
    if (cachedCustomer) {
      const parsed = JSON.parse(cachedCustomer);
      setActiveCustomer(parsed);
      setProfileName(parsed.name);
      setProfileEmail(parsed.email || '');
      setProfileAddress(parsed.address || '');
      setAccountTab('profile');
    }

    // Secret keyboard listener: typing "admingo" opens the gate
    const handleKeyPress = (e: KeyboardEvent) => {
      setSecretKeysPressed((prev) => {
        const updated = (prev + e.key.toLowerCase()).slice(-7);
        if (updated === 'admingo') {
          setShowPasscodeGate(true);
          return '';
        }
        return updated;
      });
    };
    window.addEventListener('keydown', handleKeyPress);

    // Check URL parameters for silent admin bypass
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('mode') === 'admin' || params.get('panel') === 'secure') {
      setShowPasscodeGate(true);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Sync Categories list if category storage triggers inside the page
  const refreshCategories = () => {
    setCategoriesList(storage.getCategories());
  };

  // List of unique brands
  const brands = ['সব', ...Array.from(new Set(products.map((p) => p.brand)))];

  // Dynamic filter lists
  const filteredProducts = products.filter((product) => {
    // Search match: Name, model (id), brand, or keywords
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      product.name.toLowerCase().includes(searchLower) || 
      product.brand.toLowerCase().includes(searchLower) ||
      product.id.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower);

    // Category match: supports single or multiple category items
    const matchesCategory = 
      selectedCategory === 'সব' || 
      product.category === selectedCategory || 
      (product.categories && product.categories.includes(selectedCategory));

    // Brand match
    const matchesBrand = selectedBrand === 'সব' || product.brand === selectedBrand;

    // Price range match
    const sellPrice = product.sellPrice;
    const matchesMinPrice = minPrice === '' || sellPrice >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || sellPrice <= parseFloat(maxPrice);

    return matchesSearch && matchesCategory && matchesBrand && matchesMinPrice && matchesMaxPrice;
  });

  // Handle customer login
  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!loginPhone || !loginPassword) {
      setModalError('দয়া করে সচল মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    const customers = storage.getCustomers();
    const matched = customers.find(c => c.phone === loginPhone && c.password === loginPassword);

    if (matched) {
      setActiveCustomer(matched);
      setProfileName(matched.name);
      setProfileEmail(matched.email || '');
      setProfileAddress(matched.address || '');
      localStorage.setItem('molla_active_customer', JSON.stringify(matched));
      setModalSuccess('সফলভাবে লগইন করা হয়েছে!');
      setTimeout(() => {
        setAccountTab('profile');
        setModalSuccess('');
      }, 1000);
    } else {
      setModalError('মোবাইল নম্বর অথবা পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }
  };

  // Handle customer registration
  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!regName || !regPhone || !regPassword) {
      setModalError('দয়া করে নাম, মোবাইল নম্বর এবং পাসওয়ার্ড ক্ষেত্রগুলি পূরণ করুন।');
      return;
    }

    const customers = storage.getCustomers();
    const phoneExists = customers.some(c => c.phone === regPhone);

    if (phoneExists) {
      setModalError('এই মোবাইল নম্বরটি দিয়ে ইতিপূর্বে অ্যাকাউন্ট খোলা হয়েছে।');
      return;
    }

    const newCustomer: Customer = {
      id: generateID('CST'),
      name: regName,
      phone: regPhone,
      email: regEmail,
      address: regAddress,
      password: regPassword,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    const updated = [...customers, newCustomer];
    storage.setCustomers(updated);

    // Auto Login on register
    setActiveCustomer(newCustomer);
    setProfileName(newCustomer.name);
    setProfileEmail(newCustomer.email || '');
    setProfileAddress(newCustomer.address || '');
    localStorage.setItem('molla_active_customer', JSON.stringify(newCustomer));
    
    setModalSuccess('অভিনন্দন! আপনার কাস্টমার অ্যাকাউন্ট তৈরি হয়েছে।');
    setTimeout(() => {
      setAccountTab('profile');
      setModalSuccess('');
    }, 1500);

    // Clear register fields
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegAddress('');
    setRegPassword('');
  };

  // Edit Customer Profile details
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!profileName) {
      setModalError('দয়া করে আপনার নাম প্রদান করুন।');
      return;
    }

    if (!activeCustomer) return;

    const customers = storage.getCustomers();
    const updatedCustomers = customers.map(c => {
      if (c.phone === activeCustomer.phone) {
        return {
          ...c,
          name: profileName,
          email: profileEmail,
          address: profileAddress
        };
      }
      return c;
    });

    storage.setCustomers(updatedCustomers);

    const updatedSession: Customer = {
      ...activeCustomer,
      name: profileName,
      email: profileEmail,
      address: profileAddress
    };

    setActiveCustomer(updatedSession);
    localStorage.setItem('molla_active_customer', JSON.stringify(updatedSession));
    setIsEditingProfile(false);
    setModalSuccess('আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে।');
    setTimeout(() => setModalSuccess(''), 2000);
  };

  const handleCustomerLogout = () => {
    setActiveCustomer(null);
    localStorage.removeItem('molla_active_customer');
    setAccountTab('login');
    setModalSuccess('সফলভাবে লগআউট করা হয়েছে।');
    setTimeout(() => setModalSuccess(''), 1000);
  };

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const nextClicks = prev + 1;
      if (nextClicks >= 5) {
        setShowPasscodeGate(true);
        return 0;
      }
      return nextClicks;
    });
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = ['৭১৮৯', '7189', '২০২৬', '2026', 'admin'];
    if (validCodes.includes(passcodeVal.trim())) {
      setPasscodeErr('');
      setShowPasscodeGate(false);
      setPasscodeVal('');
      onAdminLoginClick();
    } else {
      setPasscodeErr('ভুল সিকিউরিটি কোড! সঠিক কোডটি দিন।');
    }
  };

  // Filter invoices for the active customer order history
  const customerOrders = activeCustomer 
    ? invoices.filter(inv => inv.customerPhone.trim() === activeCustomer.phone.trim())
    : [];

  const handleOpenAccountSection = () => {
    setModalError('');
    setModalSuccess('');
    if (activeCustomer) {
      setAccountTab('profile');
    } else {
      setAccountTab('login');
    }
    setShowAccountModal(true);
  };

  // Quick range filters helper
  const applyQuickPriceFilter = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Dynamic Banner Alert */}
      <div className="bg-gradient-to-r from-pink-600 via-orange-600 to-cyan-600 text-white text-xs py-2 px-4 shadow-md font-bold tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1">
          <span className="flex items-center gap-1.5 justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            আমাদের সকল প্রোডাক্ট ১০০% অরিজিনাল ও দ্রুত সার্ভিসিংয়ের আকর্ষণীয় নিশ্চয়তা!
          </span>
          <span className="opacity-95 font-mono text-[10px] sm:text-xs text-white bg-black/15 px-2.5 py-0.5 rounded-full">
            আজকের তারিখ: {toBanglaNumber('০৬/০৬/২০২৬')} | সময়: {toBanglaNumber('সন্ধ্যা ০৭:২৯')}
          </span>
        </div>
      </div>

      {/* Header section with sleek layout */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-white/10 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo 
            size="md" 
            onClick={handleLogoClick} 
            className="hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer"
          />

          <div className="flex gap-2 sm:gap-3 items-center">
            {/* Customer Portal Toggle */}
            <button
              onClick={handleOpenAccountSection}
              className="px-4.5 py-2.5 text-xs sm:text-sm font-black text-white bg-gradient-to-tr from-pink-500/20 via-amber-500/10 to-cyan-500/20 hover:from-pink-500/30 hover:to-cyan-500/30 border border-white/15 hover:border-white/30 rounded-2xl transition-all shadow-md duration-200 flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <User className="w-4 h-4 text-pink-400" />
              <span>
                {activeCustomer ? `প্রোফাইল (${activeCustomer.name})` : 'লগইন / কাস্টমার অ্যাকাউন্ট'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero section with ultra-colorful premium layout */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-14 sm:py-20 border-b border-slate-800">
        {/* Glow ambient backdrops */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600 rounded-full blur-[140px] opacity-25 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600 rounded-full blur-[140px] opacity-25 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[30%] w-[100px] h-[100px] bg-amber-500 rounded-full blur-[80px] opacity-20 pointer-events-none" />

        {/* Premium cyber grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] opacity-100 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-7 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-cyan-500/20 text-pink-300 text-xs font-black rounded-full border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)] animate-bounce">
              <Sparkles className="w-4 h-4 text-pink-400" />
              ফরিদপুরের সেরা মাল্টিব্র্যান্ড গ্যাজেট প্যারাডাইস!
            </span>
            
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.125] tracking-tight text-white">
              পছন্দের বিশ্বস্ত ব্রান্ডেড মোবাইল ও গ্যাজেট <br />
              <span className="bg-gradient-to-r from-pink-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(251,146,60,0.2)]">
                পাবেন সেরা লাইভ প্রাইসে!
              </span>
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              ফরিদপুরের প্রাণকেন্দ্রে অবস্থিত মজিব সড়কের স্বনামধন্য <strong className="text-white">মোল্লা ইলেকট্রনিক্স শপ</strong>। সম্মানিত গ্রাহকদের সেবা ও ১ নম্বর কোয়ালিটি মোবাইলের নিশ্চয়তা। মেমো জেনারেটর কোড দ্বারা রিয়েল-টাইম অনলাইন ট্র্যাকিং সহ আজই অফার চেক করুন!
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <a 
                href="#outlet-info" 
                className="px-6 py-3.5 text-xs sm:text-sm font-black bg-gradient-to-r from-pink-600 via-orange-500 to-amber-500 hover:from-pink-500 hover:to-orange-400 text-white rounded-2xl shadow-[0_4px_20px_rgba(219,39,119,0.4)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.6)] transform hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                আউটলেট ভিজিট করুন 📍
              </a>
              <a 
                href="#product-catalog" 
                className="px-6 py-3.5 text-xs sm:text-sm font-black border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all transform hover:-translate-y-0.5 cursor-pointer backdrop-blur-md"
              >
                প্রোডাক্ট স্টক দেখুন 🔎
              </a>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md lg:max-w-none">
            {/* Visual Promo Bento Grid with interactive glow cards */}
            <div className="grid grid-cols-2 gap-4 p-5 bg-white/[0.03] rounded-[36px] border border-white/10 shadow-2xl relative">
              <div className="absolute -inset-0 rounded-[36px] bg-gradient-to-tr from-pink-500/10 to-cyan-500/10 blur-xl opacity-60 pointer-events-none" />
              
              <div className="relative bg-slate-900/80 p-5 rounded-3xl border border-white/5 hover:border-pink-500/40 hover:shadow-[0_0_25px_rgba(236,72,153,0.2)] transition-all duration-300 flex flex-col justify-between h-40 group cursor-pointer overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-pink-500/10 rounded-full blur-xl group-hover:bg-pink-500/20 transition-all" />
                <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform">
                  📱
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1">স্মার্টফোন <ChevronRight className="w-3.5 h-3.5 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">সব লেটেস্ট ব্র্যান্ডের অফিসিয়াল সেট এখানে পাবেন</p>
                </div>
              </div>

              <div className="relative bg-slate-900/80 p-5 rounded-3xl border border-white/5 hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-all duration-300 flex flex-col justify-between h-40 mt-6 lg:mt-4 group cursor-pointer overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
                <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1">গ্যাজেট ও এক্সেসরিজ <ChevronRight className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">পাওয়ারব্যাংক, প্রিমিয়াম সাউন্ড স্পিকার ও হেডফোন</p>
                </div>
              </div>

              <div className="relative bg-slate-900/80 p-5 rounded-3xl border border-white/5 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 flex flex-col justify-between h-40 -mt-6 lg:-mt-4 group cursor-pointer overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
                <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                  🔌
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1">চার্জার ও ক্যাবলস <ChevronRight className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">সব লেটেস্ট ব্র্যান্ডের অরিজিনাল ফাস্ট চার্জার</p>
                </div>
              </div>

              <div className="relative bg-slate-900/80 p-5 rounded-3xl border border-white/5 hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all duration-300 flex flex-col justify-between h-40 group cursor-pointer overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  🛠️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1">স্মার্ট সার্ভিসিং <ChevronRight className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">দক্ষ টেকনিশিয়ান দ্বারা নিখুঁত রিপੇয়ার</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white border-b border-slate-200 relative overflow-hidden">
        {/* Subtle decorative color splotches */}
        <div className="absolute top-[20%] right-[-5%] w-[180px] h-[180px] bg-emerald-300 rounded-full blur-[90px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-5%] w-[180px] h-[180px] bg-indigo-300 rounded-full blur-[90px] opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-white via-indigo-50/30 to-cyan-50/40 border-2 border-slate-200/50 rounded-[32px] p-6 sm:p-12 shadow-[0_12px_45px_rgba(99,102,241,0.06)] flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
            
            {/* Portrait Image Container */}
            <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col items-center gap-4 relative z-10">
              <div className="relative group max-w-[280px] w-full">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-indigo-500 to-cyan-500 rounded-3xl blur-md opacity-35 group-hover:opacity-55 transition-opacity duration-300" />
                <div className="relative border-4 border-white shadow-2xl rounded-3xl overflow-hidden aspect-[3/4] bg-slate-50">
                  <img 
                    src={proprietorImg} 
                    alt="নুর ইসলাম মোল্লা - প্রোপাইটার, মোল্লা ইলেকট্রনিক্স" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550 animate-fade-in"
                    referrerPolicy="no-referrer"
                  />
                  {/* Hover Camera Label for Quick Upload */}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-350 gap-2 select-none">
                    <Camera className="w-9 h-9 text-pink-400 drop-shadow-md animate-bounce" />
                    <span className="text-xs font-black drop-shadow-md bg-indigo-650 tracking-wide text-white px-4 py-1.5 rounded-full border border-indigo-550">
                      {isImageLocked && !isAdminLoggedIn ? '🔒 ছবি পরিবর্তন (লকড)' : 'ছবি পরিবর্তন করুন 📸'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                </div>
                {/* Visual badge inside image frame */}
                <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-slate-950 border-2 border-slate-850 text-white text-[11px] font-black px-5 py-2 rounded-full shadow-xl whitespace-nowrap tracking-wide animate-pulse">
                  🌟 নুর ইসলাম মোল্লা (প্রোপ্রাইটার)
                </div>
              </div>

              {/* Dynamic Security Lock Toggles and Actions */}
              <div className="w-full max-w-[280px] mt-2 space-y-2.5">
                {/* Lock Status Bar Indicator */}
                <div className="flex items-center justify-between bg-white border border-slate-205 rounded-xl px-3 py-2 text-xs shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    {isImageLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="text-rose-600 font-extrabold tracking-tight">ছবি আপলোড লকড আছে</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" style={{ animationDuration: '4s' }} />
                        <span className="text-emerald-600 font-extrabold tracking-tight">ছবি আপলোড আনলকড</span>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={handleToggleLock}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                      isImageLocked 
                        ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 font-extrabold' 
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 font-extrabold'
                    }`}
                    title={isImageLocked ? 'পাসকোড দিয়ে আনলক করুন' : 'লক করুন'}
                  >
                    {isImageLocked ? 'আনলক 🔓' : 'লক করুন 🔒'}
                  </button>
                </div>

                {/* Direct upload option actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                  <label className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 select-none">
                    <Upload className="w-3.5 h-3.5" />
                    <span>সরাসরি ছবি আপলোড</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                  
                  {proprietorImg !== defaultProprietorPhoto && (
                    <button
                      onClick={handleResetImage}
                      className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-705 border border-slate-205 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      title="মূল ছবিতে ফিরে যান"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>রিসেট করুন</span>
                    </button>
                  )}
                </div>

                {proprietorImg !== defaultProprietorPhoto && (
                  <button
                    onClick={handleCopyImageCode}
                    className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all border ${
                      copiedImageCode 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-800 shadow-3xs'
                    }`}
                  >
                    <span>{copiedImageCode ? '✅ ছবির কোড কপি হয়েছে!' : '📋 ছবির স্থায়ী কোড কপি করুন'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Core Message Text */}
            <div className="flex-1 space-y-6 relative z-10 w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100/60 text-indigo-700 text-xs font-bold rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-650" />
                আমাদের অঙ্গীকার ও ব্যবসার আদর্শ
              </div>

              <div className="space-y-4">
                <blockquote className="relative pl-6">
                  {/* Styling quote mark */}
                  <span className="absolute top-0 left-0 text-3xl text-indigo-300 font-serif leading-none select-none">“</span>
                  <p className="text-lg sm:text-xl font-black text-slate-850 leading-relaxed italic bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
                    আমাদের কাছে শতভাগ আস্থা এবং সাথে এক নম্বর প্রোডাক্ট পাবেন এবং সততাই আমাদের একমাত্র মূল্য।
                  </p>
                </blockquote>
                
                <p className="text-slate-600 text-sm leading-relaxed">
                  মোল্লা ইলেকট্রনিক্স দীর্ঘ সময় ধরে বিশ্বস্ততা ও আস্থার প্রতীক হিসেবে ফরিদপুরের ক্রেতা সাধারণের সেবা করে আসছে। আমরা ক্রেতা সন্তুষ্টি অর্জনে সর্বদা প্রতিশ্রুতিবদ্ধ এবং প্রতিটি লেটেস্ট মোবাইল সেট ও গেজেট সঠিক মূল্যে পরিবেশন নিশ্চিত করি।
                </p>
              </div>

              {/* Three key pillars (Trust, Authentic Product, Honesty) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div className="bg-white hover:bg-emerald-50/10 p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all duration-300 space-y-2 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
                    🤝
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">শতভাগ আস্থা</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    সদয় গ্রাহকের বিশ্বাস, ১০০% বিক্রয়োত্তর সেবা, ও দ্রুত মেমো ক্লিয়ারেন্স গ্যারান্টি।
                  </p>
                </div>

                <div className="bg-white hover:bg-indigo-50/10 p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all duration-300 space-y-2 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
                    🏆
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">এক নম্বর প্রোডাক্ট</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    আমাদের শপের প্রতিটি মোবাইল ও নিখুঁত এক্সেসরিজ ১০০% আসল ও ব্রিলিয়ান্ট মানের।
                  </p>
                </div>

                <div className="bg-white hover:bg-amber-50/10 p-5 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all duration-300 space-y-2 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)] group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
                    💎
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">সততাই একমাত্র মূল্য</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    সৎভাবে ব্যবসা ও সঠিক মাপে মূল্য নির্ধারণ করাই আমাদের প্রধান আদর্শ ও ঐতিহ্য।
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Outlet specifications/Shop Info */}
      <section id="outlet-info" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full backdrop-blur-xs">
                  দোকানের পরিচিতি ও ঠিকানা
                </div>
                <h3 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight">
                  সরাসরি আমাদের শপে চলে আসুন
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sky-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-0.5">দোকানের অবস্থান:</p>
                      <p className="text-sm sm:text-base leading-relaxed text-slate-200">
                        মজিব সড়ক, নিউ মার্কেট সংলগ্ন, বেলী বিড়ি সংলগ্ন, কেএম আরকেডিয়া মার্কেট, ফরিদপুর।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-0.5">সম্মানিত প্রোপ্রাইটর:</p>
                      <p className="text-sm sm:text-base text-slate-200 font-medium">
                        নুরুল ইসলাম মোল্লা
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-0.5">সহায়তা ও অর্ডারের জন্য কল করুন:</p>
                      <p className="text-base sm:text-lg font-bold text-white tracking-wide">
                        {toBanglaNumber('০১৭৪৫-৯৮৭৬৫৪')} <span className="text-xs text-slate-400 font-normal">(সকাল ১০টা - রাত ১০টা)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Mini Map */}
              <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl backdrop-blur-md">
                <h4 className="font-bold text-base text-slate-100 flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-sky-400 animate-bounce" />
                  ম্যাপে আমাদের অবস্থান
                </h4>
                
                {/* Visual map rendering representation */}
                <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-700 flex flex-col justify-between p-4">
                  <div className="absolute inset-0 bg-sky-950/20 pointer-events-none" />
                  {/* Visual roadmap decoration overlay */}
                  <div className="absolute h-0.5 bg-slate-800 w-full top-1/4 left-0" />
                  <div className="absolute h-0.5 bg-slate-800 w-full top-2/3 left-0" />
                  <div className="absolute w-0.5 bg-slate-800 h-full left-1/3 top-0" />
                  <div className="absolute w-0.5 bg-slate-800 h-full left-3/4 top-0" />
                  
                  {/* Shop PIN */}
                  <div className="absolute top-[45%] left-[28%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white ring-8 ring-rose-500/20 shadow-lg relative">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    </div>
                    <span className="mt-1 px-1.5 py-0.5 bg-sky-700 text-[9px] font-bold text-white rounded shadow-sm whitespace-nowrap">
                      মোল্লা ইলেকট্রনিক্স
                    </span>
                  </div>

                  <div className="z-10 bg-slate-900/90 text-[10px] text-slate-300 p-2 rounded border border-slate-800 flex justify-between items-center w-full mt-auto">
                    <span>মজিব সড়ক, কেএম আরকেডিয়া মার্কেট</span>
                    <a 
                      href="https://maps.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sky-400 hover:underline font-bold px-1.5 py-0.5 bg-slate-800 rounded text-[9px]"
                    >
                      গুগল ম্যাপে দেখুন
                    </a>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 text-center">
                    <span className="block text-slate-400 text-[10px]">খোলার সময়</span>
                    <span className="font-bold text-sm text-slate-200">{toBanglaNumber('সকাল ১০:০০')} টা</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 text-center">
                    <span className="block text-slate-400 text-[10px]">বন্ধের সময়</span>
                    <span className="font-bold text-sm text-slate-200">{toBanglaNumber('রাত ১০:০০')} টা</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Display (Interactive Live Stock View with dynamic search and filters) */}
      <section id="product-catalog" className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT FILTER SIDEBAR / PANEL (BENTO GRIDS) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-205 shadow-sm space-y-5">
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100">
                <SlidersHorizontal className="w-4 h-4 text-indigo-650" />
                <h4 className="font-bold text-sm text-slate-850">ফিল্টার ও ক্যাটাগরি সেট</h4>
              </div>

              {/* Dynamic Price Range Inputs */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500">মূল্য সীমা (টাকা)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="সর্বনিম্ন"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    placeholder="সর্বোচ্চ"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs"
                  />
                </div>
                
                {/* Reset button inside prices */}
                {(minPrice || maxPrice) && (
                  <button 
                    onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                    className="text-[10px] text-rose-500 font-bold hover:underline"
                  >
                    শর্ত মুছুন ❌
                  </button>
                )}
              </div>

              {/* Price range presets - Bento style tags */}
              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold text-slate-400">দ্রুত মূল্য খোঁজার হট ট্যাগস:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => applyQuickPriceFilter('0', '2000')}
                    className="px-2 py-1 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-[10px] font-semibold text-slate-650 rounded-lg shrink-0 cursor-pointer"
                  >
                    ২,০০০ টাকার নিচে
                  </button>
                  <button
                    onClick={() => applyQuickPriceFilter('2000', '10000')}
                    className="px-2 py-1 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-[10px] font-semibold text-slate-650 rounded-lg shrink-0 cursor-pointer"
                  >
                    ২,০০০ - ১০,০০০
                  </button>
                  <button
                    onClick={() => applyQuickPriceFilter('10000', '25000')}
                    className="px-2 py-1 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-[10px] font-semibold text-slate-650 rounded-lg shrink-0 cursor-pointer"
                  >
                    ১০,০০০ - ২৫,০০০
                  </button>
                  <button
                    onClick={() => applyQuickPriceFilter('25000', '')}
                    className="px-2 py-1 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-[10px] font-semibold text-slate-650 rounded-lg shrink-0 cursor-pointer"
                  >
                    ২৫,০০০+ টাকা
                  </button>
                </div>
              </div>

              {/* Brand Filter checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500">ব্র্যান্ড নির্বাচন করুন</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-none">
                  {brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                        selectedBrand === b
                          ? 'bg-indigo-650 text-white border-transparent'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Quick account summary widget if logged in */}
            {activeCustomer && (
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-5 rounded-3xl text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
                <h5 className="font-extrabold text-xs text-indigo-200">কাস্টমার পোর্টাল সেশন</h5>
                <p className="font-black text-sm mt-2 text-white truncate">{activeCustomer.name}</p>
                <p className="text-[10px] text-indigo-300 mt-1">মোবাইল নম্বর: {toBanglaNumber(activeCustomer.phone)}</p>
                
                <div className="mt-4 pt-3 border-t border-indigo-800 flex justify-between items-center">
                  <button
                    onClick={handleOpenAccountSection}
                    className="text-[11px] font-bold text-indigo-200 hover:text-white flex items-center gap-0.5 cursor-pointer"
                  >
                    আমার প্রোফাইল <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCustomerLogout}
                    className="text-[11px] font-bold text-rose-350 hover:text-rose-200 cursor-pointer"
                    title="লগআউট"
                  >
                    লগআউট 🔓
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PRODUCT CATALOG CATALOG (Lg: 9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-150 shadow-xs">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-855">
                  উপলব্ধ স্টক এবং গ্যাজেট ক্যাটালগ
                </h3>
                <p className="text-xs text-slate-450 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  মোট {toBanglaNumber(filteredProducts.length)} টি পণ্য আপনার মেলা ফিল্টারে পাওয়া গেছে
                </p>
              </div>

              {/* Dynamic search status notifications */}
              <div className="flex gap-1.5 text-[10px] font-bold">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
                  ✓ অটো-ম্যাপড ক্যাটাগরি
                </span>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
                  ✓ লাইভ স্টক
                </span>
              </div>
            </div>

            {/* Filtering and search row */}
            <div className="bg-white p-4 rounded-3xl border border-slate-205 flex flex-col md:flex-row gap-3 shadow-sm">
              <div className="flex-1 relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-indigo-600" />
                  <input
                    type="text"
                    placeholder="নাম, আইডি, মডেল নম্বর বা কীওয়ার্ড দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs transition-all tracking-wider font-semibold"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-650"
                    >
                      ✗
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setSearchQuery(searchQuery)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  খুঁজুন
                </button>
              </div>
              
              {/* Category selector row */}
              <div className="flex items-center gap-1 overflow-x-auto min-h-[40px] pb-1 md:pb-0 scrollbar-none shrink-0">
                <span className="text-xs font-black text-slate-400 mr-2 shrink-0">ক্যাটাগরি:</span>
                <button
                  onClick={() => setSelectedCategory('সব')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'সব'
                      ? 'bg-indigo-650 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/50'
                  }`}
                >
                  সব ({products.length})
                </button>
                {categoriesList.map((cat) => {
                  const pCount = products.filter(p => p.category === cat || (p.categories && p.categories.includes(cat))).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-indigo-650 text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-105 text-slate-600 border border-slate-200/40'
                      }`}
                    >
                      {cat} ({pCount})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalog grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

                  // Get list of categories attached to this product to show multi tags
                  const attachedCategories = product.categories || [product.category];

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-205 rounded-3xl overflow-hidden hover:shadow-lg hover:border-indigo-150 transition-all duration-200 flex flex-col h-full group relative"
                    >
                      {/* Badge for stock */}
                      <div className="absolute top-3.5 right-3.5 z-10">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 bg-red-150 text-red-700 text-[10px] font-extrabold rounded-md shadow-xs">
                            স্টক শেষ
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-705 text-[10px] font-extrabold rounded-md shadow-xs animate-pulse">
                            সীমিত স্টক
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-750 text-[10px] font-extrabold rounded-md shadow-xs border border-emerald-100">
                            স্টক উপলব্ধ
                          </span>
                        )}
                      </div>

                      {/* Dummy product image representation */}
                      <div className="aspect-[16/10] bg-slate-50/75 border-b border-slate-205 flex items-center justify-center relative p-6">
                        <div className="absolute inset-0 bg-radial-gradient-skylike pointer-events-none" />
                        <div className="w-15 h-15 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-300 shadow-xs border border-slate-200">
                          {product.category === 'স্মার্টফোন' || product.category === 'মোবাইল' ? (
                            <Smartphone className="w-7 h-7 text-indigo-600" />
                          ) : (
                            <Cpu className="w-7 h-7 text-indigo-550" />
                          )}
                        </div>
                        <span className="absolute bottom-2.5 left-2.5 text-[9px] font-mono text-slate-450 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                          আইডি: {product.id}
                        </span>
                      </div>

                      {/* Product Content Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Multiple Categories display */}
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {attachedCategories.map((c, i) => (
                              <span key={i} className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md">
                                {c}
                              </span>
                            ))}
                            <span className="text-[10px] font-bold text-slate-400 ml-auto bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                              {product.brand}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-850 text-sm sm:text-base leading-snug group-hover:text-indigo-650 transition-colors">
                            {product.name}
                          </h4>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-405 uppercase tracking-wide">মূল্য</span>
                            <span className="font-black text-base sm:text-lg text-slate-900">
                              {formatTaka(product.sellPrice)}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <span className="block text-[9px] font-bold text-slate-405 uppercase tracking-wide">স্টক</span>
                            <span className="font-bold text-xs text-slate-700">
                              {isOutOfStock ? 'স্টকআউট' : `${toBanglaNumber(product.stock)} পিস`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 max-w-sm mx-auto">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি!</p>
                <p className="text-xs text-slate-450 mt-1 leading-relaxed">অনুগ্রহ করে সঠিক স্পেলিং খুঁজুন বা ফিল্টারের শর্তসমূহ পরিবর্তন করে চেষ্টা করুন।</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('সব');
                    setSelectedBrand('সব');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all"
                >
                  সব শর্ত মুছুন 🔌
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services summary section */}
      <section className="py-12 bg-slate-110 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900">
              মোল্লা ইলেকট্রনিক্সের প্রধান সেবাসমূহ
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              একটি দোকানের ছাদের নিচেই সকল প্রয়োজন মেটাতে আমরা প্রতিশ্রুতিবদ্ধ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/40 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">স্মার্টফোন ও গ্যাজেট ক্রয়-বিক্রয়</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  সবচেয়ে আপডেটেড স্মার্টফোন ব্র্যান্ডসমূহ যেমন Samsung, Xiaomi, Realme, Vivo এবং প্রফেশনাল গ্যাজেট ওয়ারেন্টি সহ সরবরাহ করি।
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/40 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">অরিজিনাল পার্টস ও রিপ্লেসমেন্ট</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  চার্জার অ্যাডাপ্টার, কন্টাক্ট কেবল, আসল ব্যাটারি, ডিসপ্লে টাচ প্যানেল ও আনুষঙ্গিক পার্টস অরিজিনাল ব্র্যান্ড ওয়ারেন্টি সহ নিশ্চিত করা হয়।
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/40 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">দ্রুত ও নিখুঁত রিপেয়ার</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  হার্ডওয়্যার সমস্যা হোক কিংবা সফটওয়্যার ফ্ল্যাশিং, আমাদের দক্ষ টেকনিশিয়ান দ্বারা অত্যন্ত স্বল্পতম সময়ে ও স্বচ্ছতায় সমাধান করে দেওয়া হয়।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 BEAUTIFUL CUSTOM DESIGNED COLORFUL BRAND FOOTER */}
      <footer className="bg-slate-950 text-white border-t border-white/10 pt-16 pb-12 mt-20 relative overflow-hidden">
        {/* Abstract design elements matching logo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-amber-500/5 to-pink-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-white/10 pb-12">
            {/* Left Col: Shop Brand & Motto */}
            <div className="md:col-span-2 space-y-4">
              <Logo size="lg" showText={true} />
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed mt-2">
                ফরিদপুরের প্রাণকেন্দ্রে অবস্থিত মজিব সড়কের এক অনন্য বিশ্বস্ত প্রতিষ্ঠান। নতুন স্মার্টফোন, পাওয়ার ব্যাংক, ট্যাব, অডিও ইয়ারবাডস সহ সকল ধরণের ট্রেন্ডি গ্যাজেটস ও দ্রুত সার্ভিসিংয়ের আস্থার ঠিকানা।
              </p>
            </div>

            {/* Quick Link items */}
            <div className="space-y-4 col-span-1">
              <h4 className="font-bold text-sm tracking-wider text-white uppercase border-l-4 border-pink-500 pl-3">কাস্টমার সেবাসমূহ</h4>
              <ul className="space-y-2 text-xs text-slate-400 pt-1">
                <li><a href="#product-catalog" className="hover:text-pink-400 transition-colors">প্রোডাক্ট ক্যাটালগ</a></li>
                <li><a href="#outlet-info" className="hover:text-pink-400 transition-colors font-medium">আউটলেট গাইড</a></li>
                <li><button onClick={handleOpenAccountSection} className="hover:text-pink-400 transition-colors cursor-pointer text-left">আমার মেম্বারশিপ পোর্টাল</button></li>
                <li><span className="text-[10px] text-zinc-500 flex items-center gap-1">✓ সিকিউর পেমেন্ট গেটওয়ে</span></li>
              </ul>
            </div>

            {/* Store details */}
            <div className="space-y-4 col-span-1">
              <h4 className="font-bold text-sm tracking-wider text-slate-100 uppercase border-l-4 border-cyan-400 pl-3">যোগাযোগ</h4>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                মজিব সড়ক, কেএম আরকেডিয়া মার্কেট, নিউ মার্কেট সংলগ্ন, ফরিদপুর।
              </p>
              <p className="text-xs text-slate-400 font-mono">
                মোবাইল: +৮৮০১৭৪৫-৯৮৭৬৫৪
              </p>
            </div>
          </div>

          {/* Bottom Copyright segment containing hidden secure gate */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <p className="text-slate-500 leading-none">
              &copy; {toBanglaNumber('২০২৬')} মোল্লা ইলেকট্রনিক্স। সর্বস্বত্ব সংরক্ষিত। 
              <span 
                onClick={() => setShowPasscodeGate(true)}
                className="ml-2 hover:text-slate-400 cursor-pointer inline-flex items-center gap-0.5 text-[10px]" 
                title="অ্যাডমিন জোন"
              >
                🔐
              </span>
            </p>
            <p className="text-[10px] text-slate-600 flex items-center gap-1 font-semibold">
              <span>ডিজাইন এবং ডেভেলপমেন্ট :</span>
              <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent font-black">মোল্লা টেক সলিউশনস</span>
            </p>
          </div>
        </div>
      </footer>

      {/* 🔐 PRIVATE DUAL-GATE SECURITY ADMIN PASSCODE TRIGGER */}
      {showPasscodeGate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden p-6 text-white text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Colorful neon light shapes */}
            <div className="absolute right-0 top-0 w-44 h-44 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Dynamic lock visual logo */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 p-0.5 animate-pulse mb-4">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-white">
                  <Lock className="w-8 h-8 text-pink-500 animate-bounce" />
                </div>
              </div>

              <h3 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-amber-400 to-cyan-500">
                অ্যাডমিন গেটওয়ে কন্ট্রোল প্যানেল
              </h3>
              <p className="text-slate-400 text-xs mt-2 max-w-sm">
                এটি একটি অত্যন্ত সুরক্ষিত অ্যান্ড প্রাইভেট এরিয়া। শুধুমাত্র মোল্লা ইলেকট্রনিক্সের অনুমোদিত অ্যাডমিন এখানে প্রবেশ কোড দিয়ে সিকিউরিটি লগইন উইন্ডো খুলতে পারবেন।
              </p>

              <form onSubmit={handlePasscodeSubmit} className="mt-6 w-full space-y-4">
                <div>
                  <label className="block text-left text-xs font-semibold text-slate-400 mb-1.5 focus:text-pink-400">
                    ঝটপট ৪-ডিজিট সিকিউরি অ্যাক্সেস কোড
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={passcodeVal}
                    onChange={(e) => setPasscodeVal(e.target.value)}
                    className="block w-full text-center tracking-widest text-lg font-mono py-3 bg-slate-950 border border-white/10 hover:border-pink-500/40 focus:border-cyan-400 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-cyan-400 text-white transition-all shadow-inner"
                    placeholder="••••"
                  />
                  <span className="block text-[10px] text-zinc-500 mt-2 text-left italic">
                     কোড ইঙ্গিত: 7189 বা 2026 (মলিকিউলার পাসকোড)
                  </span>
                </div>

                {passcodeErr && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/30 rounded-xl text-xs text-rose-300 font-bold flex items-center justify-center gap-2">
                    <span>⚠</span> {passcodeErr}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasscodeGate(false);
                      setPasscodeVal('');
                      setPasscodeErr('');
                      setLogoClicks(0);
                    }}
                    className="flex-1 py-3 text-xs font-semibold border border-white/10 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-slate-300"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs font-black bg-gradient-to-r from-pink-600 via-amber-500 to-cyan-500 text-white rounded-xl shadow-lg shadow-pink-900/30 hover:opacity-90 transition-all cursor-pointer"
                  >
                    গেটওয়ে আনলক করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 PROPRIETOR PHOTO ACTION AUTHORIZATION LOCK MODAL */}
      {showPhotoUnlockModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden p-6 text-slate-800 text-center animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowPhotoUnlockModal(false);
                setPendingFile(null);
                setPendingAction(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
                <Lock className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>

              <h3 className="text-lg font-black text-slate-900">
                প্রোপাইটার ছবি সুরক্ষামূলক লক
              </h3>
              <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
                অননুমোদিত পরিবর্তন ঠেকাতে প্রোপাইটারের ছবি পরিবর্তন লক করা রয়েছে। ছবি পরিবর্তন, রিসেট বা লক সক্রিয়/নিষ্ক্রিয় করতে ৪-ডিজিট অ্যাডমিন পাসকোডটি দিন।
              </p>

              <form onSubmit={handlePhotoUnlockSubmit} className="mt-5 w-full space-y-4">
                <div>
                  <label className="block text-left text-xs font-bold text-slate-550 mb-1.5 label-bangla">
                    নিরাপত্তা পাসকোড (Security Passcode)
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={photoPasscode}
                    onChange={(e) => setPhotoPasscode(e.target.value)}
                    className="block w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-400 focus:border-indigo-600 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-600 text-slate-800 transition-all shadow-inner"
                    placeholder="••••"
                  />
                </div>

                {photoPasscodeErr && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-bold text-center">
                    {photoPasscodeErr}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoUnlockModal(false);
                      setPendingFile(null);
                      setPendingAction(null);
                    }}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl border border-indigo-500 transition-all cursor-pointer shadow-sm"
                  >
                    যাচাই ও সম্পন্ন করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PORTAL / ACCOUNT SYSTEM WORKSPACE MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-105 animate-in fade-in zoom-in-95 duration-200 flex flex-col md:flex-row h-auto max-h-[90vh]">
            
            {/* Left Decorator pane (desktop only) */}
            <div className="hidden md:flex md:w-1/3 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-8 flex-col justify-between relative overflow-hidden shrink-0">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
              <div className="absolute left-0 bottom-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl" />
              
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-xl mb-4 text-indigo-300">
                  ম
                </div>
                <h4 className="text-lg font-black leading-tight">মোল্লা কাস্টমার কানেক্ট</h4>
                <p className="text-[10px] text-indigo-300 mt-2 leading-relaxed">আপনার অ্যাকাউন্ট থেকে সহজেই আপনার মেমো, বিল ও রিপেয়ার স্ট্যাটাস ট্র্যাক করতে পারেন।</p>
              </div>

              <div className="border-t border-indigo-800 pt-4 text-[9px] text-indigo-300 font-semibold space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> ২৫৬-বিট মেমোরি পাস
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> কাস্টমার ও বিল ট্র্যাকিং
                </div>
              </div>
            </div>

            {/* Right Interactive Portal Pane */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              <div className="p-4 sm:p-6 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-1.5">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-850 text-sm sm:text-base">
                    {activeCustomer ? 'আমার কাস্টমার ড্যাশবোর্ড' : 'গ্রাহক লগইন ও নিবন্ধন'}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowAccountModal(false)}
                  className="p-1 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error & Success indicators */}
              {modalError && (
                <div className="bg-rose-50 border-b border-rose-100 text-rose-700 text-xs py-2.5 px-6 font-bold flex items-center gap-2">
                  <span>⚠</span> {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-850 text-xs py-2.5 px-6 font-bold flex items-center gap-2">
                  <span>✓</span> {modalSuccess}
                </div>
              )}

              {/* Subnavigation Tabs inside modal if logged in */}
              {activeCustomer && (
                <div className="bg-slate-100/55 p-1.5 border-b border-slate-200 flex gap-1">
                  <button
                    onClick={() => setAccountTab('profile')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      accountTab === 'profile' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    আমার প্রোফাইল
                  </button>
                  <button
                    onClick={() => setAccountTab('orders')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      accountTab === 'orders' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    অর্ডার হিস্ট্রি ({toBanglaNumber(customerOrders.length)} টি)
                  </button>
                </div>
              )}

              <div className="flex-1 p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh] text-left text-slate-800">
                {/* 1. LOGIN TAB */}
                {accountTab === 'login' && !activeCustomer && (
                  <form onSubmit={handleCustomerLogin} className="space-y-4">
                    <div className="text-center sm:text-left mb-4">
                      <h4 className="font-bold text-sm text-slate-800">আপনার মোবাইল অ্যাকাউন্ট দিয়ে লগইন করুন</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">মোল্লা ইলেকট্রনিক্সের রেজিস্টার্ড কাস্টমার মেম্বারশিপ</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">মোবাইল নম্বর</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: 01712345678"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">পাসওয়ার্ড</label>
                        <input
                          type="password"
                          required
                          placeholder="আপনার পাসওয়ার্ড লিখুন"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => { setAccountTab('register'); setModalError(''); }}
                        className="text-xs text-indigo-650 hover:underline font-bold text-center sm:text-left cursor-pointer"
                      >
                        নতুন গ্রাহক? একটি অ্যাকাউন্ট তৈরি করুন <UserPlus className="inline-block w-3.5 h-3.5 ml-0.5" />
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        লগইন করুন 🔑
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. REGISTER TAB */}
                {accountTab === 'register' && !activeCustomer && (
                  <form onSubmit={handleCustomerRegister} className="space-y-4">
                    <div className="text-center sm:text-left mb-4">
                      <h4 className="font-bold text-sm text-slate-800">নতুন কাস্টমার নিবন্ধন ফরম</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">সব তথ্য সঠিকভাবে দিয়ে মোল্লা মেম্বারশিপে নাম লেখান</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">গ্রাহকের নাম *</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: রাসেল আহমেদ"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-800 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">মোবাইল নম্বর *</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: 01712345678"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-800 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ইমেইল (ঐচ্ছিক)</label>
                        <input
                          type="email"
                          placeholder="যেমন: example@gmail.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">স্থায়ী ঠিকানা (সংক্ষিপ্ত)</label>
                        <input
                          type="text"
                          placeholder="যেমন: নিউ মার্কেট রোড, ফরিদপুর"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">পাসওয়ার্ড টোকেন *</label>
                        <input
                          type="password"
                          required
                          placeholder="নিরাপদ পাসওয়ার্ড সেট করুন"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 focus:outline-hidden focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-850"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => { setAccountTab('login'); setModalError(''); }}
                        className="text-xs text-indigo-650 hover:underline font-bold text-center sm:text-left cursor-pointer"
                      >
                        ইতিপূর্বে অ্যাকাউন্ট আছে? লগইন করুন 🔑
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        রেজিস্ট্রেশন করুন 🎉
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. PROFILE TAB (IF LOGGED IN) */}
                {accountTab === 'profile' && activeCustomer && (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center">
                          {activeCustomer.name[0] || 'গ্র'}
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-indigo-600 uppercase">গ্রাহক আইডি</span>
                          <span className="font-extrabold text-sm text-slate-850">{activeCustomer.id || 'CST-১০১'}</span>
                        </div>
                      </div>
                      
                      {/* Registered text */}
                      <span className="text-[10px] font-bold text-slate-400">
                        নিবন্ধন তারিখ: {toBanglaNumber(activeCustomer.registeredAt || '০৬/০৬/২০২৬')}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">গ্রাহকের নাম</label>
                        <input
                          type="text"
                          required
                          disabled={!isEditingProfile}
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-xl text-xs sm:text-sm text-slate-800 font-bold ${
                            isEditingProfile ? 'border-indigo-300 focus:outline-hidden focus:border-indigo-500' : 'border-slate-200 bg-slate-50 cursor-not-allowed text-slate-600'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)</label>
                        <input
                          type="text"
                          disabled
                          value={toBanglaNumber(activeCustomer.phone)}
                          className="w-full px-4 py-2 border border-slate-200 bg-slate-50/80 rounded-xl text-xs sm:text-sm text-slate-550 font-semibold font-mono cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ইমেইল ঠিকানা</label>
                        <input
                          type="email"
                          disabled={!isEditingProfile}
                          placeholder="ইমেইল প্রদান করুন"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-xl text-xs sm:text-sm text-slate-800 ${
                            isEditingProfile ? 'border-indigo-300 focus:outline-hidden focus:border-indigo-500' : 'border-slate-200 bg-slate-50 cursor-not-allowed text-slate-600'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">যোগাযোগের ঠিকানা *</label>
                        <input
                          type="text"
                          disabled={!isEditingProfile}
                          placeholder="আপনার পূর্ণ ঠিকানা লিখুন"
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-xl text-xs sm:text-sm text-slate-800 ${
                            isEditingProfile ? 'border-indigo-300 focus:outline-hidden focus:border-indigo-500' : 'border-slate-200 bg-slate-50 cursor-not-allowed text-slate-605'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs font-bold">
                      <button
                        type="button"
                        onClick={handleCustomerLogout}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-100 rounded-xl cursor-pointer"
                      >
                        লগআউট 🔓
                      </button>
                      
                      <div className="flex gap-2">
                        {isEditingProfile ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingProfile(false);
                                setProfileName(activeCustomer.name);
                                setProfileEmail(activeCustomer.email || '');
                                setProfileAddress(activeCustomer.address || '');
                              }}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-600 rounded-xl cursor-pointer"
                            >
                              বাতিল
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                            >
                              তথ্য সংরক্ষণ করুন ✓
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100/90 text-indigo-700 border border-indigo-100 rounded-xl cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            তথ্য সংশোধন
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                )}

                {/* 4. ORDERS TAB (IF LOGGED IN) */}
                {accountTab === 'orders' && activeCustomer && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1">
                        <ShoppingBag className="w-4 h-4 text-indigo-650" />
                        আপনার ক্রয়কৃত মেমোর তালিকা
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        মোবাইল নম্বর: {toBanglaNumber(activeCustomer.phone)}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {customerOrders.length > 0 ? (
                        customerOrders.map((inv) => (
                          <div 
                            key={inv.id} 
                            className="bg-slate-50 hover:bg-slate-100/60 p-4 rounded-2xl border border-slate-200 transition-all text-xs space-y-3"
                          >
                            {/* Invoice Summary Row */}
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-mono font-bold text-indigo-705 block">{inv.id}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5 block">{toBanglaNumber(inv.date)}</span>
                              </div>
                              <div className="text-right">
                                <span className="block font-black text-slate-850 text-sm">{formatTaka(inv.totalPayable)}</span>
                                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-md mt-1 ${
                                  inv.due === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {inv.due === 0 ? 'পরিশোধিত ✓' : `বকেয়া : ${formatTaka(inv.due)}`}
                                </span>
                              </div>
                            </div>

                            {/* Items List inside single invoice */}
                            <div className="p-3 bg-white rounded-xl border border-slate-150 text-[11px] space-y-1.5 text-slate-650">
                              {inv.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className="font-bold text-slate-800 truncate max-w-[200px]">{item.productName}</span>
                                  <span className="font-semibold text-slate-500 font-mono">
                                    {toBanglaNumber(item.quantity)} পিস × {formatTaka(item.price)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Footer attributes */}
                            <div className="flex justify-between items-center text-[10px] text-slate-450 font-semibold">
                              <span>পেমেন্ট মাধ্যম: {inv.paymentMethod}</span>
                              <span>বিল প্রস্তুতকারক: {inv.creator}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-250 rounded-2xl">
                          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-700 text-xs">আপনার কোনো ইনভয়েস রেকর্ড পাওয়া যায়নি!</p>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                            যদি আপনি দোকানে ক্রয়ের সময় আপনার এই মোবাইল নম্বরটি ({toBanglaNumber(activeCustomer.phone)}) প্রদান করে থাকেন, তবে স্বয়ংক্রিয়ভাবে ইনভয়েসটি এখানে যুক্ত হবে।
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Purchase Portal */}
      {showPortal && activeCustomer && onPurchaseRequestSubmit && (
        <div className="fixed inset-0 z-[9999] bg-slate-100 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 sm:p-6">
            {/* Portal header */}
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-100 z-10 py-2">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                কাস্টমার পোর্টাল
              </h2>
              <button
                onClick={() => setShowPortal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                বন্ধ করুন
              </button>
            </div>
            <CustomerPortal
              products={products}
              customer={activeCustomer}
              purchaseRequests={purchaseRequests}
              onPurchaseRequestSubmit={onPurchaseRequestSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
