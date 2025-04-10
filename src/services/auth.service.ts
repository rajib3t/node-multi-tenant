import UserService  from './user.service';
import  TokenService  from './token.service';
import { UserAttributes } from '../types/user';
import User from '../models/user.model';
import httpStatus from "http-status";
import bcrypt from 'bcryptjs';
import { JWT_CONFIG } from '../config';
class AuthService {
    private static instance: AuthService;
    private userService: UserService;
    private tokenService: TokenService;

    private constructor() {
        this.userService = UserService.getInstance();
        this.tokenService = TokenService.getInstance();
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async register(userData: UserAttributes): Promise<UserAttributes> {
        const user = await this.userService.createUser(userData);
        return user;
    }

    public async loginWithEmailPassword(email: string, password: string, tenant?:string): Promise<{ user: UserAttributes; token: string , refreshToken: string, refreshTokenExpiresAt: Date, tokenType: string}> {
       
        let user = await User.scope('withPassword').findOne({
            where: { email },
        });
        if(!user) {
            const error = new Error('User not found');
            (error as any). statusCode = httpStatus.NOT_FOUND;
            throw error;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid password');
            (error as any). statusCode = httpStatus.UNAUTHORIZED;
            throw error;
        }
        // Remove password from user object
        const { password: _, ...userWithoutPassword } = user.toJSON() as UserAttributes;
        // Revoke any existing tokens for security
        await this.tokenService.revokeAllUserTokens(user);
        //Generate token
        const token = await this.tokenService.generateToken(userWithoutPassword, tenant);
        const refreshToken = await this.tokenService.generateRefreshToken(userWithoutPassword, tenant);

        return {
            user: userWithoutPassword,
            token,
            refreshToken: refreshToken.token,
            refreshTokenExpiresAt: refreshToken.expiresAt,
            tokenType: JWT_CONFIG.TOKEN_PREFIX,
        };
    }
}

export default AuthService;