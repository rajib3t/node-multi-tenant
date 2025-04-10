import { Controller } from "../controller";
import { Request, Response } from "express";
import  AuthService from "../../services/auth.service";
import AsyncHandler from '../../exceptions/asynchandler';
import httpStatus from 'http-status';
class LoginController extends Controller {

    private authService: AuthService;
     constructor() {
        super();
        this.initializeRoutes();
        this.authService = AuthService.getInstance();
    }

    private initializeRoutes() {
        this.router.post("/login", AsyncHandler.handle(this.login.bind(this)));
    }
    private  async login(req: Request, res: Response) {
        const user =  await this.authService.loginWithEmailPassword(req.body.email, req.body.password)

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