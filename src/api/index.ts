/**
 * Index principal - Exporta toda la API de forma centralizada
 */

// ========================
// CORE
// ========================
export { HttpClient, httpClient } from './core/HttpClient';
export { apiConfig, endpoints, getAuthHeader, updateApiConfig } from './core/apiConfig';

// ========================
// UTILITIES (MEJORAS PROFESIONALES)
// ========================
export { logger, LogLevel, tokenManager, rateLimiter } from './utils';

// ========================
// TYPES
// ========================
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
  FilterParams,
  QueryParams,
  CrudService,
  ApiError,
  ValidationError,
  BaseEntity,
  Evaluacion,
  Profesor,
  Asignatura,
  Estudiante,
  Role,
  BulkCreateDTO,
  BulkUpdateDTO,
  BulkDeleteDTO,
  BulkOperationResult,
} from './types/api.types';

// ========================
// FACTORY
// ========================
export {
  createCrudService,
  extendService,
  createAdvancedService,
} from './services/factory';
export type {
  CrudServiceConfig,
  ServiceExtensions,
  AdvancedServiceConfig,
} from './services/factory';

// ========================
// SERVICES (AUTH)
// ========================
export { authService } from './services/auth/auth.service';
export type { LoginRequest, LoginResponse, AuthResponse, UserProfile, AuthUserLookup } from './services/auth/auth.service';

export { rolService } from './services/auth/rol.service';
export type { 
  Rol, 
  CreateRolInput, 
  UpdateRolInput,
  RolMixto,
} from './services/auth/rol.service';

// ========================
// SERVICES (GENERATED)
// ========================
// Servicios generados - Descomenta cuando estén disponibles
// export { evaluacionService } from './services/generated/evaluacion.service';
// export { profesorService } from './services/generated/profesor.service';
// export { asignaturaService } from './services/generated/asignatura.service';
// export { estudianteService } from './services/generated/estudiante.service';

// export type { CreateEvaluacionDTO, UpdateEvaluacionDTO } from './services/generated/evaluacion.service';
// export type { CreateProfesorDTO, UpdateProfesorDTO } from './services/generated/profesor.service';
// export type { CreateAsignaturaDTO, UpdateAsignaturaDTO } from './services/generated/asignatura.service';
// export type { CreateEstudianteDTO, UpdateEstudianteDTO } from './services/generated/estudiante.service';

// ========================
// SERVICES (CUSTOM)
// ========================
export { configuracionEvaluacionService } from './services/app/cfg-t.service';
export type { 
  ConfiguracionTipo,
  AspectoConEscalas,
  AspectoEscalaOpcion,
  ConfiguracionAspectosEscalasResponse,
  CfgAItem,
  CfgEItem,
  ConfiguracionCfgACfgEResponse,
  EvalByUserItem,
} from './services/app/cfg-t.service';

export { evalService } from './services/app/eval.service';
export type { EvalGenerarInput, EvalGeneradaItem } from './services/app/eval.service';

export {
  tipoService,
  tiposEvaluacionService,
  categoriaTipoService,
  configuracionTipoRolService,
  categoriaTipoMapService,
  tipoFormService,
} from './services/app/t-a-e/tipo.service';
export type {
  Tipo,
  TipoForm,
  CategoriaTipo,
  ConfiguracionTipoRol,
  TipoMapItem,
  CategoriaTipoItemsResponse,
  CreateCategoriaTipoMapInput,
  CreateCategoriaTipoMapResponse,
  CreateTipoFormInput,
  UpdateTipoFormInput,
} from './services/app/t-a-e/tipo.service';

export {
  aspectoService,
  aspectosEvaluacionService,
  categoriaAspectoService,
  configuracionAspectoService,
  categoriaAspectoMapService,
} from './services/app/t-a-e/aspecto.service';
export type {
  Aspecto,
  CategoriaAspecto,
  ConfiguracionAspecto,
  AspectoMapItem,
  CategoriaAspectoItemsResponse,
  CreateCategoriaAspectoMapInput,
  CreateCategoriaAspectoMapResponse,
  CfgABulkInput,
  CfgABulkItem,
} from './services/app/t-a-e/aspecto.service';

export {
  escalaService,
  escalasValoracionService,
  categoriaEscalaService,
  configuracionValoracionService,
  categoriaEscalaMapService,
} from './services/app/t-a-e/escala.service';
export type {
  Escala,
  CategoriaEscala,
  ConfiguracionEscala,
  EscalaMapItem,
  CategoriaEscalaItemsResponse,
  CreateCategoriaEscalaMapInput,
  CreateCategoriaEscalaMapResponse,
  CfgEBulkInput,
  CfgEBulkItem,
} from './services/app/t-a-e/escala.service';

export { aEService } from './services/app/a-e.service';
export type {
  AspectoEscala,
  AspectoBulkItem,
  EscalaBulkItem,
  AspectoEscalaBulkItem,
  AspectoEscalaBulkInput,
  AspectoEscalaBulkResponse,
  UpdateAspectoEscalaInput,
  UpdateAspectoIdInput,
} from './services/app/a-e.service';

export { cfgTRolService } from './services/app/cfg-t-rol.service';
export type {
  CfgTRol,
  RolAsignado,
  CreateCfgTRolInput,
  UpdateCfgTRolInput,
} from './services/app/cfg-t-rol.service';

export {
  userRolService,
  progService,
  userProgService,
} from './services/app/rol.service';
export type {
  UserRol,
  UserRolWithDatalogin,
  Prog,
  UserProg,
  UserProgWithDatalogin,
  DataloginInfo,
  CreateUserRolInput,
  UpdateUserRolInput,
  CreateProgInput,
  UpdateProgInput,
  CreateUserProgInput,
  UpdateUserProgInput,
} from './services/app/rol.service';

// Servicios customizados - Descomenta cuando estén disponibles
// export { evaluacionesService } from './services/evaluaciones.service';
// export type { EvaluacionInsitu, EvaluacionCreada, BulkEvaluacionesResponse } from './services/evaluaciones.service';

// export { evaluacionesGenericasService } from './services/evaluaciones-genericas.service';
// export type { EvaluacionGenerica } from './services/evaluaciones-genericas.service';

// export { vistaAcademicaService } from './services/vista-academica.service';
// export type {
//   FilterResponse,
//   AllFiltersResponse,
// } from './services/vista-academica.service';

export { filterService } from './services/filter/filter.service';
export { metricService } from './services/metric/metric.service';

// ========================
// HOOKS
// ========================
export {
  useApi,
  useMutation,
  usePagination,
  useQueryParams,
  useDebounce,
} from './hooks/useApi';

export type {
  UseApiOptions,
  UseApiResult,
  UseMutationOptions,
  UseMutationResult,
  UsePaginationOptions,
  UsePaginationResult,
  UseQueryParamsResult,
} from './hooks/useApi';

// ========================
// UTILS
// ========================
export {
  buildQueryParams,
  parseQueryParams,
  mergeQueryParams,
  formatDateForApi,
  parseDateFromApi,
  formatDateRange,
  omit,
  pick,
  cleanObject,
  isValidEmail,
  isValidPhone,
  isValidCedula,
  calculateOffset,
  calculateTotalPages,
  getItemRange,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  isValidationError,
  setStorage,
  getStorage,
  removeStorage,
  debounce,
  throttle,
  groupBy,
  sortBy,
  unique,
} from './utils/helpers';
