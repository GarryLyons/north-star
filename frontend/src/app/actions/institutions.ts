"use server";

import { fetchWithSigV4 } from "@/utils/amplify-server-utils";

export async function getInstitutions() {
    try {
        return await fetchWithSigV4("/api/v1/institutions");
    } catch (error) {
        console.error("Failed to fetch institutions:", error);
        throw error;
    }
}

export async function createInstitution(data: any) {
    try {
        return await fetchWithSigV4("/api/v1/institutions", "POST", data);
    } catch (error) {
        console.error("Failed to create institution:", error);
        throw error;
    }
}

export async function getInstitution(id: string) {
    try {
        return await fetchWithSigV4(`/api/v1/institutions/${id}`);
    } catch (error) {
        console.error(`Failed to fetch institution ${id}:`, error);
        throw error;
    }
}
