import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Handshake, Heart, Globe, Sparkles, MapPin, Search, ArrowRight, ShieldCheck,
  Wallet, Plus, Users, Zap, CheckCircle2, AlertCircle, Phone, X, Leaf, HandHeart,
  Map as MapIcon, Share2, MessageSquare, Star, User, Home, Eye, LogOut, Check, ShoppingBag, Truck,
  Hand, Camera, Clock, ChevronRight, Award, Filter, Store, Package, ExternalLink, Copy, TrendingUp,
  FileText, LayoutGrid, Info, ShieldAlert, CheckCircle, Navigation,
} from 'lucide-react';

import {
  UserRole,
  RequestCategory,
  Urgency,
  RequestStatus,
  AppUser,
  CharityRequest,
  Donation,
  Verification,
  Review
} from './types';

import {
  MOCK_USERS,
  MOCK_REQUESTS,
  MOCK_DONATIONS,
  MOCK_VERIFICATIONS,
  MOCK_VENDORS
} from './lib/mockData';

import { client, account, OAuthProvider } from './lib/appwrite';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Contexts ---
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';

// --- Helper Components ---

interface ParticleProps {
  x: number;
  y: number;
  key?: React.Key;
}

const Particle = ({ x, y }: ParticleProps) => (
  <motion.div
    initial={{ x, y, scale: 1, opacity: 1 }}
    animate={{
      x: x + (Math.random() - 0.5) * 200,
      y: y + (Math.random() - 0.5) * 200,
      scale: 0,
      opacity: 0
    }}
    transition={{ duration: 1, ease: "easeOut" }}
    className="absolute w-2 h-2 bg-yellow-400 rounded-full z-20"
  />
);

const SuccessAnimation = ({ category, amount }: { category: RequestCategory, amount: number }) => {
  const getItems = () => {
    const count = Math.max(1, Math.min(8, Math.floor(amount / (category === 'Food' ? 50 : category === 'Medical' ? 100 : 80))));
    const emoji = category === 'Food' ? '🍞' : category === 'Medical' ? '💊' : '📚';

    return Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -200, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 15 }}
        className="text-4xl absolute z-10 drop-shadow-md"
        style={{ left: `${(i - count / 2) * 20}px`, transform: `rotate(${(i % 3 - 1) * 15}deg)` }}
      >
        {emoji}
      </motion.div>
    ));
  };

  const container = category === 'Food' ? { emoji: '🍽️', label: 'Food Plate' } :
    category === 'Medical' ? { emoji: '📦', label: 'Medical Kit' } :
      { emoji: '🎒', label: 'School Kit' };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 md:p-12 bg-white/40 rounded-[3rem] md:rounded-[4rem] border-4 border-black border-dashed min-h-[300px] overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 bg-yellow-400/20 blur-[60px]"
      />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center h-48 w-full max-w-[200px] mx-auto">
          {getItems()}

          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-[8rem] mt-16 opacity-90 drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)] z-0"
          >
            {container.emoji}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-black text-white px-6 py-2 rounded-2xl border-2 border-white font-black italic uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {container.label}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-[10px] font-black uppercase text-black"
      >
        <span className="bg-yellow-400 px-4 py-1.5 rounded-full border-2 border-black inline-flex items-center gap-2">
          Generating Impact...
        </span>
      </motion.div>
    </div>
  );
};

