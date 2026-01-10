import React, { useEffect, useState, useMemo } from "react";
import {
  LayoutDashboard,
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
  ChevronLeft,
  Key,
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    abertos: 0,
    fechados: 0,
    total: 0,
    pendentes: 0,
  });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. CARREGA DADOS DO USUÁRIO SEM REDIRECIONAR (O App.js já cuida da segurança)
    const loadUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Erro ao carregar perfil no dashboard:", error);
        }
      }
      setLoading(false);
    };

    loadUserData();

    // 2. MONITORAMENTO DOS CHAMADOS EM TEMPO REAL
    const unsubscribeChamados = onSnapshot(
      collection(db, "chamados"),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => d.data());
        setEstatisticas({
          total: docs.length,
          abertos: docs.filter((d) => d.status === "aberto").length,
          fechados: docs.filter((d) => d.status === "fechado").length,
          pendentes: docs.filter((d) => d.status === "pendente").length,
        });
      }
    );

    return () => unsubscribeChamados();
  }, []);

  // --- LÓGICA DE PERMISSÕES PARA INTERFACE ---
  const isRoot = useMemo(
    () => userData?.role?.toLowerCase() === "root",
    [userData]
  );
  const isAdmin = useMemo(
    () =>
      userData?.cargo?.toUpperCase() === "ADMINISTRADOR" ||
      userData?.role?.toLowerCase() === "admin",
    [userData]
  );
  const canManageUsers = isRoot || isAdmin;

  const nomeExibicao = userData?.nome || userData?.name || "Analista";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">
            Sincronizando Módulos...
          </p>
        </div>
      </div>
    );
  }

  // Componente interno de botão para manter o padrão visual
  const NavButton = ({ icon: Icon, label, path }) => {
    const active = location.pathname === path;
    return (
      <button
        onClick={() => navigate(path)}
        className={`flex items-center gap-4 w-full px-4 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 group cursor-pointer ${
          active
            ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
            : "text-slate-500 hover:bg-white hover:text-blue-600"
        } ${!sidebarOpen && "justify-center px-0"}`}
      >
        <Icon
          size={22}
          className={
            active ? "text-white" : "group-hover:scale-110 transition-transform"
          }
        />
        {sidebarOpen && <span className="truncate">{label}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans antialiased text-slate-900">
      {/* SIDEBAR */}
      <aside
        className={`relative ${
          sidebarOpen ? "w-72" : "w-24"
        } bg-[#F1F5F9] border-r border-slate-200/60 hidden md:flex flex-col z-50 transition-all duration-500`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-12 bg-white border border-slate-200 text-slate-400 p-1.5 rounded-full shadow-sm z-[60]"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="h-28 flex items-center px-8 mb-4 border-b border-slate-200/40">
          {sidebarOpen ? (
            <div className="flex flex-col">
              <div className="flex items-center text-2xl font-black italic tracking-tighter">
                <span className="text-[#0F172A]">RODHON</span>
                <span className="text-[#2563EB]">SYSTEM</span>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic mx-auto">
              R
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto py-4">
          {canManageUsers && (
            <div>
              {sidebarOpen && (
                <p className="px-4 text-[10px] font-black text-blue-600 uppercase mb-3 tracking-widest">
                  Master Control
                </p>
              )}
              <div className="space-y-1.5">
                {isRoot && (
                  <NavButton
                    icon={Key}
                    label="Licenças e SaaS"
                    path="/admin/licencas"
                  />
                )}
                <NavButton
                  icon={Users}
                  label="Gestão de Usuários"
                  path="/usuarios"
                />
              </div>
            </div>
          )}

          <div>
            {sidebarOpen && (
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
                Dashboards
              </p>
            )}
            <div className="space-y-1.5">
              <NavButton
                icon={LayoutDashboard}
                label="Painel Geral"
                path="/dashboard"
              />
              <NavButton
                icon={BarChart3}
                label="Indicadores BI"
                path="/dashboard-bi"
              />
            </div>
          </div>

          <div>
            {sidebarOpen && (
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
                Operação
              </p>
            )}
            <div className="space-y-1.5">
              <NavButton
                icon={MessageSquarePlus}
                label="Abrir Chamado"
                path="/cadastro-chamado"
              />
              <NavButton
                icon={ClipboardList}
                label="Fila de Trabalho"
                path="/painel-analista"
              />
            </div>
          </div>

          <div>
            {sidebarOpen && (
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
                Patrimônio
              </p>
            )}
            <div className="space-y-1.5">
              <NavButton
                icon={PlusCircle}
                label="Novo Ativo"
                path="/cadastro-equipamento"
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
        </nav>

        <div className="p-4 border-t border-slate-200/60">
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-4 px-4 py-4 text-slate-500 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all font-black text-[11px] uppercase tracking-widest"
          >
            <LogOut size={22} className={!sidebarOpen && "mx-auto"} />
            {sidebarOpen && <span>Encerrar Sessão</span>}
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 z-40">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              {isRoot ? "Root Access" : isAdmin ? "Administrador" : "Analista"}
            </h2>
            <h1 className="text-xl font-black text-slate-800 tracking-tight italic">
              Dashboard
            </h1>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end mb-12">
              <h1 className="text-4xl font-black text-slate-900">
                Olá, {nomeExibicao.split(" ")[0]}!
              </h1>
              <button
                onClick={() => navigate("/cadastro-chamado")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all"
              >
                <Plus size={18} strokeWidth={3} /> Novo Chamado
              </button>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuickActionCard
                title="Sala do Patrimônio"
                description="Gerencie o estoque central."
                icon={Package}
                onClick={() => navigate("/estoque")}
                variant="dark"
              />
              <QuickActionCard
                title="Inventário Geral"
                description="Base completa de equipamentos."
                icon={Search}
                onClick={() => navigate("/inventario")}
                variant="light"
              />
              {canManageUsers && (
                <QuickActionCard
                  title="Equipe e Usuários"
                  description="Controle de acessos e perfis."
                  icon={Users}
                  onClick={() => navigate("/usuarios")}
                  variant="light"
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Subcomponentes (StatCard e QuickActionCard)
function StatCard({ title, value, color, icon: Icon }) {
  const themes = {
    amber: "bg-amber-500 shadow-amber-100",
    rose: "bg-rose-500 shadow-rose-100",
    emerald: "bg-emerald-500 shadow-emerald-100",
    blue: "bg-blue-600 shadow-blue-100",
  };
  return (
    <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div
          className={`${themes[color]} p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}
        >
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </span>
      </div>
      <h3 className="text-4xl font-black text-slate-900 relative z-10">
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
      className={`group cursor-pointer rounded-[32px] p-8 transition-all relative overflow-hidden flex flex-col justify-between h-72 ${
        isDark
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "bg-white border border-slate-200 text-slate-900 hover:border-blue-200 shadow-sm"
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
        <p className="text-sm opacity-70 leading-relaxed font-medium">
          {description}
        </p>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
        Acessar Módulo{" "}
        <ChevronRight
          size={14}
          className="group-hover:translate-x-1 transition-transform"
        />
      </div>
    </div>
  );
}
