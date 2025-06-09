
import { getPerformancePlanning } from '@/src/performance/performance.action';
import Content from './content';
import EmptyDataTable from '@/components/commons/EmptyDataTable';

interface CreneauIdPageProps {
  params: { livreurId: string, emploiId: string }; // Définit explicitement le type
}

export default async function Page({ params }: CreneauIdPageProps) {

  const { livreurId, emploiId } = params; // Récupère l'ID depuis l'URL

  const user = await getPerformancePlanning(livreurId, emploiId)

  if (!user) {
    return <EmptyDataTable />;
  }


  return (
    <Content data={user} />
  )
}