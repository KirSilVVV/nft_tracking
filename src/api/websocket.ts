import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import { Transaction } from '../models/transaction.model';
import { Holder } from '../models/holder.model';
import { EnrichedWhale } from '../models/enrichment.model';
import { logger } from '../utils/logger';

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server, port: number) {
    this.wss = new WebSocketServer({ port, noServer: false });

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

    this.broadcast(message);
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

    this.broadcast(message);
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

    this.broadcast(message);
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

    this.broadcast(message);
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

    this.broadcast(message);
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

    this.broadcast(message);
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

    this.broadcast(message);
  }

  /**
   * Broadcast smart alert to all connected clients
   */
  broadcastAlert(alert: any): void {
    const message = JSON.stringify({
      type: 'alert',
      data: alert,
      timestamp: new Date(),
    });

    this.broadcast(message);
    logger.info(`🚨 Alert broadcast to ${this.clients.size} clients: ${alert.title}`);
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
   * Broadcast message to all connected clients
   */
  private broadcast(message: string): void {
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
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
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
