'use client';
import { title } from '@/components/primitives';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { PaginatedResponse } from '@/types';
import { Clock, MapPin, User, Package, CreditCard, Store, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Chip, Divider, Pagination, Skeleton, Avatar, Input } from "@heroui/react";
import { useState } from 'react';
import Link from 'next/link';
import { SORT_OPTIONS, courses_statuses_filters } from '@/data';
import DeliveryTools from '../component/deliveryTools';
import { getPaginationCourseExterneAutreStatus } from '@/src/actions/courses.actions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import createUrlFile from '@/utils/createUrlFile';
import IconPlus from '@/components/icon/icon-plus';

type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

const getStatusColor = (statut: string) => {
  switch (statut?.toUpperCase()) {
    case 'VALIDER': return 'warning';
    case 'TERMINER': return 'success';
    case 'ANNULER': return 'danger';
    case 'EN_ATTENTE': return 'secondary';
    default: return 'default';
  }
};

const getCommandeStatusColor = (statut: string) => {
  switch (statut?.toUpperCase()) {
    case 'EN_ATTENTE_VERSEMENT': return 'warning';
    case 'TERMINER': return 'success';
    case 'ANNULER': return 'danger';
    case 'RECUPERER': return 'secondary';
    case 'EN_COURS_LIVRAISON': return 'secondary';
    default: return 'default';
  }
};

const getStatusBorderClass = (statut: string) => {
  switch (statut?.toUpperCase()) {
    case 'VALIDER': return 'border-2 border-warning';
    case 'TERMINER': return 'border-2 border-success';
    case 'ANNULER': return 'border-2 border-danger';
    case 'EN_ATTENTE': return 'border-2 border-secondary';
    default: return 'border border-default';
  }
};

interface Props {
  initialData: PaginatedResponse<CourseExterne>;
  delivers: LivreurDisponible[];
}

