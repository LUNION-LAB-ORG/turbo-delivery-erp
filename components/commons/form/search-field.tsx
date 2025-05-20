import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchFieldProps {
    searchKey: string;
    onChange: (value: string) => void;
}
export function SearchField(props: SearchFieldProps) {
    const handleChange = (event: any) => {
        props.onChange(event.target.value);
    }
    return (
        <div className="relative w-full max-w-lg">
            <div className="relative">
                <Search className="absolute left-3 top-2 text-gray-400" size={18} />
                <Input
                    type="text"
                    placeholder="Rechercher"
                    value={props.searchKey}
                    onChange={handleChange}
                    className="w-2/3 pl-10 pr-4 py-2 border-2 rounded-full bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
            </div>
        </div>
    )
}