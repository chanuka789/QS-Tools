import React from 'react';
import type { StairInputParams } from '../types';

interface InputGroupProps {
    id: keyof StairInputParams;
    label: string;
    unit: string;
    value: number;
    step?: number;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Updated component for better responsive display in a 2-column grid.
const InputGroup: React.FC<InputGroupProps> = ({ id, label, unit, value, step = 1, onInputChange }) => (
    <div>
        {/* Responsive text size for labels */}
        <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-gray-700">{label} ({unit})</label>
        <input
            type="number"
            id={id}
            name={id}
            value={value}
            step={step}
            onChange={onInputChange}
            // Responsive padding and text size for inputs
            className="mt-1 block w-full p-1 text-sm sm:p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
);

interface InputFormProps {
    params: StairInputParams;
    setParams: React.Dispatch<React.SetStateAction<StairInputParams>>;
}

const InputForm: React.FC<InputFormProps> = ({ params, setParams }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setParams(prevParams => ({
            ...prevParams,
            [name]: parseFloat(value) || 0,
        }));
    };

    const staircaseInputs: Omit<InputGroupProps, 'value' | 'onInputChange'>[] = [
        { id: 'height', label: 'Staircase Height', unit: 'm', step: 0.1 },
        { id: 'stairWidth', label: 'Stair Width', unit: 'mm' },
        { id: 'riser', label: 'Riser Height', unit: 'mm' },
        { id: 'tread', label: 'Tread Depth', unit: 'mm' },
    ];
    
    const componentInputs: Omit<InputGroupProps, 'value' | 'onInputChange'>[] = [
        { id: 'slabThick', label: 'Slab/Waist Thickness', unit: 'mm' },
        { id: 'landingThick', label: 'Landing Thickness', unit: 'mm' },
        { id: 'landingLength', label: 'Landing Length', unit: 'mm' },
        { id: 'landingDepth', label: 'Landing Depth', unit: 'mm' },
    ];

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Enter Dimensions</h3>
            
            <h4 className="text-lg font-semibold text-gray-600 mt-6 mb-2 border-b pb-1">Staircase Details</h4>
            {/* Changed to grid-cols-2 on all screen sizes, with smaller gaps on mobile */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4">
                {staircaseInputs.map((input) => (
                    <InputGroup
                        key={input.id}
                        {...input}
                        value={params[input.id]}
                        onInputChange={handleInputChange}
                    />
                ))}
            </div>

            <h4 className="text-lg font-semibold text-gray-600 mt-6 mb-2 border-b pb-1">Component Dimensions</h4>
            {/* Changed to grid-cols-2 on all screen sizes, with smaller gaps on mobile */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4">
                {componentInputs.map((input) => (
                    <InputGroup
                        key={input.id}
                        {...input}
                        value={params[input.id]}
                        onInputChange={handleInputChange}
                    />
                ))}
            </div>
        </div>
    );
};

export default InputForm;