export default function Content({ initialData, delivers }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS.DATE_DESC);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [data, setData] = useState<PaginatedResponse<CourseExterne>>(initialData);
  const [dataFilter, setDataFilter] = useState<CourseExterne[]>(data?.content ?? []);
  const [isLoading, setIsLoading] = useState(!initialData);

  const handleFilter = (status: string, _data?: PaginatedResponse<CourseExterne>) => {
    setIsLoading(true);
    setStatusFilter(status);
    const sourceData = _data ?? data;
    setDataFilter(
      status === 'all'
        ? sourceData.content
        : sourceData.content.filter((d) => d.statut?.toUpperCase() === status)
    );
    setIsLoading(false);
  };

  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getPaginationCourseExterneAutreStatus(page - 1, pageSize);
      setData(newData);
      setDataFilter(newData?.content ?? []);
      setStatusFilter('all');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterByCode = (term: string) => {
    if (!term.trim()) return handleFilter(statusFilter);
    const lowerTerm = term.toLowerCase();
    const filtered = data?.content.filter((item) => item.code?.toLowerCase().includes(lowerTerm)) ?? [];
    setDataFilter(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSortBy(SORT_OPTIONS.DATE_DESC);
    setCurrentPage(1);
    setDataFilter(data?.content ?? []);
    setStatusFilter('all');
  };

  const toggleExpand = (deliveryId: string) => {
    setExpandedDelivery(expandedDelivery === deliveryId ? null : deliveryId);
  };

  return (
    <div className="w-full h-full pb-10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className={title({ size: 'h3', class: 'text-primary' })}>Mes Courses</h1>
        <Button as={Link} href="/delivery/create" color="primary" size="sm" startContent={<IconPlus className="h-5 w-5" />}>
          Demande de coursier
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex items-center gap-4">
                <Input
                    startContent={<Search className="text-gray-500 w-4 h-4" />}
                    label="Rechercher par code"
                    variant="bordered"
                    placeholder="Entrez le code"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        filterByCode(e.target.value);
                    }}
                    className="w-1/2 mb-4"
                    size="sm"
                />
            </div>
            <div className="flex items-center gap-4">
                {courses_statuses_filters.filter(s => s.id !== 'EN_ATTENTE').map((category) => (
                <Button
                    key={category.id}
                    className="flex-shrink-0"
                    variant={statusFilter === category.id ? 'solid' : 'flat'}
                    color={statusFilter === category.id ? 'primary' : 'default'}
                    onPress={() => handleFilter(category.id)}
                    size="sm"
                >
                    {category.name}
                </Button>
                ))}
            </div>
          <ScrollBar orientation="horizontal" className="h-0" />
        </ScrollArea>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="rounded-lg h-52" />)}
        </div>
      ) : dataFilter.length ? (
        <>
          <div className="grid grid-cols-1 gap-6">
            {dataFilter.map((delivery) => (
              <Card key={delivery.id} className={`w-full ${getStatusBorderClass(delivery.statut)}`}>
                <CardHeader className="flex justify-between">
                  <div className="flex items-center gap-4">
                    <Chip color={getStatusColor(delivery.statut)} variant="flat">{delivery.statut}</Chip>
                    <span className="text-default-500 font-bold">Code: {delivery.code}</span>
                  </div>
                  <div className="flex gap-2">
                    <DeliveryTools delivery={delivery} delivers={delivers} />
                    <Button isIconOnly color="primary" variant="light" onClick={() => toggleExpand(delivery.id)}>
                      {expandedDelivery === delivery.id ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {delivery?.restaurant?.logo_Url ? (
                        <Avatar src={createUrlFile(delivery.restaurant.logo_Url, 'restaurant')} />
                      ) : (
                        <Store className="text-default-500" />
                      )}
                      <div>
                        <p className="text-default-700">{delivery?.restaurant?.nomEtablissement}</p>
                        <p className="text-default-500 text-sm">{delivery?.restaurant?.commune}</p>
                      </div>
                    </div>

                    <Divider />

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Package className="text-default-500" />
                        <span>{delivery.nombreCommande} commande{delivery.nombreCommande > 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-large font-semibold">{delivery.total.toFixed(2)} XOF</span>
                    </div>

                    {expandedDelivery === delivery.id && delivery.commandes.map((commande, index) => (
                      <Card key={commande.id} className="w-full">
                        <CardHeader className="flex justify-between">
                          <div className="flex items-center gap-4">
                            <Chip size="sm" variant="flat" color={getCommandeStatusColor(commande.statut)}>
                              {commande.statut ?? 'EN_ATTENTE'}
                            </Chip>
                            <span className="text-default-500 font-bold">Commande #{index + 1}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-default-500 font-bold">{commande.numero}</span>
                          </div>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <User className="text-default-500 mt-1" />
                              <div>
                                <p className="text-default-700">{commande.destinataire.nomComplet}</p>
                                <p className="text-default-500">{commande.destinataire.contact}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="text-default-500 mt-1" />
                              <p className="text-default-600">{commande.lieuLivraison.latitude}, {commande.lieuLivraison.longitude}</p>
                            </div>
                            <Divider />
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <CreditCard className="text-default-500" />
                                <span className="text-default-600">{commande.modePaiement}</span>
                              </div>
                              <span className="font-semibold">{commande.prix.toFixed(2)} XOF</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}

                    <Divider />

                    <div className="flex items-center gap-2">
                      <Clock className="text-default-500" />
                      <div>
                        <p className="text-default-600">Début: {delivery.dateHeureDebut}</p>
                        <p className="text-default-600">Fin: {delivery.dateHeureFin ?? '---'}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-8 fixed bottom-4 w-full z-10">
            <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
            <Pagination
              total={data?.totalPages ?? 1}
              page={currentPage}
              onChange={fetchData}
              showControls
              color="primary"
              variant="bordered"
              isDisabled={isLoading}
            />
          </div>
        </>
      ) : (
        <Card className="min-h-52">
          <CardBody className="flex justify-center items-center">
            <p className="text-center text-default-500">Aucune course ne correspond à vos critères de recherche. Essayez de modifier vos filtres.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
