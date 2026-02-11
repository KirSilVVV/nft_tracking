import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import { Transaction } from '../models/transaction.model';
import { Holder } from '../models/holder.model';
import { EnrichedWhale } from '../models/enrichment.model';
import { logger } from '../utils/logger';

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server, port?: number) {
    // Use the same HTTP server for WebSocket (required for Render free tier - only one port allowed)
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connected to NFT Analytics server',
          timestamp: new Date(),
        })
      );

      // Handle messages from client
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleClientMessage(ws, message);
        } catch (error) {
          logger.error('Error handling WebSocket message', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        logger.info('Client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', error);
      });
    });

    logger.info(`WebSocket server listening on port ${port}`);
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    const { type, data } = message;

    switch (type) {
      case 'subscribe':
        logger.debug(`Client subscribed to: ${data.channel}`);
        break;
      case 'unsubscribe':
        logger.debug(`Client unsubscribed from: ${data.channel}`);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        logger.debug(`Unknown message type: ${type}`);
    }
  }

  /**
   * Broadcast new transfer event to all connected clients
   */
  broadcastTransfer(transaction: Transaction): void {
    const message = JSON.stringify({
      type: 'new_transfer',
      data: {
        txHash: transaction.txHash,
        from: transaction.from,
        to: transaction.to,
        tokenId: transaction.tokenId,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.timestamp,
        transactionType: transaction.type,
      },
      timestamp: new Date(),
    });

    this.broadcastMessage(message);
  }

  /**
   * Broadcast whale activity alert
   */
  broadcastWhaleAlert(whaleAddress: string, action: 'buy' | 'sell', tokenIds: number[], totalNFTs: number): void {
    const message = JSON.stringify({
      type: 'whale_alert',
      data: {
        whaleAddress,
        action,
        tokenIds,
        totalNFTs,
        timestamp: new Date(),
      },
    });

    this.broadcastMessage(message);
  }

  /**
   * Broadcast large transaction alert
   */
  broadcastLargeSale(transaction: Transaction, priceETH: number): void {
    const message = JSON.stringify({
      type: 'large_sale',
      data: {
        tokenId: transaction.tokenId,
        priceETH,
        from: transaction.from,
        to: transaction.to,
        txHash: transaction.txHash,
        timestamp: transaction.timestamp,
      },
    });

    this.broadcastMessage(message);
  }

  /**
   * Broadcast metric update
   */
  broadcastMetricUpdate(period: string, metrics: any): void {
    const message = JSON.stringify({
      type: 'metrics_update',
      data: {
        period,
        metrics,
        timestamp: new Date(),
      },
    });

    this.broadcastMessage(message);
  }

  /**
   * Broadcast top holders update
   */
  broadcastTopHoldersUpdate(topHolders: Holder[]): void {
    const message = JSON.stringify({
      type: 'top_holders_update',
      data: {
        topHolders: topHolders.slice(0, 20),
        timestamp: new Date(),
      },
    });

    this.broadcastMessage(message);
  }

  /**
   * Broadcast enriched whales update
   */
  broadcastEnrichedWhalesUpdate(enrichedWhales: EnrichedWhale[]): void {
    const message = JSON.stringify({
      type: 'enriched_whales_update',
      data: {
        whales: enrichedWhales.slice(0, 20),
        timestamp: new Date(),
      },
    });

    this.broadcastMessage(message);
  }

  /**
   * Broadcast statistics update
   */
  broadcastStatsUpdate(stats: any): void {
    const message = JSON.stringify({
      type: 'stats_update',
      data: {
        stats,
        timestamp: new Date(),
      },
    });

    this.broadcastMessage(message);
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Generic broadcast method for any message type (public API)
   */
  broadcast(message: any): void {
    const jsonMessage = typeof message === 'string' ? message : JSON.stringify(message);
    this.broadcastMessage(jsonMessage);
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastMessage(message: string): void {
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      logger.debug(`Message sent to ${sentCount} clients`);
    }
  }

  /**
   * Close all connections
   */
  close(): void {
    this.clients.forEach((client) => {
      client.close();
    });
    this.wss.close();
    logger.info('WebSocket server closed');
  }
}

// Singleton instance
let wsInstance: WebSocketManager | null = null;

/**
 * Get the WebSocket service instance
 */
export function getWebSocketService(): WebSocketManager {
  if (!wsInstance) {
    throw new Error('WebSocketManager not initialized. Call setWebSocketService() first.');
  }
  return wsInstance;
}

/**
 * Set the WebSocket service instance (called during app initialization)
 */
export function setWebSocketService(instance: WebSocketManager): void {
  wsInstance = instance;
}
