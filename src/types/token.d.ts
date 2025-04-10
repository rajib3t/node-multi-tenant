export type TokenAttributes = {
    id?: number;
    userId: number;
    token: string;
    type: string;
    isRevoked: boolean;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}


export type TokenDecode = {
    userId: number;
    email: string;
    tenant?: string;
    iat?: number;
    exp?: number;
}