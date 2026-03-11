import { create } from 'zustand';

interface CustomerStore {
  selectedCustomerId: string | null;
  customerSearch: string;
  setSelectedCustomerId: (id: string | null) => void;
  setCustomerSearch: (search: string) => void;
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  selectedCustomerId: null,
  customerSearch: '',
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  setCustomerSearch: (search) => set({ customerSearch: search }),
}));

interface ContainerFiltersStore {
  customerId?: string;
  tradeLane?: string;
  year: number;
  setCustomerId: (id?: string) => void;
  setTradeLane: (lane?: string) => void;
  setYear: (year: number) => void;
}

export const useContainerFiltersStore = create<ContainerFiltersStore>((set) => ({
  year: new Date().getFullYear(),
  setCustomerId: (customerId) => set({ customerId }),
  setTradeLane: (tradeLane) => set({ tradeLane }),
  setYear: (year) => set({ year }),
}));
