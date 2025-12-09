import type { Booking, Dataset } from "@shared/schema";

export interface UploadResponse {
  headers: string[];
}

export interface CreateDatasetRequest {
  file: File;
  name: string;
  columnMapping: Record<string, string>;
}

export interface CreateDatasetResponse {
  dataset: Dataset;
  bookingsCount: number;
}

export interface KPIData {
  totalRevenue: number;
  totalBookings: number;
  averageDailyRate: number;
  cancellationRate: number;
  averageLeadTime: number;
  repeatGuestRate: number;
  occupancyRate?: number;
}

export interface TrendData {
  date: string;
  revenue: number;
  bookings: number;
  adr: number;
}

export interface ChannelPerformance {
  channel: string;
  revenue: number;
  bookings: number;
  adr: number;
  cancellationRate: number;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Upload failed");
  }

  return response.json();
}

export async function createDataset(request: CreateDatasetRequest): Promise<CreateDatasetResponse> {
  const formData = new FormData();
  formData.append("file", request.file);
  formData.append("name", request.name);
  formData.append("columnMapping", JSON.stringify(request.columnMapping));

  const response = await fetch("/api/datasets", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Dataset creation failed" }));
    throw new Error(error.message || "Dataset creation failed");
  }

  return response.json();
}

export async function getDatasets(): Promise<Dataset[]> {
  const response = await fetch("/api/datasets");

  if (!response.ok) {
    throw new Error("Failed to fetch datasets");
  }

  return response.json();
}

export async function getKPIs(datasetId?: number): Promise<KPIData> {
  const url = datasetId 
    ? `/api/analytics/kpis?datasetId=${datasetId}`
    : "/api/analytics/kpis";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch KPIs");
  }

  return response.json();
}

export async function getTrends(datasetId?: number): Promise<TrendData[]> {
  const url = datasetId 
    ? `/api/analytics/trends?datasetId=${datasetId}`
    : "/api/analytics/trends";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch trends");
  }

  return response.json();
}

export async function getChannelPerformance(datasetId?: number): Promise<ChannelPerformance[]> {
  const url = datasetId 
    ? `/api/analytics/channels?datasetId=${datasetId}`
    : "/api/analytics/channels";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch channel performance");
  }

  return response.json();
}

export async function getBookings(datasetId?: number): Promise<Booking[]> {
  const url = datasetId 
    ? `/api/bookings?datasetId=${datasetId}`
    : "/api/bookings";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  return response.json();
}
