import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { userContext } from '../utils/context';

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Unauthorized', details: info?.message });
        }
        req.user = user;

        // Wrap the next call in the user context
        userContext.run({ userId: user.id }, () => {
            next();
        });
    })(req, res, next);
};
