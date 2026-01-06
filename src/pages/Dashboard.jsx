import React, { useEffect, useState } from "react";
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
  ShieldCheck,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Monitoramento de Autenticação e Dados do Usuário
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Bloqueio de acesso para usuários comuns ao Dashboard
          if (data.role === "usuario" || data.cargo === "usuario") {
            navigate("/home");
            return;
          }
          setUserData(data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    });

    // Monitoramento de Chamados em Tempo Real
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

    return () => {
      unsubscribeAuth();
      unsubscribeChamados();
    };
  }, [navigate]);

  // Lógica de exibição de nome e permissões
  const nomeExibicao =
    userData?.nome ||
    userData?.name ||
    auth.currentUser?.displayName ||
    "Analista";

  const isAdmin =
    userData?.role === "admin" ||
    userData?.cargo === "admin" ||
    userData?.cargo === "Administrativo";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase text-xs tracking-widest">
            Carregando Rodhon System...
          </p>
        </div>
      </div>
    );
  }

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
      {/* Sidebar Lateral */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen sticky top-0">
        {/* HEADER DA SIDEBAR PADRONIZADO COM O LOGIN */}
        <div className="pt-12 pb-8 px-6 flex flex-col items-center text-center">
          <div className="text-slate-900 font-black text-3xl tracking-tighter italic leading-none uppercase">
            RODHON<span className="text-blue-600">SYSTEM</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">
            Technology Solutions
          </p>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent mt-8"></div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-6 space-y-6 overflow-y-auto pb-8 custom-scrollbar">
          <div>
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest text-center">
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

          {isAdmin && (
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
          )}
        </nav>

        {/* Perfil do Usuário */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="mb-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs uppercase shadow-md shadow-blue-100">
              {nomeExibicao.substring(0, 2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-tighter flex items-center gap-1">
                {isAdmin && <ShieldCheck size={10} />}
                {userData?.cargo || userData?.role || "Analista"}
              </p>
              <p className="text-sm font-bold text-slate-700 truncate">
                {nomeExibicao}
              </p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="flex items-center justify-center gap-2 p-3 text-rose-500 hover:bg-rose-50 w-full rounded-xl transition-all font-black text-xs uppercase tracking-widest border border-transparent hover:border-rose-100"
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
              Painel Administrativo
            </p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Olá, {nomeExibicao.split(" ")[0]}!
            </h1>
          </div>
          <button
            onClick={() => navigate("/cadastrar-chamado")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] shadow-xl shadow-blue-100 flex items-center gap-3 font-black transition-all transform hover:-translate-y-1"
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

        {/* Atalhos Rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Sala do Patrimônio"
            description="Gerencie o estoque central e realize distribuições imediatas para as unidades."
            icon={Package}
            onClick={() => navigate("/estoque")}
            variant="dark"
          />
          <QuickActionCard
            title="Inventário Geral"
            description="Base completa de equipamentos e controle de baixas definitivas do sistema."
            icon={Search}
            onClick={() => navigate("/inventario")}
            variant="light"
          />
          <QuickActionCard
            title="Equipe e Usuários"
            description="Controle de acessos, permissões e perfis para analistas e administradores."
            icon={Users}
            onClick={() => navigate("/usuarios")}
            variant="light"
          />
        </div>
      </main>
    </div>
  );
}

// Subcomponentes
function StatCard({ title, value, color, icon: Icon }) {
  const themes = {
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-600",
  };
  return (
    <div className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex justify-between items-center mb-6">
        <div
          className={`${themes[color]} p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}
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
      className={`group cursor-pointer rounded-[40px] p-8 transition-all relative overflow-hidden flex flex-col justify-between h-72 ${
        isDark
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "bg-white border border-slate-200 text-slate-900 hover:border-blue-200 shadow-sm hover:shadow-md"
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
        <p className="text-sm opacity-70 leading-relaxed">{description}</p>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        Acessar Módulo{" "}
        <ChevronRight
          size={14}
          className="text-blue-500 group-hover:translate-x-1 transition-transform"
        />
      </div>

      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={120} />
      </div>
    </div>
  );
}
