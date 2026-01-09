import React, { useEffect, useState } from "react";
import { db } from "../api/Firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Key,
  Search,
  Calendar,
  Save,
  User,
  Lock,
  Unlock,
  ArrowLeft,
  LayoutDashboard,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";

// Reaproveitando NavButton com cursor-pointer garantido
const NavButton = ({ icon: Icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all group cursor-pointer ${
      active
        ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
        : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
    }`}
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </button>
);

export default function AdminLicencas() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const clientesPorPagina = 6;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClientes(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  // Lógica de Filtro e Paginação
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
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 italic font-black text-slate-400 animate-pulse uppercase tracking-widest">
        Sincronizando Rodhon Core...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen sticky top-0">
        <div className="pt-12 pb-8 px-6 text-center">
          <div className="text-slate-900 font-black text-3xl italic uppercase leading-none">
            RODHON<span className="text-blue-600">SYSTEM</span>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-4">
          <NavButton
            icon={LayoutDashboard}
            label="Dashboard"
            onClick={() => navigate("/dashboard")}
          />
          <NavButton icon={Key} label="Licenças" active onClick={() => {}} />
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase cursor-pointer transition-all"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-100 p-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 italic uppercase">
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
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onChange={(e) => {
                setFiltro(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>
        </header>

        {/* LISTA DE USUÁRIOS */}
        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-4">
            {clientesExibidos.map((cliente) => (
              <div
                key={cliente.id}
                className={`bg-white p-5 rounded-[2.5rem] border-2 flex flex-col xl:flex-row items-center justify-between gap-6 transition-all ${
                  cliente.statusLicenca === "bloqueada"
                    ? "border-red-100"
                    : "border-slate-50 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-4 w-full xl:w-1/4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${
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

                <div className="flex flex-wrap items-center gap-4 justify-end">
                  {/* BOTOES DE CADEADO */}
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
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                          : "text-slate-400"
                      }`}
                    >
                      <Unlock size={14} /> Liberado
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
                          ? "bg-red-600 text-white shadow-lg shadow-red-100"
                          : "text-slate-400"
                      }`}
                    >
                      <Lock size={14} /> Bloquear
                    </button>
                  </div>

                  <input
                    type="date"
                    id={`dt-${cliente.id}`}
                    className="bg-slate-50 border-2 border-transparent focus:border-blue-500 p-3 rounded-2xl text-[11px] font-black outline-none cursor-pointer"
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
            ))}
          </div>
        </section>

        {/* PAGINAÇÃO VISUAL */}
        <footer className="bg-white border-t border-slate-100 p-6 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Página
              </span>
              <span className="text-sm font-black text-slate-800">
                {paginaAtual} de {totalPaginas || 1}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
              disabled={paginaAtual === 1}
              className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer transition-all border border-slate-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() =>
                setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
              }
              disabled={paginaAtual === totalPaginas}
              className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer transition-all border border-slate-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Rodhon SaaS Manager
          </p>
        </footer>
      </main>
    </div>
  );
}
