import { title } from '@/components/primitives';
// import { Button } from '@/components/ui/button';
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@heroui/react';
// import { Input } from '@/components/ui/input';
import { ArrowDownToLine, Search } from 'lucide-react';

export default function HeaderList() {
    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Gestions des frais de livraison</h1>
            </div>

            <div className="py-6 flex items-center justify-between">
                <div className="relative">
                    <Input startContent={<Search />} placeholder="Rechercher" className="w-full" />
                </div>

                <div className="flex pt-0 flex-wrap gap-2 sm:pt-4 lg:pt-0 md:pt-0 xl:pt-0">
                    <Button size='sm' variant="bordered" endContent={<ArrowDownToLine />}>
                        Exporter
                    </Button>

                    <Popover showArrow offset={10} placement="bottom">
                        <PopoverTrigger>
                            <Button size='sm' color="primary" endContent={<ArrowDownToLine />}>
                                Ajouter
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px]">
                            {(titleProps) => (
                                <div className="px-1 py-2 w-full">
                                    <p className="text-small font-bold text-foreground" {...titleProps}>
                                        Dimensions
                                    </p>
                                    <div className="mt-2 flex flex-col gap-2 w-full">
                                        <Input defaultValue="100%" label="Width" size="sm" variant="bordered" />
                                        <Input defaultValue="300px" label="Max. width" size="sm" variant="bordered" />
                                        <Input defaultValue="24px" label="Height" size="sm" variant="bordered" />
                                        <Input defaultValue="30px" label="Max. height" size="sm" variant="bordered" />
                                    </div>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>

                    {/* <Button className="h-8" variant={'slate'}>
                        <Edit className="mr-2" /> Modifier
                    </Button>
                    <Button className="h-8" variant={'default'}>
                        <Printer className="mr-2" /> Imprimer
                    </Button> */}
                </div>
            </div>
        </div>
    );
}
