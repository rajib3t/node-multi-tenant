import TenantDatabase from "../database";
import { Sequelize , } from "sequelize";
import { TenantAttributes } from "../types/tenant";
import Tenant from "../models/tenant.model";
import httpStatus from "http-status";
import { uniqueNamesGenerator, adjectives, colors, animals, Config } from 'unique-names-generator';
import { Umzug, SequelizeStorage } from 'umzug';
class TenantService {
    private static instance: TenantService;
    private tenantDatabase: TenantDatabase;
    private masterSequelize: Sequelize;
    private dbType: 'mysql' | 'postgres';
    
    private constructor() {
        this.tenantDatabase = TenantDatabase.getInstance();
        this.masterSequelize = this.tenantDatabase.getMasterConnection();
        
        // Determine database dialect from Sequelize connection
        this.dbType = (this.masterSequelize.getDialect() === 'postgres') ? 'postgres' : 'mysql';
    }

    public static getInstance(): TenantService {
        if (!TenantService.instance) {
            TenantService.instance = new TenantService();
        }
        return TenantService.instance;
    }

    public async createTenant(tenantData: TenantAttributes): Promise<TenantAttributes> {
        // Check if tenant already exists
        const existingTenant = await Tenant.findOne({ where: { name: tenantData.name } });
        if (existingTenant) {
            const error = new Error('Tenant already exists');
            (error as any).statusCode = httpStatus.CONFLICT;
            throw error;
        }
        try {
            
            
            // Create database for tenant
            const { databaseName, databaseUser, databasePassword } = await this.createDatabase(tenantData.name);
            
            // Create the tenant in the master database
            const newTenantData = {
                ...tenantData,
                databaseName,
                databaseUser,
                databasePassword
            };
            
            const tenant = await Tenant.create(newTenantData);
            await this.migrateTenantDatabase(tenant.name);
            return tenant.toJSON() as TenantAttributes;

        } catch (error) {
            // Check if this is already a formatted error (like our CONFLICT error)
            if ((error as any).statusCode) {
                throw error;
            }
            // Otherwise create a new error with proper details
            const newError = new Error(`Error creating tenant: ${(error as Error).message}`);
            (newError as any).statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            throw newError;
        }
    }

    private async createDatabase(tenantName: string): Promise<{ databaseName: string; databaseUser: string; databasePassword: string }> {
        try {
            // Sanitize tenant name to ensure it's safe for database names
            const sanitizedName = tenantName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            const databaseName = `tenant_${sanitizedName}_db`;
            
            // Generate random credentials with specific configuration
            const customConfig: Config = {
                dictionaries: [colors, adjectives, animals],
                separator: '_',
                style: 'lowerCase',
                length: 3
            };
            
            // Generate random user
            const randomString = uniqueNamesGenerator(customConfig);
            // MySQL usernames are limited to 32 chars, PostgreSQL to 63
            const maxUsernameLength = this.dbType === 'postgres' ? 63 : 32;
            const databaseUser = `${randomString}`.substring(0, maxUsernameLength);
            
            // Create a more complex password
            const passwordConfig: Config = {
                dictionaries: [colors, adjectives, animals, ['123', '456', '789']],
                separator: '_',
                style: 'lowerCase',
                length: 4
            };
            const databasePassword = uniqueNamesGenerator(passwordConfig);
            
            // Execute database-specific SQL commands
            if (this.dbType === 'postgres') {
                await this.createPostgresDatabase(databaseName, databaseUser, databasePassword);
            } else {
                await this.createMySQLDatabase(databaseName, databaseUser, databasePassword);
            }
            // Migrate the tenant database
            
            return {
                databaseName,
                databaseUser,
                databasePassword,
            };
        } catch (error) {
            const errorMessage = `Error creating database for tenant ${tenantName}: ${(error as Error).message}`;
            console.error(errorMessage);
            const newError = new Error(errorMessage);
            (newError as any).statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            throw newError;
        }
    }
    
    private async createMySQLDatabase(databaseName: string, databaseUser: string, databasePassword: string): Promise<void> {
        // MySQL-specific database creation commands
        await this.masterSequelize.query(`CREATE DATABASE \`${databaseName}\``);
        
        await this.masterSequelize.query(`CREATE USER '${databaseUser}'@'%' IDENTIFIED BY '${databasePassword}'`);
        
        await this.masterSequelize.query(`GRANT ALL PRIVILEGES ON \`${databaseName}\`.* TO '${databaseUser}'@'%'`);
        
        await this.masterSequelize.query('FLUSH PRIVILEGES');
    }
    
    private async createPostgresDatabase(databaseName: string, databaseUser: string, databasePassword: string): Promise<void> {
        // PostgreSQL-specific database creation commands
        // Escape all inputs for PostgreSQL
        const escapedDbName = databaseName.replace(/"/g, '""');
        const escapedDbUser = databaseUser.replace(/"/g, '""');
        const escapedDbPassword = databasePassword.replace(/'/g, "''");
        
        // Create database with properly escaped identifiers
        await this.masterSequelize.query(`CREATE DATABASE "${escapedDbName}"`);
        
        // Create user with password
        await this.masterSequelize.query(`CREATE USER "${escapedDbUser}" WITH PASSWORD '${escapedDbPassword}'`);
        
        // Grant privileges
        await this.masterSequelize.query(`GRANT ALL PRIVILEGES ON DATABASE "${escapedDbName}" TO "${escapedDbUser}"`);
    }


    private async migrateTenantDatabase(tenantId: string): Promise<void> {
        try {
            // Get tenant connection
            const tenantSequelize = await this.tenantDatabase.getTenantConnection(tenantId);
            
            const umzug = new Umzug({
                migrations: { 
                  glob: 'src/database/migrations/tenant/*.js',
                  // Make sure this is properly passing Sequelize to migrations
                  resolve: ({ name, path, context }) => {
                    const migration = require(path as string);
                    return {
                      name,
                      up: async () => migration.up(context, tenantSequelize.Sequelize),
                      down: async () => migration.down(context, tenantSequelize.Sequelize),
                    };
                  }
                },
                context: tenantSequelize.getQueryInterface(),
                storage: new SequelizeStorage({ sequelize: tenantSequelize }),
                logger: console,
              });
              // Run migrations
            await umzug.up();
        } catch (error) {
            const errorMessage = `Error migrating database for tenant ${tenantId}: ${(error as Error).message}`;
            console.error(errorMessage);
            const newError = new Error(errorMessage);
            (newError as any).statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            throw newError;
        }
    }

    public async validateTenant(tenantId: string): Promise<boolean> {
        try {
            // Get tenant connection
            const tenant = await Tenant.findOne({ where: { name: tenantId } });
            if (!tenant) {
                console.error(`Tenant ${tenantId} not found`);
                return false;
            }
            const tenantSequelize = await this.tenantDatabase.getTenantConnection(tenantId);
            if (!tenantSequelize) {
                console.error(`Tenant connection not found for tenant ${tenantId}`);
            // Test the connection
            return false;
            }
            // Test the connection
            await tenantSequelize.authenticate();
            return true;
        } catch (error) {
            console.error(`Failed to validate tenant ${tenantId}:`, error);
            return false;
        }
    }
}

export default TenantService;