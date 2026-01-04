import React, { useState } from "react";
import CadastroChamado from "../components/CadastroChamado";
import MeusChamados from "../components/MeusChamados";
import { Stethoscope, LogOut } from "lucide-react";
import { auth } from "../api/Firebase";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER SUPERIOR */}
      <header className="bg-white p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-blue-700 font-bold">
          <Stethoscope /> Rede Maricá
        </div>
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-red-500 transition-colors"
        >
          <LogOut size={18} /> Sair
        </button>
      </header>

      <main className="flex-1 p-6 w-full">
        <div className="mt-2">
          {/* CONEXÃO REALIZADA: 
            Passamos a função abrirFormulario para o componente MeusChamados.
            Certifique-se de que no arquivo MeusChamados.js, o botão de "Novo Chamado" 
            esteja usando a prop: onClick={abrirFormulario}
          */}
          <MeusChamados abrirFormulario={() => setModalOpen(true)} />
        </div>

        {/* O Modal de cadastro que você forneceu anteriormente */}
        <CadastroChamado
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </main>
    </div>
  );
}
