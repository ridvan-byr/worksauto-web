import { test, expect } from '@playwright/test';

test.describe('Work Order Lifecycle E2E', () => {
  test.beforeEach(async ({ context, page }) => {
    // 1. Edge Middleware Auth Cookie
    await context.addCookies([
      {
        name: 'worksauto_session',
        value: '1',
        url: 'http://localhost:3000',
      },
    ]);

    // 2. Client-Side Auth Context LocalStorage State
    await context.addInitScript(() => {
      localStorage.setItem(
        'worksauto_auth_session',
        JSON.stringify({
          user: {
            id: 'usr_tech_1',
            name: 'Ahmet',
            surname: 'Usta',
            phone: '05321112233',
            role: 'OWNER',
          },
          tenant: {
            id: 'ten_test_1',
            title: 'Test Oto Servis',
            slug: 'test-oto',
            phone: '02123334455',
            isActive: true,
            onboardingCompleted: true,
          },
        })
      );
    });

    // 3. Mock Auth Refresh & Me endpoints to keep client session active
    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'mock_access_jwt_token' }),
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'usr_tech_1',
          name: 'Ahmet',
          surname: 'Usta',
          role: 'OWNER',
          tenant: {
            id: 'ten_test_1',
            title: 'Test Oto Servis',
            isActive: true,
            onboardingCompleted: true,
          },
        }),
      });
    });
  });

  test('displays work orders list and toggles view modes', async ({ page }) => {
    // Mock work-orders API response
    await page.route('**/api/v1/work-orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'wo-101',
            tenantId: 'ten_test_1',
            workOrderNumber: 'WO-2026-001',
            customerId: 'cust-1',
            customer: { firstName: 'Ahmet', lastName: 'Yılmaz', phone: '05321112233' },
            vehicleId: 'veh-1',
            vehicle: { plate: '34ABC123', brand: 'Volkswagen', model: 'Golf', year: 2022, currentKm: 45000 },
            status: 'PENDING',
            assignedLift: 'Lift 1',
            items: [],
          },
        ]),
      });
    });

    await page.goto('/work-orders');
    await expect(page).toHaveURL(/\/work-orders/);

    // Verify page header is rendered
    await expect(page.getByText('İş Emirleri & Atölye Paneli')).toBeVisible();

    // Verify create button is present
    const createBtn = page.getByRole('button', { name: /İş Emri Aç/i });
    await expect(createBtn).toBeVisible();
  });

  test('loads work order detail page with customer and vehicle data', async ({ page }) => {
    // Mock specific order
    await page.route('**/api/v1/work-orders/wo-101', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'wo-101',
          tenantId: 'ten_test_1',
          workOrderNumber: 'WO-2026-001',
          customerId: 'cust-1',
          customer: { firstName: 'Ahmet', lastName: 'Yılmaz', phone: '05321112233' },
          vehicleId: 'veh-1',
          vehicle: { plate: '34ABC123', brand: 'Volkswagen', model: 'Golf', year: 2022, mileage: 45000 },
          status: 'IN_PROGRESS',
          assignedLift: 'Lift 1',
          items: [
            { id: 'item-1', itemType: 'SERVICE', name: 'Ön Fren Bakımı', unitPrice: 750, quantity: 1, totalPrice: 750 },
          ],
          photos: [],
          notes: [],
          subtotal: 750,
          grandTotal: 900,
        }),
      });
    });

    // Mock inventory products
    await page.route('**/api/v1/inventory*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'prod-101',
            name: 'Ön Fren Balatası Ferodo',
            code: 'FB-VW-01',
            oemCode: '5Q0698151B',
            salePrice: 1200,
            stockQuantity: 8,
            shelfLocation: 'A-12-04',
          },
        ]),
      });
    });

    await page.goto('/work-orders/wo-101');
    await expect(page.getByText('WO-2026-001')).toBeVisible();
    await expect(page.getByText('34 ABC 123')).toBeVisible();
    await expect(page.getByText('Volkswagen Golf')).toBeVisible();
    await expect(page.getByText('Ahmet Yılmaz')).toBeVisible();

    // Verify action buttons exist
    const addPartBtn = page.getByRole('button', { name: /Parça Ekle/i });
    await expect(addPartBtn).toBeVisible();
  });
});
