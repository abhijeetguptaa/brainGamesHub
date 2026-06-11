// src/store/useUnlockModalStore.ts
import { create } from 'zustand';

interface UnlockModalState {
  isOpen: boolean;
  featureName: string;
  coinCost: number;
  onConfirm: () => void;
  openModal: (featureName: string, coinCost: number, onConfirm: () => void) => void;
  closeModal: () => void;
}

const useUnlockModalStore = create<UnlockModalState>((set) => ({
  isOpen: false,
  featureName: '',
  coinCost: 0,
  onConfirm: () => {},
  openModal: (featureName, coinCost, onConfirm) =>
    set({ isOpen: true, featureName, coinCost, onConfirm }),
  closeModal: () => set({ isOpen: false, featureName: '', coinCost: 0, onConfirm: () => {} }),
}));

export default useUnlockModalStore;
