/**
 * Servicio para Roles, Usuarios-Roles, Programas y Usuarios-Programas
 * Acceso a endpoints /rol, /user/rol, /prog, /user/prog
 */

import { BaseService } from '../../core/BaseService';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../../types/api.types';

// ========================
// TYPES
// ========================

export interface Rol {
  id: number;
  nombre: string;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface UserRol {
  id: number;
  user_id: number;
  rol_id: number;
  rol_nombre?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface DataloginInfo {
  user_name: string;
  user_username: string;
  user_email: string;
  user_idrole: number;
  user_statusid: string;
  role_name: string;
}

export interface UserRolWithDatalogin extends UserRol {
  datalogin: DataloginInfo;
}

export interface Prog {
  id: number;
  nombre: string;
}

export interface UserProg {
  id: number;
  user_rol_id: number;
  prog_id: number;
  prog_nombre?: string;
  datalogin?: DataloginInfo;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface UserProgWithDatalogin extends UserProg {
  datalogin: DataloginInfo;
}

export interface CreateRolInput {
  nombre: string;
}

export interface UpdateRolInput {
  nombre?: string;
}

export interface CreateUserRolInput {
  user_id: number;
  rol_id: number;
}

export interface UpdateUserRolInput {
  user_id?: number;
  rol_id?: number;
}

export interface CreateProgInput {
  nombre: string;
}

export interface UpdateProgInput {
  nombre?: string;
}

export interface CreateUserProgInput {
  user_rol_id: number;
  prog_id: number;
}

export interface UpdateUserProgInput {
  user_rol_id?: number;
  prog_id?: number;
}

// ========================
// SERVICES
// ========================

class RolService extends BaseService<Rol, CreateRolInput, UpdateRolInput> {
  constructor() {
    super('/rol');
  }
}

class UserRolService extends BaseService<UserRol, CreateUserRolInput, UpdateUserRolInput> {
  constructor() {
    super('/user/rol');
  }

  /**
   * Obtiene todos los roles de usuario con información de datalogin
   * Endpoint: GET /user/rol/u
   */
  async getUserRoles(): Promise<ApiResponse<UserRolWithDatalogin[]>> {
    return this.getCustom('/u');
  }
}

class ProgService extends BaseService<Prog, CreateProgInput, UpdateProgInput> {
  constructor() {
    super('/prog');
  }
}

class UserProgService extends BaseService<UserProg, CreateUserProgInput, UpdateUserProgInput> {
  constructor() {
    super('/user/prog');
  }

  /**
   * Obtiene todos los programas de usuario con información de datalogin
   * Endpoint: GET /user/prog/u
   */
  async getUserProgs(): Promise<ApiResponse<UserProgWithDatalogin[]>> {
    return this.getCustom('/u');
  }
}

export const rolService = new RolService();
export const userRolService = new UserRolService();
export const progService = new ProgService();
export const userProgService = new UserProgService();
