/**
 * RBAC Type Definitions
 *
 * Comprehensive TypeScript types for Role-Based Access Control
 * across the Educational Management Platform.
 */

import { Role } from '@prisma/client';
import { Permission } from '@/lib/rbac';

/**
 * Resource Types
 * Define all resource types that can be protected
 */
export enum ResourceType {
  USER = 'user',
  STUDENT = 'student',
  TEACHER = 'teacher',
  BOOKING = 'booking',
  HOMEWORK = 'homework',
  REPORT = 'report',
  SYNC_LOG = 'sync_log',
  SYSTEM = 'system',
}

/**
 * Access Control Entry
 * Represents a permission check result with metadata
 */
export interface AccessControlEntry {
  /** Whether access is granted */
  granted: boolean;
  /** The permission that was checked */
  permission: Permission;
  /** The user's role */
  role: Role;
  /** Optional reason for denial */
  reason?: string;
  /** Optional resource information */
  resource?: {
    type: ResourceType;
    id?: string;
    ownerId?: string;
  };
}

/**
 * Permission Check Options
 */
export interface PermissionCheckOptions {
  /** User's role */
  role: Role;
  /** Required permission */
  permission: Permission;
  /** Optional resource type */
  resourceType?: ResourceType;
  /** Optional resource ID */
  resourceId?: string;
  /** Optional resource owner ID */
  resourceOwnerId?: string;
}

/**
 * Role Comparison Result
 */
export interface RoleComparisonResult {
  /** The role being compared */
  role: Role;
  /** The target role for comparison */
  targetRole: Role;
  /** Whether role has higher privilege */
  isHigher: boolean;
  /** Whether role has equal privilege */
  isEqual: boolean;
  /** Whether role has higher or equal privilege */
  isHigherOrEqual: boolean;
  /** Privilege level difference */
  levelDifference: number;
}

/**
 * Authorization Context
 * Contains all information needed for authorization decisions
 */
export interface AuthorizationContext {
  /** User ID */
  userId: string;
  /** User's role */
  role: Role;
  /** Whether user is active */
  isActive: boolean;
  /** User's teacher ID (if applicable) */
  teacherId?: string;
  /** User's student ID (if applicable) */
  studentId?: string;
  /** Timestamp of context creation */
  timestamp: Date;
}

/**
 * Permission Set
 * A collection of permissions for easy checking
 */
export type PermissionSet = Set<Permission>;

/**
 * Role Permission Map
 * Maps roles to their permission sets
 */
export type RolePermissionMap = Record<Role, PermissionSet>;

/**
 * Access Decision
 * Result of an access control decision
 */
export interface AccessDecision {
  /** Whether access is allowed */
  allowed: boolean;
  /** Reason for the decision */
  reason: string;
  /** Permissions that were checked */
  checkedPermissions: Permission[];
  /** Timestamp of decision */
  timestamp: Date;
}

/**
 * Resource Access Request
 * Represents a request to access a resource
 */
export interface ResourceAccessRequest {
  /** User making the request */
  userId: string;
  /** User's role */
  userRole: Role;
  /** Type of resource being accessed */
  resourceType: ResourceType;
  /** ID of the resource */
  resourceId?: string;
  /** Owner of the resource */
  resourceOwnerId?: string;
  /** Required permission for access */
  requiredPermission: Permission;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Role Assignment
 * Represents a role assignment to a user
 */
export interface RoleAssignment {
  /** User ID */
  userId: string;
  /** Assigned role */
  role: Role;
  /** Who assigned the role */
  assignedBy: string;
  /** When role was assigned */
  assignedAt: Date;
  /** Optional expiration date */
  expiresAt?: Date;
  /** Whether assignment is active */
  isActive: boolean;
}

/**
 * Permission Guard Props
 * Props for components that guard content based on permissions
 */
export interface PermissionGuardProps {
  /** Required permission */
  permission: Permission;
  /** Optional resource owner ID */
  resourceOwnerId?: string;
  /** Content to show if permission granted */
  children: React.ReactNode;
  /** Fallback content if permission denied */
  fallback?: React.ReactNode;
}

/**
 * Role Guard Options
 * Options for role-based guards
 */
export interface RoleGuardOptions {
  /** Required roles */
  requiredRoles: Role[];
  /** Whether to require all roles or just one */
  requireAll?: boolean;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Redirect URL if unauthorized */
  redirectUrl?: string;
}

/**
 * Authorization Error
 * Custom error for authorization failures
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly role: Role,
    public readonly requiredPermission?: Permission,
    public readonly resourceType?: ResourceType
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Audit Log Entry
 * Records access attempts for audit purposes
 */
export interface AuditLogEntry {
  /** Unique ID for the log entry */
  id: string;
  /** Timestamp of the access attempt */
  timestamp: Date;
  /** User who attempted access */
  userId: string;
  /** User's role at time of attempt */
  userRole: Role;
  /** Type of resource accessed */
  resourceType: ResourceType;
  /** ID of resource accessed */
  resourceId?: string;
  /** Permission that was checked */
  permission: Permission;
  /** Whether access was granted */
  granted: boolean;
  /** IP address of request */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Type guard to check if a value is a valid Role
 */
export function isRole(value: unknown): value is Role {
  return (
    typeof value === 'string' &&
    Object.values(Role).includes(value as Role)
  );
}

/**
 * Type guard to check if a value is a valid Permission
 */
export function isPermission(value: unknown): value is Permission {
  return (
    typeof value === 'string' &&
    Object.values(Permission).includes(value as Permission)
  );
}

/**
 * Type guard to check if a value is a valid ResourceType
 */
export function isResourceType(value: unknown): value is ResourceType {
  return (
    typeof value === 'string' &&
    Object.values(ResourceType).includes(value as ResourceType)
  );
}
