// src/database/tenant.migrate-single.ts
import Tenant from "../models/tenant.model";
import TenantDatabase from "../database";
import { Umzug, SequelizeStorage } from 'umzug';
import {SERVER_CONFIG} from "../config";
async function migrateSpecificTenant(tenantName: string) {
    // Check if the environment is production
    const isProduction = SERVER_CONFIG.NODE_ENV === 'production';
    if (isProduction) {
        console.log("Tenant migrations are not allowed in production mode.");
        return;
    }
  try {
    // Initialize master connection
    TenantDatabase.getInstance().getMasterConnection();
    
    // Find the specific tenant
    const tenant = await Tenant.findOne({ where: { name: tenantName } });
    
    if (!tenant) {
      throw new Error(`Tenant "${tenantName}" not found`);
    }
    
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
    
    return migrations;
  } catch (error) {
    console.error(`Error migrating tenant ${tenantName}:`, error);
    throw error;
  }
}

export default migrateSpecificTenant;