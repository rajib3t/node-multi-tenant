// src/scripts/undo-tenant-migrations.ts
import Tenant from "../models/tenant.model";
import TenantDatabase from "../database";
import { Umzug, SequelizeStorage } from 'umzug';
import {SERVER_CONFIG} from "../config";
import { initializeMasterModels } from "../models/modelsInit";
async function undoAllTenantMigrations() {
    // Check if the environment is production
    const isProduction = SERVER_CONFIG.NODE_ENV === 'production';
    if (isProduction) {
        console.log("Tenant migrations are not allowed in production mode.");
        return;
    }
  try {
    // Initialize master connection
    const masterConnection = TenantDatabase.getInstance().getMasterConnection();
    initializeMasterModels(); // Initialize models for master connection
    // Get all tenants
    const tenants = await Tenant.findAll();
    
    if (tenants.length === 0) {
      console.log("No tenants found to revert migrations.");
      return;
    }
    
    console.log(`Found ${tenants.length} tenants to revert migrations.`);
    
    // Process each tenant
    for (const tenant of tenants) {
      try {
        console.log(`Starting migration reversion for tenant: ${tenant.name}`);
        
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
        
        // Undo migrations
        console.log(`Reverting migrations for tenant: ${tenant.name}...`);
        const migrations = await umzug.down({ to: 0 }); // Revert all migrations
        console.log(`Successfully reverted tenant: ${tenant.name}. Reverted ${migrations.length} migrations.`);
      } catch (error) {
        console.error(`Error reverting migrations for tenant ${tenant.name}:`, error);
        // Continue with other tenants even if one fails
      }
    }
    
    console.log("Tenant migration reversions completed.");
  } catch (error) {
    console.error("Error in tenant migration reversion process:", error);
    throw error;
  }
}



export default undoAllTenantMigrations;