'use client';

import { useState } from "react";
import { crearLiquidacion, aprobarLiquidacion } from "./actions";

export default function LiquidacionesClient({ 
  rol,
  planillas,
  liquidacionesPendientes
}: { 
  rol: string;
  planillas: any[];
  liquidacionesPendientes: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [planillasSeleccionadas, setPlanillasSeleccionadas] = useState<any[]>([]);
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");



    function seleccionarTodas() {
      const idsVisibles = planillasFiltradas.map((p) => p.id);
      setPlanillasSeleccionadas(idsVisibles);
    }

    function deseleccionarTodas() {
      setPlanillasSeleccionadas([]);
    }

    const planillasFiltradas = planillas.filter((p) => {
      if (!fechaDesde && !fechaHasta) return true;
      const fechaPlanilla = new Date(p.fecha);
      const desde = fechaDesde ? new Date(fechaDesde) : null;
      const hasta = fechaHasta ? new Date(fechaHasta) : null;
      if (desde && hasta) {
        return fechaPlanilla >= desde && fechaPlanilla <= hasta;
      } else if (desde) {
        return fechaPlanilla >= desde;
      } else if (hasta) {
        return fechaPlanilla <= hasta;
      }
      return true;
    });

    async function handleCrearLiquidacion() {
      if (planillasSeleccionadas.length === 0) {
        setError("Seleccione al menos una planilla");
        return;
      }
      if (!confirm("¿Crear liquidación con las planillas seleccionadas?")) {
        return;
      }
      setLoading(true);
      setError("");
      setMessage("");
      const result = await crearLiquidacion(planillasSeleccionadas);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Liquidación creada correctamente. Esperando aprobación de tesorera.");
        setPlanillasSeleccionadas([]);
        setTimeout(() => window.location.reload(), 2000);
      }
      setLoading(false);
    }

    async function handleAprobarLiquidacion(liquidacionId: number) {
      if (!confirm("¿Confirmar recepción de dinero?")) {
        return;
      }
      setLoading(true);
      setError("");
      setMessage("");
      const result = await aprobarLiquidacion(liquidacionId);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Liquidación aprobada y notificación enviada");
        setTimeout(() => window.location.reload(), 2000);
      }
      setLoading(false);
    }

    // --- Aquí va el JSX ---
    return (

      <main>
        {/* Aquí debe ir el contenido JSX real, no un placeholder. Si el contenido fue eliminado accidentalmente, restaurar el JSX original aquí. */}
      </main>
    );
}
