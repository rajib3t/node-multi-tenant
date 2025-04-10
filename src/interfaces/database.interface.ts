import { Dialect } from 'sequelize';
import { Sequelize } from 'sequelize';
export interface DatabaseConfig {
    dialect:Dialect,
    host: string;
    username: string;
    password: string;
    database: string;
    port?: number;
    models: string[];
    define: {
        timestamps: boolean;
        [key: string]: any;
    };
  }


  export interface IDatabase {
    getMasterConnection(): Sequelize;
    getTenantConnection(tenantId: string): Promise<Sequelize>;
    connect(): Promise<void>;
    closeAllConnections(): Promise<void>;
  }

