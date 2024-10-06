'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Bee {
  x: number;
  y: number;
  type: 'scout' | 'forager';
  targetSource?: FoodSource;
}

interface FoodSource {
  x: number;
  y: number;
  nectar: number;
  discovered: boolean;
}

interface Images {
  food: HTMLImageElement;
  scout: HTMLImageElement;
  forager: HTMLImageElement;
}

const BeeColonyOptimization: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bees, setBees] = useState<Bee[]>([]);
    const [foodSources, setFoodSources] = useState<FoodSource[]>([]);
    const [stats, setStats] = useState({ discoveredSources: 0, totalNectar: 0 });
    const [images, setImages] = useState<Images | null>(null);
    const [speed, setSpeed] = useState<number>(50);
  
    const canvasWidth = 800;
    const canvasHeight = 600;
    const numBees = 20;
    const numFoodSources = 10;

  const loadImages = useCallback(() => {
    const imageNames = ['food', 'scout', 'forager'] as const;
    const loadedImages: Partial<Images> = {};

    imageNames.forEach(name => {
      const img = new Image();
      img.src = `assets/${name}.png`;
      img.onload = () => {
        loadedImages[name] = img;
        if (Object.keys(loadedImages).length === imageNames.length) {
          setImages(loadedImages as Images);
        }
      };
    });
  }, []);

  const initializeBees = useCallback(() => {
    const newBees: Bee[] = Array.from({ length: numBees }, (_, i) => ({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      type: i < numBees / 2 ? 'scout' : 'forager'
    }));
    setBees(newBees);
  }, [canvasWidth, canvasHeight]);

  const initializeFoodSources = useCallback(() => {
    const newFoodSources: FoodSource[] = Array.from({ length: numFoodSources }, () => ({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      nectar: Math.floor(Math.random() * 100) + 1,
      discovered: false
    }));
    setFoodSources(newFoodSources);
  }, [canvasWidth, canvasHeight]);

  const updateSimulation = useCallback(() => {
    setBees(prevBees => 
      prevBees.map(bee => bee.type === 'scout' ? updateScoutBee(bee) : updateForagerBee(bee))
    );
    updateStats();
  }, []);

  const updateScoutBee = useCallback((bee: Bee): Bee => {
    const newBee = { ...bee };
    newBee.x += (Math.random() - 0.5) * 10;
    newBee.y += (Math.random() - 0.5) * 10;

    newBee.x = Math.max(0, Math.min(newBee.x, canvasWidth));
    newBee.y = Math.max(0, Math.min(newBee.y, canvasHeight));

    const discoveredSource = foodSources.find(
      source => !source.discovered && 
      Math.abs(source.x - newBee.x) < 20 && 
      Math.abs(source.y - newBee.y) < 20
    );

    if (discoveredSource) {
      discoveredSource.discovered = true;
      newBee.targetSource = discoveredSource;
    }

    return newBee;
  }, [canvasWidth, canvasHeight, foodSources]);

  const updateForagerBee = useCallback((bee: Bee): Bee => {
    const newBee = { ...bee };
    const discoveredSources = foodSources.filter(source => source.discovered && source.nectar > 0);
    
    if (!newBee.targetSource && discoveredSources.length > 0) {
      // Assign a random discovered food source to the forager
      newBee.targetSource = discoveredSources[Math.floor(Math.random() * discoveredSources.length)];
    }

    if (newBee.targetSource) {
      const dx = newBee.targetSource.x - newBee.x;
      const dy = newBee.targetSource.y - newBee.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        newBee.targetSource.nectar = Math.max(0, newBee.targetSource.nectar - 1);
        if (newBee.targetSource.nectar === 0) {
          newBee.targetSource = undefined;
        }
      } else {
        newBee.x += (dx / distance) * 3;
        newBee.y += (dy / distance) * 3;
      }
    } else {
      // If no target, move randomly like a scout
      newBee.x += (Math.random() - 0.5) * 5;
      newBee.y += (Math.random() - 0.5) * 5;
      newBee.x = Math.max(0, Math.min(newBee.x, canvasWidth));
      newBee.y = Math.max(0, Math.min(newBee.y, canvasHeight));
    }

    return newBee;
  }, [foodSources, canvasWidth, canvasHeight]);

  const updateStats = useCallback(() => {
    setStats({
      discoveredSources: foodSources.filter(source => source.discovered).length,
      totalNectar: foodSources.reduce((sum, source) => sum + source.nectar, 0)
    });
  }, [foodSources]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !images) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    foodSources.forEach(source => {
      ctx.drawImage(images.food, source.x - 10, source.y - 10, 20, 20);
      if (source.discovered) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(source.x - 10, source.y - 10, 20, 20);
      }
    });

    bees.forEach(bee => {
      const image = bee.type === 'scout' ? images.scout : images.forager;
      ctx.drawImage(image, bee.x - 10, bee.y - 10, 20, 20);
    });
  }, [bees, foodSources, images, canvasWidth, canvasHeight]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    if (images) {
      initializeBees();
      initializeFoodSources();
    }
  }, [images, initializeBees, initializeFoodSources]);

  useEffect(() => {
    const intervalId = setInterval(updateSimulation, 1000 / speed);
    return () => clearInterval(intervalId);
  }, [updateSimulation, speed]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const chartData = [
    { name: 'Discovered Sources', value: stats.discoveredSources },
    { name: 'Total Nectar', value: stats.totalNectar },
  ];

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Bee Colony Optimization</h1>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border border-gray-300"
      />
      <div className="mt-4 w-full max-w-md">
        <label htmlFor="speed-control" className="block text-sm font-medium text-gray-700">
          Simulation Speed
        </label>
        <input
          type="range"
          id="speed-control"
          min="1"
          max="100"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <div className="mt-4 w-full max-w-md">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BeeColonyOptimization;