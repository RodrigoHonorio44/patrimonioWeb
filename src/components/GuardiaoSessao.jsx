import React from "react";
import { useInactivityLogout } from "../hooks/useInactivityLogout";

const GuardiaoSessao = ({ children }) => {
  // Alterado de 10 para 40 minutos
  useInactivityLogout(40);

  return <React.Fragment>{children}</React.Fragment>;
};

export default GuardiaoSessao;
