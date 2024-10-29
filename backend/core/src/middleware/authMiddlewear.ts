import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const JWT_SECRET = 'your_jwt_secret_key';

interface User {
    id: string;
    username: string;
    password: string;
    role: string;
}

declare module 'express-serve-static-core' {
    interface Request {
      user?: User;
    }
  }
  
const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.sendStatus(401);
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        req.user = user as User;
        next();
    });
};

export { authenticateJWT };
