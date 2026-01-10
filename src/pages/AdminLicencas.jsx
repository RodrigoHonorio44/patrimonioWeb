import React, { useEffect, useState } from "react";
import { auth, db } from "../api/Firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Key,
  Search,
  Save,
  Lock,
  Unlock,
  ArrowLeft,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck,
  Users,
  LogOut,
} from "lucide-react";
import { toast } from "react-toastify";

export default function AdminLicencas() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const clientesPorPagina = 6;

  useEffect(() => {
    // Verificação de autenticação e permissão
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Regra: Apenas Admin ou Root acessam esta página
        if (data.cargo !== "admin" && data.role !== "root") {
          navigate("/dashboard");
          return;
        }
        setUserData(data);
      }
    });

    // Escuta de clientes (usuários do sistema)
    const unsubscribeClientes = onSnapshot(
      collection(db, "usuarios"),
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClientes(docs);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeClientes();
    };
  }, [navigate]);

  const atualizarLicenca = async (id, novoStatus, novaData) => {
    try {
      const docRef = doc(db, "usuarios", id);
      const dataFormatada = new Date(novaData);
      dataFormatada.setHours(23, 59, 59);

      await updateDoc(docRef, {
        statusLicenca: novoStatus,
        validadeLicenca: Timestamp.fromDate(dataFormatada),
      });

      novoStatus === "bloqueada"
        ? toast.error("Cadeado Ativado!")
        : toast.success("Acesso Liberado!");
    } catch (error) {
      toast.error("Erro ao atualizar banco.");
    }
  };

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

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
      c.email?.toLowerCase().includes(filtro.toLowerCase())
  );

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  const indiceUltimoCliente = paginaAtual * clientesPorPagina;
  const indicePrimeiroCliente = indiceUltimoCliente - clientesPorPagina;
  const clientesExibidos = clientesFiltrados.slice(
    indicePrimeiroCliente,
    indiceUltimoCliente
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
            Sincronizando Rodhon Core...
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans antialiased text-slate-900">
      {/* SIDEBAR PADRONIZADA */}
      <aside
        className={`relative ${
          sidebarOpen ? "w-72" : "w-24"
        } bg-[#F1F5F9] border-r border-slate-200/60 hidden md:flex flex-col z-50 transition-all duration-500 ease-in-out`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-12 bg-white border border-slate-200 text-slate-400 p-1.5 rounded-full shadow-sm hover:text-blue-600 z-[60] transition-all hover:scale-110"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="h-28 flex items-center px-8 mb-4 bg-white/40 backdrop-blur-sm border-b border-slate-200/40 overflow-hidden">
          {sidebarOpen ? (
            <div className="flex flex-col min-w-[180px]">
              <div className="flex items-center text-2xl font-black italic tracking-tighter">
                <span className="text-[#0F172A]">RODHON</span>
                <span className="text-[#2563EB]">SYSTEM</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.4em] uppercase leading-none mt-1.5">
                Technology Solutions
              </span>
            </div>
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-100 mx-auto shrink-0">
              R
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto py-4 custom-scrollbar">
          <div>
            {sidebarOpen && (
              <p className="px-4 text-[10px] font-black text-blue-600 uppercase mb-3 tracking-[0.2em]">
                Master Control
              </p>
            )}
            <div className="space-y-1.5">
              <NavButton
                icon={Key}
                label="Licenças e SaaS"
                path="/admin/licencas"
              />
              <NavButton
                icon={Users}
                label="Gestão de Usuários"
                path="/usuarios"
              />
            </div>
          </div>

          <div>
            {sidebarOpen && (
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em]">
                Dashboards
              </p>
            )}
            <div className="space-y-1.5">
              <NavButton
                icon={LayoutDashboard}
                label="Painel Geral"
                path="/dashboard"
              />
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200/60 bg-white/20">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center gap-4 px-4 py-4 text-slate-500 rounded-2xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest group hover:bg-white hover:text-blue-600 cursor-pointer overflow-hidden"
          >
            <ArrowLeft size={22} className={!sidebarOpen && "mx-auto"} />
            {sidebarOpen && <span>Voltar</span>}
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 z-40">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight italic">
              Cadeado <span className="text-blue-600">Mestre</span>
            </h1>
          </div>
          <div className="relative w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all"
              onChange={(e) => {
                setFiltro(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <div className="max-w-[1200px] mx-auto space-y-4 pb-10">
            {clientesExibidos.map((cliente) => (
              <div
                key={cliente.id}
                className={`bg-white p-6 rounded-[32px] border-2 flex flex-col xl:flex-row items-center justify-between gap-6 transition-all ${
                  cliente.statusLicenca === "bloqueada"
                    ? "border-red-100"
                    : "border-slate-50 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-4 w-full xl:w-1/3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                      cliente.statusLicenca === "bloqueada"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {cliente.nome?.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="font-black text-slate-800 uppercase italic text-sm truncate">
                      {cliente.nome}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                      {cliente.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-end w-full xl:w-2/3">
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200">
                    <button
                      onClick={() =>
                        atualizarLicenca(
                          cliente.id,
                          "ativa",
                          document.getElementById(`dt-${cliente.id}`).value
                        )
                      }
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer transition-all ${
                        cliente.statusLicenca !== "bloqueada"
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "text-slate-400"
                      }`}
                    >
                      <Unlock size={14} /> Ativo
                    </button>
                    <button
                      onClick={() =>
                        atualizarLicenca(
                          cliente.id,
                          "bloqueada",
                          document.getElementById(`dt-${cliente.id}`).value
                        )
                      }
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer transition-all ${
                        cliente.statusLicenca === "bloqueada"
                          ? "bg-red-600 text-white shadow-lg"
                          : "text-slate-400"
                      }`}
                    >
                      <Lock size={14} /> Bloquear
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      id={`dt-${cliente.id}`}
                      className="bg-slate-50 border-2 border-slate-100 focus:border-blue-500 p-3 rounded-2xl text-[11px] font-black outline-none"
                      defaultValue={
                        cliente.validadeLicenca
                          ?.toDate()
                          .toISOString()
                          .split("T")[0]
                      }
                    />
                    <button
                      onClick={() =>
                        atualizarLicenca(
                          cliente.id,
                          cliente.statusLicenca,
                          document.getElementById(`dt-${cliente.id}`).value
                        )
                      }
                      className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all cursor-pointer shadow-lg active:scale-90"
                    >
                      <Save size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="bg-white border-t border-slate-100 p-6 flex justify-between items-center px-10">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Página
            </span>
            <span className="text-sm font-black text-slate-800">
              {paginaAtual} / {totalPaginas || 1}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
              disabled={paginaAtual === 1}
              className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer border border-slate-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() =>
                setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
              }
              disabled={paginaAtual === totalPaginas}
              className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer border border-slate-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
