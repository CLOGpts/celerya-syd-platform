// MCP Universal Types - Zero vendor lock-in architecture
export interface ConnectionConfig {
  type: 'sap' | 'oracle' | 'pmi' | 'local' | 'email' | 'whatsapp';
  endpoint?: string;
  credentials?: Record<string, unknown>;
  watchPath?: string;
  security: SecurityConfig;
}

export interface SecurityConfig {
  encryption: boolean;
  authMethod: 'oauth' | 'api-key' | 'certificate' | 'none';
  rateLimiting: { requests: number; window: number };
}

export interface DataPacket {
  id: string;
  source: string;
  payload: unknown;
  metadata: Record<string, unknown>;
  timestamp: number;
  integrity: string; // Hash for data integrity
}

export interface ConnectorStatus {
  connected: boolean;
  lastPing: number;
  errorCount: number;
  throughput: { sent: number; received: number };
}