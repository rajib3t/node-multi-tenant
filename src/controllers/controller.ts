import {  Router } from 'express';
import TenantResolver from '../middlewares/tenantResolver';
export abstract class Controller{
    public readonly router: Router; 

    constructor(){
        this.router = Router()
    } 


   
    
    
}