import { RestaurantTuboProgression } from '@/types/slot';
import { Pagination, Progress } from '@heroui/react';
import progresseBare from '../progression-barre';
import { PaginatedResponse } from '@/types';
import { LivreurPerformance } from '@/types/creneau-performance';
import { CreneauxRestaurantProgression } from '@/types/creneaux-progression';

interface Props {
  initialData: CreneauxRestaurantProgression[] | null;
}

const UserListe = ({ initialData }: Props) => {

if(initialData)

  return (
    <div className="flex flex-col gap-6 ">
      {initialData.map((item, index) => {
        return (
          <div key={index} className="panel mt-5 overflow-hidden border-0 p-0">
            <div className="table-responsive">
              <table className="table-striped table-hover">
                <thead>
                  <tr>
                    <th>Nom du coursier</th>
                    <th>Progression</th>
                    <th>Jour</th>
                    <th>Début</th>
                    <th>Fin</th>
                  </tr>
                </thead>

                <tbody>
                  {initialData.map((item,index) => {
                    // const progresseBare = () => {
                    //   if (item.progression == 100) {
                    //     return <Progress color="success" className="max-w-md" value={100} />;
                    //   }
                    //   if (item.progression < 100 && item.progression >= 65) {
                    //     return <Progress color="warning" className="max-w-md" value={65} />;
                    //   }
                    //   if (item.progression < 65) {
                    //     return <Progress color="danger" className="max-w-md" value={20} />;
                    //   }
                    // };
                    return (
                      <tr key={index}>
                        <td>{item.nomRestaurant}</td>
                        <td>
                          mmmmmmmmmm
                          {/* {progresseBare()} */}


                        </td>
                        <td>jjjjj
                          {/* {item.}/{item.jour.jourTravaille} */}
                        </td>
                        <td>kkkk
                          {/* {item.creneauVM.debut} */}

                        </td>
                        <td>
                          pppp
                          {/* {item.creneauVM.fin} */}
                          </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* <Pagination total={data?.totalPages ?? 1} page={currentPage} onChange={fetchData} showControls color="primary" variant="bordered" isDisabled={isLoading} /> */}
          </div>
        );
      })}
    </div>
  );
  if(initialData)
    return <div>Auncun element trouver</div>
};

export default UserListe;
