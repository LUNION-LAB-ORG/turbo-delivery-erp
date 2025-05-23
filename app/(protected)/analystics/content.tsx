'use client';

import { Card as CardUI } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Printer } from 'lucide-react';
import DashboardChart from '@/components/dashboard/apercu/DashboardChart';
import SourcesCard from '@/components/dashboard/apercu/SourcesCard';
import StatsOverview from '@/components/dashboard/apercu/StatsOverview';
import { formatNumber } from '@/utils/formatNumber';
import { DateRangePicker, RangeValue, CalendarDate, CardHeader, CardBody, Card, Tooltip } from '@heroui/react';
import RestaurantList from '@/components/dashboard/apercu/RestaurantList';
import { ChiffreAffaireRestaurant } from '@/types/statistiques.model';
import DatabaseCards from '@/components/dashboard/apercu/DatabaseCards';
import useContentCtx from './useContentCtx';
import { TbArrowUpRight, TbChartBar } from 'react-icons/tb';
import Link from 'next/link';

export default function Content({ initialItems }: { initialItems: Record<string, any> }) {
  const { items, handleDateChange } = useContentCtx({ initialItems });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 items-center">
        <span>Rechercher la période</span>
        <DateRangePicker className="max-w-xs relative" onChange={(value) => handleDateChange(value as RangeValue<CalendarDate>)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        <Link href={'/tikets-terminers'}>

        <Link href={"/ticktes-terminers/commande-terminer"}>

          <CardUI className="p-6 flex flex-col justify-between bg-[#1e98e9] text-white shadow-lg">
            <div className="flex flex-col gap-2 mb-4">
              <div className="text-base font-medium">Total Commande Terminée</div>
            </div>
            <div className="text-3xl font-bold mb-4">
              {formatNumber(items?.chiffreAffaire?.commandeTotalTermine ?? 0)} <br /> FCFA
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" className="text-white hover:bg-[#94d4ff] px-1 text-sm">
                Voir toutes les commandes
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-transparent px-2">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </CardUI>
        </Link>

        <CardUI className="p-6  flex flex-col justify-between  bg-[#E91E63] text-white shadow-lg">
          <div className="flex flex-col gap-2 mb-4">
            <div className="text-base font-medium">Total Commande en Attente</div>
          </div>
          <div className="text-3xl font-bold mb-4">
            {formatNumber(items?.chiffreAffaire?.commandeTotalEnAttente ?? 0)} <br /> FCFA
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="text-white hover:bg-white/10 px-2 text-sm">
              Voir toutes les commandes
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardUI>

        <Link href={'/external_delivery/commande-terminers'}>

        <Link href={"/ticktes-terminers/frais-livraison"}>

          <CardUI className="p-6  flex flex-col justify-between  bg-[#1F2937] text-white shadow-lg">
            <div className="flex flex-col gap-2 mb-4">
              <div className="text-base font-medium">Total Frais Livraison Terminée</div>
            </div>
            <div className="text-3xl font-bold mb-4">
              {formatNumber(items?.chiffreAffaire?.fraisLivraisonTotalTermine ?? 0)} <br /> FCFA
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">Aujourd&apos;hui</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm font-medium">+2,8</span>
              </div>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 px-2">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </CardUI>
        </Link>
        <CardUI className="p-6  flex flex-col justify-between bg-[#fffb0e] shadow-lg">
          <div className="flex flex-col gap-2 mb-4">
            <div className="text-base font-medium">Total Frais Livraison en Attente</div>
          </div>
          <div className="text-3xl font-bold mb-4">
            {formatNumber(items?.chiffreAffaire?.fraisLivraisonTotalEnAttente ?? 0)} <br /> FCFA
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">Aujourd&apos;hui</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm font-medium">+2,8</span>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 px-2">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardUI>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200">
              <CardHeader className="pb-0 pt-4 px-6">
                <div className='flex gap-2 items-center'>
                  <h4 className="text-lg font-medium opacity-90">Commission sur Chiffre Affaire</h4>
                  <Tooltip content="Commission en type pourcentage" className='bg-yellow-200 font-bold'>
                    <Info size={18} className='cursor-pointer mt-2' />
                  </Tooltip>
                </div>
              </CardHeader>
              <CardBody className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <TbChartBar className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{items?.chiffreAffaire?.commissionChiffreAffaire?.toLocaleString()} XOF</p>
                    </div>
                  </div>
                  <Link href="/ticktes-terminers/POURCENTAGE">
                    <TbArrowUpRight className="w-8 h-8 opacity-80" />
                  </Link>
                </div>
              </CardBody>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200">
              <CardHeader className="pb-0 pt-4 px-6">
                <div className='flex gap-2 items-center'>
                  <h4 className="text-lg font-medium opacity-90">Commission par Commande</h4>
                  <Tooltip content="Commission en type fixe" className='bg-yellow-200 font-bold'>
                    <Info size={20} className='cursor-pointer' />
                  </Tooltip>
                </div>
              </CardHeader>
              <CardBody className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <TbChartBar className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{items?.chiffreAffaire?.commissionCommande?.toLocaleString()} XOF</p>
                    </div>
                  </div>
                  <Link href="/ticktes-terminers/FIXE">
                    <TbArrowUpRight className="w-8 h-8 opacity-80" />
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>

          <CardUI className="p-6 shadow-lg bg-white">
            <DatabaseCards
              items={[
                { label: 'Total Personnel', value: items?.users?.totalElements ?? 0 },
                { label: 'Total Partenaire', value: items?.restaurants?.totalElements ?? 0 },
                { label: 'Total Livreur', value: items?.deliveryMen?.totalElements ?? 0 },
                { label: 'Total Type de plat', value: items?.typePlats?.length ?? 0 },
              ]}
            />
          </CardUI>
          <CardUI className="p-6 shadow-lg bg-white">
            <DashboardChart />
          </CardUI>
        </div>
        <div className="space-y-6">
          <SourcesCard />
          <StatsOverview />
        </div>
      </div>
      <div>
        <RestaurantList data={items?.chiffresAffairesRestaurants as ChiffreAffaireRestaurant[]} />
      </div>
    </div>
  );
}
