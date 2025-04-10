import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import TenantService from '../services/tenant.service';
import { initializeTenantModels } from '../models/modelsInit';
declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      tenantModels: any;
    }
  }
}

class TenantResolver {
  private tenantService: TenantService;

  constructor() {
    this.tenantService = TenantService.getInstance();
    // Bind the method to the class instance to maintain proper 'this' context
    this.resolveTenant = this.resolveTenant.bind(this);
  }
  

  /**
   * Singleton instance of TenantResolver
   */
  private static instance: TenantResolver;
  public static getInstance(): TenantResolver {
    if (!TenantResolver.instance) {
      TenantResolver.instance = new TenantResolver();
    }
    return TenantResolver.instance;
  }
  /**
   * Middleware to resolve tenant based on the request
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Next function to call the next middleware
   * @returns {Promise<void>}
   */
  public async resolveTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'];

      if (!tenantId || typeof tenantId !== 'string') {
        res.status(httpStatus.BAD_REQUEST).json({
          message: 'Tenant ID is required',
        });
        return;
      }

      // Validate tenant ID format
      try {
        await this.tenantService.validateTenant(tenantId);
      } catch (error) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: 'Invalid tenant ID',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
      }

      // Set the tenant ID in the request
      req.tenantId = tenantId;
      
      // Load tenant models
      try {
        const tenantModels = await initializeTenantModels(tenantId);
        req.tenantModels = tenantModels;
      } catch (error) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'Tenant not found or models could not be loaded',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
      }

      next();
    } catch (error) {
      // Handle any unexpected errors
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to resolve tenant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  }
}

export default TenantResolver;