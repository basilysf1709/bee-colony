'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Bee {
  id: number;
  x: number;
  y: number;
  type: 'scout' | 'onlooker' | 'forager';
  targetSource?: FoodSource;
  returnToHive: boolean;
}

interface FoodSource {
  id: number;
  x: number;
  y: number;
  nectar: number;
  discovered: boolean;
}

interface Hive {
  x: number;
  y: number;
}

interface Images {
  food: HTMLImageElement;
  scout: HTMLImageElement;
  onlooker: HTMLImageElement;
  forager: HTMLImageElement;
  hive: HTMLImageElement;
}

const BeeColonyOptimization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bees, setBees] = useState<Bee[]>([]);
  const [foodSources, setFoodSources] = useState<FoodSource[]>([]);
  const [hive, setHive] = useState<Hive>({ x: 0, y: 0 });
  const [stats, setStats] = useState({ discoveredSources: 0, totalNectar: 0 });
  const [images, setImages] = useState<Images | null>(null);
  const [speed, setSpeed] = useState<number>(50);

  const canvasWidth = 800;
  const canvasHeight = 600;
  const numBees = 50;
  const numFoodSources = 10;

  const loadImages = useCallback(() => {
    const imageNames = ['food', 'scout', 'onlooker', 'forager', 'hive'] as const;
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

  const initializeSimulation = useCallback(() => {
    // Initialize hive
    const newHive = {
      x: canvasWidth / 2,
      y: canvasHeight / 2
    };
    setHive(newHive);

    // Initialize bees
    const newBees: Bee[] = Array.from({ length: numBees }, (_, i) => ({
      id: i,
      x: newHive.x,
      y: newHive.y,
      type: i < numBees * 0.2 ? 'scout' : 'onlooker',
      returnToHive: false
    }));
    setBees(newBees);

    // Initialize food sources
    const newFoodSources: FoodSource[] = Array.from({ length: numFoodSources }, (_, i) => ({
      id: i,
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      nectar: Math.floor(Math.random() * 100) + 50,
      discovered: false
    }));
    setFoodSources(newFoodSources);
  }, [canvasWidth, canvasHeight]);

  const updateSimulation = useCallback(() => {
    setBees(prevBees => 
      prevBees.map(bee => {
        switch (bee.type) {
          case 'scout':
            return updateScoutBee(bee);
          case 'onlooker':
            return updateOnlookerBee(bee);
          case 'forager':
            return updateForagerBee(bee);
          default:
            return bee;
        }
      })
    );
    updateStats();
  }, []);

  const updateScoutBee = useCallback((bee: Bee): Bee => {
    const newBee = { ...bee };
    if (newBee.returnToHive) {
      // Move towards hive
      const dx = hive.x - newBee.x;
      const dy = hive.y - newBee.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 5) {
        newBee.returnToHive = false;
        // Perform waggle dance
        const onlookers = bees.filter(b => b.type === 'onlooker' && !b.targetSource);
        if (onlookers.length > 0) {
          const recruitedBee = onlookers[Math.floor(Math.random() * onlookers.length)];
          recruitedBee.type = 'forager';
          recruitedBee.targetSource = newBee.targetSource;
        }
      } else {
        newBee.x += (dx / distance) * 5;
        newBee.y += (dy / distance) * 5;
      }
    } else {
      // Explore for new food sources
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
        newBee.returnToHive = true;
      }
    }
    return newBee;
  }, [canvasWidth, canvasHeight, foodSources, hive, bees]);

  const updateOnlookerBee = useCallback((bee: Bee): Bee => {
    const newBee = { ...bee };
    // Onlooker bees stay in the hive
    newBee.x = hive.x + (Math.random() - 0.5) * 20;
    newBee.y = hive.y + (Math.random() - 0.5) * 20;
    return newBee;
  }, [hive]);

  const updateForagerBee = useCallback((bee: Bee): Bee => {
    const newBee = { ...bee };
    if (newBee.targetSource) {
      const dx = newBee.targetSource.x - newBee.x;
      const dy = newBee.targetSource.y - newBee.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        newBee.targetSource.nectar = Math.max(0, newBee.targetSource.nectar - 1);
        if (newBee.targetSource.nectar === 0) {
          newBee.targetSource = undefined;
          newBee.type = 'onlooker';
        }
      } else {
        newBee.x += (dx / distance) * 3;
        newBee.y += (dy / distance) * 3;
      }
    } else {
      newBee.type = 'onlooker';
    }
    return newBee;
  }, []);

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

    // Draw hive
    ctx.drawImage(images.hive, hive.x - 25, hive.y - 25, 50, 50);

    // Draw food sources
    foodSources.forEach(source => {
      ctx.drawImage(images.food, source.x - 10, source.y - 10, 20, 20);
      if (source.discovered) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(source.x - 10, source.y - 10, 20, 20);
      }
    });

    // Draw bees
    bees.forEach(bee => {
      let image;
      switch (bee.type) {
        case 'scout':
          image = images.scout;
          break;
        case 'onlooker':
          image = images.onlooker;
          break;
        case 'forager':
          image = images.forager;
          break;
      }
      ctx.drawImage(image, bee.x - 10, bee.y - 10, 20, 20);
    });
  }, [bees, foodSources, images, canvasWidth, canvasHeight, hive]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    if (images) {
      initializeSimulation();
    }
  }, [images, initializeSimulation]);

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