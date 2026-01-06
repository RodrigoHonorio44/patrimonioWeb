import React from "react";

const FormAnalista = ({ dados, setDados, onSubmit, loading, requisitos }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-blue-500 mb-8 animate-in fade-in zoom-in duration-300">
      <h2 className="text-blue-600 font-black uppercase text-xs mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
        Cadastro de Equipe de TI (Analista)
      </h2>

      <form
        onSubmit={(e) => onSubmit(e, "analista")}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        autoComplete="off"
      >
        {/* TRUQUE ANTI-PREENCHIMENTO */}
        <input style={{ display: "none" }} type="text" name="fake-user" />
        <input style={{ display: "none" }} type="password" name="fake-pass" />

        {/* NOME */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Nome Completo
          </label>
          <input
            type="text"
            name="nome_analista"
            autoComplete="new-password"
            placeholder="Ex: João Silva"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all"
            value={dados.nome} // O reset vem daqui
            onChange={(e) => setDados({ ...dados, nome: e.target.value })}
          />
        </div>

        {/* EMAIL */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            E-mail Corporativo
          </label>
          <input
            type="email"
            name="email_analista"
            autoComplete="new-password"
            placeholder="analista@email.com"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all"
            value={dados.email} // O reset vem daqui
            onChange={(e) => setDados({ ...dados, email: e.target.value })}
          />
        </div>

        {/* MATRÍCULA (Adicionado para não sobrar lixo no estado) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Matrícula TI
          </label>
          <input
            type="text"
            placeholder="000000"
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all"
            value={dados.matricula}
            onChange={(e) => setDados({ ...dados, matricula: e.target.value })}
          />
        </div>

        {/* SENHA */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            Senha Provisória
          </label>
          <input
            type="password"
            name="pass_analista"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all"
            value={dados.senha} // O reset vem daqui
            onChange={(e) => setDados({ ...dados, senha: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !requisitos.nome || !requisitos.minimo}
          className="md:col-span-2 lg:col-span-4 bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest disabled:opacity-50 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          {loading ? "Processando..." : "Finalizar Cadastro de Analista"}
        </button>
      </form>
    </div>
  );
};

export default FormAnalista;
