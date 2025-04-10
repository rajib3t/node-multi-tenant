import { UserAttributes } from "../types/user";
import User from "../models/user.model";
import httpStatus from "http-status";

class UserService{

    private static instance: UserService;
    private constructor() {}
    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }
    public async createUser(userData: UserAttributes): Promise<UserAttributes> {
        const existingUser = await this.getUserByEmail( userData.email );
            if (existingUser) {
                const error = new Error('Email already exists');
                (error as any).statusCode = httpStatus.CONFLICT;
               
              
                
                
                throw error;
            }
        try {
            // Check if user already exists
            
            const user = await User.create(userData);
            const { password, ...userWithoutPassword }  = user.toJSON() as UserAttributes;
            return userWithoutPassword;
        } catch (error) {
            throw new Error(`Error creating user: ${error}`);
        }
    }

    async getUserById(id: number ): Promise<UserAttributes | null> {
        try {
            const user = await User.findByPk(id);
            return user ? user.toJSON() as UserAttributes : null;
        } catch (error) {
            throw new Error(`Error fetching user: ${error}`);
        }
    }

    async updateUser(id: string, userData: Partial<UserAttributes>): Promise<UserAttributes | null> {
        // Check if user exists
        const existingUser = await User.findByPk(id);
        if (!existingUser) {
            const error = new Error('User not found');
            (error as any).statusCode = httpStatus.NOT_FOUND;
            throw error;
        }
        
        // Check if email is being updated and already exists
        if (userData.email) {
            const existingEmailUser = await this.getUserByEmail(userData.email);
            
            if (existingEmailUser && existingEmailUser.id?.toString() !== id) {
                const error = new Error('Email already exists');
                (error as any).statusCode = httpStatus.CONFLICT;
                throw error;
            }
        }
        try {
            
            
            const [updatedRows, [updatedUser]] = await User.update(userData, {
                where: { id },
                returning: true,
            });
            
            return updatedRows ? updatedUser.toJSON() as UserAttributes : null;
        } catch (error) {
            // Re-throw the original error instead of creating a new one
            // This preserves the status code and other properties
            (error as any).statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            throw error;
        }
    }

    async deleteUser(id: string): Promise<void> {
        try {
            await User.destroy({ where: { id } });
        } catch (error) {
            throw new Error(`Error deleting user: ${error}`);
        }
    }

    async getUserByEmail(email: string): Promise<UserAttributes | null> {
        try {
            const user = await User.findOne({ where: { email } });
            return user ? user.toJSON() as UserAttributes : null;
        } catch (error) {
            throw new Error(`Error fetching user by email: ${error}`);
        }
    }
    async getAllUsers(): Promise<UserAttributes[]> {
        try {
            const users = await User.findAll();
            return users.map(user => user.toJSON() as UserAttributes);
        } catch (error) {
            throw new Error(`Error fetching users: ${error}`);
        }
    }
    
    

    

    
    
}


export default  UserService;
