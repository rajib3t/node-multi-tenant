import { Sequelize } from 'sequelize';
import { DatabaseConfig, IDatabase } from '../interfaces/database.interface';
import {DB_CONFIG} from '../config';
import { Dialect } from 'sequelize/types';
import Tenant from '../models/tenant.model';
import { TenantAttributes } from '../types/tenant';

class TenantDatabase implements IDatabase {
    private static instance: TenantDatabase;
    private masterSequelize: Sequelize;
    private tenantConnections: Map<string, Sequelize> = new Map();
    
    private constructor() {
        const dbConfig: DatabaseConfig = {
            dialect: DB_CONFIG.DIALECT as Dialect,
            host: DB_CONFIG.HOST as string,
            username: DB_CONFIG.USERNAME as string,
            password: DB_CONFIG.PASSWORD as string,
            database: DB_CONFIG.DATABASE as string,
            port: Number(DB_CONFIG.PORT),
            models: [__dirname + '../models'],
            define: {
                timestamps: false,
            },
            
        };
        
        // Initialize the master database connection
        this.masterSequelize = new Sequelize(dbConfig);
    }
    
    private async connectToDatabase(): Promise<void> {
        try {
            await this.masterSequelize.authenticate();
            console.log('Master database connected successfully!');
        } catch (err) {
            console.log('Error connecting to master database:', err);
            throw err;
        }
    }
    
    public static getInstance(): TenantDatabase {
        if (!TenantDatabase.instance) {
            TenantDatabase.instance = new TenantDatabase();
        }
        return TenantDatabase.instance;
    }
    
    public getMasterConnection(): Sequelize {
        return this.masterSequelize;
    }
    
    public async getTenantConnection(tenantId: string): Promise<Sequelize> {
        // Check if we already have a connection for this tenant
        if (this.tenantConnections.has(tenantId)) {
            return this.tenantConnections.get(tenantId)!;
        }
        
        // Get tenant database details from the master database
        const tenantConfig = await this.getTenantDbConfig(tenantId);
        
        const tenantDbConfig: DatabaseConfig = {
            dialect: DB_CONFIG.DIALECT as Dialect,
            host: tenantConfig.host,
            username: tenantConfig.username as string,
            password: tenantConfig.password as string,
            database: tenantConfig.database as string,
            port: Number(DB_CONFIG.PORT),
            models: [__dirname + '../models/tenant'],
            define: {
                timestamps: false,
            },
        };
        // Create a new Sequelize instance for this tenant
        const tenantSequelize = new Sequelize(tenantDbConfig);
        
        // Test the connection
        try {
            await tenantSequelize.authenticate();
            console.log(`Tenant database ${tenantId} connected successfully!`);
            
            // Store the connection for reuse
            this.tenantConnections.set(tenantId, tenantSequelize);
            
            return tenantSequelize;
        } catch (err) {
            console.log(`Error connecting to tenant database ${tenantId}:`, err);
            throw err;
        }
    }
    
    private async getTenantDbConfig(tenantId: string): Promise<DatabaseConfig> {
        // In a real application, you'd fetch this from the master database
        // For now, we'll use a simple pattern
        const tenant = await Tenant.findOne({
            where: { name: tenantId },
        });

        console.log(`Tenant database config for ${tenantId}:`, tenant);
        
        return {
            dialect: DB_CONFIG.DIALECT as Dialect,
            host: DB_CONFIG.HOST as string,
            username: DB_CONFIG.USERNAME as string,
            password:  DB_CONFIG.PASSWORD as string,
            database: tenant?.databaseName as string,
            port: Number(DB_CONFIG.PORT),
            models: [__dirname + '../models'],
            define: {
                timestamps: false,
            },
        };
    }
    
    public async connect(): Promise<void> {
        return this.connectToDatabase();
    }
    
    public async closeAllConnections(): Promise<void> {
        await this.masterSequelize.close();
        for (const [_, connection] of this.tenantConnections) {
            await connection.close();
        }
        this.tenantConnections.clear();
        console.log('All database connections closed');
    }
}

export default TenantDatabase;