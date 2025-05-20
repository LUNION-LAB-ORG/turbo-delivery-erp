import CardBodyPlanningHebdomadaire from '@/app/(protected)/delivery-men/performance-apercue/[livreurId]/planning-hebdomadaire/[emploiId]/Cardbody-planning-hebdomadaire';
import TableCreneauEmploi from '@/app/(protected)/delivery-men/performance-apercue/[livreurId]/planning-hebdomadaire/[emploiId]/Cardbody-planning-hebdomadaire';
import { CreneauVM, Jour, PerformanceHebdomadaire } from '@/types/performance-hebdomadaire';

export default function BodyInfo({ data }: { data: PerformanceHebdomadaire }) {
  // const today = new Date().toLocaleDateString('fr-FR');

  const fnMois = (mois:string) => {
    let moi;
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

  const creneau = (data:CreneauVM) => {
    const m=data.fin.substring(5, 7)

    const mois = fnMois(m)
    const jourDebut = data.debut.substring(8, 10);
    const jourFin = data.fin.substring(8, 10);

    return `Créneau du ${jourDebut}-${jourFin} ${mois}`;
  };

  const todays = () => {
    const today = new Date().toLocaleDateString('fr-FR');

    const m = today.substring(3, 5);
    const mois = fnMois(m);

    const jour = today.substring(0, 2);
    // const année = data.creneauVM.fin.substring(8, 10);

    return `Aujourd'huit ${jour}-${mois}`;
  };

  const fnData = (date:Jour) => {
    const m=date.date.substring(5, 7)
    const mois = fnMois(m)
    const jour = date.date.substring(8, 10);
    return `, ${jour} ${mois}`;
  };

  return (
    <div className="py-10">
      <div className=" gap-2 lg:gap-0 px-2 lg:px-4 flex items-center justify-between">
        <div>{todays()}</div>
        <div className="bg-red-400 rounded-lg p-2">{creneau(data.creneauVM)}</div>
        <div>-</div>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        {data.jours.map((item, index) => {
          return (
            <div key={index} className="flex border-2 py-5 px-2 rounded-lg ">
              <div className="pr-2">
                {' '}
                <span>{item.jour}</span>
                 <span>{fnData(item)}</span>
              </div>
              <span>{item.debut.substring(0, 5)}</span>

              <div className="flex-grow flex justify-between w-full overflow-x-auto">
                <CardBodyPlanningHebdomadaire initialData={item.heures} />
              </div>
              <span>{item.debut.substring(0, 5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
