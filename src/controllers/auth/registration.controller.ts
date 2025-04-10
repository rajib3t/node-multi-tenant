import { Request, Response } from 'express';
import { Controller } from '../controller';
import EmptyBodyValidator from '../../validators/emptyBody.validator';
import AsyncHandler from '../../exceptions/asynchandler';
import UserService from '../../services/user.service';
import httpStatus from 'http-status';
class RegistrationController extends Controller {
    private userService: UserService;
    constructor() {
        super();
        this.initializeRoutes();
        this.userService = UserService.getInstance();
    }

    private initializeRoutes() {
        const validateRequestBody = new EmptyBodyValidator().validate(['name', 'email', 'password']);
        this.router.post("/register", validateRequestBody, AsyncHandler.handle( this.register.bind(this)));
    }

    private async register(req: Request, res: Response) {
        // Simulate a successful registration
       
        const user = await this.userService.createUser( req.body);
        return res.status(httpStatus.CREATED).json({
            success: true,
            message: 'User registered successfully',
            user
        });

    }
}

const registrationController = new RegistrationController();
export default registrationController.router;