import Tenant from "../models/tenant.model";
import TenantDatabase from "../database";
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { initializeMasterModels } from "../models/modelsInit";
import {SERVER_CONFIG} from "../config";
async function migrateAllTenantDatabase() {
    // Check if the environment is production
    const isProduction = SERVER_CONFIG.NODE_ENV === 'production';
    if (isProduction) {
        console.log("Tenant migrations are not allowed in production mode.");
        return;
    }
    // Check if the database is initialized
  try {
    // Initialize master connection
    const masterConnection = TenantDatabase.getInstance().getMasterConnection();
    if (!masterConnection) {
      throw new Error("Master connection not found.");
    }
    initializeMasterModels(); 
    // Get all tenants
    const tenants = await Tenant.findAll();
    
    if (tenants.length === 0) {
      console.log("No tenants found to migrate.");
      return;
    }
    
    console.log(`Found ${tenants.length} tenants to migrate.`);
    
    // Process each tenant
    for (const tenant of tenants) {
      try {
        console.log(`Starting migration for tenant: ${tenant.name}`);
        
        // Get tenant connection
        const tenantSequelize = await TenantDatabase.getInstance().getTenantConnection(tenant.name);
        
        // Configure Umzug
        const umzug = new Umzug({
          migrations: { 
            glob: 'src/database/migrations/tenant/*.js',
            resolve: ({ name, path }) => {
              const migration = require(path as string);
              return {
                name,
                up: async () => migration.up(tenantSequelize.getQueryInterface(), tenantSequelize.Sequelize),
                down: async () => migration.down(tenantSequelize.getQueryInterface(), tenantSequelize.Sequelize),
              };
            }
          },
          context: tenantSequelize.getQueryInterface(),
          storage: new SequelizeStorage({ sequelize: tenantSequelize }),
          logger: console,
        });
        
        // Run migrations
        console.log(`Running migrations for tenant: ${tenant.name}...`);
        const migrations = await umzug.up();
        console.log(`Successfully migrated tenant: ${tenant.name}. Applied ${migrations.length} migrations.`);
      } catch (error) {
        console.error(`Error migrating tenant ${tenant.name}:`, error);
        // Continue with other tenants even if one fails
      }
    }
    
    console.log("Tenant migrations completed.");
  } catch (error) {
    console.error("Error in tenant migration process:", error);
    throw error; // Re-throw for the caller to handle
  }
}

export default migrateAllTenantDatabase;