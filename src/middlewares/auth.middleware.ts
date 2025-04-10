import { Request, Response, NextFunction } from "express";
import { JWT_CONFIG } from "../config";
import httpStatus from "http-status";
import TokenService from "../services/token.service";
import TenantService from "../services/tenant.service";
import { initializeTenantModels } from '../models/modelsInit';
import UserService from "../services/user.service";

export interface AuthRequest extends Request {
    user?: {
      user_id: number;
      email: string;
      [key: string]: any;
    };
    tenantId: string;
      tenantModels: any;
  }
class AuthMiddleware {

    private static instance: AuthMiddleware;
    private constructor() {}
    public static getInstance(): AuthMiddleware {
        if (!AuthMiddleware.instance) {
            AuthMiddleware.instance = new AuthMiddleware();
        }
        return AuthMiddleware.instance;
    }
    

  public async handle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
     // Get token from Authorization header
     const authHeader = req.header(JWT_CONFIG.TOKEN_HEADER);
     const token = authHeader?.startsWith( JWT_CONFIG.TOKEN_PREFIX+' ') ? authHeader.substring(7) : null;
    

      const decoded = await TokenService.getInstance().verifyToken(token?.toString() as string);
     
      // Check if token has necessary claims
        if (!decoded.userId || !decoded.email) {
            res.status(httpStatus.UNAUTHORIZED).json({ 
            success: false, 
            message: 'Invalid token format'
            });
            return;
        }
        // Check if tenant is provided
        if(decoded.tenant) {
            req.tenantId = decoded.tenant;
            await TenantService.getInstance().validateTenant(decoded.tenant);
            const tenantModels = await initializeTenantModels(decoded.tenant);
            req.tenantModels = tenantModels;
        }

        // Check if user exists in the database
        const user = await UserService.getInstance().getUserById(decoded.userId);
        if (user) {
            // Attach user information to the request object
            req.user = {
                user_id: user.id as number,
                email: user.email,
            }
            // Call the next middleware or route handler
            next();
        } else {
            // If user does not exist, send an unauthorized response
            res.status(httpStatus.UNAUTHORIZED).json({ 
                success: false, 
                message: 'Unauthorized'
            });
        }
  
  }
}

export default AuthMiddleware;