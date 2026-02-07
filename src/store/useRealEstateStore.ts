import { create } from 'zustand';
import type { RealEstateProperty, SimulationResult } from '../types/realEstate';
import { runSimulation } from '../services/realEstateCalc';

interface RealEstateState {
  properties: RealEstateProperty[];
  selectedPropertyId: string | null;
  simulationResult: SimulationResult | null;

  addProperty: (property: RealEstateProperty) => void;
  removeProperty: (id: string) => void;
  updateProperty: (id: string, property: RealEstateProperty) => void;
  selectProperty: (id: string | null) => void;
  runSimulationForProperty: (id: string) => void;
}

const STORAGE_KEY = 'silver-real-estate-properties';

function loadFromStorage(): RealEstateProperty[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(properties: RealEstateProperty[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
}

export const useRealEstateStore = create<RealEstateState>((set, get) => ({
  properties: loadFromStorage(),
  selectedPropertyId: null,
  simulationResult: null,

  addProperty: (property) => {
    const updated = [...get().properties, property];
    saveToStorage(updated);
    set({
      properties: updated,
      selectedPropertyId: property.id,
      simulationResult: runSimulation(property),
    });
  },

  removeProperty: (id) => {
    const updated = get().properties.filter((p) => p.id !== id);
    saveToStorage(updated);
    const newSelected = get().selectedPropertyId === id ? null : get().selectedPropertyId;
    set({
      properties: updated,
      selectedPropertyId: newSelected,
      simulationResult: newSelected
        ? runSimulation(updated.find((p) => p.id === newSelected)!)
        : null,
    });
  },

  updateProperty: (id, property) => {
    const updated = get().properties.map((p) => (p.id === id ? property : p));
    saveToStorage(updated);
    set({
      properties: updated,
      simulationResult:
        get().selectedPropertyId === id ? runSimulation(property) : get().simulationResult,
    });
  },

  selectProperty: (id) => {
    if (!id) {
      set({ selectedPropertyId: null, simulationResult: null });
      return;
    }
    const property = get().properties.find((p) => p.id === id);
    if (property) {
      set({
        selectedPropertyId: id,
        simulationResult: runSimulation(property),
      });
    }
  },

  runSimulationForProperty: (id) => {
    const property = get().properties.find((p) => p.id === id);
    if (property) {
      set({ simulationResult: runSimulation(property) });
    }
  },
}));
