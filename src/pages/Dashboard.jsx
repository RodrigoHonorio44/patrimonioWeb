import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Box,
  ClipboardList,
  LogOut,
  Search,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle, // Substituindo FiCheckCircle que estava faltando
} from "lucide-react";
import { auth, db } from "../api/Firebase";
import {
  collection,
  query,
  onSnapshot,
  where,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";

export default function Dashboard() {
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    abertos: 0,
    fechados: 0,
    criticos: 0,
  });
  const [chamadosRecentes, setChamadosRecentes] = useState([]);
  const [userData, setUserData] = useState(null); // Estado para os dados do Firestore
  const user = auth.currentUser;

  const handleLogout = () => auth.signOut();

  useEffect(() => {
    if (!user) return;

    // 1. Busca os dados do perfil do Analista (Nome e Role)
    const fetchUserData = async () => {
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    };
    fetchUserData();

    // 2. Escuta estatísticas em tempo real
    const qAll = query(collection(db, "chamados"));
    const unsubscribeStats = onSnapshot(qAll, (snapshot) => {
      const docs = snapshot.docs.map((d) => d.data());
      setEstatisticas({
        total: docs.length,
        abertos: docs.filter((d) => d.status?.toLowerCase() === "aberto")
          .length,
        fechados: docs.filter((d) => d.status?.toLowerCase() === "fechado")
          .length,
        criticos: docs.filter((d) => d.prioridade === "Alta").length,
      });
    });

    // 3. Escuta os últimos 5 chamados abertos
    const qRecentes = query(
      collection(db, "chamados"),
      where("status", "==", "Aberto"),
      limit(5)
    );
    const unsubscribeRecentes = onSnapshot(qRecentes, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setChamadosRecentes(lista);
    });

    return () => {
      unsubscribeStats();
      unsubscribeRecentes();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
            <Box size={24} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">
            Patri<span className="text-blue-500">Hosp</span>
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active
          />
          <NavItem icon={<ClipboardList size={18} />} label="Chamados Ganhos" />
          <NavItem icon={<Box size={18} />} label="Inventário" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-bold transition-all group"
          >
            <LogOut
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col">
        {/* HEADER TOP BAR */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="relative w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600 transition-all outline-none"
              placeholder="Buscar por OS, Patrimônio..."
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-blue-600 transition-colors">
              <Bell size={22} />
              {estatisticas.abertos > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {estatisticas.abertos}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 uppercase italic leading-none">
                  {userData?.name || "Carregando..."}
                </p>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                  {userData?.role || "Acesso"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 uppercase">
                {userData?.name?.substring(0, 2) || "..."}
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE TRABALHO */}
        <div className="p-8 max-w-[1600px] w-full mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
              Painel de Controle
            </h2>
            <p className="text-slate-400 font-medium mt-1">
              Bem-vindo, {userData?.name?.split(" ")[0]}. Monitoramento em tempo
              real.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              title="Total Chamados"
              value={estatisticas.total}
              color="blue"
              icon={<Box />}
            />
            <StatCard
              title="Aguardando"
              value={estatisticas.abertos}
              color="amber"
              icon={<Clock />}
            />
            <StatCard
              title="Finalizados"
              value={estatisticas.fechados}
              color="emerald"
              icon={<CheckCircle />}
            />
            <StatCard
              title="Alta Prioridade"
              value={estatisticas.criticos}
              color="red"
              icon={<AlertCircle />}
            />
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase italic tracking-tight">
                Chamados Pendentes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-5">Equipamento / OS</th>
                    <th className="px-8 py-5">Setor</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {chamadosRecentes.length > 0 ? (
                    chamadosRecentes.map((chamado) => (
                      <TableRow key={chamado.id} data={chamado} />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-10 text-center text-slate-400 italic"
                      >
                        Nenhum chamado pendente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Subcomponentes (Simples e Reutilizáveis)
function NavItem({ icon, label, active = false }) {
  return (
    <button
      className={`flex items-center gap-3 w-full p-3.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value, color, icon }) {
  const themes = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    red: "text-red-600 bg-red-50 border-red-100",
  };
  return (
    <div
      className={`p-6 rounded-[2rem] border-2 transition-all hover:scale-105 ${themes[color]}`}
    >
      <div className="flex justify-between items-start italic">
        <p className="text-[10px] font-black uppercase tracking-widest">
          {title}
        </p>
        <div className="opacity-20">{icon}</div>
      </div>
      <p className="text-4xl font-black mt-2 tracking-tighter">
        {value < 10 ? `0${value}` : value}
      </p>
    </div>
  );
}

function TableRow({ data }) {
  return (
    <tr className="hover:bg-blue-50/30 transition-colors">
      <td className="px-8 py-6">
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">
            #{data.numeroOs} - {data.equipamento}
          </span>
          <span className="text-[10px] font-black text-blue-500 uppercase italic">
            {data.patrimonio}
          </span>
        </div>
      </td>
      <td className="px-8 py-6 text-sm font-bold text-slate-600">
        {data.setor}
      </td>
      <td className="px-8 py-6 text-sm font-bold text-slate-500">
        {data.criadoEm?.toDate
          ? data.criadoEm.toDate().toLocaleDateString("pt-BR")
          : "---"}
      </td>
      <td className="px-8 py-6 text-center">
        <button className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-lg hover:bg-blue-600 transition-all uppercase italic">
          Atender
        </button>
      </td>
    </tr>
  );
}
