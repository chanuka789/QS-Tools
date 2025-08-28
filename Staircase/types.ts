export interface StairInputParams {
  height: number;
  stairWidth: number;
  riser: number;
  tread: number;
  slabThick: number;
  landingLength: number;
  landingDepth: number;
  landingThick: number;
}

export interface FlightData {
  risers: number;
  treads: number;
  run: number;
  rise: number;
  inclined_length: number;
}

export interface StairMetrics {
  num_flights: number;
  num_landings: number;
  total_treads: number;
  total_volume: number;
  total_formwork_area: number;
  formwork_bottom_slab: number;
  formwork_landing_bottom: number;
  formwork_risers: number;
  formwork_above_slab: number;
  volume_waist_slabs: number;
  volume_landings: number;
  volume_steps: number;
  flights_data: FlightData[];
  R: number; 
  T: number; 
  ST: number; 
  LD: number;
  LT: number; 
}