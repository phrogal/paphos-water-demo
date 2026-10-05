import axios from "axios";

const API_BASE_URL = 'http://localhost:8000';

export interface ForecastItem{
    date: string;
    predicted_consumption_m3: number;
}

export interface LeakCheckResult {
    status: string;
    zone: string;
    current_flow_rate: number;
    is_leak_detected: boolean;
    anomaly_score: number;
    message: string;
}

export interface WaterHistoryItem {
    Year: number;
    Pafos_Pop: number;
    Pegeia_Pop: number;
    Total_Tourist_Beds: number;
    Annual_Occupancy_Rate: number;
    Simulated_Water_Demand_m3: number;
}

export const fetchWaterHistory = async (): Promise<WaterHistoryItem[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/water-demand-history`);
    return response.data.data;
};

export const fetchForecast = async (days: number = 7): Promise<ForecastItem[]> => {
    const response = await axios.post(`${API_BASE_URL}/api/forecast`, {days_ahead: days});
    return response.data.forecast;
};

export const checkLeak = async (zone: string, flowRate: number): Promise<LeakCheckResult> => {
  const response = await axios.post(`${API_BASE_URL}/api/detect-leak`, {
    current_flow_rate: flowRate,
    district_zone: zone,
  });
  return response.data;
};