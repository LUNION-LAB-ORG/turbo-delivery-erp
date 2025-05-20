type StatusType = "WAITING" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED";

type Gender = "HOMME" ;

export interface LivreurDetail{
    id: string,
    nom: string,
    prenoms: string,
    telephone: string,
    avatarUrl: string,
    email: string,
    birthDay: string,
    gender: Gender,
    numeroCni: string,
    habitation: string,
    immatriculation: string,
    matricule: string,
    deleted: boolean,
    type: string,
    cniUrlR: string,
    cniUrlV: string,
    status: number
  }