
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
    items: any[];
}
export function SearchBar({ items }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setIsOpen(e.target.value.length > 0);
    };

    return (
        <div className="relative w-full max-w-lg mx-auto">
            <div className="relative">
                <Search className="absolute left-3 top-2 text-gray-400" size={18} />
                <Input
                    type="text"
                    placeholder="Rechercher"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => setIsOpen(query.length > 0)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
            </div>

            {isOpen && (
                <div className="absolute w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    <ul className="py-2">
                        {items
                            .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
                            .map((item, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100"
                                    onMouseDown={() => setQuery(item)}
                                >

                                    {item}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </div>
    );
}


