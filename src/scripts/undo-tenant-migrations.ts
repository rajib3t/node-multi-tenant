import undoAllTenantMigrations from "../database/undo-tenant-migrations";


// Run the function if this file is being executed directly
// Run the function if this file is being executed directly
if (require.main === module) {
    undoAllTenantMigrations()
      .then(() => {
        console.log("All tenant migrations undone successfully.");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Failed to undo tenant migrations:", error);
        process.exit(1);
      });
  }
//