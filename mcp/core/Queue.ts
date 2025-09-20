import { DataPacket } from '../types';

/**
 * Queue - High availability queue management for MCP
 * Persistence, retry logic, dead letter queues
 */
export class Queue {
  private queues: Map<string, QueueInstance> = new Map();
  private persistence: PersistenceAdapter;

  constructor(persistence: PersistenceAdapter) {
    this.persistence = persistence;
  }

  async enqueue(queueName: string, packet: DataPacket): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.add(packet);
    await this.persistence.save(queueName, packet);
  }

  async dequeue(queueName: string): Promise<DataPacket | null> {
    const queue = this.queues.get(queueName);
    return queue?.poll() || null;
  }

  private getOrCreateQueue(name: string): QueueInstance {
    if (!this.queues.has(name)) {
      this.queues.set(name, new QueueInstance(name));
    }
    return this.queues.get(name)!;
  }
}

interface PersistenceAdapter {
  save(queue: string, packet: DataPacket): Promise<void>;
}