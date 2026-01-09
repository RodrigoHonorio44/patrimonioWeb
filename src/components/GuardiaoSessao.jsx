import React from "react";
import { useInactivityLogout } from "../hooks/useInactivityLogout";

const GuardiaoSessao = ({ children }) => {
  // Ativa o monitoramento (passando 10 minutos)
  useInactivityLogout(10);

  return <>{children}</>;
};

export default GuardiaoSessao;
