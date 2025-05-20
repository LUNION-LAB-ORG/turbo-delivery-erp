'use client';
import { LivreurBird } from '@/types/creneau-bird';
import DropDownAction from './dropDownAction';
import CreneauxDetail from './progression-details/creneaux-detail';
import progresseBare from '../delivery-men/progression/progression-barre';
import { IconPointFilled } from '@tabler/icons-react';

interface props {
  turboy: LivreurBird;
}
const userListeModel1 = ({ turboy }: props) => {
  return (
    <div key={turboy.id} className="w-ful flex items-center border-2 rounded-2xl">
      <div className="py-2 px-4 flex-1 flex justify-between gap-2 items-center  rounded-lg">
        <div className="flex items-center w-1/2">
          {/* <Avatar isBordered radius="full" size="md" src={undefinedRestaurant.logo_Url} /> */}
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
          <p className="font-semibold">{turboy.nomComplet}</p>
        </div>
        <p className="w-1/2 text-sm text-gray-500">Inscrit le : {turboy.dateInscrit}</p>
      </div>

      <div className="mr-8 flex-1 flex justify-between items-center">
        <p className="text-sm text-gray-500 mr-3">Défini le : {turboy.dateDefiniEmploiTemps}</p>

        <div className="relative flex gap-2">
          {/* <span className='absolutee'>creneau du 12-27 fev(5/7)</span> */}
          {progresseBare(turboy)}
          <span className="relative flex  items-end mt-6">
            {turboy.disponibilite?<IconPointFilled color="#16B84E" size={30} />:<IconPointFilled color="#FF0000" size={30} />}
            {turboy.disponibilite?<span className="absolute -top-[3px] inline-flex h-full w-full animate-ping duration-3000 rounded-full bg-success/50 opacity-75 ltr:-left-[3px] rtl:-right-[3px]"></span>:''}

          </span>

          {/* {turboy.disponibilite == true ? <IconPointFilled color="#16B84E" size={30} /> : <IconPointFilled color="#FF0000" size={30} />} */}
        </div>

        <DropDownAction id={turboy.id} />
      </div>
    </div>
  );
};

export default userListeModel1;
