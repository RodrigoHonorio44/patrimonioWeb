import React, { useEffect, useState } from "react";
import { db, auth } from "../api/Firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { FiArrowUp, FiArrowRight, FiRefreshCw, FiTrash2 } from "react-icons/fi";

const AdminGerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "usuarios"));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(lista);
    });
    return () => unsub();
  }, []);

  const mudarNivel = async (id, novoRole) => {
    try {
      const cargoNome =
        novoRole === "analista"
          ? "ANALISTA"
          : novoRole === "gestor"
          ? "GESTOR"
          : "USUÁRIO";

      await updateDoc(doc(db, "usuarios", id), {
        role: novoRole,
        cargo: cargoNome,
      });
      toast.success(`Nível alterado para ${novoRole.toUpperCase()}`);
    } catch (e) {
      toast.error("Erro ao atualizar no banco");
    }
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Colaborador
              </th>
              <th className="p-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest px-10">
                Controle de Acesso (Admin)
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              // Evita que você mude seu próprio cargo de Admin
              if (u.role === "admin") return null;

              const r = (u.role || "user").toLowerCase().trim();

              return (
                <tr
                  key={u.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-all"
                >
                  <td className="p-6">
                    <div className="font-bold text-slate-700 capitalize">
                      {u.nome}
                    </div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase">
                        Role: {r}
                      </span>
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                        {u.unidade}
                      </span>
                    </div>
                  </td>

                  <td className="p-6">
                    <div className="flex justify-end gap-3 items-center">
                      {/* LÓGICA DE CICLO PARA ADMIN GERENCIAR */}
                      {r === "analista" ? (
                        /* SE É ANALISTA -> MOSTRA LARANJA (VIRA GESTOR) */
                        <button
                          onClick={() => mudarNivel(u.id, "gestor")}
                          className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        >
                          <FiArrowRight size={24} strokeWidth={3} />
                        </button>
                      ) : r === "gestor" ? (
                        /* SE É GESTOR -> MOSTRA AZUL (VOLTA USUÁRIO) */
                        <button
                          onClick={() => mudarNivel(u.id, "user")}
                          className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        >
                          <FiRefreshCw size={22} strokeWidth={3} />
                        </button>
                      ) : (
                        /* SE É USER -> MOSTRA VERDE (VIRA ANALISTA) */
                        <button
                          onClick={() => mudarNivel(u.id, "analista")}
                          className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        >
                          <FiArrowUp size={24} strokeWidth={3} />
                        </button>
                      )}

                      <div className="w-px h-8 bg-slate-200 mx-1"></div>

                      <button
                        onClick={() => deleteDoc(doc(db, "usuarios", u.id))}
                        className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGerenciarUsuarios;
