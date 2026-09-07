import { z } from 'zod';

export const customerSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'CORPORATE', 'individual', 'corporate']).optional().default('INDIVIDUAL'),
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır').max(50, 'Ad en fazla 50 karakter olabilir'),
  lastName: z.string().max(50, 'Soyad en fazla 50 karakter olabilir').optional().default(''),
  phone: z
    .string()
    .min(10, 'Telefon numarası en az 10 haneli olmalıdır')
    .max(20, 'Telefon numarası en fazla 20 hane olabilir')
    .regex(/^[0-9+() -]+$/, 'Geçerli bir telefon formatı giriniz'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().or(z.literal('')),
  companyTitle: z.string().max(100, 'Firma unvanı en fazla 100 karakter olabilir').optional().or(z.literal('')),
  taxNumber: z.string().max(20, 'Vergi no en fazla 20 karakter olabilir').optional().or(z.literal('')),
  taxOffice: z.string().max(50, 'Vergi dairesi en fazla 50 karakter olabilir').optional().or(z.literal('')),
  city: z.string().max(50).optional().or(z.literal('')),
  district: z.string().max(50).optional().or(z.literal('')),
  address: z.string().max(255, 'Adres en fazla 255 karakter olabilir').optional().or(z.literal('')),
  notes: z.string().max(500, 'Notlar en fazla 500 karakter olabilir').optional().or(z.literal('')),
});

export const createCustomerStep1Schema = z
  .object({
    customerType: z.enum(['individual', 'corporate']),
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    surname: z.string().optional().default(''),
    companyTitle: z.string().optional().default(''),
    taxOffice: z.string().optional().default(''),
    taxNumber: z.string().optional().default(''),
    phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz (en az 10 hane)'),
    email: z.string().email('Geçerli bir e-posta giriniz').optional().or(z.literal('')),
    city: z.string().optional().default('İstanbul'),
    district: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.customerType === 'individual') {
      if (!data.surname || data.surname.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Soyad zorunludur.',
          path: ['surname'],
        });
      }
    } else {
      if (!data.companyTitle || data.companyTitle.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Şirket ünvanı zorunludur.',
          path: ['companyTitle'],
        });
      }
      if (!data.taxNumber || data.taxNumber.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Kurumsal müşteriler için en az 10 haneli Vergi Numarası zorunludur.',
          path: ['taxNumber'],
        });
      }
    }
  });

export const createCustomerStep2Schema = z.object({
  plate: z.string().min(2, 'Plaka zorunludur.'),
  brand: z.string().min(1, 'Marka zorunludur.'),
  model: z.string().min(1, 'Model zorunludur.'),
  year: z
    .number({ message: 'Model yılı sayı olmalıdır' })
    .min(1950, 'Model yılı 1950 den küçük olamaz')
    .max(new Date().getFullYear() + 1, 'Geçerli bir model yılı giriniz'),
  kilometer: z
    .number({ message: 'Kilometre sayı olmalıdır' })
    .min(0, 'Kilometre negatif olamaz.')
    .optional()
    .default(0),
  fuelType: z.enum(['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik']).default('Benzin'),
  transmission: z.enum(['Manuel', 'Otomatik']).default('Otomatik'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
export type CreateCustomerStep1Values = z.infer<typeof createCustomerStep1Schema>;
export type CreateCustomerStep2Values = z.infer<typeof createCustomerStep2Schema>;
