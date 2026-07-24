import React from 'react';
import { render, screen } from '@testing-library/react';
import { YieldWaterfall } from '@/components/YieldWaterfall';

describe('YieldWaterfall Component', () => {
  const mockYieldData = {
    net_yield: "30.60",
    champions_fee: "6.12",
    opportunity_fee: "2.04",
    core_fee: "2.04"
  };

  it('mounts successfully and renders the 5-card waterfall', () => {
    render(<YieldWaterfall latestYield={mockYieldData} />);
    
    // Check main heading mounts
    expect(screen.getByText('Automated Yield Distribution (75/8/7/5/5 Waterfall)')).toBeInTheDocument();
  });

  it('renders the correct numerical splits based on mock data', () => {
    render(<YieldWaterfall latestYield={mockYieldData} />);

    // net_yield (75%)
    expect(screen.getByText('INVESTOR NET YIELD (75%)')).toBeInTheDocument();
    expect(screen.getByText('$30.60')).toBeInTheDocument();

    // champions_fee O&M (8%) = 6.12 * (8/15) = 3.264
    expect(screen.getByText('O&M (8%)')).toBeInTheDocument();
    expect(screen.getByText('$3.26')).toBeInTheDocument();

    // champions_fee RESERVES (7%) = 6.12 * (7/15) = 2.856
    expect(screen.getByText('RESERVES (7%)')).toBeInTheDocument();
    expect(screen.getByText('$2.86')).toBeInTheDocument();

    // opportunity_fee (5%)
    expect(screen.getByText('EXPANSION FUND (5%)')).toBeInTheDocument();

    // core_fee (5%)
    expect(screen.getByText('PLATFORM FEE (5%)')).toBeInTheDocument();
    // Use getAllByText for duplicates if opportunity_fee and core_fee have the same value (2.04)
    const twoOhFours = screen.getAllByText('$2.04');
    expect(twoOhFours.length).toBe(2);
  });
});
