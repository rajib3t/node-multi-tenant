import { Sequelize } from 'sequelize';
import TenantDatabase from '../database/index';
import ModelRegistry from './modelRegistry';
import Token from './token.model';
import User from './user.model';
import Tenant from './tenant.model';
// Import other models as needed

/**
 * Initialize all models for the master database
 */
function initializeMasterModels() {
    const registry = ModelRegistry.getInstance();
    const tenantDatabase = TenantDatabase.getInstance();
    const masterSequelize = tenantDatabase.getMasterConnection();
    
    // Initialize Token model
    registry.initializeMasterModel('Token', masterSequelize, Token.initialize);
    
    // Initialize other models
    registry.initializeMasterModel('User', masterSequelize, User.initialize);
    // Add other models as needed
    registry.initializeMasterModel('Tenant', masterSequelize, Tenant.initialize);
}

/**
 * Initialize all models for a specific tenant
 * @param tenantId The tenant identifier
 */
async function initializeTenantModels(tenantId: string) {
    const registry = ModelRegistry.getInstance();
    const tenantDatabase = TenantDatabase.getInstance();
    
    try {
        // Get tenant connection (await the promise)
        const tenantSequelize = await tenantDatabase.getTenantConnection(tenantId);
        
        // Initialize Token model
        registry.initializeTenantModel('Token', tenantId, tenantSequelize, Token.initialize);
        
        // Initialize other models
        registry.initializeTenantModel('User', tenantId, tenantSequelize, User.initialize);
        // Add other models as needed
    } catch (error) {
        console.error(`Failed to initialize models for tenant ${tenantId}:`, error);
        throw new Error(`Tenant connection not found for tenant: ${tenantId}`);
    }
}

export { initializeMasterModels, initializeTenantModels };