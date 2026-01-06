import React from "react";

const FormUsuario = ({ dados, setDados, onSubmit, loading, requisitos }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-900 mb-8 animate-in fade-in zoom-in duration-300">
      <h2 className="text-slate-900 font-black uppercase text-xs mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"></span>
        Cadastro de Funcionário (Unidade)
      </h2>

      <form
        onSubmit={(e) => onSubmit(e, "usuario")}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        autoComplete="off"
      >
        {/* --- TRUQUE ANTI-PREENCHIMENTO (HONEYPOT) --- */}
        <input
          style={{ display: "none" }}
          type="text"
          name="prevent_autofill_user"
        />
        <input
          style={{ display: "none" }}
          type="password"
          name="prevent_autofill_pass"
        />

        {/* NOME */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Nome Completo
          </label>
          <input
            type="text"
            name="nome_registro_interno"
            autoComplete="new-password"
            placeholder="Nome Completo"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all"
            value={dados.nome} // Reset automático via prop
            onChange={(e) => setDados({ ...dados, nome: e.target.value })}
          />
        </div>

        {/* EMAIL */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            E-mail
          </label>
          <input
            type="email"
            name="email_registro_interno"
            autoComplete="new-password"
            placeholder="E-mail"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all"
            value={dados.email} // Reset automático via prop
            onChange={(e) => setDados({ ...dados, email: e.target.value })}
          />
        </div>

        {/* MATRÍCULA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Matrícula
          </label>
          <input
            type="text"
            name="matricula_hospitalar"
            placeholder="Matrícula"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all"
            value={dados.matricula} // Reset automático via prop
            onChange={(e) => setDados({ ...dados, matricula: e.target.value })}
          />
        </div>

        {/* UNIDADE */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Unidade
          </label>
          <select
            className="p-4 bg-slate-50 rounded-2xl outline-none border-none focus:ring-2 ring-slate-900 transition-all cursor-pointer"
            required
            value={dados.unidade} // Reset automático via prop
            onChange={(e) => setDados({ ...dados, unidade: e.target.value })}
          >
            <option value="">Unidade Hospitalar...</option>
            <option value="Hospital Conde">Hospital Conde</option>
            <option value="Upa Inoão">Upa Inoão</option>
            <option value="Upa Santa Rita">Upa Santa Rita</option>
            <option value="Samu Barroco">Samu Barroco</option>
          </select>
        </div>

        {/* CARGO */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Cargo
          </label>
          <select
            className="p-4 bg-slate-50 rounded-2xl outline-none border-none focus:ring-2 ring-slate-900 transition-all cursor-pointer"
            required
            value={dados.cargoH} // Reset automático via prop
            onChange={(e) => setDados({ ...dados, cargoH: e.target.value })}
          >
            <option value="">Cargo...</option>
            <option value="Enfermeira">Enfermeira</option>
            <option value="Tecnico de Enfermagem">Técnico de Enfermagem</option>
            <option value="Administrativo">Administrativo</option>
            <option value="Chefia">Chefia</option>
          </select>
        </div>

        {/* SENHA PROVISÓRIA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Senha Provisória
          </label>
          <input
            type="password"
            name="pass_provisoria_user"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all"
            value={dados.senha} // Reset automático via prop
            onChange={(e) => setDados({ ...dados, senha: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !requisitos.nome || !dados.unidade}
          className="lg:col-span-3 bg-slate-900 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-100"
        >
          {loading ? "Salvando..." : "Salvar Funcionário"}
        </button>
      </form>
    </div>
  );
};

export default FormUsuario;
