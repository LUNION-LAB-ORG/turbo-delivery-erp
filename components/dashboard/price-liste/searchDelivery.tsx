import { IconSearch } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const SearchDelivery = () => {
  const { register, setValue } = useForm();
  const [inputValue, setInputValue] = useState<string>('');

  // Synchroniser l'input avec l'URL lors du premier rendu
  useEffect(() => {
    // Récupérer le paramètre 'text' depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    console.log("search", search)
    if (search) {
      setInputValue(search);
      setValue('search', search);
    }
  }, [setValue]);

  // Fonction pour gérer les changements dans le champ de texte
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setInputValue(newText); // Mettre à jour la valeur locale de l'input

    // Mettre à jour l'URL avec la nouvelle valeur du champ
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('search', newText); // Ajouter ou mettre à jour le paramètre 'text'
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
  };

  return (
    <div className="relative">
      <input
        className='peer form-input py-2 ltr:pr-11 rtl:pl-11'
        id='text'
        type="text"
        {...register('text')}
        value={inputValue} // Lier l'input à l'état local
        onChange={handleInputChange} // Mettre à jour l'URL à chaque changement
        placeholder="Recherche"
      />
      <label htmlFor="text"><IconSearch className="cursor-pointer mx-auto absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]" /></label>
    </div>
  );
};

export default SearchDelivery;
