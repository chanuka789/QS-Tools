
import React, { useState, useMemo } from 'react';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import StairVisualizer from './components/StairVisualizer';
import { calculateStairMetrics } from './services/stairCalculator';
import type { StairInputParams } from './types';

const App: React.FC = () => {
    const [params, setParams] = useState<StairInputParams>({
        height: 4.0,
        stairWidth: 1950,
        riser: 180,
        tread: 280,
        slabThick: 150,
        landingLength: 4100,
        landingDepth: 1495,
        landingThick: 200,
    });

    const results = useMemo(() => {
        try {
            return calculateStairMetrics(params);
        } catch (error) {
            console.error(error);
            return null;
        }
    }, [params]);

    return (
        <div className="font-sans p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Staircase Calculator</h1>
                    <p className="text-gray-600 mt-2">Calculate formwork area and concrete volume with dynamic visualization.</p>
                </header>

                <main>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center lg:text-left">Calculator & Visualizer</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <InputForm params={params} setParams={setParams} />
                        </div>
                        <div className="lg:col-span-2">
                            <ResultsDisplay results={results} />
                            <StairVisualizer data={results} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
