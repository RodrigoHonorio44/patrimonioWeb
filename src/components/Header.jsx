import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { auth, db } from "../api/Firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Header() {
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");

  useEffect(() => {
    const buscarNomeUsuario = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setNomeUsuario(
              data.nome || data.name || user.displayName || "Usuário"
            );
          }
        } catch (error) {
          console.error("Erro ao buscar nome:", error);
        }
      }
    };
    buscarNomeUsuario();
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* LADO ESQUERDO: LOGO */}
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => (window.location.href = "/")}
        >
          <div className="text-slate-900 font-black text-xl tracking-tighter italic leading-none uppercase">
            RODHON<span className="text-blue-600">SYSTEM</span>
          </div>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">
            Technology Solutions
          </p>
        </div>

        {/* LADO DIREITO: INFO */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3 pr-6 border-r border-slate-100">
            <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-100">
              {nomeUsuario.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">
                Rede Maricá
              </p>
              <p className="text-sm font-bold text-slate-700">{nomeUsuario}</p>
            </div>
          </div>

          <button
            onClick={() => auth.signOut()}
            className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-rose-100"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
