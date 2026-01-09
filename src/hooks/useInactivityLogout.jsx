import { useEffect, useRef, useCallback } from "react";
import { auth } from "../api/Firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

export const useInactivityLogout = (timeoutMinutes = 10) => {
  const timerRef = useRef(null);
  const ms = timeoutMinutes * 60 * 1000;

  // Função que executa o logout real
  const handleLogout = useCallback(() => {
    if (auth.currentUser) {
      signOut(auth)
        .then(() => {
          // Toast único para não encher a tela se houver várias abas
          toast.warning("Sessão encerrada por inatividade.", {
            toastId: "logout-toast",
            autoClose: 5000,
          });
        })
        .catch((err) =>
          console.error("Erro ao deslogar por inatividade:", err)
        );
    }
  }, []);

  // Função que reinicia o contador
  const resetTimer = useCallback(() => {
    // Limpa o timer anterior
    if (timerRef.current) clearTimeout(timerRef.current);

    // Só agenda o próximo logout se o usuário estiver de fato logado
    if (auth.currentUser) {
      timerRef.current = setTimeout(handleLogout, ms);
    }
  }, [handleLogout, ms]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Handler para os eventos da janela
    const handleUserActivity = () => resetTimer();

    // Adiciona ouvintes em todos os eventos de interação
    events.forEach((e) => window.addEventListener(e, handleUserActivity));

    // Inicia o timer imediatamente se já houver usuário
    if (auth.currentUser) {
      resetTimer();
    }

    return () => {
      // Remove os ouvintes ao desmontar para evitar vazamento de memória
      events.forEach((e) => window.removeEventListener(e, handleUserActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]); // Removido auth.currentUser daqui para evitar loops, o resetTimer já lida com isso
};
