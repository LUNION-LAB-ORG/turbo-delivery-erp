import SearchBar from "@/app/(protected)/trafic/searchBar";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Map, Search } from "lucide-react";


export function SearchAndLink() {
    return (
        <div className="flex gap-4 w-1/4">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 border-red-500" size={20} />
                <Input
                    placeholder="Rechercher un coursier ou un restaurant"
                    className="pl-10 rounded-lg bg-white border-2 h-12"
                />
            </div>
            <Badge className="rounded-full pr-4 cursor-pointer"> <Map className="mr-4" size={30} /> Maps</Badge>
        </div>
    )
}