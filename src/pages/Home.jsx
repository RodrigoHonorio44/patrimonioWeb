import React, { useState, useEffect } from "react";
import CadastroChamado from "../components/CadastroChamado";
import MeusChamados from "../components/MeusChamados";
import { LogOut, LayoutGrid, ShieldCheck } from "lucide-react";
import { auth, db } from "../api/Firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");

  useEffect(() => {
    const buscarNomeUsuario = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Busca no Firestore na coleção "usuarios" pelo UID do logado
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Tenta pegar o campo 'nome' ou 'name' do seu documento
            setNomeUsuario(
              data.nome || data.name || user.displayName || "Usuário"
            );
          } else if (user.displayName) {
            setNomeUsuario(user.displayName);
          }
        } catch (error) {
          console.error("Erro ao buscar nome:", error);
        }
      }
    };

    buscarNomeUsuario();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* HEADER SUPERIOR */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* LADO ESQUERDO: NOME DO SISTEMA */}
          <div className="flex flex-col">
            <div className="text-slate-900 font-black text-xl tracking-tighter italic leading-none uppercase">
              RODHON<span className="text-blue-600">SYSTEM</span>
            </div>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">
              Technology Solutions
            </p>
          </div>

          {/* LADO DIREITO: INFO DO USUÁRIO E SAIR */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 pr-6 border-r border-slate-100">
              <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-100">
                {nomeUsuario.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">
                  Rede Maricá
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {nomeUsuario}
                </p>
              </div>
            </div>

            <button
              onClick={() => auth.signOut()}
              className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-rose-100"
            >
              <LogOut size={16} />{" "}
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {/* BANNER DE BOAS-VINDAS */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <LayoutGrid size={14} /> Suporte Técnico
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Olá, {nomeUsuario.split(" ")[0]}!
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Gerencie seus chamados e acompanhe suas solicitações de TI.
          </p>
        </div>

        {/* CONTAINER DOS CHAMADOS */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
          <div className="p-1">
            <MeusChamados abrirFormulario={() => setModalOpen(true)} />
          </div>
        </div>

        {/* RODAPÉ */}
        <footer className="mt-12 mb-6 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="h-px w-12 bg-slate-200"></div>
            <ShieldCheck size={16} />
            <div className="h-px w-12 bg-slate-200"></div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
            &copy; 2024 Rodhon System | Unidade Maricá
          </p>
        </footer>

        {/* Modal de cadastro de chamado */}
        <CadastroChamado
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </main>
    </div>
  );
}
