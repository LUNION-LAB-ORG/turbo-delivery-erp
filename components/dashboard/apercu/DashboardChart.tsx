'use client';

import { LineChart, Line, XAxis, ResponsiveContainer, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Tab, Tabs } from "@heroui/react";

const data = [
    { name: 'Lun', revenue: 14000000, expenses: 12000000 },
    { name: 'Mar', revenue: 16000000, expenses: 13000000 },
    { name: 'Mer', revenue: 15000000, expenses: 13000000 },
    { name: 'Jeu', revenue: 15000000, expenses: 12000000 },
    { name: 'Ven', revenue: 14000000, expenses: 11000000 },
    { name: 'Sam', revenue: 14500000, expenses: 12000000 },
    { name: 'Dim', revenue: 18000000, expenses: 14000000 },
];

const formatYAxis = (value: number) => {
    if (value === 0) return '0 M';
    return `${value / 1000000}M`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="text-sm font-medium mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {`${entry.name === 'revenue' ? 'Revenu' : 'Dépenses'}: ${entry.value.toLocaleString()} FCFA`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const tabs = [
    { id: 'week', label: 'Semaine' },
    { id: 'month', label: 'Mois' },
];

export default function DashboardChart() {
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold mb-1">Revenu total</h3>
                    <Tabs items={tabs}>{(item) => <Tab id={item.id} title={item.label} />}</Tabs>
                </div>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                    <Printer className="h-4 w-4" />
                </Button>
            </div>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                            tickFormatter={formatYAxis}
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 'auto']}
                            ticks={[0, 2000000, 4000000, 6000000, 8000000, 10000000, 12000000, 14000000, 16000000, 18000000]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#4ade80' }} />
                        <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#f43f5e' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
