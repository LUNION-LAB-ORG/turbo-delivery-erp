import { Button } from '@heroui/react';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ButtonRetour(){
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Garantir que le code s'exécute après le montage côté client
  }, []);

  const handleRetour = () => {
    window.history.back(); 
  };

  if (!isClient) {
    return null;
  }

  return (
        <Button onClick={handleRetour} variant="light" className="text-red-500">
            <ChevronLeft size="sm" />
        </Button>

    // <Button variant="light" onClick={handleRetour} >
    //   Retour
    // </Button>
  );
};

