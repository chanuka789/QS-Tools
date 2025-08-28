import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { StairMetrics } from '../types';

interface StairVisualizerProps {
    data: StairMetrics | null;
}

const StairVisualizer: React.FC<StairVisualizerProps> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    const zoomIn = () => setZoom(prev => Math.min(prev * 1.25, 10));
    const zoomOut = () => setZoom(prev => Math.max(prev / 1.25, 0.2));
    const resetView = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button !== 0) return; // Only pan with left click
        setIsPanning(true);
        if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isPanning) return;
        setOffset(prev => ({
            x: prev.x + e.movementX,
            y: prev.y + e.movementY,
        }));
    };

    const handleMouseUpOrLeave = () => {
        setIsPanning(false);
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    };

    // This effect handles wheel-based zooming, preventing page scroll.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const delta = e.deltaY * -0.005;
            
            const newZoom = Math.max(0.2, Math.min(zoom * (1 + delta), 10));
            const zoomFactor = newZoom / zoom;

            if (Math.abs(1 - zoomFactor) < 0.01) return;

            const newOffsetX = mouseX - (mouseX - offset.x) * zoomFactor;
            const newOffsetY = mouseY - (mouseY - offset.y) * zoomFactor;

            setZoom(newZoom);
            setOffset({ x: newOffsetX, y: newOffsetY });
        };
        
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [zoom, offset]);

    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if (!data) {
            ctx.save();
            ctx.fillStyle = '#1A202C';
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
            return;
        }

        const { flights_data, num_landings, R, T, ST, LD, LT } = data;
        
        ctx.save();
        ctx.fillStyle = '#1A202C';
        ctx.fillRect(0, 0, width, height);

        if (!flights_data || flights_data.length === 0 || R === 0 || T === 0) {
            ctx.restore();
            return;
        }

        const totalRise = flights_data.reduce((sum, f) => sum + f.rise, 0);
        const maxRun = Math.max(...flights_data.map(f => f.run));
        const totalDrawingWidth = maxRun + LD;

        if (totalDrawingWidth === 0 || totalRise === 0) {
            ctx.restore();
            return;
        }

        const padding = { top: 40, right: 80, bottom: 40, left: 80 };
        const canvasWidth = width - padding.left - padding.right;
        const canvasHeight = height - padding.top - padding.bottom;
        
        const baseScale = Math.min(canvasWidth / totalDrawingWidth, canvasHeight / totalRise) * 0.9;
        const scale = baseScale * zoom;
        
        ctx.translate(offset.x, offset.y);
        ctx.translate(padding.left, height - padding.bottom);

        // --- Define Styles & Dimensions ---
        const fillStyle = '#384252';
        const strokeStyle = '#FBBF24'; // Amber/Yellow
        const textStyle = '#EF4444'; // Red
        const floorSlabThickness = LT * scale;
        const floorSlabWidth = LD * scale;

        // --- Draw Bottom Floor Slab ---
        ctx.beginPath();
        ctx.rect(0, 0, -floorSlabWidth, floorSlabThickness);
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 1.5 / zoom; // Keep main drawing lines constant screen width for clarity
        ctx.fill();
        ctx.stroke();

        let currentY = 0;
        let direction = 1; 
        let totalTreadCountSoFar = 0;
        let finalX = 0;
        let finalY = 0;

        for (let f = 0; f < flights_data.length; f++) {
            const flight = flights_data[f];
            const flightStartX = (direction === 1) ? 0 : maxRun * scale;
            const flightStartY = -currentY;

            // --- 1. Draw Flight (Steps + Waist) as a single shape ---
            const flightShape = new Path2D();
            flightShape.moveTo(flightStartX, flightStartY);
            
            let topX = flightStartX;
            let topY = flightStartY;
            for (let i = 0; i < flight.risers; i++) {
                topY -= R * scale;
                flightShape.lineTo(topX, topY); // Vertical riser
                if (i < flight.treads) {
                    topX += T * scale * direction;
                    flightShape.lineTo(topX, topY); // Horizontal tread
                }
            }
            
            const innerCornerTopX = flightStartX + flight.run * scale * direction;
            const innerCornerTopY = flightStartY - flight.rise * scale;

            flightShape.lineTo(innerCornerTopX, innerCornerTopY);
            
            const angle = Math.atan2(flight.rise, flight.run);
            const waistOffsetX = Math.sin(angle) * ST * scale;
            const waistOffsetY = Math.cos(angle) * ST * scale;

            const waistUnderTopCornerX = innerCornerTopX + waistOffsetX * direction;
            const waistUnderTopCornerY = innerCornerTopY + waistOffsetY;
            const waistUnderBottomCornerX = flightStartX + waistOffsetX * direction;
            const waistUnderBottomCornerY = flightStartY + waistOffsetY;

            flightShape.lineTo(waistUnderTopCornerX, waistUnderTopCornerY);
            flightShape.lineTo(waistUnderBottomCornerX, waistUnderBottomCornerY);
            flightShape.closePath();

            ctx.fillStyle = fillStyle;
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 1.5 / zoom;
            ctx.fill(flightShape);
            ctx.stroke(flightShape);

            // --- Highlight Slabs ---
            ctx.strokeStyle = '#34D399'; // Green
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            let treadX = flightStartX;
            let treadY = flightStartY;
            for (let i = 0; i < flight.treads; i++) {
                treadY -= R * scale;
                ctx.moveTo(treadX, treadY);
                treadX += T * scale * direction;
                ctx.lineTo(treadX, treadY);
            }
            ctx.stroke();

            ctx.strokeStyle = '#60A5FA'; // Blue
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            ctx.moveTo(waistUnderBottomCornerX, waistUnderBottomCornerY);
            ctx.lineTo(waistUnderTopCornerX, waistUnderTopCornerY);
            ctx.stroke();

            // --- 2. Draw Landing ---
            if (f < num_landings) {
                const landingRectWidth = LD * scale;
                const landingRectX = (direction === 1) ? innerCornerTopX : innerCornerTopX - landingRectWidth;
                
                ctx.beginPath();
                ctx.rect(landingRectX, innerCornerTopY, landingRectWidth, LT * scale);
                ctx.lineWidth = 1.5 / zoom;
                ctx.fillStyle = fillStyle;
                ctx.strokeStyle = strokeStyle;
                ctx.fill();
                ctx.stroke();
            }

            if (f === flights_data.length - 1) {
                finalX = innerCornerTopX;
                finalY = innerCornerTopY;
            }

            // --- 3. Draw Step Numbers ---
            let numX = flightStartX;
            let numY = flightStartY;
            const stepFontSize = Math.max(1, R * 0.4 * scale);
            for (let i = 0; i < flight.treads; i++) {
                ctx.fillStyle = textStyle;
                ctx.font = `bold ${stepFontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.fillText(
                    String(totalTreadCountSoFar + i + 1).padStart(2, '0'),
                    numX + (T * scale * direction * 0.7),
                    numY - (R * scale * 0.3)
                );
                
                numY -= R * scale;
                numX += T * scale * direction;
            }
            totalTreadCountSoFar += flight.treads;
            
            // --- 4. Draw Dimensions and Labels for the flight ---
            ctx.save();
            ctx.fillStyle = '#A0AEC0';
            const waistLabelFontSize = Math.max(1, ST * 0.6 * scale);
            ctx.font = `bold ${waistLabelFontSize}px sans-serif`;
            ctx.textAlign = 'center';

            const waistMidX = (waistUnderBottomCornerX + waistUnderTopCornerX) / 2;
            const waistMidY = (waistUnderBottomCornerY + waistUnderTopCornerY) / 2;
            ctx.translate(waistMidX, waistMidY);
            ctx.rotate(angle * direction);
            ctx.fillText(`L = ${flight.inclined_length.toFixed(2)} m`, 0, -ST * scale * 0.25);
            ctx.restore();

            currentY += flight.rise * scale;
            direction *= -1;
        }

        // --- Draw Top Floor Slab ---
        ctx.beginPath();
        ctx.rect(finalX, finalY, -floorSlabWidth, floorSlabThickness);
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 1.5 / zoom;
        ctx.fill();
        ctx.stroke();
        
        // --- Draw overall dimension lines ---
        ctx.strokeStyle = "#6b7280";
        ctx.fillStyle = "#A0AEC0";
        const dimLineWidth = Math.max(0.5, 0.002 * scale);
        ctx.lineWidth = dimLineWidth;
        const dimFontSize = Math.max(2, R * 0.4 * scale);
        ctx.font = `${dimFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const drawDimLine = (x1: number, y1: number, x2: number, y2: number, text: string, isVertical: boolean) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
            const tickSize = Math.max(2, R * 0.15 * scale);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.moveTo(x1, y1); ctx.lineTo(x1 + tickSize * Math.cos(angle + Math.PI / 6), y1 + tickSize * Math.sin(angle + Math.PI / 6));
            ctx.moveTo(x1, y1); ctx.lineTo(x1 + tickSize * Math.cos(angle - Math.PI / 6), y1 + tickSize * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x2, y2); ctx.lineTo(x2 - tickSize * Math.cos(angle + Math.PI / 6), y2 - tickSize * Math.sin(angle + Math.PI / 6));
            ctx.moveTo(x2, y2); ctx.lineTo(x2 - tickSize * Math.cos(angle - Math.PI / 6), y2 - tickSize * Math.sin(angle - Math.PI / 6));
            ctx.stroke();
            if (isVertical) {
                ctx.save();
                ctx.translate(x1 - dimFontSize * 1.5, (y1 + y2) / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(text, 0, 0);
                ctx.restore();
            } else {
                ctx.fillText(text, (x1 + x2) / 2, y1 - dimFontSize);
            }
        };
        
        let accumulatedRise = 0;
        let dimDirection = 1;
        for (let i = 0; i < flights_data.length; i++) {
            const flight = flights_data[i];
            const startY = -accumulatedRise;
            accumulatedRise += flight.rise * scale;
            const endY = -accumulatedRise;
            const dimX_vert_offset = dimFontSize * 3;
            const dimX_vert = (dimDirection === 1) ? -dimX_vert_offset : (maxRun * scale) + dimX_vert_offset;
            
            drawDimLine(dimX_vert, startY, dimX_vert, endY, (flight.rise*1000).toFixed(0), true);
            
            ctx.beginPath();
            ctx.moveTo(dimX_vert, startY); ctx.lineTo( (dimDirection === 1) ? 0 : maxRun * scale, startY);
            ctx.moveTo(dimX_vert, endY); ctx.lineTo( (dimDirection === 1) ? maxRun * scale : 0, endY);
            const dashOn = Math.max(1, 0.01 * scale);
            const dashOff = Math.max(1, 0.015 * scale);
            ctx.setLineDash([dashOn, dashOff]);
            ctx.stroke();
            ctx.setLineDash([]);
            dimDirection *= -1;
        }
        ctx.restore();
    }, [data, zoom, offset]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (ctx && canvas) {
            draw(ctx, canvas.width, canvas.height);
        }
    }, [draw]);

    const takeScreenshot = () => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;

        const scaleFactor = 3; // For high-resolution output
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = canvas.width * scaleFactor;
        offscreenCanvas.height = canvas.height * scaleFactor;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        if (!offscreenCtx) return;

        // Scale the context to draw bigger, then call the same draw function.
        offscreenCtx.scale(scaleFactor, scaleFactor);
        draw(offscreenCtx, canvas.width, canvas.height);

        // Trigger download
        const link = document.createElement('a');
        link.download = 'staircase-visualization.png';
        link.href = offscreenCanvas.toDataURL('image/png');
        link.click();
    };

    const buttonClasses = "bg-gray-900 bg-opacity-60 text-white rounded-md w-10 h-10 flex items-center justify-center hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-all";

    return (
        <div className="mt-8 relative">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Staircase Visualization (Side View)</h3>

            <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
                <button onClick={zoomIn} className={buttonClasses} aria-label="Zoom in" title="Zoom In">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
                </button>
                <button onClick={zoomOut} className={buttonClasses} aria-label="Zoom out" title="Zoom Out">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                </button>
                <button onClick={resetView} className={buttonClasses} aria-label="Reset view" title="Reset View">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
                </button>
                <button onClick={takeScreenshot} className={buttonClasses} aria-label="Take screenshot" title="Take Screenshot">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
            
            <canvas
                ref={canvasRef}
                width="800"
                height="600"
                className="w-full h-auto border border-gray-600 rounded-lg bg-gray-800 cursor-grab"
                aria-label="Side view visualization of the calculated staircase"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
            ></canvas>
        </div>
    );
};

export default StairVisualizer;