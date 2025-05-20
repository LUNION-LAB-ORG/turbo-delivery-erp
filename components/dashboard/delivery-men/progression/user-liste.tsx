import { BirdPerformance } from '@/types/slot';
import { Pagination, Progress } from '@heroui/react';
import progresseBare2 from './progression-barre2';

const UserListe = ({ initialData }: { initialData: CreneauProgressionBird[] }) => {
  
  
    return (
    <div className="panel mt-5 overflow-hidden border-0 p-0">
      <div className="table-responsive">
        <table className='table-striped table-hover'>
            <thead>
                <tr >
                    <th >Nom du coursier</th>
                    <th >Progression</th>
                    <th >Jour</th>
                    <th>Début</th>
                    <th >Fin</th>
                </tr>
            </thead>
          
          <tbody>
            {initialData.map((item) => {
          // const progresseBare =()=>{
          //   if(item.progression==100){
          //   return <Progress   color="success" className="max-w-md"  value={100} />
          //   }
          //   if(item.progression<100 && item.progression>=65){
          //       return <Progress   color="warning" className="max-w-md"  value={65} />
          //       }
          //   if(item.progression<65){
                
          //       return <Progress   color="danger" className="max-w-md"  value={20} />
          //       }
          // }
              return (
                <tr key={item.id}>
                  <td>{item.nomComplet}</td>
                  <td>{progresseBare2(item)}</td>
                  <td>{item.jour.jourNonTravaille}/{item.jour.jourTravaille}</td>
                  <td>{item.creneauVM.jourDebut}</td>
                  <td>{item.creneauVM.jourFin}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* <Pagination total={data?.totalPages ?? 1} page={currentPage} onChange={fetchData} showControls color="primary" variant="bordered" isDisabled={isLoading} /> */}

    </div>
  );
};

export default UserListe;
