/**
 * Servicio para generación de evaluaciones
 * Acceso a endpoint /eval/generar según Swagger especificado
 */

import { httpClient } from '../../core/HttpClient';
import type { ApiResponse } from '../../types/api.types';

// ========================
// TYPES
// ========================

export interface EvalGenerarInput {
	configId: number;
}

export interface EvalGeneradaItem {
	id_configuracion: number;
	estudiante: string | null;
	docente: string | null;
	codigo_materia: string | null;
	nombre_docente?: string | null;
	nombre_materia?: string | null;
}

// ========================
// SERVICE
// ========================

class EvalService {
	/**
	 * Generar evaluaciones/encuestas por configuración
	 * POST /eval/generar
	 */
	async generar(configId: number): Promise<ApiResponse<EvalGeneradaItem[]>> {
		try {
			const response = await httpClient.post<EvalGeneradaItem[]>('/eval/generar', { configId });
			return {
				success: true,
				data: response,
			};
		} catch (error: any) {
			return {
				success: false,
				data: [],
				error,
			};
		}
	}
}

export const evalService = new EvalService();
