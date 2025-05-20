import { Button } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

const RetourButton = () => {
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
            <ArrowLeft size={24} />
        </Button>

    // <Button variant="light" onClick={handleRetour} >
    //   Retour
    // </Button>
  );
};

export default RetourButton;
