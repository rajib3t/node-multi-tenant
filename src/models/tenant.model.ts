import { Model, Optional, DataTypes, Sequelize, ModelCtor } from 'sequelize';
import { TenantAttributes } from '../types/tenant';

import ModelRegistry from './modelRegistry';

type TenantCreationAttributes = Optional<TenantAttributes, 'id'>;

class Tenant extends Model<TenantAttributes, TenantCreationAttributes> {

    declare id: number;
    declare name: string;
    declare databaseName: string;
    declare databaseUser: string;
    declare databasePassword: string;
    declare createdAt: Date;
    declare updatedAt: Date;
    static initialize(sequelize: Sequelize): ModelCtor<Tenant> {
        return Tenant.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                databaseName: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                databaseUser: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                databasePassword: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                }
            },
            {
                sequelize,
                modelName: 'Tenant',
                tableName: 'tenants',
                timestamps: true
            }
        ) as ModelCtor<Tenant>;
    }

    // Helper method to get the Token model for a specific tenant
    static getTokenModel(tenantId: string): ModelCtor<Tenant> | undefined {
        const registry = ModelRegistry.getInstance();
        return registry.getModel<Tenant>('Tenant', tenantId);
    }
   
}

export default Tenant;