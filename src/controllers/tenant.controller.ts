import { Controller } from "./controller";
import { Request, Response } from "express";
import  TenantService  from "../services/tenant.service"; // Import the TenantService
import AsyncHandler from "../exceptions/asynchandler";
import EmptyBodyValidator from "../validators/emptyBody.validator";
import httpStatus from 'http-status';
class TenantController extends Controller {
    private tenantService: TenantService;
    constructor() {
        super();
        this.initializeRoutes();
        this.tenantService = TenantService.getInstance(); // Initialize the tenant service
    }

    private initializeRoutes() {
        const validateRequestBody = new EmptyBodyValidator().validate(['name']);
        this.router.post('/create',validateRequestBody, AsyncHandler.handle(this.createPost.bind(this)));
    }

    // Define your controller methods here
    private async createPost(req: Request, res: Response) {
        const {name} = req.body;
        const tenant = await this.tenantService.createTenant({name}); 
       res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Tenant created successfully',
            tenant
        });
    }
}
// Export the TenantController instance
const tenantController = new TenantController();
export default tenantController.router;