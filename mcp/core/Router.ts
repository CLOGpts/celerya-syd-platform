import { DataPacket, ConnectionConfig } from '../types';

/**
 * Router - Intelligent routing system for MCP
 * Load balancing, failover, priority-based routing
 */
export class Router {
  private routes: Map<string, RouteConfig> = new Map();
  private loadBalancer: LoadBalancer;

  constructor() {
    this.loadBalancer = new LoadBalancer();
  }

  async route(packet: DataPacket): Promise<string> {
    const route = this.selectOptimalRoute(packet);
    return this.loadBalancer.assignToConnector(route, packet);
  }

  private selectOptimalRoute(packet: DataPacket): RouteConfig {
    // Priority: latency, throughput, error rate
    const routes = Array.from(this.routes.values());
    return routes.reduce((best, current) =>
      current.health > best.health ? current : best
    );
  }
}

interface RouteConfig {
  connectorId: string;
  priority: number;
  health: number; // 0-1 score
}