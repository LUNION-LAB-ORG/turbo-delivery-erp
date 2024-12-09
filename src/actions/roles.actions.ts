'use server';

import { apiClient } from '@/lib/api-client';

import rolesEndpoints from '@/src/endpoints/roles.endpoint';
import { Role } from '@/types/models';

export async function getAllRoles(): Promise<Role[]> {
    const response = await apiClient.get(rolesEndpoints.getAll);
    if (!response.ok) {
        return [];
    }
    const result = await response.json();
    return result;
}
