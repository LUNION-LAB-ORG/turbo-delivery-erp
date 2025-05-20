interface Creneau {
    debut: string;  
    fin: string;   
  }
  
  interface Etat {
    date: string;   
    jour: string;   
    statut: string; 
  }
  
  interface LivreurPerformanceBirdEndTorubo {
    id: string;            
    avatarUrl: string;       
    nomComplet: string;    
    creneau: Creneau;       
    etats: Etat[];         
    performance: number;   
    commission: number;    
    prime: number;         
  }
  