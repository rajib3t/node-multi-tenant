import { Router } from "express";
import LoginController from "../controllers/tenant/auth/login.controller";
import registrationController from "../controllers/tenant/auth/registration.controller";
import path from "path";
import router from "../controllers/tenant/auth/login.controller";
import profileController from "../controllers/tenant/profile.controller";
const tenantRouters:Router = Router();


// Define default routes configuration



// Define default routes configuration
const defaultRoutes  = [
    {
        path: '/auth',
        route: LoginController
    },
    {
        path: '/auth',
        route:registrationController
    },
    {
        path: '/profile',
        route: profileController
    }
];



// Register routes by iterating through default routes
defaultRoutes.forEach((route) => {
    tenantRouters.use(route.path, route.route);
});

// Export the configured router
export default tenantRouters;