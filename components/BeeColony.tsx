'use client';
import React, { useEffect, useRef, useState } from 'react';
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

const BeeColonyOptimization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bees, setBees] = useState<Bee[]>([]);
  const [foodSources, setFoodSources] = useState<FoodSource[]>([]);
  const [stats, setStats] = useState({ discoveredSources: 0, totalNectar: 0 });

  const canvasWidth = 800;
  const canvasHeight = 600;
  const numBees = 20;
  const numFoodSources = 10;

  useEffect(() => {
    initializeBees();
    initializeFoodSources();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(updateSimulation, 50);
    return () => clearInterval(intervalId);
  }, [bees, foodSources]);

  useEffect(() => {
    drawCanvas();
  }, [bees, foodSources]);

  const initializeBees = () => {
    const newBees: Bee[] = [];
    for (let i = 0; i < numBees; i++) {
      newBees.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        type: i < numBees / 2 ? 'scout' : 'forager'
      });
    }
    setBees(newBees);
  };

  const initializeFoodSources = () => {
    const newFoodSources: FoodSource[] = [];
    for (let i = 0; i < numFoodSources; i++) {
      newFoodSources.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        nectar: Math.floor(Math.random() * 100) + 1,
        discovered: false
      });
    }
    setFoodSources(newFoodSources);
  };

  const updateSimulation = () => {
    const updatedBees = bees.map(bee => {
      if (bee.type === 'scout') {
        return updateScoutBee(bee);
      } else {
        return updateForagerBee(bee);
      }
    });

    setBees(updatedBees);
    updateStats();
  };

  const updateScoutBee = (bee: Bee): Bee => {
    const newBee = { ...bee };
    newBee.x += (Math.random() - 0.5) * 10;
    newBee.y += (Math.random() - 0.5) * 10;

    newBee.x = Math.max(0, Math.min(newBee.x, canvasWidth));
    newBee.y = Math.max(0, Math.min(newBee.y, canvasHeight));

    const discoveredSource = foodSources.find(
      source => !source.discovered && 
      Math.abs(source.x - newBee.x) < 10 && 
      Math.abs(source.y - newBee.y) < 10
    );

    if (discoveredSource) {
      discoveredSource.discovered = true;
      newBee.type = 'forager';
      newBee.targetSource = discoveredSource;
    }

    return newBee;
  };

  const updateForagerBee = (bee: Bee): Bee => {
    const newBee = { ...bee };
    if (!newBee.targetSource) {
      const undiscoveredSources = foodSources.filter(source => !source.discovered);
      if (undiscoveredSources.length > 0) {
        newBee.type = 'scout';
      } else {
        newBee.targetSource = foodSources[Math.floor(Math.random() * foodSources.length)];
      }
      return newBee;
    }

    const dx = newBee.targetSource.x - newBee.x;
    const dy = newBee.targetSource.y - newBee.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      newBee.targetSource.nectar = Math.max(0, newBee.targetSource.nectar - 1);
      if (newBee.targetSource.nectar === 0) {
        newBee.targetSource = undefined;
      }
    } else {
      newBee.x += (dx / distance) * 5;
      newBee.y += (dy / distance) * 5;
    }

    return newBee;
  };

  const updateStats = () => {
    const discoveredSources = foodSources.filter(source => source.discovered).length;
    const totalNectar = foodSources.reduce((sum, source) => sum + source.nectar, 0);
    setStats({ discoveredSources, totalNectar });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw food sources
    foodSources.forEach(source => {
      ctx.beginPath();
      ctx.arc(source.x, source.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = source.discovered ? 'green' : 'red';
      ctx.fill();
    });

    // Draw bees
    bees.forEach(bee => {
      ctx.beginPath();
      ctx.arc(bee.x, bee.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = bee.type === 'scout' ? 'blue' : 'orange';
      ctx.fill();
    });
  };

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