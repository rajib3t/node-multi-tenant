import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';

class AsyncHandler {
  static handle(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next))
        .catch((error) => {
          
            console.error('Error in async handler:', (error as any).statusCode) ;
            
          // Handle known errors with proper status codes
          if ((error as any).statusCode) {
            return res.status((error as any).statusCode).json({
              success: false,
              message: (error as Error).message
            });
          }
          
          // Handle unexpected errors
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occurred'
          });
        });
    };
  }
}

export default AsyncHandler;