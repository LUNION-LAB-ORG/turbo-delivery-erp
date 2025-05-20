import { CreneauID } from '@/types/creneau-byId';
import { Skeleton } from '@heroui/react';

export default function CreneauxDetail({ dataCreneau }: { dataCreneau: CreneauID[] | null }) {
  if (dataCreneau && dataCreneau.length) {
    return (
      <div className="gap-2 gap-x-5 grid grid-cols-2 sm:grid-cols-3 mt-24">
        {dataCreneau.map((item: CreneauID) => {
 
          const jourDebut = item.debut?.substring(8, 10);
          const jourFin = item.fin?.substring(8, 10);

          const moiDebut = item.debut?.substring(5, 7);
          const moiFin = item.fin?.substring(5, 7);

          let moi;

          const fnMois = (mois: string) => {
            switch (mois) {
              case '01':
                return (moi = 'Janv');
                break;
              case '02':
                return (moi = 'Fev');
                break;
              case '03':
                return (moi = 'Mars');
                break;
              case '04':
                return (moi = 'Avril');
                break;
              case '05':
                return (moi = 'Mais');
                break;
              case '06':
                return (moi = 'Juin');
                break;
              case '07':
                return (moi = 'Jull');
                break;
              case '08':
                return (moi = 'Aout');
                break;
              case '09':
                return (moi = 'Sept');
                break;
              case '10':
                return (moi = 'Oct');
                break;
              case '11':
                return (moi = 'Nov');
                break;
              case '12':
                return (moi = 'Des');
                break;
              default:
            }
          };

          const fnData = () => {
            const mois = item.debut?.substring(5, 7);
            const jourDebut = item.debut?.substring(8, 10);
            const jourFin = item.fin?.substring(8, 10);

            let moi;

            const fnMois = () => {
              switch (mois) {
                case '01':
                  return (moi = 'Janv');
                  break;
                case '02':
                  return (moi = 'Fev');
                  break;
                case '03':
                  return (moi = 'Mars');
                  break;
                case '04':
                  return (moi = 'Avril');
                  break;
                case '05':
                  return (moi = 'Mais');
                  break;
                case '06':
                  return (moi = 'Juin');
                  break;
                case '07':
                  return (moi = 'Jull');
                  break;
                case '08':
                  return (moi = 'Aout');
                  break;
                case '09':
                  return (moi = 'Sept');
                  break;
                case '10':
                  return (moi = 'Oct');
                  break;
                case '11':
                  return (moi = 'Nov');
                  break;
                case '12':
                  return (moi = 'Des');
                  break;
                default:
              }
            };

            fnMois();

            return `Créneau du : ${jourDebut}-${jourFin} ${moi}`;
          };
          const style = !item.semainePassee ? 'bg-red-500 text-red-500 rounded-xl text-white py-2 px-2' : 'bg-slate-200 rounded-xl  py-2 px-2';

          return (
            <div key={item.id} className="flex flex-col gap-4">
              <p className="text-red-500">
                Plan mensuel -{jourDebut}
                {fnMois(moiDebut)} au {jourFin}
                {fnMois(moiFin)}
              </p>
              <div className={style}>{fnData()}</div>
            </div>
          );
        })}
      </div>
    );
  } else {
    return (
      <div className="gap-2 gap-x-5 grid grid-cols-2 sm:grid-cols-3 mt-24">
        <div className="flex flex-col gap-4">
          <p className="text-red-500 text-lg">Aucun creneau trouvé</p>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-red-500 text-lg">Aucun creneau trouvé</p>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-red-500 text-lg">Aucun creneau trouvé</p>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
          <Skeleton className=" bg-slate-200 rounded-xl  py-2 px-2">
            <div className="h-3 w-full rounded-lg bg-secondary" />
          </Skeleton>
        </div>
      </div>
    );
  }
}

// export default CreneauxDetail;
