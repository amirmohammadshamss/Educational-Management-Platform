/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * This file provides utilities for managing permissions and access control
 * based on user roles in the Educational Management Platform.
 */

import { Role } from '@prisma/client';
import type { Session } from 'next-auth';

/**
 * Permission Actions
 * Define all possible actions in the system
 */
export enum Permission {
  // User Management
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  MANAGE_USERS = 'manage:users',

  // Student Management
  CREATE_STUDENT = 'create:student',
  READ_STUDENT = 'read:student',
  UPDATE_STUDENT = 'update:student',
  DELETE_STUDENT = 'delete:student',
  ASSIGN_STUDENT = 'assign:student',

  // Teacher Management
  CREATE_TEACHER = 'create:teacher',
  READ_TEACHER = 'read:teacher',
  UPDATE_TEACHER = 'update:teacher',
  DELETE_TEACHER = 'delete:teacher',

  // Booking Management
  CREATE_BOOKING = 'create:booking',
  READ_BOOKING = 'read:booking',
  UPDATE_BOOKING = 'update:booking',
  DELETE_BOOKING = 'delete:booking',
  READ_ALL_BOOKINGS = 'read:all_bookings',

  // Homework Management
  CREATE_HOMEWORK = 'create:homework',
  READ_HOMEWORK = 'read:homework',
  UPDATE_HOMEWORK = 'update:homework',
  DELETE_HOMEWORK = 'delete:homework',
  REVIEW_HOMEWORK = 'review:homework',
  READ_ALL_HOMEWORK = 'read:all_homework',

  // Reports
  GENERATE_REPORTS = 'generate:reports',
  EXPORT_REPORTS = 'export:reports',

  // System Configuration
  MANAGE_SYSTEM = 'manage:system',
  VIEW_SYNC_LOGS = 'view:sync_logs',
}

/**
 * Role Permissions Map
 * Define which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // Super Admin has all permissions
    ...Object.values(Permission),
  ],

  [Role.ADMIN]: [
    // User Management (all except system management)
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.MANAGE_USERS,

    // Student Management (all)
    Permission.CREATE_STUDENT,
    Permission.READ_STUDENT,
    Permission.UPDATE_STUDENT,
    Permission.DELETE_STUDENT,
    Permission.ASSIGN_STUDENT,

    // Teacher Management (all)
    Permission.CREATE_TEACHER,
    Permission.READ_TEACHER,
    Permission.UPDATE_TEACHER,
    Permission.DELETE_TEACHER,

    // Booking Management (all)
    Permission.CREATE_BOOKING,
    Permission.READ_BOOKING,
    Permission.UPDATE_BOOKING,
    Permission.DELETE_BOOKING,
    Permission.READ_ALL_BOOKINGS,

    // Homework Management (all)
    Permission.CREATE_HOMEWORK,
    Permission.READ_HOMEWORK,
    Permission.UPDATE_HOMEWORK,
    Permission.DELETE_HOMEWORK,
    Permission.REVIEW_HOMEWORK,
    Permission.READ_ALL_HOMEWORK,

    // Reports
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_REPORTS,

    // System
    Permission.VIEW_SYNC_LOGS,
  ],

  [Role.TEACHER]: [
    // Student Management (read only, assign)
    Permission.READ_STUDENT,
    Permission.ASSIGN_STUDENT,

    // Booking Management (read own)
    Permission.READ_BOOKING,

    // Homework Management (manage own students)
    Permission.CREATE_HOMEWORK,
    Permission.READ_HOMEWORK,
    Permission.UPDATE_HOMEWORK,
    Permission.REVIEW_HOMEWORK,
  ],

  [Role.STUDENT]: [
    // Student Management (read own)
    Permission.READ_STUDENT,

    // Booking Management (read own)
    Permission.READ_BOOKING,

    // Homework Management (submit and read own)
    Permission.CREATE_HOMEWORK,
    Permission.READ_HOMEWORK,
  ],
};

/**
 * Role Hierarchy
 * Higher number = higher privilege level
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 4,
  [Role.ADMIN]: 3,
  [Role.TEACHER]: 2,
  [Role.STUDENT]: 1,
};

/**
 * Check if a user has a specific permission
 *
 * @param role - User's role
 * @param permission - Permission to check
 * @returns True if user has the permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 *
 * @param role - User's role
 * @param permissions - Array of permissions to check
 * @returns True if user has at least one permission
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a user has all of the specified permissions
 *
 * @param role - User's role
 * @param permissions - Array of permissions to check
 * @returns True if user has all permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has higher or equal privilege level than another role
 *
 * @param role - Role to check
 * @param targetRole - Role to compare against
 * @returns True if role has higher or equal privilege
 */
export function hasHigherOrEqualRole(role: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Check if a role has higher privilege level than another role
 *
 * @param role - Role to check
 * @param targetRole - Role to compare against
 * @returns True if role has higher privilege
 */
export function hasHigherRole(role: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[targetRole];
}

/**
 * Check if a user has one of the required roles
 *
 * @param role - User's role
 * @param requiredRoles - Array of required roles
 * @returns True if user has one of the required roles
 */
export function hasRequiredRole(role: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(role);
}

/**
 * Check if a user can access a specific resource
 * This function can be extended with more complex logic based on resource ownership
 *
 * @param session - User session
 * @param permission - Required permission
 * @param resourceOwnerId - Optional owner ID of the resource
 * @returns True if user can access the resource
 */
export function canAccessResource(
  session: Session | null,
  permission: Permission,
  resourceOwnerId?: string
): boolean {
  if (!session?.user) {
    return false;
  }

  const { role, id } = session.user;

  // Check if user has the required permission
  if (!hasPermission(role, permission)) {
    return false;
  }

  // If no resource owner specified, user has permission
  if (!resourceOwnerId) {
    return true;
  }

  // Super Admin and Admin can access all resources
  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) {
    return true;
  }

  // For other roles, check if they own the resource
  return id === resourceOwnerId;
}

/**
 * Check if a user can manage another user
 * Users can only manage users with lower privilege levels
 *
 * @param managerRole - Role of the manager
 * @param targetRole - Role of the user to be managed
 * @returns True if manager can manage the target user
 */
export function canManageUser(managerRole: Role, targetRole: Role): boolean {
  // Super Admin can manage anyone
  if (managerRole === Role.SUPER_ADMIN) {
    return true;
  }

  // Admin can manage everyone except Super Admin
  if (managerRole === Role.ADMIN && targetRole !== Role.SUPER_ADMIN) {
    return true;
  }

  return false;
}

/**
 * Get all permissions for a role
 *
 * @param role - User's role
 * @returns Array of permissions
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if user is admin (ADMIN or SUPER_ADMIN)
 *
 * @param role - User's role
 * @returns True if user is admin
 */
export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

/**
 * Check if user is super admin
 *
 * @param role - User's role
 * @returns True if user is super admin
 */
export function isSuperAdmin(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

/**
 * Check if user is teacher
 *
 * @param role - User's role
 * @returns True if user is teacher
 */
export function isTeacher(role: Role): boolean {
  return role === Role.TEACHER;
}

/**
 * Check if user is student
 *
 * @param role - User's role
 * @returns True if user is student
 */
export function isStudent(role: Role): boolean {
  return role === Role.STUDENT;
}
