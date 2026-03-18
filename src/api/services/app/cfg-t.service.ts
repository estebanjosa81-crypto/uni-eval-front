/**
 * Servicio para Configuraciones de Evaluación
 * Acceso a endpoints /cfg/t según Swagger especificado
 */

import { BaseService } from '../../core/BaseService';
import { httpClient } from '../../core/HttpClient';
import type { ApiResponse } from '../../types/api.types';

// ========================
// TYPES
// ========================

export interface ConfiguracionTipo {
  id: number;
  tipo_id: number;
  tipo_form_id: number;
  tipo_form?: {
    id: number;
    nombre: string;
    descripcion?: string | null;
  } | null;
  fecha_inicio: string;
  fecha_fin: string;
  es_cmt_gen: boolean;
  es_cmt_gen_oblig: boolean;
  es_activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  rolesRequeridos?: Array<{
    rol_mix_id: number;
    rol_origen_id: number;
    origen: string;
  }>;
  tipo_evaluacion: {
    id: number;
    categoria: {
      id: number;
      nombre: string;
      descripcion: string;
    };
    tipo: {
      id: number;
      nombre: string;
      descripcion: string;
    };
  };
}

export interface CreateConfiguracionTipoInput {
  tipo_id: number;
  tipo_form_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  es_cmt_gen?: boolean;
  es_cmt_gen_oblig?: boolean;
  es_activo?: boolean;
}

export interface UpdateConfiguracionTipoInput {
  tipo_id?: number;
  tipo_form_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  es_cmt_gen?: boolean;
  es_cmt_gen_oblig?: boolean;
  es_activo?: boolean;
}

/**
 * Opción de escala asociada a un aspecto
 */
export interface AspectoEscalaOpcion {
  id: number | null;
  sigla: string | null;
  nombre: string | null;
  descripcion: string | null;
  orden: string | null;
  puntaje: string | null;
  a_e_id: number;
}

/**
 * Tipo de evaluación con categoría y tipo
 */
export interface TipoEvaluacionData {
  id: number;
  categoria: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  tipo: {
    id: number;
    nombre: string;
    descripcion: string;
  };
}

/**
 * Aspecto con sus escalas/opciones configuradas
 */
export interface AspectoConEscalas {
  id: number;
  cfg_a_id: number;
  nombre: string;
  descripcion: string;
  orden: string;
  es_activo: boolean;
  es_cmt: boolean;
  es_cmt_oblig: boolean;
  opciones: AspectoEscalaOpcion[];
}

/**
 * Respuesta del endpoint /cfg/t/{id}/a-e
 */
export interface ConfiguracionAspectosEscalasResponse {
  es_evaluacion: boolean;
  es_cmt_gen: boolean;
  es_cmt_gen_oblig: boolean;
  tipo_form_id?: number;
  tipo_form?: {
    id: number;
    nombre: string;
    descripcion?: string | null;
  } | null;
  tipo_evaluacion: TipoEvaluacionData;
  aspectos: AspectoConEscalas[];
}

export interface CfgAItem {
  id: number;
  cfg_t_id: number;
  aspecto_id: number;
  orden: number;
  es_activo: boolean;
  aspecto: {
    id: number;
    nombre: string;
    descripcion: string;
  };
}

export interface CfgEItem {
  id: number;
  cfg_t_id: number;
  escala_id: number;
  puntaje: number;
  orden: number;
  es_activo: boolean;
  escala: {
    id: number;
    sigla: string;
    nombre: string;
    descripcion: string;
  };
}

export interface ConfiguracionCfgACfgEResponse {
  es_evaluacion: boolean;
  es_cmt_gen: boolean;
  es_cmt_gen_oblig: boolean;
  tipo_evaluacion: TipoEvaluacionData;
  cfg_a: CfgAItem[];
  cfg_e: CfgEItem[];
}

export interface EvalByUserItem {
  id: number;
  id_configuracion: number;
  estudiante: string;
  docente: string;
  codigo_materia: string;
  es_evaluacion: boolean;
  es_finalizada: boolean;
  nombre_docente: string;
  nombre_materia: string;
  nom_programa: string;
  semestre: string;
}

// ========================
// SERVICE
// ========================

class ConfiguracionEvaluacionService extends BaseService<
  ConfiguracionTipo,
  CreateConfiguracionTipoInput,
  UpdateConfiguracionTipoInput
> {
  constructor() {
    super('/cfg/t');
  }

  /**
   * Obtener listado de configuraciones según rol del usuario
   * GET /cfg/t/r
   */
  async getAllByRole(): Promise<ApiResponse<ConfiguracionTipo[]>> {
    return this.getCustom('/r');
  }

  /**
   * Obtener aspectos con sus escalas configuradas para una configuración
   * GET /cfg/t/{id}/a-e
   */
  async getAspectosConEscalas(id: number): Promise<ApiResponse<ConfiguracionAspectosEscalasResponse>> {
    return this.executeAsync(
      () => httpClient.get<ConfiguracionAspectosEscalasResponse>(`/cfg/t/${id}/a-e`),
      {
        es_evaluacion: false,
        es_cmt_gen: false,
        es_cmt_gen_oblig: false,
        tipo_form_id: 0,
        tipo_form: null,
        tipo_evaluacion: {
          id: 0,
          categoria: {
            id: 0,
            nombre: '',
            descripcion: ''
          },
          tipo: {
            id: 0,
            nombre: '',
            descripcion: ''
          }
        },
        aspectos: []
      }
    );
  }

  /**
   * Obtener cfg_a y cfg_e configurados para una configuración (id opcional)
   * GET /cfg/t/cfg-a_cfg-e
   * GET /cfg/t/{id}/cfg-a_cfg-e
   */
  async getCfgACfgE(id?: number): Promise<ApiResponse<ConfiguracionCfgACfgEResponse | ConfiguracionCfgACfgEResponse[]>> {
    const path = typeof id === 'number' ? `/cfg/t/${id}/cfg-a_cfg-e` : '/cfg/t/cfg-a_cfg-e';
    const defaultItem: ConfiguracionCfgACfgEResponse = {
      es_evaluacion: false,
      es_cmt_gen: false,
      es_cmt_gen_oblig: false,
      tipo_evaluacion: {
        id: 0,
        categoria: {
          id: 0,
          nombre: '',
          descripcion: ''
        },
        tipo: {
          id: 0,
          nombre: '',
          descripcion: ''
        }
      },
      cfg_a: [],
      cfg_e: []
    };

    return this.executeAsync(
      () => httpClient.get<ConfiguracionCfgACfgEResponse | ConfiguracionCfgACfgEResponse[]>(path),
      typeof id === 'number' ? defaultItem : []
    );
  }

  /**
   * Obtener evaluaciones/encuestas del usuario autenticado por configuración
   * GET /cfg/t/{id}/evals
   */
  async getEvaluacionesByCfgT(id: number): Promise<ApiResponse<EvalByUserItem[]>> {
    return this.executeAsync(
      () => httpClient.get<EvalByUserItem[]>(`/cfg/t/${id}/evals`),
      []
    );
  }

  /**
   * Actualizar campo booleano (ej: es_activo, es_cmt_gen, es_cmt_gen_oblig)
   * PUT /cfg/t/{id} con campo específico
   */
  async updateBooleanField(id: number, field: string, value: number | boolean): Promise<ApiResponse<ConfiguracionTipo>> {
    return super.updateBooleanField(id, field, value);
  }
}

export const configuracionEvaluacionService = new ConfiguracionEvaluacionService();
