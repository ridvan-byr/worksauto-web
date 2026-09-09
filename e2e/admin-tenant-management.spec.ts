import { test, expect } from '@playwright/test';

test.describe('Super Admin Tenant Management E2E', () => {
  test.beforeEach(async ({ context }) => {
    // 1. Edge Middleware Super Admin Session Cookie
    await context.addCookies([
      {
        name: 'worksauto_admin_session',
        value: '1',
        url: 'http://localhost:3000',
      },
    ]);

    // 2. Client-Side Admin Auth State in LocalStorage
    await context.addInitScript(() => {
      localStorage.setItem(
        'worksauto_admin_user',
        JSON.stringify({
          id: 'admin_1',
          name: 'Süper',
          surname: 'Yönetici',
          email: 'admin@worksauto.com',
          phone: '05550000000',
          role: 'SUPER_ADMIN',
        })
      );
    });
  });

  test('admin dashboard loads KPI metrics and tenants table', async ({ page }) => {
    // 1. Mock admin statistics API
    await page.route('**/api/v1/admin/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalTenants: 12,
          activeTenants: 10,
          inactiveTenants: 2,
          suspendedTenants: 0,
          totalUsers: 48,
          totalWorkOrders: 1420,
        }),
      });
    });

    // 2. Mock admin tenants list API
    await page.route('**/api/v1/admin/tenants*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'tenant-1',
            title: 'Kadıköy Bosch Car Service',
            city: 'İstanbul',
            district: 'Kadıköy',
            owner: 'Hasan Yılmaz',
            ownerPhone: '05321112233',
            isActive: true,
            createdAt: '2026-01-10T10:00:00.000Z',
            stats: { totalStaff: 6, totalWorkOrders: 120 },
          },
          {
            id: 'tenant-2',
            title: 'Ankara Otomotiv Garaj',
            city: 'Ankara',
            district: 'Çankaya',
            owner: 'Murat Kara',
            ownerPhone: '05554443322',
            isActive: false,
            createdAt: '2026-02-15T12:00:00.000Z',
            stats: { totalStaff: 4, totalWorkOrders: 45 },
          },
        ]),
      });
    });

    // 3. Mock admin health API
    await page.route('**/api/v1/admin/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          database: { latencyMs: 2, status: 'ok' },
          redis: { latencyMs: 1, status: 'ok' },
        }),
      });
    });

    // 4. Mock audit logs API
    await page.route('**/api/v1/admin/audit-logs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
        }),
      });
    });

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);

    // Verify platform header
    await expect(page.getByText('Platform Yönetim Konsolu')).toBeVisible();

    // Verify stats grid cards are visible
    await expect(page.getByText('Toplam Kayıtlı Servis')).toBeVisible();
    await expect(page.getByText('12', { exact: true })).toBeVisible();

    // Verify tenant rows in the table
    await expect(page.getByText('Kadıköy Bosch Car Service')).toBeVisible();
    await expect(page.getByText('Ankara Otomotiv Garaj')).toBeVisible();

    // Verify action button
    await expect(page.getByRole('button', { name: /Yeni Servis Ekle/i })).toBeVisible();
  });

  test('filters tenants by search query', async ({ page }) => {
    await page.route('**/api/v1/admin/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalTenants: 2, activeTenants: 2, totalUsers: 8, totalWorkOrders: 50 }),
      });
    });

    await page.route('**/api/v1/admin/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', database: { latencyMs: 1 } }),
      });
    });

    await page.route('**/api/v1/admin/audit-logs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
      });
    });

    await page.route('**/api/v1/admin/tenants*', async (route) => {
      const url = route.request().url();
      if (url.includes('search=Kad') || url.includes('search=kad')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'tenant-1',
              title: 'Kadıköy Bosch Car Service',
              city: 'İstanbul',
              district: 'Kadıköy',
              isActive: true,
              createdAt: '2026-01-10T10:00:00.000Z',
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'tenant-1',
              title: 'Kadıköy Bosch Car Service',
              city: 'İstanbul',
              district: 'Kadıköy',
              isActive: true,
              createdAt: '2026-01-10T10:00:00.000Z',
            },
            {
              id: 'tenant-2',
              title: 'İzmir Ege Oto Servis',
              city: 'İzmir',
              district: 'Bornova',
              isActive: true,
              createdAt: '2026-02-10T10:00:00.000Z',
            },
          ]),
        });
      }
    });

    await page.goto('/admin');
    await expect(page.getByText('Kadıköy Bosch Car Service')).toBeVisible();
    await expect(page.getByText('İzmir Ege Oto Servis')).toBeVisible();

    // Use search input
    const searchInput = page.getByPlaceholder(/Servis adı, şehir/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Kadıköy');

    // Verify filtered result remains visible
    await expect(page.getByText('Kadıköy Bosch Car Service')).toBeVisible();
  });
});
