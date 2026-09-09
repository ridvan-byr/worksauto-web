import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminStatsGrid } from '../admin-stats-grid'

describe('AdminStatsGrid Component', () => {
  it('renders platform stats accurately', () => {
    const mockStats = {
      totalTenants: 12,
      activeTenants: 10,
      suspendedTenants: 2,
      totalWorkOrders: 154,
      totalCustomers: 85,
      totalPlatformVolume: '145.000',
    }

    const mockHealth = {
      database: {
        latencyMs: 3,
      },
    }

    render(<AdminStatsGrid stats={mockStats} health={mockHealth} />)

    expect(screen.getByText('Platform Yönetim Konsolu')).toBeInTheDocument()
    expect(screen.getByText('Canlı Sistem')).toBeInTheDocument()
    expect(screen.getByText('3 ms')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('handles empty/undefined stats gracefully with fallback values', () => {
    render(<AdminStatsGrid />)

    expect(screen.getByText('Platform Yönetim Konsolu')).toBeInTheDocument()
    expect(screen.getByText('1 ms')).toBeInTheDocument()
  })
})
