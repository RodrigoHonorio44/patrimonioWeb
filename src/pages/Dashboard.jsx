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
  MessageSquarePlus, // Ícone para Novo Chamado
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
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
          setUserData({ nome: user.displayName || "Analista" });
        }
      } catch (error) {
        setUserData({ nome: user.displayName || "Analista" });
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

  const nomeExibicao = userData?.nome || user?.displayName || "Analista";

  const NavButton = ({ icon: Icon, label, path, active = false }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
      }`}
    >
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 flex items-center gap-2 text-blue-600 font-bold text-xl uppercase italic">
          <Box size={28} />
          <span>
            Patri<span className="text-slate-800">Hospital</span>
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">
            Principal
          </p>
          <NavButton
            icon={LayoutDashboard}
            label="Painel Geral"
            path="/dashboard"
            active
          />
          <NavButton
            icon={BarChart3}
            label="Indicadores BI"
            path="/indicadores"
          />

          <div className="pt-4">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">
              Chamados
            </p>
            {/* Novo botão na lateral para o formulário */}
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

          <div className="pt-4">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">
              Patrimônio
            </p>
            <NavButton
              icon={PlusCircle}
              label="Novo Patrimônio"
              path="/cadastrar-patrimonio"
            />
            <NavButton
              icon={Repeat}
              label="Transferência"
              path="/transferencia"
            />
          </div>

          <div className="pt-4">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">
              Gestão
            </p>
            <NavButton icon={Search} label="Inventário" path="/inventario" />
            <NavButton icon={Package} label="Estoque" path="/estoque" />
            <NavButton
              icon={Users}
              label="Gestão de Usuários"
              path="/usuarios"
            />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="mb-4 px-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Analista Logado
            </p>
            <p className="text-sm font-bold text-slate-700 truncate">
              {nomeExibicao}
            </p>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 w-full rounded-xl transition-all font-medium"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Setor de Patrimônio
            </h1>
            <p className="text-slate-500 text-sm">
              Olá, {nomeExibicao.split(" ")[0]}. Bem-vindo ao sistema.
            </p>
          </div>

          {/* BOTÃO ATUALIZADO: Agora leva ao formulário de cadastro de chamado */}
          <button
            onClick={() => navigate("/cadastrar-chamado")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 font-medium transition-all"
          >
            <Plus size={20} /> Novo Chamado
          </button>
        </header>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Abertos"
            value={estatisticas.abertos}
            color="amber"
            icon={Clock}
          />
          <StatCard
            title="Em Espera"
            value={estatisticas.pendentes}
            color="red"
            icon={AlertCircle}
          />
          <StatCard
            title="Finalizados"
            value={estatisticas.fechados}
            color="emerald"
            icon={CheckCircle}
          />
          <StatCard
            title="Total"
            value={estatisticas.total}
            color="blue"
            icon={Box}
          />
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-8 text-white flex justify-between items-center shadow-xl shadow-blue-100 border border-blue-400">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Pronto para o Inventário?
            </h2>
            <p className="text-blue-100 opacity-90">
              Inicie o levantamento de ativos diretamente pelo módulo de gestão.
            </p>
          </div>
          <button
            onClick={() => navigate("/inventario")}
            className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-sm"
          >
            Iniciar Agora
          </button>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color, icon: Icon }) {
  const colors = {
    amber: "text-amber-500 bg-amber-50",
    red: "text-red-500 bg-red-50",
    emerald: "text-emerald-500 bg-emerald-50",
    blue: "text-blue-500 bg-blue-50",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-4xl font-black text-slate-800">
        {value.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
