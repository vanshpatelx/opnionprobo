import { Response } from 'express';
import { z } from 'zod';

const handleError = (res: Response, error: unknown, defaultMessage: string): void => {
    if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors.map((e) => e.message).join(', ') });
    } else {
        console.error(defaultMessage, error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

export { handleError };
