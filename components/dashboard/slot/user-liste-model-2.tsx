import { Card, CardHeader, CardBody, CardFooter, Divider, Link, Image } from '@heroui/react';
import DropDownAction from './dropDownAction';
import progresseBare from '../delivery-men/progression/progression-barre';
import { IconPointFilled } from '@tabler/icons-react';
const UserListeModel2 = ({ turboy }:any) => {
  return (
    <Card className="max-w-[400px]">
      <CardHeader className="flex justify-between gap-3">
        <div className='flex gap-2 items-center'>
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>

          {/* <Image alt="heroui logo" height={40} radius="sm" src="https://avatars.githubusercontent.com/u/86160567?s=200&v=4" width={40} /> */}
          <p className="text-md">{turboy.nomComplet}</p>
        </div>

        <DropDownAction id={turboy.id}  />
      </CardHeader>
      <CardBody className='flex flex-col gap-2'>
      <p className="w-1/2 text-sm text-gray-500">Inscrit le : {turboy.dateInscrit}</p>
      <p className="text-sm text-gray-500 mr-3">Défini le : {turboy.dateDefiniEmploiTemps}</p>

      </CardBody>
      <CardFooter>
      <div className="flex gap-2">
        {progresseBare(turboy)}
      <span className='relative mt-5  '>
       {turboy.disponibilite?<IconPointFilled  style={{ border: 'none' }}  color="#16B84E" size={30} />:<IconPointFilled  style={{ border: 'none' }}  color="#FF0000" size={30} />}
       {turboy.disponibilite?<span className="absolute -top-[3px] inline-flex h-full w-full animate-ping  rounded-full bg-success/50 opacity-75 ltr:-left-[3px] rtl:-right-[3px]"></span>:''}
</span>
       </div>
      </CardFooter>
    </Card>
  );
};

export default UserListeModel2;
