

import { fetchAllNotifcation } from "@/src/actions/notifcation.action";
import { NotificationVM } from "@/types/notifcation.model";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useNotificationController(intialNotification: NotificationVM[]) {

    return {
        intialNotification
    }

}