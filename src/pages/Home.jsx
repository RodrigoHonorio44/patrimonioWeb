import React, { useState, useEffect } from "react";
import CadastroChamado from "../components/CadastroChamado";
import MeusChamados from "../components/MeusChamados";
import FormRemanejamento from "../components/FormRemanejamento";
import ModalLaudoTecnico from "../components/ModalLaudoTecnico"; // Importação do novo modal
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LayoutGrid } from "lucide-react";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [remanejamentoOpen, setRemanejamentoOpen] = useState(false);
  
  // Novos estados para o controle do Laudo Técnico
  const [laudoOpen, setLaudoOpen] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const verificarUsuario = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();

            if (data.requiresPasswordChange === true) {
              navigate("/trocar-senha");
              return;
            }

            setNomeUsuario(
              data.nome || data.name || user.displayName || "Usuário"
            );
          } else if (user.displayName) {
            setNomeUsuario(user.displayName);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        } finally {
          setCarregando(false);
        }
      } else {
        setCarregando(false);
      }
    };

    verificarUsuario();
  }, [navigate]);

  // Função para acionar a abertura do laudo passando os dados do item/equipamento
  const handleAbrirLaudo = (equipamento) => {
    setEquipamentoSelecionado(equipamento);
    setLaudoOpen(true);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">
            <LayoutGrid size={14} /> Suporte Técnico
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight text-left">
            Olá, {nomeUsuario.split(" ")[0]}!
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-left">
            Gerencie seus chamados e acompanhe suas solicitações de TI.
          </p>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
          <div className="p-1">
            {/* Injetado a propriedade abrirLaudo para o componente interno */}
            <MeusChamados
              abrirFormulario={() => setModalOpen(true)}
              abrirRemanejamento={() => setRemanejamentoOpen(true)}
              abrirLaudo={handleAbrirLaudo} 
            />
          </div>
        </div>

        <Footer />

        {/* Modal de Manutenção */}
        <CadastroChamado
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />

        {/* Modal de Remanejamento */}
        {remanejamentoOpen && (
          <FormRemanejamento onClose={() => setRemanejamentoOpen(false)} />
        )}

        {/* Modal do Laudo Técnico de Inviabilidade */}
        <ModalLaudoTecnico
          isOpen={laudoOpen}
          equipamento={equipamentoSelecionado}
          onClose={() => {
            setLaudoOpen(false);
            setEquipamentoSelecionado(null);
          }}
          onAtualizar={() => {
            // Se você tiver alguma função de recarregamento na Home, chame-a aqui
          }}
        />
      </main>
    </div>
  );
}