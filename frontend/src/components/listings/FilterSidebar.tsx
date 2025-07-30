import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DualRangeSlider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface FilterSidebarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  searchTerm,
  setSearchTerm,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  applyFilters,
  clearFilters,
}) => {
  return (
    <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 p-6 bg-white dark:bg-neutral-900 rounded-lg shadow-md h-fit sticky top-20">
      <h3 className="text-xl font-bold mb-4">Filters</h3>
      <div className="space-y-6">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="text-sm font-medium">Search by keyword</label>
          <div className="relative mt-1">
            <Input
              id="search"
              placeholder="e.g., 'Gym' or 'Concert'"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Price Range Slider */}
        <DualRangeSlider
          min={0}
          max={50000}
          step={500}
          value={priceRange}
          onValueChange={setPriceRange}
        />

        {/* Sort By Dropdown */}
        <div>
          <label htmlFor="sort" className="text-sm font-medium">Sort by</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort" className="w-full mt-1">
              <SelectValue placeholder="Sort results..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="createdAt_desc">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button onClick={applyFilters} className="w-full">
            <Search className="mr-2 h-4 w-4" /> Apply Filters
          </Button>
          <Button variant="ghost" onClick={clearFilters} className="w-full">
            <X className="mr-2 h-4 w-4" /> Clear All
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
