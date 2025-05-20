'use client';
import { Button, CircularProgress } from '@heroui/react';
import fnPerformance from './fn-performance';
import DropDownActionPerformance from './drop-down-action-performance';
import fnProgressionPerformance from './fn-progressive-performance';

interface props {
  data: LivreurPerformanceBirdEndTorubo[];
}
export default function UserListPerformanceBird({ data }: props) {
  return (
    <div className="flex flex-col gap-2">
      {data.map((item) => {
        const fnData = () => {
          const mois = item.creneau.debut?.substring(5, 7);
          const jourDebut = item.creneau.debut?.substring(8, 10);
          const jourFin = item.creneau.fin?.substring(8, 10);
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
              // code block
            }
          };

          fnMois();

          return `Créneau du : ${jourDebut} - ${jourFin} ${moi}`;
        };

        // const fnData = () => {
        //   const mois = item.debut?.substring(5, 7);
        //   const jourDebut = item.debut?.substring(8, 10);
        //   const jourFin = item.fin?.substring(8, 10);

        //   let moi;

        //   const fnMois = () => {
        //     switch (mois) {
        //       case '01':
        //         return (moi = 'Janv');
        //         break;
        //       case '02':
        //         return (moi = 'Fev');
        //         break;
        //       case '03':
        //         return (moi = 'Mars');
        //         break;
        //       case '04':
        //         return (moi = 'Avril');
        //         break;
        //       case '05':
        //         return (moi = 'Mais');
        //         break;
        //       case '06':
        //         return (moi = 'Juin');
        //         break;
        //       case '07':
        //         return (moi = 'Jull');
        //         break;
        //       case '08':
        //         return (moi = 'Aout');
        //         break;
        //       case '09':
        //         return (moi = 'Sept');
        //         break;
        //       case '10':
        //         return (moi = 'Oct');
        //         break;
        //       case '11':
        //         return (moi = 'Nov');
        //         break;
        //       case '12':
        //         return (moi = 'Des');
        //         break;
        //       default:
        //     }
        //   };

        //   fnMois();

        //   return `Créneau du : ${jourDebut}-${jourFin} ${moi}`;
        // };

        const jour = item.etats.map((item, index) => item);

        return (
          <div key={item.id} className="flex overflow-hidden">
            <div
              className="
                  relative
                  w-full
                  overflow-x-auto overflow-y-hidden
                  px-5 py-3
                  hide-scrollbar
                  flex flex-nowrap gap-2
                  border-2 rounded-2xl
                  space-x-4
                  flex-1
                "
            >
              {/* avatar + nom */}
              <div className="flex-shrink-0 flex items-center w-1/6">
                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                <p className="font-semibold text-slate-500">{item.nomComplet}</p>
              </div>

              {/* date / statut */}
              <div className="flex-shrink-0 ww-3/12 bg-red-500 flex items-center rounded-2xl text-white ppy-2 px-2">{fnData()}</div>

              {/* boutons jours */}
              <div className="flex-shrink-0 w-[350px]  flex items-center gap-2">
                <span>En cours</span>
                {item.etats.map((etat, idx) => {
                  const lettre = etat.jour[0];
                  const style = etat.statut === 'VALIDE' ? 'warning' : etat.statut === 'MANQUE' ? 'danger' : 'default';
                  return (
                    <Button key={idx} isIconOnly size="sm" color={style}>
                      {lettre}
                    </Button>
                  );
                })}
              </div>

              {/* progression */}
              <div className="flex-shrink-0 w-1/6  flex gap-2 items-center">
                {fnProgressionPerformance(item)}
                <span>Performance {fnPerformance(item)}</span>
              </div>

              {/* commission */}
              <div className="flex-shrink-0 w-1/12">
                <h3>Commission</h3>
                <h4 className="text-lg">{item.commission}</h4>
              </div>

              {/* prime */}
              <div className="flex-shrink-0 w-1/12">
                <h3>Prime</h3>
                <h4 className="text-lg">{item.prime}</h4>
              </div>

              {/* actions */}
              {/* <div className="flex-shrink-0 fixed  aabsolute right-10  bg-yellow-500">
              <DropDownActionPerformance id={item.id} />
            </div> */}
            </div>

            {/* action  */}
          <div className="bg-stone-100 w-[50px] bbg-slate-800 rounded-r-2xl flex items-center justify-center fflex-shrink-0 relative  -left-10">
            <DropDownActionPerformance id={item.id} />
          </div>
          </div>
        );
      })}
    </div>
  );
}
