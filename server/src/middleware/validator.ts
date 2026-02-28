import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../types';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const monthRegex = /^\d{4}-\d{2}$/;
const positiveNumber = z.coerce.number().positive();
const nonNegativeNumber = z.coerce.number().min(0);

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  fullname: z.string().min(2).max(100),
  address: z.string().min(3).max(500),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(72),
});

const customerCreateSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(500).optional().or(z.literal('')),
  contact: z.string().max(30).optional().or(z.literal('')),
  rate_per_litre: positiveNumber,
});

const customerUpdateSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    address: z.string().max(500).optional(),
    contact: z.string().max(30).optional(),
    rate_per_litre: positiveNumber.optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: 'At least one field is required for update',
  });

const deliverySchema = z.object({
  customer_id: z
    .union([z.number(), z.string(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      return Number(val);
    })
    .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
      message: 'customer_id must be a positive integer',
    })
    .optional(),
  delivery_date: z.string().regex(dateRegex),
  quantity: nonNegativeNumber,
  status: z.enum(['delivered', 'absent', 'mixed', 'no_entry']),
  month_year: z.string().regex(monthRegex),
  rate_per_litre: z
    .union([z.number(), z.string(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      return Number(val);
    })
    .refine((val) => val === undefined || (Number.isFinite(val) && val >= 0), {
      message: 'rate_per_litre must be a non-negative number',
    })
    .optional(),
});

const rateUpdateSchema = z.object({
  rate_per_litre: positiveNumber,
});

const importSchema = z.object({
  deliveries: z.array(deliverySchema),
  customers: z.array(customerCreateSchema).optional(),
});

const billQuerySchema = z.object({
  customer_id: z.string().optional(),
  period_start: z.string().regex(dateRegex),
  period_end: z.string().regex(dateRegex),
});

const monthQuerySchema = z.object({
  month_year: z.string().regex(monthRegex).optional(),
});

const customerIdParamSchema = z.object({
  customerId: z.coerce.number().int().positive(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const monthParamSchema = z.object({
  month: z.string().regex(monthRegex),
});

const validate = (
  source: 'body' | 'params' | 'query',
  schema: z.ZodSchema
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Validation error',
      } as ApiResponse);
      return;
    }
    (req as any)[source] = parsed.data;
    next();
  };
};

export const validateRegister = validate('body', registerSchema);
export const validateLogin = validate('body', loginSchema);
export const validateCustomerCreate = validate('body', customerCreateSchema);
export const validateCustomerUpdate = validate('body', customerUpdateSchema);
export const validateDeliveryInput = validate('body', deliverySchema);
export const validateMonthlyRateUpdate = validate('body', rateUpdateSchema);
export const validateImportData = validate('body', importSchema);
export const validateBillQuery = validate('query', billQuerySchema);
export const validateMonthQuery = validate('query', monthQuerySchema);
export const validateCustomerIdParam = validate('params', customerIdParamSchema);
export const validateIdParam = validate('params', idParamSchema);
export const validateMonthParam = validate('params', monthParamSchema);
