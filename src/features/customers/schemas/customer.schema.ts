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

export type CustomerFormValues = z.infer<typeof customerSchema>;
