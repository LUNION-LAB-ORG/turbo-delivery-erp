'use client';
import { LivreurBird } from '@/types/creneau-bird';
// import DropDownAction from './dropDownAction';
// import CreneauxDetail from './progression-details/creneaux-detail';
// import progresseBare from '../delivery-men/progression/progression-barre';
import { IconPointFilled } from '@tabler/icons-react';
import DropDownAction from './dropDownAction';
import progresseBare from '../progression/progression-barre';
import { Avatar } from '@heroui/react';
import createUrlFile from '@/utils/createUrlFile';

interface props {
  turboy: LivreurBird;
}
export default function UserListeModel1({ turboy }: props) {
  return (
    <div className="overflow-x-auto overflow-y-hidden hide-scrollbar">
      <div key={turboy.id} className="w-fulll min-w-[1000px] flex items-center border-2 rounded-2xl">
        <div className="flex-shrink-0 py-2 px-4 flex-1 flex lg:justify-between gap-2 items-center  rounded-lg">
          <div className="max-w-[300px] flex items-center ww-1/2 gap-2">
            <Avatar isBordered radius="full" size="md" src={createUrlFile(turboy?.avatar ?? '', 'backend')} />
            {/* <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div> */}
            <p className="font-semibold">{turboy.nomComplet}</p>
          </div>
          <p className="w-1/2 text-sm text-gray-500">Inscrit le : {turboy.dateInscrit}</p>
        </div>

        <div className="flex-shrink-0 pr-8 flex-1 flex lg:justify-between items-center">
          <p className="text-sm text-gray-500 mr-3">Défini le : {turboy.dateDefiniEmploiTemps}</p>

          <div className="relative flex gap-2">
            {/* <span className='absolutee'>creneau du 12-27 fev(5/7)</span> */}
            {progresseBare(turboy)}
            <span className="relative flex  items-end mt-6">
              {turboy.disponibilite ? <IconPointFilled color="#16B84E" size={30} /> : <IconPointFilled color="#FF0000" size={30} />}
              {turboy.disponibilite ? (
                <span className="absolute -top-[3px] inline-flex h-full w-full animate-ping duration-3000 rounded-full bg-success/50 opacity-75 ltr:-left-[3px] rtl:-right-[3px]"></span>
              ) : (
                ''
              )}
            </span>

            {/* {turboy.disponibilite == true ? <IconPointFilled color="#16B84E" size={30} /> : <IconPointFilled color="#FF0000" size={30} />} */}
          </div>

          <span className='pl-16 lg:pl-0'>
          <DropDownAction id={turboy.id} />
          </span>
        </div>
      </div>
    </div>
  );
}
