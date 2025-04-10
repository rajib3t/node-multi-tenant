import { Router } from "express";
import IndexController from "../controllers/index.controller"
import auth from "./auth";
import { RouteConfig } from "../interfaces/route.interface";
import TenantController from "../controllers/tenant.controller"; // Import the TenantController
import tenantRouters from "./tenant";

class AppRouter {
  private router: Router;
  private routes: RouteConfig[];

  constructor() {
    this.router = Router();
    this.routes = [
      {
        path: "/",
        route: IndexController, // Import the IndexController
      },
      {
        path: "/auth",
        route: auth, // Import the LoginController
      },
      // Add other routes here
      {
        path: "/tenant",
        route: TenantController, // Import the TenantController
      },
      {
        path: "/tenants",
        route: tenantRouters, // Import the TenantController
      }
    ];
    
    this.setupRoutes();
  }



  private setupRoutes(): void {
    
    
    this.routes.forEach((route) => {
      this.router.use(route.path, route.route);
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

// Create and export router instance
const appRouter = new AppRouter();
export default appRouter.getRouter();