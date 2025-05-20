'use client';

import React from 'react';
import { Select, SelectItem } from "@heroui/react";
import { Search } from 'lucide-react';
import { LivreurDisponible } from '@/types/models';

export default function SearchBar({ coursiers, handleCourierSelect }: { coursiers: LivreurDisponible[]; handleCourierSelect: (courierId: string) => void }) {
    return (
        <Select
            startContent={<Search size={20} className="text-primary" />}
            onChange={(e) => {
                const value = e.target.value;
                handleCourierSelect(value);
            }}
            placeholder="Rechercher"
            className="w-60"
        >
            {coursiers.map((coursiers) => (
                <SelectItem key={coursiers.livreurId}>{coursiers.nomComplet}</SelectItem>
            ))}
        </Select>
    );
}
