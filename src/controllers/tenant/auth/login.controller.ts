import { Controller } from "../../controller";
import { Request, Response } from "express";
import  AuthService from "../../../services/auth.service";
import AsyncHandler from '../../../exceptions/asynchandler';
import EmptyBodyValidator from '../../../validators/emptyBody.validator';
import TenantResolver  from '../../../middlewares/tenantResolver';
import httpStatus from 'http-status';

class LoginController extends Controller {

    private authService: AuthService;
     constructor() {
        super();
        this.initializeRoutes();
        this.authService = AuthService.getInstance();
    }

    private initializeRoutes() {
        const validateRequestBody = new EmptyBodyValidator().validate(['email', 'password']);
        this.router.post("/login", TenantResolver.getInstance().resolveTenant,validateRequestBody, AsyncHandler.handle(this.login.bind(this)));
    }
    private  async login(req: Request, res: Response) {
        const tenant = req.headers['x-tenant-id'];
        const user =  await this.authService.loginWithEmailPassword(req.body.email, req.body.password,tenant as string);

        return res.status(httpStatus.OK).json({
            success: true,
            message: 'User logged in successfully',
            user: user.user,
            token: user.token,
            refreshToken: user.refreshToken,
            refreshTokenExpiresAt: user.refreshTokenExpiresAt,
            tokenType: user.tokenType,
        });

    }
}

// Export the LoginController instance
const loginController = new LoginController();
export default loginController.router;