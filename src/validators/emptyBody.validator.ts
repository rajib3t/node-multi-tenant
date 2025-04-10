import { Request, Response, NextFunction } from 'express';

import httpStatus from 'http-status';

class EmptyBodyValidator {
    public  validate (requiredFields: string[]) {
        
        
        return (req: Request, res: Response, next: NextFunction): void => {
            
            // Check if the request method is POST
            if (req.method !== 'POST') {
                res.status(httpStatus.METHOD_NOT_ALLOWED).json({
                    success: false,
                    message: 'Method not allowed. Only POST requests are accepted.',
                });
                return;
            }                    
            // Check if the request headers contain 'Content-Type: application/json'
            if (!req.headers['content-type'] || req.headers['content-type'] !== 'application/json') {
                res.status(httpStatus.UNSUPPORTED_MEDIA_TYPE).json({
                    success: false,
                    message: 'Unsupported Media Type. Content-Type must be application/json',
                });
                return;
            }
            // Check if the request body is a valid JSON object
            if (typeof req.body !== 'object' || Array.isArray(req.body)) {
                res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid request body. Expected a JSON object',
                });
                return;
            }

            // Check if the request body is empty
            if (Object.keys(req.body).length === 0) {
                res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: 'Request body cannot be empty',
                });
                return;
            }
            // Check for missing required fields
          const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');
          
          if (missingFields.length > 0) {
            res.status(httpStatus.BAD_REQUEST).json({
              success: false,
              message: `Missing required fields: ${missingFields.join(', ')}`,
            });
            return;
          }
          
          next();
        };
      };
}

export default EmptyBodyValidator
