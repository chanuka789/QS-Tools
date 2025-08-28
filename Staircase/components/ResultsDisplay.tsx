import React from 'react';
import type { StairMetrics } from '../types';

// Card for the main summary totals dashboard
interface SummaryCardProps {
    label: string;
    value: string;
    color: 'indigo' | 'green' | 'blue' | 'amber';
}

const colorClasses = {
    indigo: { border: 'border-indigo-600', text: 'text-indigo-900' },
    green: { border: 'border-green-600', text: 'text-green-900' },
    blue: { border: 'border-blue-600', text: 'text-blue-900' },
    amber: { border: 'border-amber-600', text: 'text-amber-900' },
};

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color }) => {
    const colors = colorClasses[color];
    return (
        // Responsive padding and text sizes
        <div className={`bg-white border-l-4 ${colors.border} p-2 sm:p-4 rounded-r-lg rounded-l-sm`}>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{label}</p>
            <p className={`text-lg sm:text-2xl font-bold ${colors.text}`}>{value}</p>
        </div>
    );
};

// Card for the detailed breakdown sections
interface ResultCardProps {
    label: string;
    value: string | React.ReactNode;
    className?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ label, value, className = '' }) => (
    <div className={`bg-gray-50 border-l-4 border-indigo-600 p-2 sm:p-4 rounded ${className}`}>
        <p className="text-xs sm:text-sm text-gray-500">{label}</p>
        <p className="text-md sm:text-xl font-bold text-gray-800 break-words">{value}</p>
    </div>
);

interface ResultsDisplayProps {
    results: StairMetrics | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
    if (!results) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Calculated Results</h3>
                <p>Enter dimensions to see results.</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Calculated Results</h3>

            <div className="bg-indigo-50 p-4 rounded-lg mb-6 shadow-sm">
                <h4 className="text-lg font-semibold text-indigo-800 mb-3">Summary Totals</h4>
                 {/* Updated to a 2x2 grid for both web and mobile */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <SummaryCard 
                        label="Total Formwork" 
                        value={`${results.total_formwork_area.toFixed(2)} m²`} 
                        color="indigo" 
                    />
                    <SummaryCard 
                        label="Total Volume" 
                        value={`${results.total_volume.toFixed(3)} m³`} 
                        color="green" 
                    />
                    <SummaryCard 
                        label="Flights" 
                        value={results.num_flights.toString()}
                        color="blue" 
                    />
                    <SummaryCard 
                        label="Total Treads" 
                        value={results.total_treads.toString()} 
                        color="amber" 
                    />
                </div>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-600 mt-6 mb-2 border-b pb-1">General Details</h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <ResultCard label="Flights" value={results.num_flights.toString()} />
                <ResultCard label="Landings" value={results.num_landings.toString()} />
                <ResultCard label="Total Treads" value={results.total_treads.toString()} />
                <ResultCard
                    label="Stringer Lengths"
                    value={
                        <span className="text-sm sm:text-base font-bold">
                            {results.flights_data.map((flight, index) => `F${index + 1}: ${flight.inclined_length.toFixed(2)}m`).join(' | ') || 'N/A'}
                        </span>
                    }
                    className="col-span-3"
                />
            </div>

            <h4 className="text-lg font-semibold text-gray-600 mt-6 mb-2 border-b pb-1">Formwork Area Breakdown (m²)</h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <ResultCard label="Bottom Slab" value={`${results.formwork_bottom_slab.toFixed(2)} m²`} />
                <ResultCard label="Landing Bottom" value={`${results.formwork_landing_bottom.toFixed(2)} m²`} />
                <ResultCard label="Risers" value={`${results.formwork_risers.toFixed(2)} m²`} />
            </div>
            
            <h4 className="text-lg font-semibold text-gray-600 mt-6 mb-2 border-b pb-1">Concrete Volume Breakdown (m³)</h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <ResultCard label="Waist Slabs" value={`${results.volume_waist_slabs.toFixed(3)} m³`} />
                <ResultCard label="Landings" value={`${results.volume_landings.toFixed(3)} m³`} />
                <ResultCard label="Steps" value={`${results.volume_steps.toFixed(3)} m³`} />
            </div>
        </div>
    );
};

export default ResultsDisplay;