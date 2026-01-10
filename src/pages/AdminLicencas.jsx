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
  Infinity, // Adicionado para ícone vitalício
  Clock,
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

  // --- FUNÇÃO DE CÁLCULO AUTOMÁTICO ---
  const calcularDataExpiracao = (tipoPlano) => {
    const data = new Date();
    switch (tipoPlano) {
      case "degustacao":
        data.setDate(data.getDate() + 7);
        break;
      case "mensal":
        data.setMonth(data.getMonth() + 1);
        break;
      case "trimestral":
        data.setMonth(data.getMonth() + 3);
        break;
      case "anual":
        data.setFullYear(data.getFullYear() + 1);
        break;
      case "vitalicio":
        data.setFullYear(data.getFullYear() + 30);
        break; // Simula vitalício (2056+)
      default:
        return "";
    }
    return data.toISOString().split("T")[0];
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.cargo !== "admin" && data.role !== "root") {
          navigate("/dashboard");
          return;
        }
        setUserData(data);
      }
    });

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
    if (!novaData) {
      toast.warn("Selecione uma data de validade.");
      return;
    }
    try {
      const docRef = doc(db, "usuarios", id);
      const dataFormatada = new Date(novaData);
      dataFormatada.setHours(23, 59, 59);

      await updateDoc(docRef, {
        statusLicenca: novoStatus,
        validadeLicenca: Timestamp.fromDate(dataFormatada),
      });

      novoStatus === "bloqueada"
        ? toast.error("Acesso Suspenso!")
        : toast.success("Licença Atualizada!");
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
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto py-4">
          <NavButton
            icon={Key}
            label="Licenças e SaaS"
            path="/admin/licencas"
          />
          <NavButton icon={Users} label="Gestão de Usuários" path="/usuarios" />
          <NavButton
            icon={LayoutDashboard}
            label="Painel Geral"
            path="/dashboard"
          />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 z-40">
          <h1 className="text-xl font-black text-slate-800 tracking-tight italic">
            Cadeado <span className="text-blue-600">Mestre</span>
          </h1>
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
            {clientesExibidos.map((cliente) => {
              const isVitalicio =
                cliente.validadeLicenca?.toDate().getFullYear() > 2050;

              return (
                <div
                  key={cliente.id}
                  className={`bg-white p-6 rounded-[32px] border-2 flex flex-col xl:flex-row items-center justify-between gap-6 transition-all ${
                    cliente.statusLicenca === "bloqueada"
                      ? "border-red-100 bg-red-50/10"
                      : "border-slate-50 shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* INFO CLIENTE */}
                  <div className="flex items-center gap-4 w-full xl:w-1/4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
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
                      <div className="flex items-center gap-2">
                        {isVitalicio ? (
                          <span className="flex items-center gap-1 text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase">
                            <Infinity size={10} /> Vitalício
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase">
                            <Clock size={10} /> Expira em:{" "}
                            {cliente.validadeLicenca
                              ?.toDate()
                              .toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CONTROLES DE PLANO E DATA */}
                  <div className="flex flex-wrap items-center gap-3 justify-end w-full xl:w-3/4">
                    {/* SELECT DE PLANO RÁPIDO */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-2">
                        Plano Rápido
                      </label>
                      <select
                        onChange={(e) => {
                          const novaData = calcularDataExpiracao(
                            e.target.value
                          );
                          if (novaData)
                            document.getElementById(`dt-${cliente.id}`).value =
                              novaData;
                        }}
                        className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-500"
                      >
                        <option value="">Personalizado</option>
                        <option value="degustacao">7 Dias</option>
                        <option value="mensal">30 Dias</option>
                        <option value="trimestral">3 Meses</option>
                        <option value="anual">1 Ano</option>
                        <option value="vitalicio">Vitalício</option>
                      </select>
                    </div>

                    {/* BOTÕES DE STATUS */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 mt-4 xl:mt-0">
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
                            : "text-slate-400 hover:text-slate-600"
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
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <Lock size={14} /> Bloquear
                      </button>
                    </div>

                    {/* DATA E SAVE */}
                    <div className="flex items-center gap-2 mt-4 xl:mt-0">
                      <input
                        type="date"
                        id={`dt-${cliente.id}`}
                        className="bg-white border border-slate-200 focus:border-blue-500 p-2.5 rounded-xl text-[11px] font-black outline-none shadow-sm"
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
                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        <Save size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FOOTER PAGINAÇÃO */}
        <footer className="bg-white border-t border-slate-100 p-6 flex justify-between items-center px-10 shrink-0">
          <div className="flex flex-col text-[11px] font-black uppercase text-slate-400">
            Página {paginaAtual} de {totalPaginas || 1}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
              disabled={paginaAtual === 1}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                setPaginaAtual((p) => Math.min(p + 1, totalPaginas))
              }
              disabled={paginaAtual === totalPaginas}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
