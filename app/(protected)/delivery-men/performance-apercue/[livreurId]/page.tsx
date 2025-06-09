
import { getPerformanceCreneauById } from '@/src/performance/performance.action';
import Content from './content'
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { getInfoLivreurById } from '@/src/livreurInfo/livreur-info.action';

interface CreneauIdPageProps {
  params: { livreurId: string }
}

export default async function Page({ params }: CreneauIdPageProps) {

  const { livreurId } = params
  const infoUser = await getInfoLivreurById(livreurId)

  const user = await getPerformanceCreneauById(livreurId)


  if (!user || !infoUser) {
    return <EmptyDataTable />
  }


  return (
    <Content data={user} infoUser={infoUser} />
  )
}