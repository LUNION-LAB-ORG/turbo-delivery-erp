import { CreneauID } from '@/types/creneau-byId';
import { Skeleton } from '@heroui/react';
import { useState } from 'react';

export default function CreneauxDetail({ dataCreneau }: { dataCreneau: CreneauID[] | null }) {
  const [activeTab, setActiveTab] = useState(0);
  // Fonction pour obtenir le nom du jour de la semaine
  const getJourSemaine = (dateString: string) => {
    const date = new Date(dateString);
    const jours = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    return jours[date.getDay()];
  };

  // Fonction pour générer tous les jours entre deux dates
  const getJoursEntreDates = (dateDebut: string, dateFin: string) => {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const jours = [];
    
    for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
      const jour = d.getDate();
      const nomJour = getJourSemaine(d.toISOString());
      jours.push({
        numero: jour,
        nom: nomJour,
        date: new Date(d)
      });
    }
    
    return jours;
  };

  // Fonction pour obtenir le nom du mois (corrigée)
  const fnMois = (mois: string) => {
    switch (mois) {
      case '01': return 'Janv';
      case '02': return 'Fév';
      case '03': return 'Mars';
      case '04': return 'Avril';
      case '05': return 'Mai'; // Corrigé
      case '06': return 'Juin';
      case '07': return 'Juil'; // Corrigé
      case '08': return 'Août';
      case '09': return 'Sept';
      case '10': return 'Oct';
      case '11': return 'Nov';
      case '12': return 'Déc'; // Corrigé
      default: return '';
    }
  };

  if (dataCreneau && dataCreneau.length) {
    return (
      <div className="p-4 bg-white">
        {/* En-tête avec titre - statique */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-800">Créneau</h2>
          <p className="text-pink-500 text-sm mt-1">Sélectionnez les jours de travail</p>
          <p className="text-gray-500 text-xs mt-2">
            Tu seras complètement rémunéré sur les 7 jours de travail
          </p>
          <p className="text-gray-500 text-xs">
            La durée de travail est de en 8 heures minimum.
          </p>
        </div>

        {/* Tabs horizontales scrollables */}
        <div className="overflow-x-auto mb-4">
          <div className="flex space-x-2 min-w-max">
            {dataCreneau.map((item: CreneauID, tabIndex) => {
              const jourDebut = item.debut?.substring(8, 10);
              const jourFin = item.fin?.substring(8, 10);
              const moiDebut = item.debut?.substring(5, 7);
              const moiFin = item.fin?.substring(5, 7);
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(tabIndex)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                    activeTab === tabIndex
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Semaine du {jourDebut} - {jourFin} {fnMois(moiDebut || moiFin || '')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des tabs */}
        {dataCreneau.map((item: CreneauID, tabIndex) => {
          if (tabIndex !== activeTab) return null;
          
          // Générer tous les jours entre les dates
          const joursEntreDates = item.debut && item.fin ? 
            getJoursEntreDates(item.debut, item.fin) : [];

          return (
            <div key={item.id} className="space-y-3">
              {joursEntreDates.map((jour, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">{jour.numero}</span>
                      </div>
                      <span className="text-gray-700 font-medium">{jour.nom}</span>
                    </div>
                    
                    {/* Toggle switch */}
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        defaultChecked={index > 0}
                      />
                      <div className={`w-12 h-6 rounded-full ${index > 0 ? 'bg-pink-500' : 'bg-gray-400'} relative cursor-pointer`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${index > 0 ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Horaires - affichés seulement si le jour est sélectionné */}
                  {index > 0 && (
                    <div className="mt-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-sm">Heure de début</span>
                        <div className="bg-white rounded px-3 py-1 border">
                          <span className="text-gray-700">08:00</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 text-sm">Heure de fin</span>
                        <div className="bg-white rounded px-3 py-1 border">
                          <span className="text-gray-700">22:00</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  } else {
    return (
      <div className="p-4">
        <div className="space-y-4">
          <p className="text-pink-500 text-lg">Aucun créneau trouvé</p>
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="bg-gray-200 rounded-xl p-4">
              <div className="h-16 w-full rounded-lg bg-gray-300" />
            </Skeleton>
          ))}
        </div>
      </div>
    );
  }
}