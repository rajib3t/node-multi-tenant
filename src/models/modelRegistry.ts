import { Model, ModelCtor, Sequelize } from 'sequelize';

/**
 * A generic registry for managing Sequelize models across multiple database connections
 * in a multi-tenant architecture.
 */
class ModelRegistry {
    private static instance: ModelRegistry;
    // Map of model name -> tenant ID -> model instance
    private models: Map<string, Map<string, ModelCtor<any>>>;
    // Map of model name -> master model instance
    private masterModels: Map<string, ModelCtor<any>>;

    private constructor() {
        this.models = new Map();
        this.masterModels = new Map();
    }

    public static getInstance(): ModelRegistry {
        if (!ModelRegistry.instance) {
            ModelRegistry.instance = new ModelRegistry();
        }
        return ModelRegistry.instance;
    }

    /**
     * Initialize a model for a specific tenant
     * @param modelName The name of the model to register
     * @param tenantId The tenant identifier
     * @param sequelize The Sequelize instance for the tenant
     * @param initializeFunc The function that initializes the model with a Sequelize instance
     * @returns The initialized model
     */
    public initializeTenantModel<T extends Model>(
        modelName: string,
        tenantId: string,
        sequelize: Sequelize,
        initializeFunc: (sequelize: Sequelize) => ModelCtor<T>
    ): ModelCtor<T> {
        // Initialize the tenant map for this model if it doesn't exist
        if (!this.models.has(modelName)) {
            this.models.set(modelName, new Map<string, ModelCtor<any>>());
        }

        const modelMap = this.models.get(modelName)!;
        const model = initializeFunc(sequelize);
        modelMap.set(tenantId, model);
        return model;
    }

    /**
     * Initialize a model for the master database
     * @param modelName The name of the model to register
     * @param sequelize The Sequelize instance for the master database
     * @param initializeFunc The function that initializes the model with a Sequelize instance
     * @returns The initialized model
     */
    public initializeMasterModel<T extends Model>(
        modelName: string,
        sequelize: Sequelize,
        initializeFunc: (sequelize: Sequelize) => ModelCtor<T>
    ): ModelCtor<T> {
        const model = initializeFunc(sequelize);
        this.masterModels.set(modelName, model);
        return model;
    }

    /**
     * Get a model for a specific tenant
     * @param modelName The name of the model to retrieve
     * @param tenantId The tenant identifier
     * @returns The model instance or undefined if not found
     */
    public getTenantModel<T extends Model>(modelName: string, tenantId: string): ModelCtor<T> | undefined {
        const modelMap = this.models.get(modelName);
        if (!modelMap) {
            return undefined;
        }
        return modelMap.get(tenantId) as ModelCtor<T> | undefined;
    }

    /**
     * Get a model from the master database
     * @param modelName The name of the model to retrieve
     * @returns The model instance or undefined if not found
     */
    public getMasterModel<T extends Model>(modelName: string): ModelCtor<T> | undefined {
        return this.masterModels.get(modelName) as ModelCtor<T> | undefined;
    }

    /**
     * Get a model for a tenant, falling back to the master model if not found
     * @param modelName The name of the model to retrieve
     * @param tenantId The tenant identifier
     * @returns The model instance or undefined if neither tenant nor master model is found
     */
    public getModel<T extends Model>(modelName: string, tenantId: string): ModelCtor<T> | undefined {
        return this.getTenantModel<T>(modelName, tenantId) || this.getMasterModel<T>(modelName);
    }

    /**
     * Check if a tenant model exists
     * @param modelName The name of the model to check
     * @param tenantId The tenant identifier
     * @returns True if the tenant model exists
     */
    public hasTenantModel(modelName: string, tenantId: string): boolean {
        const modelMap = this.models.get(modelName);
        return modelMap ? modelMap.has(tenantId) : false;
    }

    /**
     * Check if a master model exists
     * @param modelName The name of the model to check
     * @returns True if the master model exists
     */
    public hasMasterModel(modelName: string): boolean {
        return this.masterModels.has(modelName);
    }

    /**
     * Get all registered tenant IDs for a specific model
     * @param modelName The name of the model
     * @returns An array of tenant IDs
     */
    public getTenantIds(modelName: string): string[] {
        const modelMap = this.models.get(modelName);
        return modelMap ? Array.from(modelMap.keys()) : [];
    }

    /**
     * Remove a tenant model from the registry
     * @param modelName The name of the model
     * @param tenantId The tenant identifier
     * @returns True if the model was removed, false if it didn't exist
     */
    public removeTenantModel(modelName: string, tenantId: string): boolean {
        const modelMap = this.models.get(modelName);
        if (!modelMap) {
            return false;
        }
        return modelMap.delete(tenantId);
    }

    /**
     * Remove a master model from the registry
     * @param modelName The name of the model
     * @returns True if the model was removed, false if it didn't exist
     */
    public removeMasterModel(modelName: string): boolean {
        return this.masterModels.delete(modelName);
    }
}

export default ModelRegistry;