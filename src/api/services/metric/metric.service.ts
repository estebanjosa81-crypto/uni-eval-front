/**
 * Servicio de Métricas para Evaluaciones
 * Proporciona endpoints para análisis de datos de evaluaciones docentes
 */

import { httpClient } from '../../core/HttpClient';

// ========================
// TYPES
// ========================

export interface MetricFilters {
  cfg_t: number;
  sede?: string;
  periodo?: string;
  programa?: string;
  semestre?: string;
  grupo?: string;
}

export interface DocenteMetricFilters extends MetricFilters {
  codigo_materia?: string;
}

// Summary Types
export interface SummaryMetrics {
  generales: {
    total_evaluaciones: number;
    total_realizadas: number;
    total_evaluaciones_registradas: number;
    total_pendientes: number;
    total_estudiantes: number;
    total_estudiantes_registrados: number;
    total_estudiantes_pendientes: number;
    total_docentes: number;
    total_docentes_pendientes: number;
  };
}

export interface ProgramaMetrics {
  total_evaluaciones: number;
  total_evaluaciones_registradas: number;
  total_realizadas: number;
  total_pendientes: number;
  total_estudiantes: number;
  total_estudiantes_registrados: number;
  total_estudiantes_pendientes: number;
  total_docentes: number;
  total_docentes_pendientes: number;
}

export interface GrupoMetrics {
  grupo: string;
  metricas: ProgramaMetrics;
}

export interface ProgramaSummary {
  nombre: string;
  metricas: ProgramaMetrics;
  grupos: GrupoMetrics[];
  selected?: boolean;
}

export interface SummaryByPrograms {
  programas: ProgramaSummary[];
}

// Ranking Types
export interface RankingItem {
  docente: string;
  nombre_docente: string;
  avg: number;
  adjusted: number;
  realizados: number;
  universo: number;
}

export interface RankingResponse {
  ranking: RankingItem[];
}

// Docente Metrics Types
export interface DocenteGeneralMetrics {
  docente: string;
  nombre_docente?: string;
  promedio_general: number | null;
  desviacion_general: number | null;
  total_evaluaciones: number;
  total_realizadas: number;
  total_pendientes: number;
  total_evaluaciones_registradas?: number;
  total_estudiantes_registrados?: number;
  total_aspectos: number;
  porcentaje_cumplimiento: number;
  suma: number;
}

export interface AspectoMetric {
  aspecto_id: number;
  nombre: string | null;
  total_respuestas: number;
  suma: number;
  promedio?: number | null;
  desviacion?: number | null;
}

export interface AspectoGroupMetrics {
  peso: number;
  suma_total: number;
  total_respuestas: number;
  promedio_general: number | null;
  ponderado: number | null;
  desviacion?: number | null;
  aspectos: AspectoMetric[];
}

export interface ResultadoFinalMetrics {
  nota_final_ponderada: number | null;
}

export interface DocenteAspectosMetrics {
  docente: string | string[];
  codigo_materia?: string | null;
  escala_maxima: number;
  evaluacion_estudiantes: AspectoGroupMetrics;
  autoevaluacion_docente: AspectoGroupMetrics;
  resultado_final: ResultadoFinalMetrics;
}

export interface MateriaGrupoMetric {
  grupo: string;
  total_evaluaciones: number;
  total_realizadas: number;
  total_pendientes: number;
  suma: number;
  promedio_general: number | null;
  desviacion_general: number | null;
  total_evaluaciones_registradas: number;
  total_estudiantes_registrados: number;
  total_aspectos: number;
  porcentaje_cumplimiento: number;
  nota_final_ponderada?: number | null;
}

export interface MateriaMetric {
  codigo_materia: string;
  nombre_materia: string;
  nom_programa: string;
  semestre: string;
  total_evaluaciones: number;
  total_realizadas: number;
  total_pendientes: number;
  suma: number;
  promedio_general: number | null;
  desviacion_general: number | null;
  total_evaluaciones_registradas: number;
  total_estudiantes_registrados: number;
  total_aspectos: number;
  porcentaje_cumplimiento: number;
  nota_final_ponderada?: number | null;
  grupo?: string;
  grupos?: MateriaGrupoMetric[];
}

export interface DocenteMateriasMetrics {
  docente: string;
  nombre_docente?: string;
  materias: MateriaMetric[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DocenteListResponse {
  data: DocenteGeneralMetrics[];
  pagination: PaginationInfo;
}

export interface StudentInfo {
  id: string;
  nombre: string;
}

export interface GrupoCompletion {
  grupo: string;
  completados: StudentInfo[];
  pendientes: StudentInfo[];
}

export interface MateriaCompletionMetrics {
  docente: string;
  nombre_docente?: string;
  codigo_materia: string;
  grupos: GrupoCompletion[];
}

// AI Analysis Types
export interface AspectoAnalysis {
  aspecto: string;
  conclusion: string;
}

export interface AIAnalysis {
  conclusion_general: string;
  aspectos: AspectoAnalysis[];
  fortalezas: string[];
  debilidades: string[];
}

export interface CommentsAnalysisResponse {
  docente: string;
  total_respuestas: number;
  analisis: AIAnalysis;
}

// ========================
// SERVICE
// ========================

export const metricService = {
  /**
   * Obtener resumen general de métricas de evaluaciones
   */
  getSummary: async (filters: MetricFilters): Promise<SummaryMetrics> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    return httpClient.get<SummaryMetrics>(`/metric/evaluations/summary?${params.toString()}`);
  },

  /**
   * Obtener métricas agrupadas por programas y grupos
   */
  getSummaryByPrograms: async (filters: MetricFilters): Promise<SummaryByPrograms> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    return httpClient.get<SummaryByPrograms>(`/metric/evaluations/summary/programas?${params.toString()}`);
  },

