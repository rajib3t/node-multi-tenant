
// src/scripts/migrate-tenants.ts
import migrateAllTenantDatabase from "../database/tenant.migrate";

// Run the migration
migrateAllTenantDatabase()
  .then(() => {
    console.log("Tenant migration process completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Tenant migration failed:", error);
    process.exit(1);
  });

  