const PaymentSuccessOverlay = ({ category, amount, onClose }: { category: RequestCategory, amount: number, onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[300] bg-yellow-400 flex flex-col items-center justify-center p-6 text-center"
  >
    <motion.div
      initial={{ scale: 0.5, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      className="max-w-md w-full space-y-8"
    >
      <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-[0_0_40px_rgba(0,0,0,0.2)]">
        <Check size={48} className="text-yellow-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Impact Created!</h2>
        <p className="text-black font-bold uppercase tracking-widest text-sm">You just donated ₹{amount}</p>
      </div>

      <SuccessAnimation category={category} amount={amount} />

      <div className="bg-black text-white p-6 rounded-3xl border-4 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <p className="font-black italic text-lg mb-2">
          {category === 'Food' ? "A plate is being filled right now!" :
            category === 'Medical' ? "Medicine is on its way!" :
              "You've empowered a student's future!"}
        </p>
        <p className="text-[10px] font-black uppercase text-yellow-400 tracking-widest">Transaction Verified on Network</p>
      </div>

      <Button onClick={onClose} className="w-full h-16 bg-white text-black border-4 border-black font-black uppercase tracking-widest text-xl rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        Continue Helping
      </Button>
    </motion.div>
  </motion.div>
);

const VisualDonation = ({ amount, target, category }: { amount: number, target: number, category: RequestCategory }) => {
  const safeAmount = amount || 0;
  const safeTarget = target || 1;
  const percentage = Math.min((safeAmount / safeTarget) * 100, 100);

  const getIcon = () => {
    switch (category) {
      case 'Food': return <Zap className="text-orange-500" />;
      case 'Medical': return <Heart className="text-red-500" />;
      case 'Education': return <Award className="text-blue-500" />;
      default: return <Zap className="text-yellow-500" />;
    }
  };

  const getLabel = () => {
    switch (category) {
      case 'Food': return `₹200 = 1 Meal Plate`;
      case 'Medical': return `₹500 = 1 Medicine Kit`;
      case 'Education': return `₹100 = 1 Stationery Set`;
      default: return `₹100 = 1 Impact Unit`;
    }
  };

  const getEquivalence = () => {
    switch (category) {
      case 'Food': return `${Math.floor(safeAmount / 200)} meals provided`;
      case 'Medical': return `${Math.floor(safeAmount / 500)} kits funded`;
      case 'Education': return `${Math.floor(safeAmount / 100)} sets distributed`;
      default: return `${Math.floor(safeAmount / 100)} units of help`;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{getLabel()}</span>
        </div>
        <span className="text-2xl font-black italic tracking-tighter">₹{safeAmount.toLocaleString()} <span className="text-sm text-gray-400 font-normal">/ ₹{safeTarget.toLocaleString()}</span></span>
      </div>
      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-black">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${category === 'Food' ? 'bg-orange-400' : category === 'Medical' ? 'bg-red-400' : 'bg-blue-400'}`}
        />
      </div>
      <p className="text-[10px] font-black uppercase text-gray-400 text-right tracking-widest">{getEquivalence()}</p>
    </div>
  );
};

const UPIDonationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  title: string;
}> = ({ isOpen, onClose, upiId, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black rounded-[2rem] p-8 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Donate to {title}</DialogTitle>
          <DialogDescription className="font-bold text-gray-600">
            Transfer directly to the requester using any UPI app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="p-6 bg-yellow-50 border-2 border-black border-dashed rounded-2xl flex flex-col items-center gap-4">
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Requester UPI ID</div>
            <div className="text-xl font-black italic tracking-tight">{upiId}</div>
            <Button
              variant="outline"
              className="border-2 border-black font-black uppercase text-xs h-10 px-6"
              onClick={handleCopy}
            >
              {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
              {copied ? 'Copied' : 'Copy ID'}
            </Button>
          </div>
          <Button className="w-full h-14 bg-black text-white border-2 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]">
            Open UPI App <ExternalLink size={18} className="ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RequestCard: React.FC<{ request: CharityRequest }> = ({ request }) => {
  const navigate = useNavigate();
  const [showUPI, setShowUPI] = useState(false);

  const urgencyInfo = {
    'High': 'Immediate need. Critical situation requiring urgent support.',
    'Medium': 'Standard need. Important but not immediately life-threatening.',
    'Low': 'Routine need. Support requested for ongoing requirements.'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <UPIDonationModal
        isOpen={showUPI}
        onClose={() => setShowUPI(false)}
        upiId="charity@okaxis"
        title={request.title}
      />
      <Card
        className="overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer rounded-[2rem]"
        onClick={() => navigate(`/request/${request.id}`)}
      >
        <div className="relative h-40 md:h-48 overflow-hidden">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
            src={request.proofUrls[0]}
            alt={request.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-white text-black border-2 border-black font-black uppercase text-[8px] px-2 py-0.5">
              {request.category}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Badge className={`${request.urgency === 'High' ? 'bg-red-500' : 'bg-yellow-400'} text-black border-2 border-black font-black uppercase text-[8px] px-2 py-0.5`}>
                      {request.urgency}
                    </Badge>
                  }
                />
                <TooltipContent className="bg-black text-white border-2 border-white font-bold text-[10px] max-w-[150px]">
                  <p>{urgencyInfo[request.urgency]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {request.status === 'Verified' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-4 right-4 bg-green-500 text-white p-1.5 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <CheckCircle2 size={16} />
            </motion.div>
          )}
        </div>
        <CardHeader className="pb-1 px-6 pt-6">
          <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
            <MapPin size={12} /> {request.location.address}
          </div>
          <CardTitle className="text-xl font-black italic tracking-tighter uppercase leading-none line-clamp-1">{request.title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-6">
          <p className="text-xs text-gray-600 font-bold line-clamp-2 mb-4 leading-relaxed">{request.description}</p>
          <VisualDonation amount={request.raisedAmount} target={request.targetAmount} category={request.category} />

          {/* Need Section */}
          {request.neededItems && request.neededItems.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-black border-dashed">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={14} className="text-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Direct Needs</span>
              </div>
              <div className="space-y-2">
                {request.neededItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-black/5">
                    <span className="text-[10px] font-bold truncate mr-2">{item.name}</span>
                    <span className="text-[10px] font-black shrink-0">
                      {item.fulfilled} / {item.total} <span className="text-gray-400 hidden sm:inline">Fulfilled</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 px-6 pb-6 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              onClick={(e) => { e.stopPropagation(); setShowUPI(true); }}
              className="h-12 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black font-black italic uppercase tracking-tighter text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              Donate Money <Zap size={14} className="ml-1" />
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); navigate(`/fulfill/${request.id}`); }}
              className="h-12 bg-green-500 hover:bg-green-600 text-black border-2 border-black font-black italic uppercase tracking-tighter text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              Fulfill Need <ShoppingBag size={14} className="ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// --- Pages ---

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 800),  // Reveal Logo
      setTimeout(() => setStage(2), 1600), // Reveal Text
      setTimeout(() => setStage(3), 2400), // Shockwave
      setTimeout(() => onFinish(), 3500),  // Finish
    ];
    return () => timers.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Cinematic Background Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px]"
      />

      <div className="relative flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div className="relative z-10 w-40 h-40 flex items-center justify-center">
          <AnimatePresence>
            {stage === 1 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center gap-[2px]"
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <motion.div
                  initial={{ x: -200, opacity: 0 }}
                  animate={{ x: 10, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 25, mass: 1 }}
                >
                  <Hand size={70} className="text-green-500 transform rotate-90" strokeWidth={1.5} />
                </motion.div>
                <motion.div
                  initial={{ x: 200, opacity: 0 }}
                  animate={{ x: -10, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 25, mass: 1 }}
                >
                  <Hand size={70} className="text-green-500 transform -rotate-90 scale-x-[-1]" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {stage >= 2 && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={stage >= 3 ? { scale: [1, 1.1, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full bg-green-500 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-[0_30px_80px_rgba(34,197,94,0.4)] relative overflow-hidden"
            >
              <Handshake size={80} className="text-black" strokeWidth={1.5} />
            </motion.div>
          )}

          {/* Shockwave Rings */}
          <AnimatePresence>
            {stage === 3 && (
              <>
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute inset-0 border-4 border-green-500 rounded-[3rem]"
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Text Animation */}
        <div className="mt-12 overflow-hidden h-20 flex items-center">
          <AnimatePresence>
            {stage >= 2 && (
              <motion.h1
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase flex gap-1"
              >
                {"CONNECT".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ delay: i * 0.05 + 0.2 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={stage >= 2 ? { opacity: 0.4 } : {}}
          className="mt-4 text-[12px] font-black uppercase text-white tracking-[0.6em] italic"
        >
          Decentralized Trust Protocol
        </motion.p>
      </div>

      {/* Scanning Line Effect */}
      <motion.div
        animate={{ y: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent z-20"
      />
    </div>
  );
};

const AuthPage = () => {
  const { login, register } = useAuth();
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState(localStorage.getItem('aidconnect_last_error') || "");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    otp: '',
    location: ''
  });

  React.useEffect(() => {
    if (localStorage.getItem('aidconnect_last_error')) {
      localStorage.removeItem('aidconnect_last_error');
    }
  }, []);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const steps = [
    { id: 1, title: isLogin ? "Login" : "Create free account", desc: isLogin ? "Welcome back to AidConnect" : "Get started with AidConnect" },
    { id: 2, title: "Personal details", desc: "& Verification" },
    { id: 3, title: "Verify your sign-up", desc: "Enter the OTP sent to your mobile" }
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 md:gap-4 mb-8 px-2 overflow-x-auto no-scrollbar">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${step >= s.id ? 'bg-green-500 border-green-500 text-white' : 'border-gray-600 text-gray-600'}`}>
                {step > s.id ? <Check size={12} /> : s.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s.id ? 'text-white' : 'text-gray-600'} hidden sm:inline`}>Step 0{s.id}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-black ${step >= s.id ? 'text-white' : 'text-gray-600'}`}>{s.title}</span>
              <span className={`text-[10px] font-bold ${step >= s.id ? 'text-gray-400' : 'text-gray-700'} hidden sm:inline`}>{s.desc}</span>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-4 md:flex-1 h-[2px] ${step > s.id ? 'bg-green-500' : 'bg-gray-800'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-900/20 blur-[100px] rounded-full" />

      <div className="max-w-2xl w-full mx-auto flex flex-col h-full z-10">
        <div className="flex items-center gap-2 mb-12 mt-8">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Handshake size={20} className="text-black" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">AidConnect.</span>
        </div>

        {renderStepIndicator()}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-2xl flex-1"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                {window.location.search.includes('userId=') ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
                    />
                    <div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter">Completing Secure Login...</h2>
                      <p className="text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest">Verifying your Google session</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-black tracking-tight leading-tight">
                      {isLogin ? "Welcome back to Connect." : "Get started with Connect."}
                    </h2>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">Email Address <span className="text-red-500">*</span></label>
                        <Input
                          placeholder="yourname@email.com"
                          className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all font-bold"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">Create a Password <span className="text-red-500">*</span></label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all font-bold"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500" />
                      <span className="text-xs font-bold text-gray-500">I agree to the <span className="text-green-600 underline">Terms of Service</span> and <span className="text-green-600 underline">Privacy Policy</span>.</span>
                    </div>

                    {errorMsg && (
                      <div className="text-red-500 text-[10px] font-black uppercase p-3 bg-red-50 border-2 border-red-200 rounded-xl flex flex-col gap-1">
                        <div className="flex items-center gap-2"><AlertCircle size={12} /> {errorMsg}</div>
                        <div className="text-[8px] opacity-70">Project: 69db91100005d8796634 | {window.location.hostname}</div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Button
                        onClick={async () => {
                          if (isLogin) {
                            setLoading(true); setErrorMsg("");
                            try { await login(formData.email, formData.password); }
                            catch (err: any) { setErrorMsg(err.message || "Invalid credentials."); }
                            finally { setLoading(false); }
                          } else { handleNext(); }
                        }}
                        disabled={loading}
                        className="w-full h-14 bg-black text-white hover:bg-gray-900 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(253,224,71,1)]"
                      >
                        {loading ? "Please wait..." : isLogin ? "Log In" : "Continue with Email"}
                      </Button>

                      <Button
                        onClick={() => account.createOAuth2Session(OAuthProvider.Google, window.location.origin, window.location.origin, ['profile', 'email'])}
                        className="w-full h-14 bg-white text-black border-2 border-gray-200 hover:bg-gray-50 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-none transition-colors"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                      </Button>
                    </div>

                    <div className="text-center pt-4">
                      <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-xs font-bold text-gray-500"
                      >
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span className="text-green-600 font-black"> {isLogin ? "Sign Up" : "Log In"}</span>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-black tracking-tight leading-tight">
                  Personal details & verification
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">First Name <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="John"
                      className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all font-bold"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Last Name <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="Lennon"
                      className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all font-bold"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">Your City / Location <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="e.g. Bangalore, KA"
                    className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all font-bold"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1"><Sparkles size={10} className="inline mr-1 text-yellow-500" /> We'll show you what's happening near you</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">Mobile number <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="w-20 h-14 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center font-bold text-sm">+91</div>
                    <Input
                      placeholder="Mobile number"
                      className="h-14 flex-1 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all font-bold"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {errorMsg && <div className="text-red-500 text-xs font-bold bg-red-100 p-2 rounded">{errorMsg}</div>}

                <Button
                  onClick={async () => {
                    setLoading(true); setErrorMsg("");
                    try { await register(formData); }
                    catch (e: any) { setErrorMsg(e.message || "Registration failed"); }
                    finally { setLoading(false); }
                  }}
                  disabled={loading}
                  className="w-full h-14 bg-black text-white hover:bg-gray-900 rounded-2xl font-black uppercase tracking-widest text-sm"
                >
                  {loading ? "Creating Profile..." : "Complete Registration"}
                </Button>

                <div className="text-center">
                  <button onClick={handleBack} className="text-xs font-bold text-gray-500 hover:text-black">Back to account details</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} className="text-green-500" />
                </div>
                <h2 className="text-3xl font-black tracking-tight leading-tight text-center">
                  Verify your sign-up
                </h2>
                <p className="text-center text-xs font-bold text-gray-500 px-4">
                  Enter the one-time password sent to your mobile number.
                </p>

                <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold">+91 {formData.phone || '1234567890'}</span>
                  <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <FileText size={12} /> Change number
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 block text-center">Enter OTP</label>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="w-12 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center font-black text-xl bg-gray-50">0</div>
                    ))}
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-[10px] font-bold text-gray-400">Resend in 0:30</span>
                    <button className="text-[10px] font-black text-green-600 uppercase tracking-widest">Resend OTP</button>
                  </div>
                </div>

                <Button
                  onClick={() => login('donor')}
                  className="w-full h-14 bg-black text-white hover:bg-gray-900 rounded-2xl font-black uppercase tracking-widest text-sm"
                >
                  Verify OTP
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-auto py-8 text-center space-y-2">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">&copy; 2026 Connect.</div>
          <div className="flex justify-center gap-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <span>Privacy</span>
            <span>Security</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const FallingLeaves = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-green-600/20"
          initial={{
            top: -50,
            left: `${Math.random() * 100}%`,
            rotate: 0,
            opacity: 0,
            scale: Math.random() * 0.6 + 0.4
          }}
          animate={{
            top: "110%",
            left: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            rotate: 360,
            opacity: [0, 0.5, 0.5, 0]
          }}
          transition={{
            duration: Math.random() * 12 + 15,
            repeat: Infinity,
            delay: Math.random() * -20,
            ease: "linear"
          }}
        >
          <Leaf size={32} className="fill-green-600/10 shadow-sm" strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const { requests, donations } = useData();
  const [filter, setFilter] = useState<RequestCategory | 'All'>('All');
  const navigate = useNavigate();

  const filteredRequests = filter === 'All' ? requests : requests.filter(r => r.category === filter);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="pb-32 bg-[#FDFCF8] min-h-screen relative"
    >
      <FallingLeaves />

      {/* Dynamic Header */}
      <motion.div
        variants={itemVariants}
        className="bg-black text-white pt-16 rounded-b-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto p-8">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32"
          />

          <div className="flex justify-between items-center mb-10 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Handshake size={20} className="text-black" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">Connect.</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="text-right">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Welcome back</div>
                <div className="text-sm font-black italic">{user?.displayName}</div>
              </div>
              <Avatar className="w-10 h-10 border-2 border-green-500">
                <AvatarImage src={user?.photoURL} />
                <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Motivational Quote Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-green-500 text-black p-8 rounded-[2.5rem] border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] relative z-10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10">
              <Heart size={160} />
            </div>
            <div className="relative z-10 space-y-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                <Zap size={14} /> Power of Giving
              </div>

              <h3 className="text-xl md:text-2xl font-black italic tracking-tighter leading-tight uppercase relative z-10">
                "We make a living by what we get, but we make a life by what we give."
              </h3>

              <div className="h-1 w-12 bg-black rounded-full" />

              <h3 className="text-base md:text-lg font-black tracking-tight leading-relaxed">
                "Those who spend their wealth in charity, by night and by day, secretly and publicly, will find their reward."
              </h3>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-4">
                - Divine Wisdom
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Unified Quick Actions */}
      <motion.div
        variants={itemVariants}
        className="px-6 -mt-6 relative z-20 grid grid-cols-3 gap-4"
      >
        {[
          { icon: <Zap size={24} />, label: 'Donate', color: 'bg-orange-400', path: '/' },
          { icon: <Plus size={24} />, label: 'Request', color: 'bg-blue-400', path: '/create-request' },
          { icon: <Eye size={24} />, label: 'Verify', color: 'bg-green-400', path: '/map' }
        ].map((action, i) => (
          <motion.button
            key={i}
            whileHover={{ y: -10, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(action.path)}
            className={`${action.color} border-4 border-black rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-black/10">
              {action.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Live Impact Ticker */}
      <motion.div variants={itemVariants} className="px-6 mt-12 w-full overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-black uppercase tracking-tight italic flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-500" /> Live Impact
          </h4>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Right Now
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {donations.slice(0, 5).map((don, i) => (
            <motion.div
              whileHover={{ scale: 1.05 }}
              key={i}
              className="min-w-[260px] bg-white border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full border-2 border-green-500 flex items-center justify-center font-black text-green-700">
                {don.donorName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black truncate">{don.donorName}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">donated <span className="text-green-600 font-black italic text-sm">₹{don.amount}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Categories Scroller */}
      <motion.div
        variants={itemVariants}
        className="px-6 mt-12"
      >
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
          {['All', 'Food', 'Medical', 'Emergency', 'Education'].map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(cat as any)}
              className={`px-8 py-3 rounded-2xl border-2 border-black font-black uppercase text-[10px] tracking-[0.2em] whitespace-nowrap transition-all ${filter === cat ? 'bg-black text-white shadow-[6px_6px_0px_0px_rgba(253,224,71,1)]' : 'bg-white text-black hover:bg-gray-50'}`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Feed Section */}
      <motion.div
        variants={itemVariants}
        className="px-6 space-y-10 mt-4"
      >
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Active Causes</h3>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-2">Verified requests in your area</p>
          </div>
          <motion.button
            whileHover={{ x: 5 }}
            className="text-[10px] font-black uppercase text-blue-500 border-b-2 border-blue-500/20 pb-1 tracking-widest"
          >
            View Map
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {filteredRequests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const RequestDetailPage = () => {
  const { id } = useParams();
  const { requests, donations, verifications, reviews, addDonation, addReview, updateNeededItem } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDonating, setIsDonating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [donationAmount, setDonationAmount] = useState('100');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showUPI, setShowUPI] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showShareFeedback, setShowShareFeedback] = useState(false);

  const request = requests.find(r => r.id === id);
  const requestDonations = donations.filter(d => d.requestId === id);
  const requestVerifications = verifications.filter(v => v.requestId === id);
  const requestReviews = reviews.filter(rev => rev.requesterId === request?.requesterId);

  if (!request) return <div>Not found</div>;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareFeedback(true);
    setTimeout(() => setShowShareFeedback(false), 2000);
  };

  const handleReviewSubmit = () => {
    if (!user) return;
    addReview({
      requesterId: request.requesterId,
      donorId: user.uid,
      donorName: user.displayName,
      rating: reviewRating,
      comment: reviewComment
    });
    setShowReviewForm(false);
    setReviewComment('');
  };

  const handleDonate = () => {
    if (!user) return;
    setIsDonating(true);

    // Mock success after 2 seconds
    setTimeout(() => {
      addDonation({
        requestId: request.id,
        donorId: user.uid,
        donorName: user.displayName,
        amount: parseInt(donationAmount),
        transactionId: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase()
      });
      setIsDonating(false);
      setShowSuccess(true);
    }, 2000);
  };

  const handlePaymentSuccess = () => {
    if (!user || !request) return;

    addDonation({
      requestId: request.id,
      donorId: user.uid,
      donorName: user.displayName,
      amount: parseInt(donationAmount),
      transactionId: 'STRIPE_' + Math.random().toString(36).substr(2, 9).toUpperCase()
    });

    setShowStripeModal(false);
    setShowSuccess(true);
  };

  const urgencyInfo = {
    'High': 'Immediate need. Critical situation requiring urgent support.',
    'Medium': 'Standard need. Important but not immediately life-threatening.',
    'Low': 'Routine need. Support requested for ongoing requirements.'
  };

  return (
    <div className="pb-32 max-w-4xl mx-auto">
      <UPIDonationModal
        isOpen={showUPI}
        onClose={() => setShowUPI(false)}
        upiId="charity@okaxis"
        title={request.title}
      />
      <AnimatePresence>
        {showSuccess && (
          <PaymentSuccessOverlay
            category={request.category}
            amount={parseInt(donationAmount)}
            onClose={() => {
              setShowSuccess(false);
              setShowReviewForm(true);
            }}
          />
        )}
      </AnimatePresence>

      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="border-4 border-black rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Leave a Review</DialogTitle>
            <DialogDescription className="font-bold text-gray-500">
              Share your experience with {request.requesterName} to help others trust them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-3xl transition-transform hover:scale-125 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Write your review here..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="border-2 border-black rounded-2xl font-bold min-h-[100px]"
            />

            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border-2 border-black border-dashed flex flex-col items-center justify-center p-4 rounded-2xl transition-colors">
              <Camera size={24} className="mb-2 text-black" />
              <span className="text-[10px] font-black uppercase tracking-widest text-black mb-1">Add Geo-Tagged Photo Proof</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Take a photo of the received items or location</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" />
            </label>
          </div>
          <DialogFooter>
            <Button
              onClick={handleReviewSubmit}
              className="w-full h-14 bg-black text-white border-2 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]"
            >
              Submit Review & Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="relative h-80 md:h-[500px]">
        <img src={request.proofUrls[0]} className="w-full h-full object-cover rounded-b-[3rem] md:rounded-3xl" referrerPolicy="no-referrer" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-6 w-10 h-10 bg-white rounded-xl border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <X size={20} />
        </button>
        <div className="absolute top-12 right-6 flex gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-white rounded-xl border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative"
          >
            <Share2 size={20} />
            <AnimatePresence>
              {showShareFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-10 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 rounded whitespace-nowrap"
                >
                  Link Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
        <div className="absolute -bottom-10 left-6 right-6 bg-white border-2 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-2">
              <Badge className="bg-black text-white font-black uppercase text-[10px]">{request.category}</Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Badge className={`${request.urgency === 'High' ? 'bg-red-500' : 'bg-yellow-400'} text-black border-2 border-black font-black uppercase text-[10px]`}>
                        {request.urgency}
                      </Badge>
                    }
                  />
                  <TooltipContent className="bg-black text-white border-2 border-white font-bold text-xs max-w-[200px]">
                    <p>{urgencyInfo[request.urgency]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Clock size={12} /> {new Date(request.createdAt).toLocaleDateString()}
            </div>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{request.title}</h1>
        </div>
      </div>

      <div className="px-6 mt-16 space-y-8">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-black border-dashed">
          <Avatar className="w-12 h-12 border-2 border-black">
            <AvatarImage src={`https://picsum.photos/seed/${request.requesterId}/100/100`} />
            <AvatarFallback>{request.requesterName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Requested By</div>
            <div className="font-black italic text-lg">{request.requesterName}</div>
          </div>
          <div className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 text-[10px] font-black uppercase">Verified</div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-black italic uppercase tracking-tight">The Cause</h3>
          <p className="text-gray-600 font-bold leading-relaxed">{request.description}</p>
        </div>

        <VisualDonation amount={request.raisedAmount} target={request.targetAmount} category={request.category} />

        {/* Monetary Support Card */}
        <div className="p-8 bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(253,224,71,1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl border-2 border-black flex items-center justify-center">
              <Zap size={20} className="text-yellow-600" />
            </div>
            <div>
              <h4 className="text-xl font-black italic uppercase tracking-tight">Monetary Support</h4>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Help reach the target of ₹{(request.targetAmount || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg">₹</span>
                <Input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="h-16 pl-8 border-4 border-black rounded-2xl font-black text-xl focus:ring-yellow-400"
                  placeholder="Enter amount"
                />
              </div>
              <Button
                onClick={() => setShowUPI(true)}
                className="h-16 px-8 bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black font-black uppercase tracking-widest italic text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                Donate Now
              </Button>
            </div>

            <div className="flex gap-2">
              {['100', '500', '1000', '2000'].map(amt => (
                <button
                  key={amt}
                  onClick={() => setDonationAmount(amt)}
                  className={`flex-1 py-2 border-2 border-black rounded-xl font-black text-xs transition-all ${donationAmount === amt ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Need Section */}
        {request.neededItems && request.neededItems.length > 0 && (
          <div className="p-6 bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(34,197,94,0.1)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl border-2 border-black flex items-center justify-center">
                <ShoppingBag size={20} className="text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-black italic uppercase tracking-tight">Direct Needs</h4>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fulfill items directly via vendors</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {request.neededItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border-2 border-black border-dashed relative overflow-hidden group">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="font-black text-sm truncate">{item.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase truncate">{item.total - item.fulfilled} more needed</div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <div className="text-right">
                      <motion.div
                        key={item.fulfilled}
                        initial={{ scale: 1.5, color: "#22c55e" }}
                        animate={{ scale: 1, color: "#000000" }}
                        className="text-base md:text-lg font-black italic tracking-tighter"
                      >
                        {item.fulfilled} / {item.total}
                      </motion.div>
                      <div className="text-[8px] md:text-[10px] font-black uppercase text-green-600">Fulfilled</div>
                    </div>
                    {item.fulfilled < item.total && (
                      <Button
                        size="sm"
                        onClick={() => updateNeededItem(request.id, item.name, 1)}
                        className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                      >
                        <Plus size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="transparency" className="w-full">
          <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            <TabsList className="inline-flex w-full md:flex bg-gray-100 p-1 rounded-2xl border-2 border-black h-12 min-w-max md:min-w-0">
              <TabsTrigger value="transparency" className="flex-1 px-4 rounded-xl font-black uppercase text-[10px] md:text-xs data-[state=active]:bg-black data-[state=active]:text-white whitespace-nowrap">Transparency</TabsTrigger>
              <TabsTrigger value="verification" className="flex-1 px-4 rounded-xl font-black uppercase text-[10px] md:text-xs data-[state=active]:bg-black data-[state=active]:text-white whitespace-nowrap">Verification</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 px-4 rounded-xl font-black uppercase text-[10px] md:text-xs data-[state=active]:bg-black data-[state=active]:text-white whitespace-nowrap">Reviews</TabsTrigger>
              <TabsTrigger value="proof" className="flex-1 px-4 rounded-xl font-black uppercase text-[10px] md:text-xs data-[state=active]:bg-black data-[state=active]:text-white whitespace-nowrap">Proof</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="transparency" className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black uppercase text-sm">Recent Donations</h4>
                <span className="text-xs font-bold text-gray-400">{requestDonations.length} Donors</span>
              </div>
              <div className="space-y-3">
                {requestDonations.map(don => (
                  <div key={don.id} className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-400 rounded-xl border-2 border-black flex items-center justify-center font-black">{don.donorName[0]}</div>
                      <div>
                        <div className="font-black text-sm">{don.donorName}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">{new Date(don.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div className="text-lg font-black italic tracking-tighter">₹{don.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verification" className="pt-6">
            <div className="space-y-6">
              {requestVerifications.map(ver => (
                <div key={ver.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-black">
                      <AvatarImage src={`https://picsum.photos/seed/${ver.verifierId}/100/100`} />
                    </Avatar>
                    <div>
                      <div className="font-black text-sm">{ver.verifierName} <Badge className="ml-2 bg-blue-500 text-white text-[8px]">Eyewitness</Badge></div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{new Date(ver.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="relative h-48 rounded-2xl overflow-hidden border-2 border-black">
                    <img src={ver.photoUrl} className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
                      <MapPin size={10} /> {ver.location.lat.toFixed(4)}, {ver.location.lng.toFixed(4)}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-2xl border-2 border-black border-dashed italic">"{ver.notes}"</p>
                </div>
              ))}
              {user?.role === 'eyewitness' && (
                <Button
                  onClick={() => navigate(`/verify/${request.id}`)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-black font-black uppercase tracking-widest"
                >
                  I am an Eyewitness <Eye size={18} className="ml-2" />
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black uppercase text-sm">Community Reviews</h4>
                <span className="text-xs font-bold text-gray-400">{requestReviews.length} Reviews</span>
              </div>
              {requestReviews.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-black border-dashed">
                  <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-bold text-gray-400 uppercase">No reviews yet for this requester</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requestReviews.map(rev => (
                    <div key={rev.id} className="p-4 bg-white border-2 border-black rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-xs">{rev.donorName[0]}</div>
                          <div>
                            <div className="font-black text-xs">{rev.donorName}</div>
                            <div className="text-[8px] font-bold text-gray-400 uppercase">{new Date(rev.timestamp).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex text-yellow-400 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
              {user && (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full bg-black text-white hover:bg-gray-900 border-2 border-black font-black uppercase tracking-widest mt-4 h-12 rounded-2xl"
                >
                  Write a Review <MessageSquare size={16} className="ml-2" />
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="proof" className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              {request.proofUrls.map((url, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-black">
                  <img src={url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Dual Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white border-t-4 border-black z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="flex gap-2">
              <div className="flex-1 flex gap-1">
                {['100', '500'].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setDonationAmount(amt)}
                    className={`flex-1 h-12 md:h-14 border-2 border-black rounded-xl md:rounded-2xl font-black text-xs md:text-base transition-all ${donationAmount === amt ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(253,224,71,1)]' : 'bg-white text-black hover:bg-gray-50'}`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setShowUPI(true)}
                className="flex-[1.5] h-12 md:h-14 bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black font-black uppercase tracking-tighter italic text-sm md:text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Donate Money <Zap size={16} className="ml-1" />
              </Button>
            </div>
            <Button
              onClick={() => navigate(`/fulfill/${request.id}`)}
              className="h-12 md:h-14 bg-green-500 text-black hover:bg-green-600 border-4 border-black font-black uppercase tracking-tighter italic text-sm md:text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              Fulfill Direct Need <ShoppingBag size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FulfillNeedPage = () => {
  const { id } = useParams();
  const { requests } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'vendor' | 'self' | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<'none' | 'ordered' | 'preparing' | 'out' | 'delivered'>('none');
  const [showSuccess, setShowSuccess] = useState(false);

  const request = requests.find(r => r.id === id);
  if (!request) return null;

  const vendors = MOCK_VENDORS.filter(v => v.category === request.category);

  const handleOrder = () => {
    setOrderStatus('ordered');
    setStep(3);

    // Mock status updates
    setTimeout(() => setOrderStatus('preparing'), 3000);
    setTimeout(() => setOrderStatus('out'), 6000);
    setTimeout(() => setOrderStatus('delivered'), 9000);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">How will you help?</h2>
        <p className="text-gray-500 font-bold">Choose a method to fulfill this need.</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setMethod('vendor'); setStep(2); }}
          className="p-8 bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(34,197,94,1)] text-left flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-green-100 rounded-2xl border-2 border-black flex items-center justify-center">
            <Store size={32} className="text-green-600" />
          </div>
          <div>
            <div className="text-xl font-black italic uppercase">Order via App Vendors</div>
            <div className="text-sm font-bold text-gray-500">Fastest. We handle the logistics.</div>
          </div>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setMethod('self'); setStep(2); }}
          className="p-8 bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-2xl border-2 border-black flex items-center justify-center">
            <Truck size={32} className="text-blue-600" />
          </div>
          <div>
            <div className="text-xl font-black italic uppercase">Self Delivery</div>
            <div className="text-sm font-bold text-gray-500">Buy and deliver the items yourself.</div>
          </div>
        </motion.button>
      </div>
    </div>
  );

  const renderVendorList = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setStep(1)} className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Select a Vendor</h2>
      </div>
      {vendors.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 rounded-[2rem] border-4 border-black border-dashed">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="font-black uppercase text-gray-400">No vendors available in this area</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vendors.map(vendor => (
            <Card key={vendor.id} className="border-4 border-black rounded-[2rem] overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="p-4 md:p-6 pb-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg md:text-xl font-black italic uppercase truncate">{vendor.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-yellow-400 text-black text-[8px] font-black">★ {vendor.rating}</Badge>
                      <span className="text-[10px] font-bold text-gray-400 uppercase truncate">{vendor.distance} away</span>
                    </div>
                  </div>
                  <Store size={24} className="text-gray-300 shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-2">
                <div className="space-y-2">
                  {vendor.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border-2 border-black border-dashed">
                      <span className="font-bold text-sm truncate mr-2">{item.name}</span>
                      <span className="font-black shrink-0">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 md:p-6 bg-gray-50 border-t-2 border-black">
                <Button
                  onClick={() => { setSelectedVendor(vendor); setStep(2.5); }}
                  className="w-full bg-black text-white font-black uppercase tracking-widest h-12 text-xs md:text-sm"
                >
                  Order & Deliver <ArrowRight size={18} className="ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrderSummary = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setStep(2)} className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Order Summary</h2>
      </div>
      <Card className="border-4 border-black rounded-[2rem] overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center border-b-2 border-black border-dashed pb-4">
            <span className="font-bold text-gray-500 uppercase text-xs">Vendor</span>
            <span className="font-black italic uppercase truncate ml-4">{selectedVendor.name}</span>
          </div>
          <div className="space-y-2">
            {selectedVendor.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-bold truncate mr-4">{item.name}</span>
                <span className="font-black shrink-0">₹{item.price}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t-2 border-black flex justify-between items-center">
            <span className="text-xl font-black italic uppercase">Total</span>
            <span className="text-2xl font-black italic">₹{selectedVendor.items.reduce((acc: number, item: any) => acc + item.price, 0)}</span>
          </div>
        </div>
        <div className="p-8 bg-yellow-50 border-t-4 border-black space-y-4">
          <div className="text-center space-y-1">
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vendor UPI ID</div>
            <div className="text-lg font-black italic">{selectedVendor.upiId}</div>
          </div>
          <div className="p-4 bg-white border-2 border-black rounded-xl text-xs font-bold text-center">
            Pay the total amount to the UPI ID above and click "Mark as Ordered" to begin delivery.
          </div>
          <Button
            onClick={handleOrder}
            className="w-full h-14 bg-green-500 text-black border-2 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Mark as Ordered <CheckCircle size={20} className="ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderOrderStatus = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Order in Progress</h2>
        <p className="text-gray-500 font-bold">The vendor is fulfilling your request.</p>
      </div>

      <div className="space-y-6">
        {[
          { id: 'ordered', label: 'Ordered', icon: <Package size={20} />, active: true },
          { id: 'preparing', label: 'Preparing', icon: <Zap size={20} />, active: ['preparing', 'out', 'delivered'].includes(orderStatus) },
          { id: 'out', label: 'Out for Delivery', icon: <Truck size={20} />, active: ['out', 'delivered'].includes(orderStatus) },
          { id: 'delivered', label: 'Delivered', icon: <CheckCircle size={20} />, active: orderStatus === 'delivered' }
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-6">
            <div className={`w-12 h-12 rounded-2xl border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${s.active ? 'bg-green-500' : 'bg-white'}`}>
              {s.active ? <Check size={24} /> : s.icon}
            </div>
            <div className="flex-1">
              <div className={`font-black uppercase text-sm ${s.active ? 'text-black' : 'text-gray-300'}`}>{s.label}</div>
              {s.active && orderStatus === s.id && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="h-1 bg-green-500 mt-2 rounded-full"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {orderStatus === 'delivered' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8"
        >
          <AnimatePresence>
            {showSuccess && (
              <PaymentSuccessOverlay
                category={request.category}
                amount={selectedVendor ? selectedVendor.items.reduce((acc: number, item: any) => acc + item.price, 0) : 0}
                onClose={() => {
                  setShowSuccess(false);
                  navigate('/');
                }}
              />
            )}
          </AnimatePresence>
          <Card className="border-4 border-black rounded-[2rem] p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black italic uppercase">Confirm Delivery</h3>
              <p className="text-xs font-bold text-gray-500">Upload a photo of the delivered items to complete.</p>
            </div>
            <div className="aspect-video bg-gray-50 border-2 border-black border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-all">
              <Camera size={32} className="text-gray-300" />
              <span className="text-[10px] font-black uppercase text-gray-400">Tap to upload photo</span>
            </div>
            <Textarea placeholder="Add an optional note..." className="border-2 border-black rounded-xl font-bold" />
            <Button
              onClick={() => setShowSuccess(true)}
              className="w-full h-14 bg-black text-white border-2 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]"
            >
              Mark as Completed <CheckCircle size={20} className="ml-2" />
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );

  const renderSelfDelivery = () => (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setStep(1)} className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Self Delivery</h2>
      </div>
      <Card className="border-4 border-black rounded-[2rem] p-8 space-y-8">
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black shrink-0">1</div>
            <p className="font-bold text-gray-600">Purchase the required items: <span className="text-black font-black">{request.neededItems?.map(i => `${i.total - i.fulfilled} ${i.name}`).join(', ')}</span></p>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black shrink-0">2</div>
            <p className="font-bold text-gray-600">Deliver to the requester location: <span className="text-black font-black">{request.location.address}</span></p>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black shrink-0">3</div>
            <p className="font-bold text-gray-600">Take a photo of the items at the location and mark as delivered.</p>
          </div>
        </div>
        <div className="aspect-video bg-gray-50 border-2 border-black border-dashed rounded-2xl flex flex-col items-center justify-center gap-2">
          <Camera size={32} className="text-gray-300" />
          <span className="text-[10px] font-black uppercase text-gray-400">Upload Delivery Photo</span>
        </div>
        <Button
          onClick={() => navigate('/')}
          className="w-full h-14 bg-green-500 text-black border-2 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          Mark as Delivered <CheckCircle size={20} className="ml-2" />
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 pb-32">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && renderStep1()}
          {step === 2 && method === 'vendor' && renderVendorList()}
          {step === 2 && method === 'self' && renderSelfDelivery()}
          {step === 2.5 && renderOrderSummary()}
          {step === 3 && renderOrderStatus()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const CreateRequestPage = () => {
  const { user } = useAuth();
  const { addRequest } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Food' as RequestCategory,
    targetAmount: '',
    urgency: 'Medium' as Urgency,
    location: ''
  });

  const validate = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.title.trim()) errs.title = 'Title is required.';
      if (formData.title.trim().length < 10) errs.title = 'Title must be at least 10 characters.';
    }
    if (s === 2) {
      if (!formData.description.trim()) errs.description = 'Description is required.';
      if (!formData.targetAmount || parseInt(formData.targetAmount) < 100) errs.targetAmount = 'Enter a valid target amount (min ₹100).';
    }
    if (s === 3) {
      if (!formData.location.trim()) errs.location = 'Location is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = (nextStep: number) => {
    if (validate(step)) setStep(nextStep);
  };

  const handleGps = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(f => ({ ...f, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        setGpsLoading(false);
      },
      () => {
        setFormData(f => ({ ...f, location: 'Chennai, Tamil Nadu' }));
        setGpsLoading(false);
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProofImages(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!validate(3) || !user) return;
    setSubmitting(true);
    await addRequest({
      requesterId: user.uid,
      requesterName: user.displayName,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      targetAmount: parseInt(formData.targetAmount),
      urgency: formData.urgency,
      location: { lat: 12.9716, lng: 77.5946, address: formData.location },
      proofUrls: proofImages.length > 0 ? proofImages : ['https://picsum.photos/seed/proof_default/800/600']
    });
    setSubmitting(false);
    navigate('/');
  };

  const steps = [
    { id: 1, title: 'Basics', icon: <FileText size={18} /> },
    { id: 2, title: 'Details', icon: <TrendingUp size={18} /> },
    { id: 3, title: 'Proof', icon: <Camera size={18} /> }
  ];

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 pb-32">
      <div className="mb-12">
        <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-8">Create Request</h2>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
          <motion.div
            className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 z-0"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div
                animate={{
                  scale: step === s.id ? 1.2 : 1,
                  backgroundColor: step >= s.id ? '#22c55e' : '#ffffff',
                  borderColor: step >= s.id ? '#000000' : '#e5e7eb'
                }}
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors`}
              >
                <div className={step >= s.id ? 'text-black' : 'text-gray-300'}>
                  {step > s.id ? <Check size={20} /> : s.icon}
                </div>
              </motion.div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.id ? 'text-black' : 'text-gray-400'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                    <FileText size={14} /> Request Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    className={`border-2 rounded-2xl font-bold h-14 text-lg focus:ring-green-500 transition-all ${errors.title ? 'border-red-500 bg-red-50' : 'border-black'}`}
                    placeholder="e.g. Emergency Medical Support for Flood Victims"
                    value={formData.title}
                    onChange={e => { setFormData({ ...formData, title: e.target.value }); setErrors({}); }}
                  />
                  {errors.title && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={12} />{errors.title}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                      <LayoutGrid size={14} /> Category
                    </label>
                    <Select onValueChange={(v) => setFormData({ ...formData, category: v as any })} defaultValue={formData.category}>
                      <SelectTrigger className="border-2 border-black rounded-2xl font-bold h-14 focus:ring-green-500">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black rounded-xl">
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Medical">Medical</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                      <AlertCircle size={14} /> Urgency Level
                    </label>
                    <Select onValueChange={(v) => setFormData({ ...formData, urgency: v as any })} defaultValue={formData.urgency}>
                      <SelectTrigger className="border-2 border-black rounded-2xl font-bold h-14 focus:ring-green-500">
                        <SelectValue placeholder="Select Urgency" />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black rounded-xl">
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => goNext(2)} className="w-full h-16 bg-black text-white font-black uppercase tracking-widest text-lg rounded-2xl shadow-[6px_6px_0px_0px_rgba(34,197,94,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                  Continue to Details <ArrowRight size={20} className="ml-2" />
                </Button>
              </motion.div>
            ) : step === 2 ? (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} /> Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    className={`border-2 rounded-2xl font-bold min-h-[160px] text-lg focus:ring-green-500 transition-all ${errors.description ? 'border-red-500 bg-red-50' : 'border-black'}`}
                    placeholder="Provide as much detail as possible to help donors understand the situation..."
                    value={formData.description}
                    onChange={e => { setFormData({ ...formData, description: e.target.value }); setErrors({}); }}
                  />
                  {errors.description && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={12} />{errors.description}</p>}
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} /> Target Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl text-gray-400">₹</span>
                    <Input
                      type="number"
                      className={`border-2 rounded-2xl font-bold h-14 pl-10 text-xl focus:ring-green-500 transition-all ${errors.targetAmount ? 'border-red-500 bg-red-50' : 'border-black'}`}
                      placeholder="0.00"
                      value={formData.targetAmount}
                      onChange={e => { setFormData({ ...formData, targetAmount: e.target.value }); setErrors({}); }}
                    />
                  </div>
                  {errors.targetAmount && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={12} />{errors.targetAmount}</p>}
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-16 border-2 border-black font-black uppercase rounded-2xl">Back</Button>
                  <Button onClick={() => goNext(3)} className="flex-[2] h-16 bg-black text-white font-black uppercase tracking-widest text-lg rounded-2xl shadow-[6px_6px_0px_0px_rgba(34,197,94,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                    Next: Proof <ArrowRight size={20} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Proof Image Upload */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                    <Camera size={14} /> Upload Proof Images <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed border-black rounded-[2rem] p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-green-50 transition-colors cursor-pointer group"
                  >
                    <div className="w-16 h-16 bg-white border-2 border-black rounded-2xl flex items-center justify-center mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform">
                      <Camera size={28} className="text-black" />
                    </div>
                    <p className="text-sm font-black uppercase text-black mb-1">Click to Upload Proof</p>
                    <p className="text-[10px] font-bold text-gray-400">Medical bills, ID cards, photos — donors will see these</p>
                  </div>

                  {/* Image Previews */}
                  {proofImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {proofImages.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} className="w-full h-24 object-cover rounded-2xl border-2 border-black" />
                          <button
                            onClick={() => setProofImages(p => p.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black border border-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.location && !formData.location && <p className="text-yellow-600 text-xs font-bold">⚠ Add at least one image to help donors verify</p>}
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> Location <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <Input
                      className={`border-2 rounded-2xl font-bold h-14 flex-1 focus:ring-green-500 ${errors.location ? 'border-red-500 bg-red-50' : 'border-black'}`}
                      placeholder="e.g. Chennai, Tamil Nadu"
                      value={formData.location}
                      onChange={e => { setFormData({ ...formData, location: e.target.value }); setErrors({}); }}
                    />
                    <Button
                      variant="outline"
                      onClick={handleGps}
                      disabled={gpsLoading}
                      className="w-14 h-14 p-0 border-2 border-black rounded-2xl hover:bg-green-500 transition-colors"
                      title="Use my GPS location"
                    >
                      {gpsLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Navigation size={24} /></motion.div> : <Navigation size={24} />}
                    </Button>
                  </div>
                  {errors.location && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={12} />{errors.location}</p>}
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-16 border-2 border-black font-black uppercase rounded-2xl">Back</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-[2] h-16 bg-green-500 text-black border-2 border-black font-black uppercase tracking-widest text-lg rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  >
                    {submitting ? 'Publishing...' : 'Publish Request'} <Zap size={20} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

const VerificationPage = () => {
  const { id } = useParams();
  const { requests, addVerification } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const request = requests.find(r => r.id === id);
  if (!request) return null;

  const handleVerify = () => {
    if (!user) return;
    setIsVerifying(true);
    // Simulate GPS and Photo upload
    setTimeout(() => {
      addVerification({
        requestId: request.id,
        verifierId: user.uid,
        verifierName: user.displayName,
        photoUrl: 'https://picsum.photos/seed/verify_new/800/600',
        location: { lat: 12.9716, lng: 77.5946 },
        notes
      });
      setIsVerifying(false);
      navigate(`/request/${request.id}`);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-8">Verify Request</h2>
      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="pt-6 space-y-6">
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-3">
            <Info size={20} className="text-blue-500 mt-1 shrink-0" />
            <p className="text-xs font-bold text-blue-700 leading-relaxed">
              You must be at the physical location to verify. We will record your GPS coordinates and a live photo.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Live Photo</label>
            <div className="aspect-video border-2 border-dashed border-black rounded-2xl flex flex-col items-center justify-center bg-gray-50">
              <Camera size={32} className="text-gray-300 mb-2" />
              <Button className="h-8 text-[10px] font-black uppercase">Open Camera</Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Your Observations</label>
            <Textarea
              className="border-2 border-black rounded-xl font-bold min-h-[100px]"
              placeholder="What did you see? Is the request genuine?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border-2 border-black border-dashed flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-green-500" />
              <span className="text-[10px] font-black uppercase">GPS Lock: Active</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400">12.9716, 77.5946</span>
          </div>

          <Button
            onClick={handleVerify}
            loading={isVerifying}
            className="w-full h-12 bg-black text-white font-black uppercase tracking-widest"
          >
            Submit Verification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapPage = () => {
  const { requests } = useData();
  const navigate = useNavigate();

  return (
    <div className="h-screen relative bg-gray-100 overflow-hidden">
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={13}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {requests.map((req) => (
          <Marker
            key={req.id}
            position={[req.location.lat, req.location.lng]}
            eventHandlers={{
              click: () => navigate(`/request/${req.id}`)
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2 font-black uppercase text-[10px] tracking-tighter">
                {req.title}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Header */}
      <div className="absolute top-12 left-0 right-0 z-10 px-6 flex justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 bg-white border-4 border-black rounded-2xl h-14 flex items-center px-6 gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Search size={24} className="text-gray-400" />
              <input className="bg-transparent outline-none font-black text-lg w-full placeholder:text-gray-300" placeholder="Search local causes..." />
            </div>
            <button className="w-14 h-14 bg-black text-white border-4 border-black rounded-2xl flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(253,224,71,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
              <Filter size={24} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['All', 'Food', 'Medical', 'Emergency'].map(cat => (
              <Badge key={cat} className="bg-white text-black border-2 border-black px-4 py-1.5 font-black uppercase text-[10px] whitespace-nowrap shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Cards Preview */}
      <div className="absolute bottom-32 left-0 right-0 z-10 px-6 flex justify-center">
        <div className="w-full max-w-4xl overflow-x-auto flex gap-6 no-scrollbar pb-6">
          {requests.map(req => (
            <motion.div
              key={req.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/request/${req.id}`)}
              className="min-w-[300px] bg-white border-4 border-black rounded-[2rem] p-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex gap-5 cursor-pointer"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-black shrink-0">
                <img src={req.proofUrls[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{req.category}</span>
                    <Badge className="bg-yellow-400 text-black border border-black text-[7px] px-1 py-0">{req.urgency}</Badge>
                  </div>
                  <div className="text-sm font-black italic tracking-tighter uppercase leading-tight line-clamp-2">{req.title}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-black uppercase">
                    <span>Progress</span>
                    <span>{Math.round((req.raisedAmount / req.targetAmount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-black">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(req.raisedAmount / req.targetAmount) * 100}%` }}
                      className="h-full bg-yellow-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { donations, requests } = useData();

  const myDonations = donations.filter(d => d.donorId === user?.uid);
  const totalDonated = myDonations.reduce((acc, d) => acc + d.amount, 0);
  const myRequests = requests.filter(r => r.requesterId === user?.uid);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-6">
          <Avatar className="w-32 h-32 border-4 border-black shadow-[8px_8px_0px_0px_rgba(253,224,71,1)] rotate-3">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback>{user?.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-black text-yellow-400 px-3 py-1 rounded-full font-black text-xs border-2 border-white">
            {user?.role?.toUpperCase()}
          </div>
        </div>
        <h2 className="text-4xl font-black italic tracking-tighter uppercase">{user?.displayName}</h2>
        <p className="text-gray-500 font-bold mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Card className="bg-black text-white border-none shadow-[4px_4px_0px_0px_rgba(253,224,71,1)]">
          <div className="text-[10px] font-black uppercase text-yellow-400 tracking-widest mb-1">Total Impact</div>
          <div className="text-3xl font-black italic tracking-tighter">₹{totalDonated.toLocaleString()}</div>
        </Card>
        <Card className="bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-[10px] font-black uppercase text-black/50 tracking-widest mb-1">Your Location</div>
          <div className="text-xl mt-1 font-black italic tracking-tighter uppercase line-clamp-1">{user?.location?.address || 'India'}</div>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black italic uppercase tracking-tight">Activity History</h3>

        {user?.role === 'donor' ? (
          <div className="space-y-4">
            {myDonations.map(don => (
              <div key={don.id} className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl border-2 border-black flex items-center justify-center"><History size={20} /></div>
                  <div>
                    <div className="font-black text-sm uppercase">Donated to Request</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{new Date(don.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-lg font-black italic tracking-tighter text-green-600">+₹{don.amount}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-white border-2 border-black rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl border-2 border-black flex items-center justify-center"><TrendingUp size={20} /></div>
                  <div>
                    <div className="font-black text-sm uppercase line-clamp-1">{req.title}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{req.status}</div>
                  </div>
                </div>
                <div className="text-lg font-black italic tracking-tighter">₹{req.raisedAmount}</div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={logout}
          variant="outline"
          className="w-full h-14 border-2 border-red-500 text-red-500 hover:bg-red-50 mt-8"
        >
          Logout Session <LogOut size={20} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

// --- Providers ---

// Providers are now imported from ./contexts

// --- Main App ---

const AppContent = () => {
  const { user, loading } = useAuth();
  // Detect OAuth callback: Appwrite returns ?userId=XXX&secret=YYY in the redirect URL
  const isOAuthRedirect = new URLSearchParams(window.location.search).has('userId') &&
    new URLSearchParams(window.location.search).has('secret');
  const [showSplash, setShowSplash] = useState(!localStorage.getItem('aidconnect_user') && !isOAuthRedirect);
  const location = useLocation();
  const navigate = useNavigate();

  // After OAuth login is confirmed by AuthContext, navigate to home page
  useEffect(() => {
    const handleAuthReady = () => {
      navigate('/', { replace: true });
    };
    window.addEventListener('aidconnect:auth-ready', handleAuthReady);
    return () => window.removeEventListener('aidconnect:auth-ready', handleAuthReady);
  }, [navigate]);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  // Show a branded loading screen while verifying session — never show AuthPage during this
  if (loading) return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 bg-green-500 rounded-[1.5rem] flex items-center justify-center border-4 border-white shadow-[0_0_40px_rgba(34,197,94,0.4)]">
        <Handshake size={32} className="text-black" />
      </div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full"
      />
      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500">
        {isOAuthRedirect ? 'Completing Sign-In...' : 'Loading...'}
      </p>
    </div>
  );

  if (!user) return <AuthPage />;

  const hideNav = ['/request/', '/create-request', '/verify/', '/fulfill/'].some(path => location.pathname.startsWith(path));

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#FDFCF8] font-sans selection:bg-yellow-200">
        <div className="max-w-screen-xl mx-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/request/:id" element={<RequestDetailPage />} />
                <Route path="/fulfill/:id" element={<FulfillNeedPage />} />
                <Route path="/create-request" element={<CreateRequestPage />} />
                <Route path="/verify/:id" element={<VerificationPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Bar */}
          {!hideNav && (
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
              <nav className="w-full max-w-lg bg-white border-4 border-black px-8 py-4 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-[2rem] pointer-events-auto">
                <Link to="/" className={`flex flex-col items-center gap-1.5 transition-all ${location.pathname === '/' ? 'text-black scale-110' : 'text-gray-300'}`}>
                  <div className={`p-2 rounded-xl ${location.pathname === '/' ? 'bg-green-500 border-2 border-black' : ''}`}>
                    <Home size={22} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span>
                </Link>
                <Link to="/map" className={`flex flex-col items-center gap-1.5 transition-all ${location.pathname === '/map' ? 'text-black scale-110' : 'text-gray-300'}`}>
                  <div className={`p-2 rounded-xl ${location.pathname === '/map' ? 'bg-green-500 border-2 border-black' : ''}`}>
                    <MapIcon size={22} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Map</span>
                </Link>

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-16 h-16 bg-black rounded-[1.5rem] flex items-center justify-center -mt-14 border-4 border-white shadow-[0_15px_30px_rgba(0,0,0,0.3)] cursor-pointer group"
                  onClick={() => navigate('/create-request')}
                >
                  <Plus size={32} className="text-green-500 group-hover:rotate-90 transition-transform" />
                </motion.div>

                <Link to="/profile" className={`flex flex-col items-center gap-1.5 transition-all ${location.pathname === '/profile' ? 'text-black scale-110' : 'text-gray-300'}`}>
                  <div className={`p-2 rounded-xl ${location.pathname === '/profile' ? 'bg-green-500 border-2 border-black' : ''}`}>
                    <User size={22} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Profile</span>
                </Link>
                <button className="flex flex-col items-center gap-1.5 text-gray-300 hover:text-red-500 transition-colors">
                  <div className="p-2 rounded-xl">
                    <ShieldAlert size={22} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Report</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppContent />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}
