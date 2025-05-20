'use client'
import RetourButton from "@/components/dashboard/retourButton";
import CreneauxDetail from "@/components/dashboard/slot/progression-details/creneaux-detail";
import User from "@/components/dashboard/slot/progression-details/user";
import { CreneauID } from "@/types/creneau-byId";
import { LivreurDetail } from "@/types/livreur";
import { Button, Card, Input } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";
import { ArrowLeft, Edit } from "lucide-react";
import Image from "next/image";
import useContentCtx from "./useContentCtx";


export interface Turboys  {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  domicile: string;
  email: string;
  typeDocument: string;
  numeroDocument: string;
  type: string;
  nomVehicule: string;
  immatriculationVehicule: string;
}

export default function Content({user,dataCreneau}:{user:LivreurDetail,dataCreneau:CreneauID[]|null}){
   
  const {exerianceLivreur}=useContentCtx({dataCreneau})
    return (

        <Card className="py-6 px-4 lg:px-20 bbg-gray-50 min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
             <div className="flex items-center">
             <RetourButton/>
                <h1 className="text-xl font-bold text-red-500">
                    {user.nom} {user.prenoms}
                </h1>
                </div>
            </div>
          </div>
    
         <User user={user} dataCreneau={dataCreneau} exerianceLivreur={exerianceLivreur}/>
         <CreneauxDetail dataCreneau={dataCreneau}/>
        </Card>
      );
}