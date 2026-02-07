'use client';

import { useState } from 'react';

interface TransactionFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  type: 'all' | 'send' | 'receive' | 'bridge';
  status: 'all' | 'pending' | 'completed' | 'failed';
}

export function TransactionFilters({ onFilterChange }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'all',
  });

  const handleTypeChange = (type: FilterState['type']) => {
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (status: FilterState['status']) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const FilterButton = ({
    active,
    onClick,
    children
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
          ? 'bg-[#F4673B] text-white shadow-sm'
          : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
    >
      {children}
    </button>
  );

  return (
    <div className="glass-card p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Type Filters */}
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-2 block">Type</label>
          <div className="flex gap-2 flex-wrap">
            <FilterButton active={filters.type === 'all'} onClick={() => handleTypeChange('all')}>
              All
            </FilterButton>
            <FilterButton active={filters.type === 'send'} onClick={() => handleTypeChange('send')}>
              Sent
            </FilterButton>
            <FilterButton active={filters.type === 'receive'} onClick={() => handleTypeChange('receive')}>
              Received
            </FilterButton>
            <FilterButton active={filters.type === 'bridge'} onClick={() => handleTypeChange('bridge')}>
              Bridge
            </FilterButton>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-2 block">Status</label>
          <div className="flex gap-2 flex-wrap">
            <FilterButton active={filters.status === 'all'} onClick={() => handleStatusChange('all')}>
              All
            </FilterButton>
            <FilterButton active={filters.status === 'pending'} onClick={() => handleStatusChange('pending')}>
              Pending
            </FilterButton>
            <FilterButton active={filters.status === 'completed'} onClick={() => handleStatusChange('completed')}>
              Completed
            </FilterButton>
            <FilterButton active={filters.status === 'failed'} onClick={() => handleStatusChange('failed')}>
              Failed
            </FilterButton>
          </div>
        </div>
      </div>
    </div>
  );
}
