import React from "react";

const ImprimirAnalista = ({ chamado, isRemaneja, formatarDataHora }) => {
  if (!chamado) return null;

  return (
    <div
      id="area-impressao"
      className="hidden p-8 text-black bg-white uppercase"
    >
      <div className="border-[4px] border-black p-6">
        <div className="flex justify-between border-b-4 border-black pb-4 mb-4">
          <h1 className="text-2xl font-black">
            {isRemaneja(chamado)
              ? "ORDEM DE REMANEJAMENTO"
              : "ORDEM DE SERVIÇO"}
          </h1>
          <span className="text-3xl font-black">#{chamado.numeroOs}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm font-bold mb-6">
          <p>SOLICITANTE: {chamado.nome}</p>
          <p className="text-right">UNIDADE: {chamado.unidade}</p>
          <p>DATA: {formatarDataHora(chamado.criadoEm)}</p>
          <p className="text-right">
            TÉCNICO: {chamado.tecnicoResponsavel || "________________"}
          </p>
        </div>
        <div className="border-2 border-black p-4 min-h-[150px] mb-10">
          <p className="text-[10px] font-black border-b border-black mb-2 uppercase">
            Descrição / Problema:
          </p>
          <p className="text-sm italic">
            {chamado.problema || chamado.descricao || "Sem descrição."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImprimirAnalista;
