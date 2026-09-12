import { z } from 'zod';

const currentYear = new Date().getFullYear();
const maxYear = currentYear + 1;

export const editVehicleSchema = z.object({
  plate: z
    .string()
    .min(2, 'Plaka en az 2 karakter olmalıdır.')
    .max(20, 'Plaka en fazla 20 karakter olabilir.'),
  brand: z.string().min(1, 'Marka zorunludur.').max(50),
  model: z.string().min(1, 'Model zorunludur.').max(50),
  year: z
    .number({ message: 'Model yılı geçerli bir sayı olmalıdır' })
    .min(1950, 'Model yılı 1950 den küçük olamaz')
    .max(maxYear, `Model yılı 1950 ile ${maxYear} arasında olmalıdır.`),
  kilometer: z
    .number({ message: 'Kilometre geçerli bir sayı olmalıdır' })
    .min(0, 'Kilometre negatif olamaz.'),
  fuelType: z.enum(['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik']),
  transmission: z.enum(['Manuel', 'Otomatik']),
  color: z.string().max(30).optional().or(z.literal('')),
  vin: z
    .string()
    .max(17, 'Şasi numarası (VIN) en fazla 17 karakter olmalıdır.')
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val.length === 17, {
      message: 'Şasi numarası (VIN) tam 17 karakter olmalıdır.',
    }),
  engineNo: z.string().max(50).optional().or(z.literal('')),
});

export type EditVehicleFormValues = z.infer<typeof editVehicleSchema>;

export const createVehicleSchema = editVehicleSchema.extend({
  customerId: z.string().min(1, 'Lütfen araca ait bir müşteri seçin.'),
});

export type CreateVehicleFormValues = z.infer<typeof createVehicleSchema>;
