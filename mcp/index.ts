// MCP Core Entry Point - L'ARCHITETTO Implementation
export { UniversalConnector } from './core/UniversalConnector';
export { MCPSecurityCore } from './MCPSecurityCore';
export { Router } from './core/Router';
export { Queue } from './core/Queue';
export { RetrySystem } from './resilience/RetrySystem';
export { HealthCheck } from './monitoring/HealthCheck';

// Types
export type {
  ConnectionConfig,
  SecurityConfig,
  DataPacket,
  ConnectorStatus
} from './types/index';

// Security Adapters
export { Auth } from './security/Auth';
export { Encryption } from './security/Encryption';

// Universal Adapters
export * from './adapters/index';