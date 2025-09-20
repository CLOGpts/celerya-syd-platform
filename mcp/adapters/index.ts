// MCP Adapters - Extensible connector implementations
export * from './SAPAdapter';
export * from './OracleAdapter';
export * from './PMIAdapter';
export * from './LocalFileAdapter';
export * from './EmailAdapter';

import { ConnectionConfig } from '../types';

/**
 * Adapter Factory - Zero vendor lock-in principle
 * Dynamic adapter loading based on configuration
 */
export class AdapterFactory {
  static async create(config: ConnectionConfig) {
    switch (config.type) {
      case 'sap':
        const { SAPAdapter } = await import('./SAPAdapter');
        return new SAPAdapter(config);
      case 'oracle':
        const { OracleAdapter } = await import('./OracleAdapter');
        return new OracleAdapter(config);
      case 'pmi':
        const { PMIAdapter } = await import('./PMIAdapter');
        return new PMIAdapter(config);
      case 'local':
        const { LocalFileAdapter } = await import('./LocalFileAdapter');
        return new LocalFileAdapter(config);
      default:
        throw new Error(`Unsupported adapter type: ${config.type}`);
    }
  }
}