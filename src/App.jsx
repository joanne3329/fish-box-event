import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, 
  serverTimestamp, addDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  ShoppingBag, Timer, Package, User, Heart, 
  Settings, CheckCircle2, AlertCircle, Trash2, Plus, 
  Crown, Gift, Sparkles, Trophy, Users, ShieldCheck, Lock, X, Waves, MessageSquare, Star, Upload, ImageIcon
} from 'lucide-react';

// ==========================================
// 部署前請填入您在 Firebase 獲得的設定資訊
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD2I5BIe8qRQwPnliawwWtIJywUKuo991M",
  authDomain: "fishbox-23845.firebaseapp.com",
  projectId: "fishbox-23845",
  storageBucket: "fishbox-23845.firebasestorage.app",
  messagingSenderId: "289474404782",
  appId: "1:289474404782:web:6ae8b67279e27d28e7a83f",
  measurementId: "G-6X34W7G7N2"
};

// ==========================================
// 初始化 Firebase
// ==========================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'fish-box-celebration-v1'; // 資料庫路徑 ID

// 管理員密碼
const ADMIN_SECRET = "fish2026";

// 預設圖片 (尚未上傳自訂圖時顯示)
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800"; 

const DEFAULT_CONFIG = {
  title: "BIRTHDAY EVENT FOR YU CIAN HE",
  startTime: "2026-01-04T12:00:00", 
  drawTime: "2026-01-10T00:00:00", 
  imageUrl: "", 
  items: [
    { id: 'item_a', name: '生日驚喜福利 A', stock: 5, initialStock: 5 },
    { id: 'item_b', name: '生日驚喜福利 B', stock: 3, initialStock: 3 },
    { id: 'item_c', name: '生日驚喜福利 C', stock: 2, initialStock: 2 }
  ],
  luckyWinner: null, 
  luckyPrizeName: "未公開簽名拍立得"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(new Date());
  const [view, setView] = useState('user'); 
  const [loading, setLoading] = useState(true);
  const [myOrder, setMyOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { console.error("Auth Failed", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const settingsDoc = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
    const unsubSettings = onSnapshot(settingsDoc, (docSnap) => {
      if (docSnap.exists()) setConfig(docSnap.data());
      else setDoc(settingsDoc, DEFAULT_CONFIG);
      setLoading(false);
    });

    const ordersCol = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const unsubOrders = onSnapshot(ordersCol, (snapshot) => {
      const ordersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(ordersData);
      const userWon = ordersData.find(o => o.uid === user.uid);
      if (userWon) {
        setMyOrder(userWon);
        if (view === 'user' && !userWon.formFilled) setView('success');
      }
    });

    return () => { unsubSettings(); unsubOrders(); };
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_SECRET) {
      setView('admin');
      setPasswordInput("");
      showMessage("驗證成功", "success");
    } else {
      showMessage("密碼錯誤", "error");
    }
  };

  const handleGrab = async (item) => {
    if (!user || isSubmitting) return;
    if (now < new Date(config.startTime)) return showMessage("活動尚未開始喔！", "error");
    if (item.stock <= 0) return showMessage("已經搶完囉！", "error");
    if (myOrder) return showMessage("每人限領一次喔！", "error");

    setIsSubmitting(true);
    try {
      const settingsDoc = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
      const newItems = config.items.map(i => (i.id === item.id ? { ...i, stock: i.stock - 1 } : i));
      await updateDoc(settingsDoc, { items: newItems });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), {
        uid: user.uid,
        itemId: item.id,
        itemName: item.name,
        timestamp: serverTimestamp(),
        formFilled: false
      });
      showMessage("🎉 搶購成功！快留下祝福吧", "success");
      setView('success');
    } catch (err) {
      showMessage("搶購失敗", "error");
    } finally { setIsSubmitting(false); }
  };

  const getTimeRemaining = (target) => {
    const total = Date.parse(target) - Date.parse(now);
    if (total <= 0) return null;
    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((total / 1000 / 60) % 60),
      seconds: Math.floor((total / 1000) % 60)
    };
  };

  if (loading) return <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center font-bold text-[#FF8E53] animate-pulse">FISH BOX CELEBRATION...</div>;

  const grabTimeRem = getTimeRemaining(config.startTime);
  const drawTimeRem = getTimeRemaining(config.drawTime);
  const displayImageUrl = config.imageUrl || DEFAULT_IMAGE;

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#4A4A4A] pb-24 font-sans selection:bg-[#FFE9D1]">
      {/* Toast */}
      {message && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 transition-all animate-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-[#FF8E53] text-white' : 'bg-rose-400 text-white'
        }`}>
          {message.type === 'success' ? <Star size={20} className="fill-current" /> : <AlertCircle size={20} />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      {/* Admin Login Modal */}
      {view === 'login' && (
        <div className="fixed inset-0 z-[60] bg-[#4A4A4A]/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-2 text-[#FF8E53]">
                <ShieldCheck size={24} /> 管理驗證
              </h3>
              <button onClick={() => setView('user')} className="p-2 hover:bg-slate-50 rounded-full text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input 
                autoFocus
                type="password"
                className="w-full px-8 py-5 rounded-[1.8rem] bg-[#FFF9F2] border-none focus:ring-4 focus:ring-[#FFE9D1] outline-none transition-all font-bold text-lg"
                placeholder="請輸入管理密鑰"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
              />
              <button className="w-full py-5 bg-[#FF8E53] text-white rounded-[1.8rem] font-black text-lg hover:bg-[#FF7A3D] transition-all shadow-xl shadow-orange-100">
                確認進入
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-40 border-b border-[#F5E6D3]/50 px-6 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#FF8E53] p-2.5 rounded-[1.5rem] text-white shadow-lg shadow-orange-100">
            <Heart size={24} className="fill-current" strokeWidth={0} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#4A4A4A] leading-none">
              {config.title}
            </h1>
            <p className="text-[10px] font-black text-[#FF8E53] uppercase tracking-[0.2em] mt-1">22nd Birthday Celebration Special</p>
          </div>
        </div>
        
        <button 
          onClick={() => setView('login')}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#4A4A4A] hover:bg-black text-white rounded-full text-xs font-black transition-all shadow-md"
        >
          管理入口
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-12 space-y-16">
        {view === 'user' && (
          <>
            <div className={`relative overflow-hidden rounded-[4rem] p-1.5 transition-all ${
              config.luckyWinner ? 'bg-gradient-to-br from-[#FFD194] to-[#FF8E53] shadow-2xl shadow-orange-100' : 'bg-white shadow-xl shadow-slate-100'
            }`}>
              <div className={`rounded-[3.8rem] p-12 ${
                config.luckyWinner ? 'bg-transparent text-white' : 'bg-white'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                  <div className="flex items-center gap-6">
                    <div className={`p-6 rounded-[2.5rem] ${config.luckyWinner ? 'bg-white/20' : 'bg-[#FFF9F2] text-[#FF8E53]'}`}>
                      <Trophy size={48} />
                    </div>
                    <div>
                      <h2 className={`text-3xl font-black tracking-tight ${config.luckyWinner ? 'text-white' : 'text-[#4A4A4A]'}`}>
                        搶購福利即抽未公開簽名拍立得
                      </h2>
                      <p className={config.luckyWinner ? 'text-white/80 font-bold' : 'text-slate-400 font-bold'}>
                        凡參與搶購活動者，即獲得未公開簽名拍立得之抽獎資格
                      </p>
                    </div>
                  </div>
                </div>

                {config.luckyWinner ? (
                  <div className="text-center py-10 animate-in zoom-in-95 duration-700">
                    <p className="text-xl font-black opacity-90 mb-6 uppercase tracking-widest text-white">Happy Winner ✨</p>
                    <div className="relative inline-block text-white">
                      <h3 className="text-8xl md:text-[10rem] font-black tracking-tighter drop-shadow-2xl mb-6">
                        {config.luckyWinner.name}
                      </h3>
                      <Sparkles className="absolute -top-16 -right-20 text-white animate-pulse hidden md:block" size={100} />
                    </div>
                    <div className="mt-10 flex flex-col items-center gap-6 text-white">
                        <div className="px-12 py-6 bg-white/20 backdrop-blur-2xl rounded-[3rem] font-black text-3xl shadow-xl border border-white/20">
                          獲得：{config.luckyPrizeName}
                        </div>
                        {config.luckyWinner.wish && (
                          <div className="max-w-lg italic opacity-95 text-lg font-medium leading-relaxed">
                            「{config.luckyWinner.wish}」
                          </div>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4 text-slate-400">
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.3em]">
                        <Timer size={16} /> Countdown
                      </div>
                      <div className="text-6xl font-black tracking-tighter text-[#4A4A4A] font-mono leading-none">
                        {drawTimeRem ? (
                          `${drawTimeRem.days}D ${String(drawTimeRem.hours).padStart(2,'0')}:${String(drawTimeRem.minutes).padStart(2,'0')}:${String(drawTimeRem.seconds).padStart(2,'0')}`
                        ) : "開獎在即"}
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex-1 bg-[#FFF9F2] p-8 rounded-[3rem] text-center border border-[#F5E6D3]/30">
                        <span className="block text-slate-300 text-[10px] font-black uppercase tracking-widest mb-2">參與人數</span>
                        <span className="text-4xl font-black text-[#FF8E53]">{orders.length}</span>
                      </div>
                      <div className="flex-1 bg-[#FFF9F2] p-8 rounded-[3rem] text-center border border-[#F5E6D3]/30">
                        <span className="block text-slate-300 text-[10px] font-black uppercase tracking-widest mb-2">開獎日期</span>
                        <span className="text-3xl font-black text-[#4A4A4A]">01.10</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <section className="space-y-16 pt-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <h2 className="text-5xl font-black text-[#4A4A4A] flex items-center gap-5 tracking-tighter">
                    <Gift size={44} className="text-[#FF8E53]" /> 限時生日福利搶購
                  </h2>
                  <p className="text-slate-400 font-bold mt-4 text-xl">1/4 中午 12:00 正式開啟 · 數量有限搶完為止</p>
                </div>
                {grabTimeRem && (
                  <div className="px-10 py-6 bg-[#4A4A4A] text-white rounded-[3rem] shadow-2xl flex items-center gap-5">
                    <div className="w-5 h-5 bg-[#FF8E53] rounded-full animate-ping" />
                    <span className="font-black font-mono text-3xl tracking-tighter">
                      {grabTimeRem.days}D {String(grabTimeRem.hours).padStart(2,'0')}:{String(grabTimeRem.minutes).padStart(2,'0')}:{String(grabTimeRem.seconds).padStart(2,'0')}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {config.items.map(item => (
                  <div key={item.id} className="bg-white p-12 rounded-[5rem] shadow-2xl shadow-orange-50/50 border border-white flex flex-col group hover:-translate-y-3 transition-all duration-700">
                    <div className="w-full aspect-square bg-[#FFFDF9] rounded-[4rem] mb-10 overflow-hidden relative group-hover:shadow-xl transition-all">
                      <img 
                        src={displayImageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    </div>
                    <h3 className="font-black text-2xl mb-4 text-[#4A4A4A] group-hover:text-[#FF8E53] transition-colors">{item.name}</h3>
                    <div className="mb-12">
                      <div className="flex justify-between items-end mb-4 text-slate-300">
                        <span className="text-[10px] font-black uppercase tracking-widest">Inventory</span>
                        <span className={`text-2xl font-mono font-black ${item.stock > 0 ? 'text-[#FF8E53]' : ''}`}>
                          {item.stock} / {item.initialStock}
                        </span>
                      </div>
                      <div className="h-4 w-full bg-[#FFF9F2] rounded-full overflow-hidden p-1">
                        <div 
                          className="h-full bg-gradient-to-r from-[#FFD194] to-[#FF8E53] rounded-full transition-all duration-1000" 
                          style={{ width: `${(item.stock / item.initialStock) * 100}%` }}
                        />
                      </div>
                    </div>
                    <button
                      disabled={grabTimeRem || item.stock <= 0 || !!myOrder || isSubmitting}
                      onClick={() => handleGrab(item)}
                      className={`w-full py-7 rounded-[2.5rem] font-black text-2xl transition-all flex items-center justify-center gap-3 ${
                        grabTimeRem ? 'bg-[#F5E6D3] text-white cursor-not-allowed' :
                        item.stock <= 0 ? 'bg-slate-50 text-slate-200' :
                        myOrder ? 'bg-[#FFE9D1] text-[#FF8E53] border-2 border-[#FFD194]' :
                        'bg-[#FF8E53] text-white hover:bg-[#FF7A3D] shadow-2xl shadow-orange-100 active:scale-95'
                      }`}
                    >
                      {myOrder && myOrder.itemId === item.id ? <><CheckCircle2 size={28}/> 搶到了</> :
                       item.stock <= 0 ? '已搶完' :
                       grabTimeRem ? '等待中' : <><ShoppingBag size={28}/> 立即搶購</>}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {view === 'success' && (
          <div className="max-w-2xl mx-auto bg-white rounded-[5rem] p-16 shadow-2xl border border-white animate-in slide-in-from-bottom-12 duration-500 text-center">
            <div className="w-32 h-32 bg-[#FFE9D1] text-[#FF8E53] rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner ring-12 ring-[#FFF9F2]">
              <Heart size={64} className="fill-current" />
            </div>
            <h2 className="text-6xl font-black text-[#4A4A4A] tracking-tighter leading-tight">手速太強啦！</h2>
            <p className="text-slate-400 font-bold mt-6 text-2xl tracking-tight mb-12">恭喜搶到福利，請留下您的姓名與祝福</p>
            <form className="space-y-10 text-left" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const data = Object.fromEntries(fd);
              updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', myOrder.id), {
                ...data,
                formFilled: true
              }).then(() => {
                showMessage("魚千盒收到了您的溫馨祝福！", "success");
                setView('user');
              });
            }}>
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-300 ml-6 uppercase tracking-[0.3em]">您的姓名</label>
                <input required name="name" className="w-full px-10 py-7 rounded-[3rem] bg-[#FFF9F2] border-4 border-transparent focus:border-[#FF8E53] focus:bg-white outline-none transition-all font-bold text-2xl shadow-inner" placeholder="請輸入姓名" />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-300 ml-6 uppercase tracking-[0.3em]">給魚千盒的生日祝福</label>
                <textarea required name="wish" rows="5" className="w-full px-10 py-7 rounded-[3.5rem] bg-[#FFF9F2] border-4 border-transparent focus:border-[#FF8E53] focus:bg-white outline-none transition-all font-bold text-2xl resize-none shadow-inner" placeholder="寫下對魚千盒的悄悄話..."></textarea>
              </div>
              <button className="w-full py-9 bg-[#FF8E53] text-white rounded-[3.5rem] font-black text-3xl hover:bg-[#FF7A3D] shadow-2xl shadow-orange-100 transition-all active:scale-95">
                送出祝福 · 完成程序
              </button>
            </form>
          </div>
        )}

        {view === 'admin' && (
          <div className="bg-white rounded-[4rem] shadow-2xl border border-[#F5E6D3]/50 overflow-hidden">
            <div className="bg-[#4A4A4A] p-12 text-white flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black flex items-center gap-5 tracking-tight">
                  <ShieldCheck size={40} className="text-[#FF8E53]" /> 控制後台
                </h2>
                <p className="text-slate-400 text-xs font-black mt-3 uppercase tracking-[0.4em]">Yu Cian He Admin Panel</p>
              </div>
              <button onClick={() => setView('user')} className="px-10 py-5 bg-white/10 hover:bg-white/20 rounded-[2rem] font-black transition-all">退出</button>
            </div>
            <AdminContent 
              config={config} 
              orders={orders} 
              onSave={async (c) => {
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), c);
                showMessage("設定已更新", "success");
              }}
            />
          </div>
        )}
      </main>

      <footer className="mt-40 text-center space-y-6 px-6 opacity-60">
        <div className="flex justify-center gap-10">
            <div className="w-24 h-1 bg-[#F5E6D3] rounded-full" />
            <div className="w-2 h-2 bg-[#FF8E53] rounded-full" />
            <div className="w-24 h-1 bg-[#F5E6D3] rounded-full" />
        </div>
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.6em]">魚千盒 22歲生日快樂 · 生日福利系統</p>
      </footer>
    </div>
  );
}

function AdminContent({ config, orders, onSave }) {
  const [local, setLocal] = useState(config);
  const [tab, setTab] = useState('summary');
  const [uploading, setUploading] = useState(false);

  const handleDraw = () => {
    if (orders.length === 0) return alert("目前尚無參與名單！");
    const eligible = orders;
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    setLocal({
      ...local,
      luckyWinner: { uid: winner.uid, name: winner.name || "匿名粉絲", wish: winner.wish || "" }
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert("圖片太大囉 (限 1MB)");
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocal({ ...local, imageUrl: reader.result });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-12">
      <div className="flex gap-6 mb-12 overflow-x-auto pb-4">
        {[
          { id: 'summary', label: '名單與祝福', icon: Users },
          { id: 'settings', label: '活動設定', icon: Settings },
          { id: 'draw', label: '抽獎執行', icon: Trophy }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black transition-all ${tab === t.id ? 'bg-[#FF8E53] text-white shadow-xl' : 'bg-slate-50 text-slate-300'}`}
          >
            <t.icon size={24} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-10">
            <div className="bg-slate-50 p-10 rounded-[3rem] text-center">
              <span className="block text-slate-300 text-[10px] font-black uppercase tracking-widest mb-3">總參與人數</span>
              <span className="text-5xl font-black text-[#4A4A4A]">{orders.length}</span>
            </div>
            <div className="bg-slate-50 p-10 rounded-[3rem] text-center">
              <span className="block text-slate-300 text-[10px] font-black uppercase tracking-widest mb-3">已完成祝福</span>
              <span className="text-5xl font-black text-[#FF8E53]">{orders.filter(o=>o.formFilled).length}</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-200 uppercase">
              <tr><th className="p-8 text-left">姓名</th><th className="p-8 text-left">品項</th><th className="p-8 text-left">祝福</th><th className="p-8 text-left">狀態</th></tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="p-8 font-black">{o.name || '---'}</td>
                  <td className="p-8 text-[#FF8E53] font-bold">{o.itemName}</td>
                  <td className="p-8 text-xs text-slate-400 italic max-w-xs truncate">{o.wish || '---'}</td>
                  <td className="p-8 font-black text-[10px] text-emerald-500">{o.formFilled ? 'SUCCESS' : 'PENDING'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-10 max-w-2xl">
          <div className="space-y-4">
             <label className="block text-[10px] font-black text-slate-300 ml-6 uppercase tracking-widest">活動圖片</label>
             <div className="flex gap-8 items-center">
                <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed flex items-center justify-center overflow-hidden">
                  <img src={local.imageUrl || DEFAULT_IMAGE} className="w-full h-full object-cover" />
                </div>
                <label className="px-5 py-3 bg-[#FF8E53] text-white rounded-2xl font-black text-xs cursor-pointer">
                  {uploading ? '上傳中...' : '選擇圖片'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-10">
            <input type="datetime-local" className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold outline-none" value={local.startTime.slice(0, 16)} onChange={e => setLocal({...local, startTime: e.target.value})} />
            <input className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold outline-none" value={local.title} onChange={e => setLocal({...local, title: e.target.value})} />
          </div>
          {local.items.map(item => (
            <div key={item.id} className="flex gap-4 items-center bg-[#FFF9F2] p-5 rounded-[2.5rem]">
              <input className="flex-1 bg-white p-5 rounded-3xl font-bold border-none" value={item.name} onChange={e => setLocal({...local, items: local.items.map(i => i.id === item.id ? {...i, name: e.target.value} : i)})} />
              <input type="number" className="w-24 p-4 bg-white rounded-2xl text-center font-black border-none" value={item.stock} onChange={e => setLocal({...local, items: local.items.map(i => i.id === item.id ? {...i, stock: parseInt(e.target.value), initialStock: parseInt(e.target.value)} : i)})} />
            </div>
          ))}
          <button onClick={() => onSave(local)} className="w-full py-7 bg-[#4A4A4A] text-white rounded-[2.5rem] font-black text-2xl shadow-xl">更新設定</button>
        </div>
      )}

      {tab === 'draw' && (
        <div className="text-center py-20 max-w-md mx-auto">
          <Trophy size={64} className="mx-auto text-[#FF8E53] mb-8" />
          <h3 className="text-4xl font-black mb-6">拍立得開獎</h3>
          {local.luckyWinner ? (
            <div className="bg-[#FF8E53] p-12 rounded-[4rem] text-white animate-in zoom-in-95">
              <p className="text-7xl font-black mb-4">{local.luckyWinner.name}</p>
              <p className="italic mb-8 opacity-80">「{local.luckyWinner.wish}」</p>
              <button onClick={() => setLocal({...local, luckyWinner: null})} className="text-xs underline opacity-60">重新開獎</button>
            </div>
          ) : (
            <button onClick={handleDraw} className="px-16 py-8 bg-[#FF8E53] text-white rounded-[3.5rem] font-black text-3xl shadow-2xl">執行抽獎</button>
          )}
          <button onClick={() => onSave(local)} className="mt-16 block w-full py-6 text-slate-300 font-black text-sm uppercase tracking-widest hover:text-[#4A4A4A]">發佈至首頁</button>
        </div>
      )}
    </div>
  );
}