  /**
   * Obtener listado de docentes con métricas (paginado)
   */
  getDocentes: async (
    filters: MetricFilters & {
      docente?: string;
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<DocenteListResponse> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());

    if (filters.docente) params.append('docente', filters.docente);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return httpClient.get<DocenteListResponse>(`/metric/evaluations/docentes?${params.toString()}`);
  },

  /**
   * Obtener ranking de docentes con ajuste bayesiano
   */
  getRanking: async (filters: MetricFilters): Promise<RankingResponse> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    return httpClient.get<RankingResponse>(`/metric/evaluations/ranking?${params.toString()}`);
  },

  /**
   * Obtener métricas generales de un docente
   */
  getDocenteMetrics: async (docente: string, filters: MetricFilters): Promise<DocenteGeneralMetrics> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    return httpClient.get<DocenteGeneralMetrics>(`/metric/evaluations/docente/${docente}?${params.toString()}`);
  },

  /**
   * Obtener métricas por aspecto de un docente
   * Si se proporciona codigo_materia, filtra solo a esa materia
   */
  getDocenteAspectos: async (
    filters: DocenteMetricFilters & { docente?: string }
  ): Promise<DocenteAspectosMetrics> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.docente) params.append('docente', filters.docente);
    if (filters.codigo_materia) params.append('codigo_materia', filters.codigo_materia);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.grupo) params.append('grupo', filters.grupo);

    return httpClient.get<DocenteAspectosMetrics>(`/metric/evaluations/docentes/aspectos?${params.toString()}`);
  },

  /**
   * Obtener métricas por materia de un docente
   * Si se proporciona codigo_materia, filtra solo esa materia
   */
  getDocenteMaterias: async (docente: string, filters: DocenteMetricFilters): Promise<DocenteMateriasMetrics> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.codigo_materia) params.append('codigo_materia', filters.codigo_materia);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);

    return httpClient.get<DocenteMateriasMetrics>(`/metric/evaluations/docente/${docente}/materias?${params.toString()}`);
  },

  /**
   * Obtener estado de completitud de evaluaciones por materia
   * Lista de estudiantes que completaron vs pendientes, agrupados por GRUPO
   */
  getMateriaCompletion: async (
    docente: string,
    codigoMateria: string,
    filters: MetricFilters
  ): Promise<MateriaCompletionMetrics> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    return httpClient.get<MateriaCompletionMetrics>(
      `/metric/evaluations/docente/${docente}/materias/${codigoMateria}/completion?${params.toString()}`
    );
  },

  /**
   * Analizar comentarios con IA y actualizar conclusiones en la BD
   * Si se especifica codigo_materia, solo analiza esa materia.
   * Si no, analiza TODAS las materias por separado.
   */
  analyzeComments: async (docente: string, filters: DocenteMetricFilters): Promise<CommentsAnalysisResponse> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.codigo_materia) params.append('codigo_materia', filters.codigo_materia);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    return httpClient.get<CommentsAnalysisResponse>(
      `/metric/evaluations/docente/${docente}/comments/analysis?${params.toString()}`
    );
  },

  /**
   * Generar y descargar reporte DOCX del docente
   * Retorna un Blob que se puede usar para descargar el archivo
   */
  downloadDocenteReport: async (docente: string, filters: DocenteMetricFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('cfg_t', filters.cfg_t.toString());
    
    if (filters.codigo_materia) params.append('codigo_materia', filters.codigo_materia);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.programa) params.append('programa', filters.programa);
    if (filters.semestre) params.append('semestre', filters.semestre);
    if (filters.grupo) params.append('grupo', filters.grupo);

    const response = await fetch(
      `${httpClient['baseURL']}/metric/evaluations/docente/${docente}/report.docx?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': httpClient['defaultHeaders']['Authorization'] || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error al generar reporte: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Helper: Descargar reporte DOCX automáticamente
   */
  downloadDocenteReportToFile: async (
    docente: string,
    filters: DocenteMetricFilters,
    filename?: string
  ): Promise<void> => {
    const blob = await metricService.downloadDocenteReport(docente, filters);
    
    // Crear elemento <a> temporal para descargar
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `reporte_docente_${docente}_${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// ========================
// EXPORTS
// ========================

export default metricService;
