import { Button } from "../ui/button";


interface PaginationProps {
    currentPage: number,
    setCurrentPage: (currentPage: number) => void;
    datas: any;
    prevLabel?: string;
    nexLabel?: string;
    prevPage: number;
    className?: string;
}
export function Paginations({ currentPage, setCurrentPage, datas, prevLabel, prevPage, nexLabel, className }: PaginationProps) {
    const prevL = prevLabel ? prevLabel : 'Précédent'
    const nextL = nexLabel ? nexLabel : 'Suivant'
    return (
        <div className={`flex justify-between ml-0 mr-0  lg:ml-5 lg:mr-20 xl:ml-5 xl:mr-20 md:ml-5 md:mr-20 ${className}`}>
            <Button onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
            >{prevL}</Button>
            <Button onClick={() => setCurrentPage(currentPage + 1)}
                disabled={(currentPage + 1) * prevPage >= datas.length}
            >{nextL}</Button>
        </div>
    )
}