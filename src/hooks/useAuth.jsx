import { useState } from "react";
import { auth } from "../api/Firebase.jsx";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export const useAuth = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Falha no login. Verifique suas credenciais.");
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => signOut(auth);

  return { login, logout, error, loading };
};
