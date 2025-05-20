
import { Spinner } from "../ui/spinner";


export function LoaderSpinner() {
    return (
        <div className="flex justify-center ">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99] w-[100px] h-[100px]">
                <Spinner size="large" />
            </div>
        </div>
    )
}