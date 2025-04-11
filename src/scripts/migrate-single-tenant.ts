// src/scripts/migrate-single-tenant.ts
import migrateSpecificTenant from "../database/tenant.migrate-single";

// Get tenant name from command line arguments
const tenantName = process.argv[2];

if (!tenantName) {
  console.error("Error: Tenant name is required");
  console.log("Usage: npm run migrate:tenant [tenant-name]");
  process.exit(1);
}

// Run the migration for the specific tenant
migrateSpecificTenant(tenantName)
  .then(() => {
    console.log(`Migration for tenant "${tenantName}" completed successfully.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Migration for tenant "${tenantName}" failed:`, error);
    process.exit(1);
  });