import { NotificationContent } from "./content";
import { auth } from '@/auth';
import { fetchAllNotifcation } from "@/src/actions/notifcation.action";


export default async function Page() {
    const session = await auth()
    const initalNotifications = await fetchAllNotifcation(session?.user?.id ?? "");
    return (
        <NotificationContent intialNotification={initalNotifications} />

    )
}