// Identity Controller - API endpoints for wallet identity resolution

import { Request, Response } from 'express';
import { getIdentityService } from '../services/identity.service';
import { logger } from '../utils/logger';

/**
 * GET /api/identity/:address
 * Resolve identity for a single wallet address
 */
export const getIdentity = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { quick, forceRefresh } = req.query;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address format',
      });
    }

    const identityService = getIdentityService();

    const identity = await identityService.resolve(address, {
      quick: quick === 'true',
      forceRefresh: forceRefresh === 'true',
    });

    return res.json({
      success: true,
      data: identity,
    });
  } catch (error: any) {
    logger.error('Error resolving identity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve identity',
      error: error.message,
    });
  }
};

/**
 * POST /api/identity/batch
 * Resolve identities for multiple addresses (max 50)
 */
export const batchGetIdentity = async (req: Request, res: Response) => {
  try {
    const { addresses } = req.body;
    const { quick } = req.query;

    if (!Array.isArray(addresses)) {
      return res.status(400).json({
        success: false,
        message: 'addresses must be an array',
      });
    }

    if (addresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'addresses array cannot be empty',
      });
    }

    if (addresses.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 addresses allowed per request',
      });
    }

    // Validate all addresses
    for (const addr of addresses) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
        return res.status(400).json({
          success: false,
          message: `Invalid address format: ${addr}`,
        });
      }
    }

    const identityService = getIdentityService();

    const identities = await identityService.resolveBatch(addresses, {
      quick: quick === 'true',
    });

    // Convert Map to object for JSON response
    const result: Record<string, any> = {};
    for (const [address, identity] of identities.entries()) {
      result[address] = identity;
    }

    return res.json({
      success: true,
      count: identities.size,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error in batch identity resolution:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve identities',
      error: error.message,
    });
  }
};

/**
 * GET /api/identity/search?q=pranksy
 * Search wallets by ENS name, Twitter handle, or display name
 */
export const searchIdentity = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required',
      });
    }

    if (q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters',
      });
    }

    const identityService = getIdentityService();
    const results = await identityService.search(q);

    return res.json({
      success: true,
      query: q,
      count: results.length,
      results,
    });
  } catch (error: any) {
    logger.error('Error searching identities:', error);
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
};

/**
 * GET /api/identity/stats
 * Get identity service statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const identityService = getIdentityService();
    const stats = identityService.getCacheStats();

    return res.json({
      success: true,
      stats: {
        cachedIdentities: stats.size,
        knownWallets: stats.knownWallets,
        totalCoverage: stats.size + stats.knownWallets,
      },
    });
  } catch (error: any) {
    logger.error('Error getting identity stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/identity/cache
 * Clear identity cache (admin only)
 */
export const clearCache = async (req: Request, res: Response) => {
  try {
    const identityService = getIdentityService();
    identityService.clearCache();

    return res.json({
      success: true,
      message: 'Identity cache cleared',
    });
  } catch (error: any) {
    logger.error('Error clearing cache:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
};
