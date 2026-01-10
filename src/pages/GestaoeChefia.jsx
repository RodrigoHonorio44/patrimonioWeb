import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../api/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  FiHome,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiLayers,
} from "react-icons/fi";

const GestaoeChefia = () => {
  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const menuItems = [
    { path: "/painel-gestao", icon: <FiLayers size={22} />, label: "Início" },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans antialiased text-slate-900">
      {/* SIDEBAR COM COR DE CONTRASTE PARA MENOS BRANCO */}
      <aside
        className={`relative ${
          sidebarOpen ? "w-72" : "w-24"
        } bg-[#F1F5F9] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col z-50 border-r border-slate-200/60`}
      >
        {/* LOGO AREA */}
        <div className="h-28 flex items-center px-8 mb-4 bg-white/40 backdrop-blur-sm border-b border-slate-200/40">
          <div
            className={`flex flex-col transition-all duration-300 ${
              !sidebarOpen && "scale-0 opacity-0 w-0"
            }`}
          >
            <div className="flex items-center">
              <span className="text-2xl font-black italic tracking-tighter text-[#0F172A]">
                RODHON
              </span>
              <span className="text-2xl font-black italic tracking-tighter text-[#2563EB]">
                SYSTEM
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 tracking-[0.4em] uppercase leading-none mt-1.5">
              Technology Solutions
            </span>
          </div>
          {!sidebarOpen && (
            <div className="w-full flex justify-center animate-in zoom-in">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic text-lg shadow-lg">
                R
              </div>
            </div>
          )}
        </div>

        {/* BOTÃO TOGGLE */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3.5 top-12 bg-white border border-slate-200 shadow-md rounded-full p-1.5 text-slate-400 hover:text-blue-600 hover:scale-110 transition-all z-[60]"
        >
          {sidebarOpen ? (
            <FiChevronLeft size={16} />
          ) : (
            <FiChevronRight size={16} />
          )}
        </button>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          <p
            className={`px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${
              !sidebarOpen && "opacity-0"
            }`}
          >
            Menu Principal
          </p>

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
                    : "text-slate-500 hover:bg-white hover:text-blue-600"
                }`}
              >
                <div
                  className={`transition-transform duration-300 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  {item.icon}
                </div>
                {sidebarOpen && (
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER - SAIR DO SISTEMA COM HOVER VERMELHO */}
        <div className="p-4 mt-auto border-t border-slate-200/60 bg-white/20">
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-4 px-4 py-4 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest group shadow-none hover:shadow-md hover:shadow-red-100"
          >
            <FiLogOut
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
            {sidebarOpen && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 z-40">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
                {userData?.role || "Coordenador"}
              </h2>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight italic">
              Visão Geral{" "}
              <span className="text-slate-400 font-medium">do Sistema</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="text-right hidden md:block">
              <p className="text-xs font-black text-slate-800 uppercase leading-none mb-1 group-hover:text-blue-600 transition-colors">
                {userData?.nome || "Felipe Cu"}
              </p>
              <div className="inline-block bg-blue-50 px-2 py-0.5 rounded-md">
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-tight">
                  {userData?.unidade || "Hospital Conde"}
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-100 border-2 border-white transition-transform group-hover:rotate-3">
                <FiUser size={22} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default GestaoeChefia;
