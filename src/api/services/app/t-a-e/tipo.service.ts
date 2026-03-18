/**
 * Servicio para Tipos, Categorías y Roles de Configuración Tipo
 * Acceso a endpoints /tipo, /cat/t, /cfg/t/rol y relaciones /cat/t/tipos
 */

import { BaseService } from '../../../core/BaseService';
import { httpClient } from '../../../core/HttpClient';
import type { ApiResponse } from '../../../types/api.types';

// ========================
// TYPES
// ========================

export interface Tipo {
	id: number;
	nombre: string;
	descripcion?: string | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface TipoForm {
	id: number;
	nombre: string;
	descripcion?: string | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface CategoriaTipo {
	id: number;
	nombre: string;
	descripcion?: string | null;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface ConfiguracionTipoRol {
	id: number;
	cfg_t_id: number;
	rol_mix_id: number;
	fecha_creacion?: string | null;
	fecha_actualizacion?: string | null;
}

export interface CreateTipoInput {
	nombre: string;
	descripcion?: string | null;
}

export interface UpdateTipoInput {
	nombre?: string;
	descripcion?: string | null;
}

export interface CreateTipoFormInput {
	nombre: string;
	descripcion?: string | null;
}

export interface UpdateTipoFormInput {
	nombre?: string;
	descripcion?: string | null;
}

export interface CreateCategoriaTipoInput {
	nombre: string;
	descripcion?: string | null;
}

export interface UpdateCategoriaTipoInput {
	nombre?: string;
	descripcion?: string | null;
}

export interface CreateConfiguracionTipoRolInput {
	cfg_t_id: number;
	rol_mix_id: number;
}

export interface UpdateConfiguracionTipoRolInput {
	cfg_t_id?: number;
	rol_mix_id?: number;
}

export interface TipoMapItem extends Tipo {
	map_id: number;
}

export interface CategoriaTipoItemsResponse {
	categoria_id: number;
	items: TipoMapItem[];
}

export interface CreateCategoriaTipoMapInput {
	categoryData: {
		id?: number;
		nombre?: string;
		descripcion?: string | null;
	};
	itemData: Array<{
		id?: number;
		nombre?: string;
		descripcion?: string | null;
	}>;
}

export interface CreateCategoriaTipoMapResponse {
	category: CategoriaTipo;
	mappings: Array<{
		id: number;
		categoria_id: number;
		tipo_id: number;
		fecha_creacion?: string | null;
		fecha_actualizacion?: string | null;
	}>;
}

// ========================
// SERVICES
// ========================

class TipoService extends BaseService<Tipo, CreateTipoInput, UpdateTipoInput> {
	constructor() {
		super('/tipo');
	}

	/**
	 * Obtener configuración asociada (aspectos y escalas) por cfg_t
	 * GET /cfg/t/{id}/a-e
	 */
	async getConfiguracion(id: number): Promise<ApiResponse<any>> {
		return this.executeAsync(
			() => httpClient.get(`/cfg/t/${id}/a-e`),
			{ configuracion: null, aspectos: [], valoraciones: [] }
		);
	}

	/**
	 * Actualizar campo booleano (ej: es_activo, es_evaluacion)
	 * PUT /tipo/{id} con campo específico
	 */
	async updateBooleanField(id: number, field: string, value: number | boolean): Promise<ApiResponse<Tipo>> {
		return super.updateBooleanField(id, field, value);
	}
}

class CategoriaTipoService extends BaseService<
	CategoriaTipo,
	CreateCategoriaTipoInput,
	UpdateCategoriaTipoInput
> {
	constructor() {
		super('/cat/t');
	}

	/**
	 * Obtener tipos asociados a una categoría
	 * GET /cat/t/{id}/tipos
	 */
	async getTiposByCategoria(categoriaId: number): Promise<ApiResponse<CategoriaTipoItemsResponse>> {
		return this.executeAsync(
			() => httpClient.get<CategoriaTipoItemsResponse>(`/cat/t/${categoriaId}/tipos`),
			{ categoria_id: categoriaId, items: [] }
		);
	}
}

class ConfiguracionTipoRolService extends BaseService<
	ConfiguracionTipoRol,
	CreateConfiguracionTipoRolInput,
	UpdateConfiguracionTipoRolInput
> {
	constructor() {
		super('/cfg/t/rol');
	}
}

class TipoFormService extends BaseService<TipoForm, CreateTipoFormInput, UpdateTipoFormInput> {
	constructor() {
		super('/tipo/form');
	}
}

class CategoriaTipoMapService {
	/**
	 * Listar tipos asociados a una categoría
	 * GET /cat/t/{id}/tipos
	 */
	async listTiposByCategoria(
		categoriaId: number
	): Promise<ApiResponse<CategoriaTipoItemsResponse>> {
		try {
			const response = await httpClient.get<CategoriaTipoItemsResponse>(`/cat/t/${categoriaId}/tipos`);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { categoria_id: categoriaId, items: [] }, error };
		}
	}

	/**
	 * Crear categoría con tipos asociados (o asociar tipos existentes)
	 * POST /cat/t/tipos
	 */
	async createCategoriaMap(
		payload: CreateCategoriaTipoMapInput
	): Promise<ApiResponse<CreateCategoriaTipoMapResponse>> {
		try {
			const response = await httpClient.post<CreateCategoriaTipoMapResponse>('/cat/t/tipos', payload);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { category: {} as CategoriaTipo, mappings: [] }, error };
		}
	}

	/**
	 * Eliminar asociación de tipo en una categoría
	 * DELETE /cat/t/{id}/tipos/{itemId}
	 */
	async removeTipoFromCategoria(
		categoriaId: number,
		tipoId: number
	): Promise<ApiResponse<{ deleted: number }>> {
		try {
			const response = await httpClient.delete<{ deleted: number }>(`/cat/t/${categoriaId}/tipos/${tipoId}`);
			return { success: true, data: response };
		} catch (error: any) {
			return { success: false, data: { deleted: 0 }, error };
		}
	}
}

export const tipoService = new TipoService();
export const tiposEvaluacionService = tipoService;
export const categoriaTipoService = new CategoriaTipoService();
export const configuracionTipoRolService = new ConfiguracionTipoRolService();
export const categoriaTipoMapService = new CategoriaTipoMapService();
export const tipoFormService = new TipoFormService();
