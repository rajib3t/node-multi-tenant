import { Router } from "express";
import LoginController from "../../controllers/auth/login.controller";

import registrationController from "../../controllers/auth/registration.controller";
// Initialize Express Router instance
const authRouts:Router = Router();

// Define default routes configuration
const defaultRoutes  = [
    {
        path: '/',
        route: LoginController
    },
    {
        path: '/',
        route:registrationController
    }
];

// Register routes by iterating through default routes
defaultRoutes.forEach((route) => {
    authRouts.use(route.path, route.route);
});

// Export the configured router
export default authRouts;