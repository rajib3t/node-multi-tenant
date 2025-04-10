import { Model, Optional, Sequelize, DataTypes, ModelCtor } from 'sequelize';
import { UserAttributes } from '../types/user';
import bcrypt from "bcryptjs";
import ModelRegistry from './modelRegistry';

type UserCreationAttributes = Optional<UserAttributes, 'id'>;

class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  static initialize(sequelize: Sequelize): ModelCtor<User> {
    const model = User.init(
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
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
        },
        updatedAt: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        defaultScope: {
          attributes: {
            exclude: ['password']
          }
        },
        scopes: {
          withPassword: {
            attributes: {
              include: [
                'password'
              ]
            },
          }
        },
      }
    ) as ModelCtor<User>;

    // Add hooks
    model.beforeCreate(async (user: User) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    });

    model.beforeUpdate(async (user: User) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    });

    return model;
  }

  // Helper method to verify password
  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Helper method to get the User model for a specific tenant
  static getUserModel(tenantId: string): ModelCtor<User> | undefined {
    const registry = ModelRegistry.getInstance();
    return registry.getModel<User>('User', tenantId);
  }
}

export default User;