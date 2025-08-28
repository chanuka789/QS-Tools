
import { StairInputParams, StairMetrics, FlightData } from '../types';

export function calculateStairMetrics(params: StairInputParams): StairMetrics {
    // Convert all inputs from mm to meters, except height which is already in m
    const H = params.height;
    const SW = params.stairWidth / 1000;
    const R = params.riser / 1000;
    const T = params.tread / 1000;
    const ST = params.slabThick / 1000;
    const LL = params.landingLength / 1000;
    const LD = params.landingDepth / 1000;
    const LT = params.landingThick / 1000;

    // Return zeroed metrics if inputs are invalid, preventing crashes.
    if (R <= 0 || H <= 0 || T <= 0) {
            return {
            num_flights: 0, num_landings: 0, total_treads: 0, total_volume: 0,
            total_formwork_area: 0, formwork_bottom_slab: 0, formwork_landing_bottom: 0,
            formwork_risers: 0, formwork_above_slab: 0, volume_waist_slabs: 0,
            volume_landings: 0, volume_steps: 0, flights_data: [], R, T, ST, LD, LT
        };
    }

    // 1. Determine Flights & Landings
    const total_risers = Math.round(H / R);
    let num_flights: number;

    if (total_risers === 0) {
        num_flights = 0;
    } else if (H <= 5.7) {
        // As per user request: 0m to 5.7m -> 1 Landing (2 Flights)
        num_flights = 2;
    } else if (H <= 8) {
        // As per user request: 5.7m - 8m -> 3 Landings (4 Flights)
        num_flights = 4;
    } else if (H <= 12) {
        // As per user request: 8m - 12m -> 5 Landings (6 Flights)
        num_flights = 6;
    } else {
        // Fallback to original logic for heights above 12m for safety and sensibility.
        const MAX_RISERS_PER_FLIGHT = 18;
        num_flights = Math.ceil(total_risers / MAX_RISERS_PER_FLIGHT);
    }

    // A flight must have at least one riser. The number of flights cannot exceed the number of risers.
    // This prevents creating impossible geometry, e.g. 2 flights for a single step.
    if (total_risers > 0) {
        num_flights = Math.min(num_flights, total_risers);
    }
    
    const num_landings = num_flights > 0 ? num_flights - 1 : 0;

    // 2. Distribute Risers across flights
    const base_risers_per_flight = num_flights > 0 ? Math.floor(total_risers / num_flights) : 0;
    const extra_risers = num_flights > 0 ? total_risers % num_flights : 0;

    const flights_data: FlightData[] = [];
    for (let i = 0; i < num_flights; i++) {
        const risers = base_risers_per_flight + (i < extra_risers ? 1 : 0);
        if (risers === 0) continue;
        const treads = risers - 1;
        const run = treads * T;
        const rise = risers * R;
        const inclined_length = Math.sqrt(run**2 + rise**2);
        flights_data.push({ risers, treads, run, rise, inclined_length });
    }
    
    // 3. Detailed Component Calculation
    let formwork_bottom_slab = 0;
    let volume_waist_slabs = 0;
    let volume_steps = 0;
    let total_treads = 0;
    let total_inclined_length = 0;

    flights_data.forEach(flight => {
        total_inclined_length += flight.inclined_length;
        volume_waist_slabs += flight.inclined_length * SW * ST;
        volume_steps += (SW * T * R / 2) * flight.treads;
        total_treads += flight.treads;
    });
    
    // The user provided a formula for flight soffit and stringer formwork. To ensure correct
    // totals and avoid confusion, this is applied to the "Bottom Slab" calculation, which covers the flights.
    // This correctly adds the stringer side area to the total without double-counting other surfaces.
    // User formula: (Each Stringer Lengths) x Stair Width + (Stringer Lengths x Slab/Waist Thickness)
    formwork_bottom_slab = (total_inclined_length * SW) + (total_inclined_length * ST);

    // Landing calculations remain specific to landing dimensions.
    const formwork_landing_bottom = LL * LD * num_landings;
    const volume_landings = (LL * LD * LT) * num_landings;
    
    // Riser formwork calculation
    const formwork_risers = ((R * SW) + (R * T / 2)) * total_risers;

    // Above slab (treads) formwork is not required for stairs.
    const formwork_above_slab = 0;

    // Total volume
    const total_volume = volume_waist_slabs + volume_steps + volume_landings;

    // Total Formwork Area
    const total_formwork_area = formwork_bottom_slab + formwork_landing_bottom + formwork_risers;
    
    return {
        num_flights,
        num_landings,
        total_treads,
        total_volume,
        total_formwork_area,
        formwork_bottom_slab,
        formwork_landing_bottom,
        formwork_risers,
        formwork_above_slab,
        volume_waist_slabs,
        volume_landings,
        volume_steps,
        flights_data, R, T, ST, LD, LT
    };
}
