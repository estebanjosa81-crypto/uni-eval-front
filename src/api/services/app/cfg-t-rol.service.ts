/**
 * Servicio para Configuración de Roles en Evaluaciones
 * Acceso a endpoints /cfg/t/rol según Swagger especificado
 */

import { BaseService } from '../../core/BaseService';
import { httpClient } from '../../core/HttpClient';
import type { ApiResponse } from '../../types/api.types';

// ========================
// TYPES
// ========================

export interface CfgTRol {
  id: number;
  cfg_t_id: number;
  rol_mix_id: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  rol?: {
    id: number;
    nombre: string;
    origen: string;
    rol_origen_id: number;
  };
}

export interface RolAsignado {
  id: number;
  rol_mix_id: number;
  rol_origen_id: number;
  nombre: string;
  origen: string;
}

export interface CreateCfgTRolInput {
  cfg_t_id: number;
  rol_mix_id: number;
}

export interface UpdateCfgTRolInput {
  rol_mix_id?: number;
}

// ========================
// SERVICE
// ========================

class CfgTRolService extends BaseService<CfgTRol, CreateCfgTRolInput, UpdateCfgTRolInput> {
  constructor() {
    super('/cfg/t/rol');
  }

  /**
   * Obtener roles asignados a una configuración (nuevo endpoint optimizado)
   * GET /cfg/t/{cfgTId}/roles
   */
  async getRolesByConfiguracion(cfgTId: number): Promise<ApiResponse<RolAsignado[]>> {
    return this.executeAsync(
      () => httpClient.get<RolAsignado[]>(`/cfg/t/${cfgTId}/roles`),
      []
    );
  }

  /**
   * Obtener roles asignados a una configuración (método alternativo - query param)
   * GET /cfg/t/rol?cfg_t_id={id}
   */
  async getRolesByConfiguracionQueryParam(cfgTId: number): Promise<ApiResponse<CfgTRol[]>> {
    return this.executeAsync(
      () => httpClient.get<CfgTRol[]>(`/cfg/t/rol`, { params: { cfg_t_id: cfgTId } }),
      []
    );
  }

  /**
   * Eliminar rol por ID de la relación cfg_t_rol
   * DELETE /cfg/t/rol/{id}
   */
  async deleteByConfigAndRole(id: number): Promise<ApiResponse<void>> {
    return this.executeAsync(
      () => httpClient.delete(`/cfg/t/rol/${id}`),
      undefined
    );
  }
}

export const cfgTRolService = new CfgTRolService();
