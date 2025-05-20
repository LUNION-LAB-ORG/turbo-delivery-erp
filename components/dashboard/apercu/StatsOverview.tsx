'use client';

import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, DollarSign, Info } from "lucide-react";

export default function StatsOverview() {
  return (
    <Card className="p-6 shadow-lg bg-white">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <DollarSign className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">14 674 480 FCFA</div>
            <div className="text-sm text-gray-500">Net en caisse</div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="mt-1 p-1 bg-green-100 rounded-full">
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <div className="text-lg font-bold">1 474 750 FCFA</div>
            <div className="text-sm text-gray-500">Bénéfices obtenus dans cette semaine</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 p-1 bg-red-100 rounded-full">
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <div className="text-lg font-bold">374 480 FCFA</div>
            <div className="text-sm text-gray-500">Charges élevées dans cette semaine</div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>Vous pouvez percevoir la part que rapporte chaque source de votre chiffre d&apos;affaire</p>
        </div>
      </div>
    </Card>
  );
}