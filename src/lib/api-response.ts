import { NextResponse } from 'next/server';
import { Logger } from './logger';
import { z } from 'zod';

type ErrorResponseOptions = {
    status?: number;
    code?: string;
    context?: Record<string, any>;
};

export class ApiHelper {
    /**
     * Creates a standardized error response.
     * Redacts stack traces in production.
     */
    static errorResponse(message: string, error?: any, options: ErrorResponseOptions = {}) {
        const status = options.status || 500;
        const isProduction = process.env.NODE_ENV === 'production';

        // Log the full error internally
        Logger.error(message, error, {
            status,
            code: options.code,
            ...options.context
        });

        // Prepare response body
        const body: Record<string, any> = {
            success: false,
            error: message,
            code: options.code || 'INTERNAL_ERROR',
        };

        if (!isProduction && error) {
            body.details = error instanceof Error ? error.message : error;
            if (error instanceof Error) {
                body.stack = error.stack;
            }
        }

        if (error instanceof z.ZodError) {
            body.code = 'VALIDATION_ERROR';
            body.details = error.errors;
        }

        return NextResponse.json(body, { status });
    }

    static successResponse(data: any, status = 200) {
        return NextResponse.json({
            success: true,
            data
        }, { status });
    }
}
