'use client';

import { Card } from '@/components/ui/card';
// import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress, Tab, Tabs } from "@heroui/react";
import { Info } from 'lucide-react';

const sources = [
    { name: 'Coursiers', value: 66, color: 'bg-orange-500' },
    { name: 'Partenaires', value: 34, color: 'bg-blue-500' },
];
let tabs = [
    {
        id: 'hebdo',
        label: 'Hebdo',
    },
    {
        id: 'mensuel',
        label: 'Mensuel',
    },
];
export default function SourcesCard() {
    return (
        <Card className="p-6 shadow-lg bg-white">
            <div className="space-y-6">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">Sources</h3>
                    <Tabs size="sm" items={tabs} className="w-auto">
                        {(item) => <Tab key={item.id} title={item.label}/>}
                    </Tabs>
                </div>
                <div className="space-y-4">
                    {sources.map((source) => (
                        <div key={source.name}>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">{source.name}</span>
                                <span className="font-medium">{source.value}%</span>
                            </div>
                            <Progress value={source.value} className="h-2 bg-gray-100" color={'primary'} />
                        </div>
                    ))}
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>Vous pouvez percevoir la part que rapporte chaque source de votre chiffre d&apos;affaire</p>
                </div>
            </div>
        </Card>
    );
}
