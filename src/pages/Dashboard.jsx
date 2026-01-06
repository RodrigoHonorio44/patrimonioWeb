import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Box,
  ClipboardList,
  LogOut,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PlusCircle,
  Repeat,
  Search,
  Package,
  Users,
  MessageSquarePlus,
  ChevronRight,
  ShieldCheck, // Ícone extra para indicar Admin
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [estatisticas, setEstatisticas] = useState({
    abertos: 0,
    fechados: 0,
    total: 0,
    pendentes: 0,
  });
  const [userData, setUserData] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchUser = async () => {
      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          // Fallback caso o documento não exista
          setUserData({
            name: user.displayName || "Analista",
            cargo: "analista",
          });
        }
      } catch (error) {
        setUserData({
          name: user.displayName || "Analista",
          cargo: "analista",
        });
      }
    };

    fetchUser();

    const unsubscribe = onSnapshot(collection(db, "chamados"), (snapshot) => {
      const docs = snapshot.docs.map((d) => d.data());
      setEstatisticas({
        total: docs.length,
        abertos: docs.filter((d) => d.status === "aberto").length,
        fechados: docs.filter((d) => d.status === "fechado").length,
        pendentes: docs.filter((d) => d.status === "pendente").length,
      });
    });

    return () => unsubscribe();
  }, [user]);

  const nomeExibicao = userData?.name || user?.displayName || "Analista";

  // Verifica se o cargo é Administrativo para mostrar opções extras
  const isAdmin = userData?.cargo === "Administrativo";

  const NavButton = ({ icon: Icon, label, path }) => {
    const active = location.pathname === path;
    return (
      <button
        onClick={() => navigate(path)}
        className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all group ${
          active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
            : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
        }`}
      >
        <Icon
          size={18}
          className={
            active ? "text-white" : "group-hover:scale-110 transition-transform"
          }
        />
        <span className="text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* Sidebar Lateral Moderna */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-8 flex items-center gap-3 text-blue-600 font-black text-2xl tracking-tighter italic">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Box size={22} />
          </div>
          <span>
            PATRI<span className="text-slate-800">HOSP</span>
          </span>
        </div>

        <nav className="flex-1 px-6 space-y-6 overflow-y-auto pb-8">
          {/* SEÇÃO DASHBOARDS */}
          <div>
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
              Dashboards
            </p>
            <div className="space-y-1">
              <NavButton
                icon={LayoutDashboard}
                label="Painel Geral"
                path="/dashboard"
              />
              <NavButton
                icon={BarChart3}
                label="Indicadores BI"
                path="/indicadores"
              />
            </div>
          </div>

          {/* SEÇÃO OPERAÇÃO */}
          <div>
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
              Operação
            </p>
            <div className="space-y-1">
              <NavButton
                icon={MessageSquarePlus}
                label="Abrir Chamado"
                path="/cadastrar-chamado"
              />
              <NavButton
                icon={ClipboardList}
                label="Fila de Trabalho"
                path="/operacional"
              />
            </div>
          </div>

          {/* SEÇÃO PATRIMÔNIO */}
          <div>
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
              Patrimônio
            </p>
            <div className="space-y-1">
              <NavButton
                icon={PlusCircle}
                label="Novo Ativo"
                path="/cadastrar-patrimonio"
              />
              <NavButton
                icon={Repeat}
                label="Transferências"
                path="/transferencia"
              />
              <NavButton icon={Search} label="Inventário" path="/inventario" />
              <NavButton
                icon={Package}
                label="Sala do Patrimônio"
                path="/estoque"
              />
            </div>
          </div>

          {/* NOVO: SEÇÃO DE CONFIGURAÇÕES (GESTÃO DE USUÁRIO) */}
          <div>
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
              Configurações
            </p>
            <div className="space-y-1">
              <NavButton
                icon={Users}
                label="Gestão de Usuários"
                path="/usuarios"
              />
            </div>
          </div>
        </nav>

        {/* User Profile Area */}
        <div className="p-6 border-t border-slate-100">
          <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xs uppercase">
              {nomeExibicao.substring(0, 2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-tighter flex items-center gap-1">
                {isAdmin && <ShieldCheck size={10} />}
                {userData?.cargo || "Analista"}
              </p>
              <p className="text-sm font-bold text-slate-700 truncate">
                {nomeExibicao}
              </p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="flex items-center justify-center gap-2 p-3 text-rose-500 hover:bg-rose-50 w-full rounded-xl transition-all font-black text-xs uppercase tracking-widest"
          >
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-1">
              Gestão de Ativos
            </p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Olá, {nomeExibicao.split(" ")[0]}!
            </h1>
          </div>

          <button
            onClick={() => navigate("/cadastrar-chamado")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] shadow-xl shadow-blue-100 flex items-center gap-3 font-black transition-all transform hover:-translate-y-1 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> NOVO CHAMADO
          </button>
        </header>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Em Aberto"
            value={estatisticas.abertos}
            color="amber"
            icon={Clock}
          />
          <StatCard
            title="Aguardando"
            value={estatisticas.pendentes}
            color="rose"
            icon={AlertCircle}
          />
          <StatCard
            title="Concluídos"
            value={estatisticas.fechados}
            color="emerald"
            icon={CheckCircle}
          />
          <StatCard
            title="Histórico"
            value={estatisticas.total}
            color="blue"
            icon={ClipboardList}
          />
        </div>

        {/* Seção de Atalhos Visuais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Sala do Patrimônio"
            description="Gerencie o estoque central 'S/P' e realize distribuições imediatas."
            icon={Package}
            onClick={() => navigate("/estoque")}
            variant="dark"
          />

          <QuickActionCard
            title="Inventário Geral"
            description="Base completa de equipamentos e controle de baixas definitivas."
            icon={Search}
            onClick={() => navigate("/inventario")}
            variant="light"
          />

          <QuickActionCard
            title="Equipe e Usuários"
            description="Controle de acessos e permissões para analistas do setor."
            icon={Users}
            onClick={() => navigate("/usuarios")}
            variant="light"
          />
        </div>
      </main>
    </div>
  );
}

// Subcomponentes StatCard e QuickActionCard permanecem conforme o padrão...
function StatCard({ title, value, color, icon: Icon }) {
  const themes = {
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-600",
  };
  return (
    <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
      <div className="flex justify-between items-center mb-6">
        <div
          className={`${themes[color]} p-3 rounded-2xl text-white shadow-lg`}
        >
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </span>
      </div>
      <h3 className="text-4xl font-black text-slate-900">
        {value.toString().padStart(2, "0")}
      </h3>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon, onClick, variant }) {
  const isDark = variant === "dark";
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-[40px] p-8 transition-all relative overflow-hidden flex flex-col justify-between h-64 ${
        isDark
          ? "bg-slate-900 text-white"
          : "bg-white border border-slate-200 text-slate-900"
      }`}
    >
      <div className="relative z-10">
        <div
          className={`mb-6 inline-block p-4 rounded-2xl ${
            isDark ? "bg-slate-800" : "bg-blue-50 text-blue-600"
          }`}
        >
          <Icon size={24} />
        </div>
        <h2 className="text-xl font-black mb-2">{title}</h2>
        <p className="text-sm opacity-70">{description}</p>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        Acessar Agora <ChevronRight size={14} className="text-blue-500" />
      </div>
    </div>
  );
}
