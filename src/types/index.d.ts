declare global {
    namespace Express {
      interface Request {
        tenantId: string;
      }
    }
  }