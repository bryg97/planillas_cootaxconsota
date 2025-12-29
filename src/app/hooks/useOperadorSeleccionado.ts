import { useEffect, useState } from "react";

export function useOperadorSeleccionado(email: string) {
  const [operador, setOperador] = useState<any>(null);
  useEffect(() => {
    if (!email) return;
    const stored = localStorage.getItem("operadorSeleccionado");
    if (stored) {
      const op = JSON.parse(stored);
      if (op && op.correo === email) {
        setOperador(op);
        return;
      }
    }
    setOperador(null);
  }, [email]);
  return [operador, setOperador] as const;
}
