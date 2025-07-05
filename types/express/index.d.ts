declare namespace Express {
    export interface Request {
      userId?: string;
    }
    declare module "express" {
      interface Request {
        userId?: string;
      }
    }
  }
  

