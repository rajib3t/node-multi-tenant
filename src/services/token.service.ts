import jwt, { SignOptions, Algorithm } from 'jsonwebtoken';
import User from "../models/user.model";
import { TokenAttributes } from "../types/token";
import { JWT_CONFIG, validateConfig } from "../config";

import ms, { StringValue  }from 'ms';
import {TokenDecode} from "../types/token";
import Token from '../models/token.model';
import {Op } from 'sequelize';
import { UserAttributes } from '../types/user';
import httpStatus from "http-status";
class TokenService {
    private static instance: TokenService;
    
    private secret: string;
    private refreshSecret: string;
    private accessTokenExpiresIn: string | number;
    private refreshTokenExpiresIn: string;
    private algorithm: string;
   
    private constructor() {
        validateConfig();
        this.secret = JWT_CONFIG.ACCESS_TOKEN.SECRET as string;
        this.refreshSecret = JWT_CONFIG.REFRESH_TOKEN.SECRET as string;
        this.accessTokenExpiresIn = JWT_CONFIG.ACCESS_TOKEN.EXPIRES_IN as StringValue;
        this.refreshTokenExpiresIn = JWT_CONFIG.REFRESH_TOKEN.EXPIRES_IN as StringValue;
        this.algorithm = JWT_CONFIG.ALGORITHM;
        
    }
    
    public static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }
    
    /**
     * Generates a JWT token for a user.
     * @param {User} user - The user object for whom the token is generated.
     * @returns {string} - The generated JWT token.
     */
    public async generateToken(user: UserAttributes, tenant?:string): Promise<string> {
        if (!user) {
            throw new Error('User is required to generate a token');
        }
        let payload;
        if(tenant){
             payload = {
                userId: user.id,
                email: user.email,
                tenant: tenant,
            };
        }else{
             payload = {
                userId: user.id,
                email: user.email,
            };
        }
        
        
        // Use proper typing for the algorithm
        const options: SignOptions = {
            expiresIn: this.accessTokenExpiresIn as StringValue,
            algorithm: this.algorithm as Algorithm,
        };
        
        return jwt.sign(payload, this.secret, options);
    }
    
    // You may want to add methods for refresh tokens too
    public async generateRefreshToken(user: UserAttributes, tenant?:string): Promise<{ token: string; expiresAt: Date }> {
        if (!user) {
            throw new Error('User is required to generate a refresh token');
        }
        let payload;
        if(tenant){
             payload = {
                userId: user.id,
                email: user.email,
                tenant: tenant,
            };
        }else{
             payload = {
                userId: user.id,
                email: user.email,
            };
        }
        const options: SignOptions = {
            expiresIn: this.refreshTokenExpiresIn as StringValue,
            algorithm: this.algorithm as Algorithm,
        };
        const expires = ms(this.refreshTokenExpiresIn as StringValue) as number;
        const expiresAt = new Date(Date.now() + expires);
        const token = jwt.sign(payload, this.refreshSecret, options);
        
        // Assuming you have a method to save the token in the database
        const tokenAttributes: TokenAttributes = {
            userId: user.id as number,
            token,
            type: 'refresh',
            isRevoked: false,
            expiresAt,
        }
        const saveToken = await Token.create(tokenAttributes);
        return {
           token,
            expiresAt,
        }
        
    }

   /**
     * Verifies a JWT token and returns the decoded payload.
     * @param {string} token - The JWT token to verify.
     * @returns {TokenDecode} - The decoded token attributes.
     */
    public async verifyToken(token: string): Promise<TokenDecode> {
        if (!token) {
            const error: any = new Error('Token is required for verification');
            error.statusCode = httpStatus.BAD_REQUEST;
            throw error;
        }
        
        try {
            const decoded = jwt.verify(token, this.secret) as TokenDecode;
            return decoded;
        } catch (error) {
            // Handle specific JWT errors
            if (error instanceof jwt.TokenExpiredError ) {
                const customError = new Error('jwt expired');
                (customError as any).statusCode = httpStatus.UNAUTHORIZED;
                console.log((customError as any).statusCode );
                
                throw customError;
            } else if (error instanceof jwt.JsonWebTokenError) {
                const customError = new Error('jwt error');
                (customError as any).statusCode = httpStatus.UNAUTHORIZED;
                
                throw customError;
            } else {
                const customError = new Error('jwt error');
                (customError as any).statusCode = httpStatus.INTERNAL_SERVER_ERROR;
                
                throw customError;
            }
        }
    }

    /** 
     * Refreshes a token by verifying it and generating a new one from the refresh token.
     * 
     */ 
    public async refreshTheAccessToken(refreshToken: string): Promise<{ token: string; expiresAt: Date }> {
        if (!refreshToken) {
            throw new Error('Refresh token is required for refreshing');
        }
        try {
            const decoded = jwt.verify(refreshToken, this.refreshSecret) as TokenDecode;
            const user = await User.findByPk(decoded.userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Check if decoded token has tenant
            let payload;
            if(decoded.tenant){
                payload = {
                    id: user.id,
                    email: user.email,
                    tenant: decoded.tenant,
                };
            }else{
                payload = {
                    id: user.id,
                    email: user.email,
                };
            }
            // Generate new access token
            const options: SignOptions = {
                expiresIn: this.accessTokenExpiresIn as StringValue,
                algorithm: this.algorithm as Algorithm,
            };
            const token = jwt.sign(payload, this.secret, options);
            const expires = ms(this.accessTokenExpiresIn as StringValue) as number;
            const expiresAt = new Date(Date.now() + expires);
            
            return {
                token,
                expiresAt,
            }
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Revokes all tokens for a user
     * @param user The user whose tokens should be revoked
     * @returns A promise that resolves to the number of tokens updated
     */
    public async revokeAllUserTokens(user: UserAttributes):  Promise<[number, Token[]]>  {
        if (!user) {
            throw new Error('User is required to revoke tokens');
        }
        try {
        return await Token.update(
            { isRevoked: true }, 
            { 
              where: { userId: user.id },
              returning: true
            }
          );
        } catch (error) {
            throw new Error('Error revoking tokens');
        }
    }
    
    /**
     * Finds a valid refresh token in the database
     * @param token The token string to find
     * @returns A promise that resolves to the token record or null if not found
     */
    public async getRefreshToken(token: string): Promise<Token | null> {
        try {
            const tokenRecord = await Token.findOne({
                where: {
                token,
                isRevoked: false,
                },
                
        });
            return tokenRecord;
        } catch (error) {
        console.error("Error getting refresh token:", error);
        return null;
        }
    }

    /**
     * Cleans up expired tokens from the database
     * @returns A promise that resolves to the number of tokens deleted
     */
    public async cleanupExpiredTokens(): Promise<number> {
        try {
            const currentDate = new Date();
            const result = await Token.destroy({
                where: {
                    expiresAt: {
                        [Op.lt]: currentDate,
                    },
                },
            });
            return result;
        } catch (error) {
            console.error("Error cleaning up expired tokens:", error);
            throw error;
        }
    }

}

export default TokenService;