
import { useState } from "react";

export function useCoursiersController() {
    const [searchKey, setSearchKey] = useState("");

    const items = [
        {
            restaurantId: 1,
            restaurant: 'Tous les turboys',
            date: '2022-01-01',
            course: 'Course 1',
            status: 'En attente',
            isAllUsers: true,
            isTurboysAssigned: false,
            isTurboysBird: false,
            isDemandeAssignations: false,
            data: [
                {
                    id: 1,
                    name: 'John Doe',
                    status: 'En attente'
                },
                {
                    id: 2,
                    name: 'Jane Doe',
                    status: 'En attente'
                },
                {
                    id: 3,
                    name: 'Alice Doe',
                    status: 'En attente'
                }
            ]
        }, {
            restaurantId: 2,
            restaurant: 'Les turbos Assignés',
            date: '2022-01-02',
            course: 'Course 2',
            status: 'En attente',
            isAllUsers: false,
            isTurboysAssigned: true,
            isTurboysBird: false,
            isDemandeAssignations: false,
            data: [
                {
                    id: 4,
                    name: 'Bob Doe',
                    status: 'En attente'
                },
                {
                    id: 5,
                    name: 'Emma Doe',
                    status: 'En attente'
                },
                {
                    id: 6,
                    name: 'David Doe',
                    status: 'En attente'
                }
            ]
        },
        {
            restaurantId: 3,
            restaurant: 'Turboys BIRD',
            date: '2022-01-03',
            course: 'Course 3',
            status: 'En attente',
            isAllUsers: false,
            isTurboysAssigned: false,
            isTurboysBird: true,
            isDemandeAssignations: false,
            data: [
                {
                    id: 7,
                    name: 'Claire Doe',
                    status: 'En attente'
                },
                {
                    id: 8,
                    name: 'Grace Doe',
                    status: 'En attente'
                },
                {
                    id: 9,
                    name: 'Sophie Doe',
                    status: 'En attente'
                }
            ]
        },
        {
            restaurantId: 4,
            restaurant: 'Demande d\'assignation',
            date: '2022-01-04',
            course: 'Course 4',
            status: 'En attente',
            isAllUsers: false,
            isTurboysBird: false,
            isDemandeAssignations: true,
            data: [
                {
                    id: 10,
                    name: 'Lisa Doe',
                    status: 'En attente'
                },
                {
                    id: 11,
                    name: 'Olivia Doe',
                    status: 'En attente'
                },
                {
                    id: 12,
                    name: 'Isabella Doe',
                    status: 'En attente'
                }
            ],
            decompte: <span className="bg-primary text-white font-bold pl-2 pr-2  rounded-full text-ms w-4 h-4">3</span>
        },

    ]

    const onChange = (event: any) => {
        setSearchKey(event.target.value)
    }
    return {
        items,
        searchKey,
        onChange,
    }
}