import Express  from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {SERVER_CONFIG} from "./config";
import TenantDatabase   from "./database";
import router from './routes'; // Import the router
import { IDatabase } from "./interfaces/database.interface";
import {initializeMasterModels} from "./models/modelsInit"; // Import the function to initialize models
class Server {
    private app: Express.Application; // Express application instance
    private port: number; // Port number for the server
    private database!: IDatabase; // Placeholder for database connection instance
    constructor() {
        this.app = Express();
        this.port = SERVER_CONFIG.PORT ? parseInt(SERVER_CONFIG.PORT as string) : 3000; // Default to 3000 if PORT is not set
        this.setupMiddleware(); // Setup middleware
        this.initDatabase(); // Initialize database connection
    }
    
    /**
     * Setup middleware for the Express server
     */
    // This method configures the middleware for the Express server
    // It uses body-parser to parse JSON request bodies, cookie-parser to parse cookies,
    // and cors to handle Cross-Origin Resource Sharing (CORS) for the server.
    // The CORS configuration allows requests from specific origins in production mode
    private async setupMiddleware(): Promise<void> {
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(cors({
            origin: SERVER_CONFIG.ALLOWED_ORIGINS,
            credentials: true
        }));

        this.app.use('/', router);
       
    }


    private async initDatabase(): Promise<void> {
        try {
            this.database = TenantDatabase.getInstance();
            await this.database.connect();
            initializeMasterModels(); // Initialize models for the master database
            console.log('Master database connection initialized successfully');
            // Initialize models for tenant databases
            console.log('Database connection initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }
    /**
     * Start the server
     * @returns {Promise<void>} A promise that resolves when the server starts
     */
    public async start():  Promise<void>  {
        try {
            await this.initDatabase(); // Initialize the database connection
            return new Promise((resolve) => {
                this.app.listen(this.port, () => {
                    console.log(`Server running on port ${this.port}`); // Log the port number
                    console.log(`CORS enabled for origin: ${SERVER_CONFIG.ALLOWED_ORIGINS}`); // Log the CORS configuration
                    resolve();
                });
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Singleton pattern for the server
const server = new Server();
server.start().then(() => {
    console.log('Server is fully initialized');
    console.log('Base URL:', `${SERVER_CONFIG.BASE_URL}`); // Log the base URL
}).catch(err => {
    console.error('Server initialization failed:', err);
});

export default server;