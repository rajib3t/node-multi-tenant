import { Request, Response } from "express";
import { Controller } from "../controller";
import AsyncHandler from "../../exceptions/asynchandler";
import AuthMiddleware,{AuthRequest} from "../../middlewares/auth.middleware";
import httpStatus from "http-status";
import UserService from "../../services/user.service";
import { UserAttributes } from "../../types/user";
import CheckUnique from "../../validators/checkUnique";
import EmptyBodyValidator from "../../validators/emptyBody.validator";
class ProfileController extends Controller {
    
    private userService: UserService;
    constructor() {
        super();
        this.initializeRoutes();
        this.userService = UserService.getInstance();
        
    }

    private initializeRoutes() {
        const validateRequestBody = new EmptyBodyValidator().validate(['name', 'email']);
        this.router.get("/", AsyncHandler.handle(AuthMiddleware.getInstance().handle), AsyncHandler.handle(this.getProfile.bind(this)));
        this.router.put("/",  AsyncHandler.handle(AuthMiddleware.getInstance().handle), AsyncHandler.handle(this.updateProfile.bind(this)));
    }

    private async getProfile(req: AuthRequest, res: Response) {
        // Logic to get the profile
      
        const userId = req.user?.user_id;
        const user = await this.userService.getUserById(userId as number);
        res.status(httpStatus.OK).json({
            success: true,
            message: "Profile retrieved successfully",
            user: user,
        });
    }

    private async updateProfile(req: AuthRequest, res: Response) {
        const userData: UserAttributes = {
            name: req.body.name,
            email: req.body.email,
            
        }
       
       
        const userId = req.user?.user_id as number;
        const updatedUser = await this.userService.updateUser(userId.toString(), userData);

        if (!updatedUser) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }
        delete updatedUser.password;
        res.status(httpStatus.OK).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
}


const profileController = new ProfileController();
export default profileController.router;