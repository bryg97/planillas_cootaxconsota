export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: number
          usuario: string
          clave: string
          rol: string
          created_at: string
        }
        Insert: {
          usuario: string
          clave: string
          rol?: string
          created_at?: string
        }
        Update: {
          usuario?: string
          clave?: string
          rol?: string
          created_at?: string
        }
      }
      vehiculos: {
        Row: {
          id: number
          codigo_vehiculo: string
          saldo: number
          saldo_pendiente: number
          created_at: string
        }
        Insert: {
          codigo_vehiculo: string
          saldo?: number
          saldo_pendiente?: number
          created_at?: string
        }
        Update: {
          codigo_vehiculo?: string
          saldo?: number
          saldo_pendiente?: number
          created_at?: string
        }
      }
      planillas: {
        Row: {
          id: number
          vehiculo_id: number | null
          conductor: string | null
          tipo: string
          valor: number
          numero_planilla: string | null
          fecha: string
          operador_id: number | null
          pagada: number
          created_at: string
        }
        Insert: {
          vehiculo_id?: number | null
          conductor?: string | null
          tipo?: string
          valor: number
          numero_planilla?: string | null
          fecha: string
          operador_id?: number | null
          pagada?: number
          created_at?: string
        }
        Update: {
          vehiculo_id?: number | null
          conductor?: string | null
          tipo?: string
          valor?: number
          numero_planilla?: string | null
          fecha?: string
          operador_id?: number | null
          pagada?: number
          created_at?: string
        }
      }
      liquidaciones: {
        Row: {
          id: number
          planilla_id: number | null
          operador_id: number | null
          estado: string
          supervisor_id: number | null
          fecha_aprobacion: string | null
          comentario: string | null
          created_at: string
        }
        Insert: {
          planilla_id?: number | null
          operador_id?: number | null
          estado?: string
          supervisor_id?: number | null
          fecha_aprobacion?: string | null
          comentario?: string | null
          created_at?: string
        }
        Update: {
          planilla_id?: number | null
          operador_id?: number | null
          estado?: string
          supervisor_id?: number | null
          fecha_aprobacion?: string | null
          comentario?: string | null
          created_at?: string
        }
      }
      auditoria: {
        Row: {
          id: number
          usuario: string | null
          accion: string | null
          detalles: string | null
          created_at: string
        }
        Insert: {
          usuario?: string | null
          accion?: string | null
          detalles?: string | null
          created_at?: string
        }
        Update: {
          usuario?: string | null
          accion?: string | null
          detalles?: string | null
          created_at?: string
        }
      }
      modulos: {
        Row: {
          id: number
          nombre: string
          ruta: string
          icono: string | null
          orden: number
          activo: boolean
          created_at: string
        }
        Insert: {
          nombre: string
          ruta: string
          icono?: string | null
          orden?: number
          activo?: boolean
          created_at?: string
        }
        Update: {
          nombre?: string
          ruta?: string
          icono?: string | null
          orden?: number
          activo?: boolean
          created_at?: string
        }
      }
      permisos_por_rol: {
        Row: {
          id: number
          rol: string
          modulo_id: number | null
          permitido: boolean
          created_at: string
        }
        Insert: {
          rol: string
          modulo_id?: number | null
          permitido?: boolean
          created_at?: string
        }
        Update: {
          rol?: string
          modulo_id?: number | null
          permitido?: boolean
          created_at?: string
        }
      }
      configuracion: {
        Row: {
          id: number
          telegram_token: string | null
          telegram_chatid: string | null
          created_at: string
        }
        Insert: {
          telegram_token?: string | null
          telegram_chatid?: string | null
          created_at?: string
        }
        Update: {
          telegram_token?: string | null
          telegram_chatid?: string | null
          created_at?: string
        }
      }
    }
  }
}
