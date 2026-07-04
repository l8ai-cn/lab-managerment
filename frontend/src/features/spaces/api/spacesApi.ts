import { api } from "@/shared/api/client";
import type { BuildingTree } from "@/features/labs/types/lab";

export interface Building {
  id: string;
  name: string;
  code: string;
  address?: string;
}

export interface Floor {
  id: string;
  building_id: string;
  name: string;
  floor_number: number;
}

export interface Room {
  id: string;
  floor_id: string;
  name: string;
  code?: string;
  area_sqm?: number;
}

export const spacesApi = {
  getTree: () => api.get<BuildingTree[]>("/buildings/tree").then((r) => r.data),

  listBuildings: () => api.get<Building[]>("/buildings").then((r) => r.data),

  createBuilding: (data: { name: string; code: string; address?: string }) =>
    api.post<Building>("/buildings", data).then((r) => r.data),

  createFloor: (data: { building_id: string; name: string; floor_number: number }) =>
    api.post<Floor>("/floors", data).then((r) => r.data),

  createRoom: (data: { floor_id: string; name: string; code?: string; area_sqm?: number }) =>
    api.post<Room>("/rooms", data).then((r) => r.data),
};
