import { Model, Optional, DataTypes, Sequelize, ModelCtor } from 'sequelize';
import { TokenAttributes } from '../types/token';
import ModelRegistry from './modelRegistry';

type TokenCreationAttributes = Optional<TokenAttributes, 'id'>;

class Token extends Model<TokenAttributes, TokenCreationAttributes> {
    declare id: number;
    declare userId: number;
    declare token: string;
    declare type: string;
    declare isRevoked: boolean;
    declare expiresAt: Date;
    declare createdAt: Date;
    declare updatedAt: Date;

    // Static method to initialize the model with a specific sequelize instance
    static initialize(sequelize: Sequelize): ModelCtor<Token> {
        return Token.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                userId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'users',
                        key: 'id'
                    }
                },
                token: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                type: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                isRevoked: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                expiresAt: {
                    type: DataTypes.DATE,
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
                modelName: 'Token',
                tableName: 'tokens',
                timestamps: true,
            }
        ) as ModelCtor<Token>;
    }

    // Helper method to get the Token model for a specific tenant
    static getTokenModel(tenantId: string): ModelCtor<Token> | undefined {
        const registry = ModelRegistry.getInstance();
        return registry.getModel<Token>('Token', tenantId);
    }
}

export default Token;