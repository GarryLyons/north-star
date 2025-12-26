"use server";

import { fetchWithSigV4 } from "@/utils/amplify-server-utils";

export async function getInstitutions(userId?: string) {
    try {
        return await fetchWithSigV4("/api/v1/institutions", "GET", undefined, userId);
    } catch (error) {
        console.error("Failed to fetch institutions:", error);
        throw error;
    }
}

export async function createInstitution(data: any, userId?: string) {
    try {
        return await fetchWithSigV4("/api/v1/institutions", "POST", data, userId);
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

export async function updateInstitution(id: string, data: any) {
    try {
        return await fetchWithSigV4(`/api/v1/institutions/${id}`, "PUT", data);
    } catch (error) {
        console.error(`Failed to update institution ${id}:`, error);
        throw error;
    }
}

export async function getDepartments(institutionId: string) {
    try {
        return await fetchWithSigV4(`/api/v1/institutions/${institutionId}/departments`);
    } catch (error) {
        console.error(`Failed to fetch departments for institution ${institutionId}:`, error);
        throw error;
    }
}

export async function createDepartment(institutionId: string, data: any) {
    try {
        return await fetchWithSigV4(`/api/v1/institutions/${institutionId}/departments`, "POST", data);
    } catch (error) {
        console.error(`Failed to create department for institution ${institutionId}:`, error);
        throw error;
    }
}

export async function getDepartment(institutionId: string, departmentId: string) {
    try {
        return await fetchWithSigV4(`/api/v1/institutions/${institutionId}/departments/${departmentId}`);
    } catch (error) {
        console.error(`Failed to fetch department ${departmentId} for institution ${institutionId}:`, error);
        throw error;
    }
}

export async function getPathways(departmentId: string) {
    try {
        return await fetchWithSigV4(`/api/v1/departments/${departmentId}/pathways`);
    } catch (error) {
        console.error(`Failed to fetch pathways for department ${departmentId}:`, error);
        throw error;
    }
}

export async function createPathway(departmentId: string, data: any) {
    try {
        return await fetchWithSigV4(`/api/v1/departments/${departmentId}/pathways`, "POST", data);
    } catch (error) {
        console.error(`Failed to create pathway for department ${departmentId}:`, error);
        throw error;
    }
}

export async function updatePathway(departmentId: string, pathwayId: string, data: any) {
    try {
        return await fetchWithSigV4(`/api/v1/departments/${departmentId}/pathways/${pathwayId}`, "PUT", data);
    } catch (error) {
        console.error(`Failed to update pathway ${pathwayId}:`, error);
        throw error;
    }
}

export async function getPathway(departmentId: string, pathwayId: string) {
    try {
        return await fetchWithSigV4(`/api/v1/departments/${departmentId}/pathways/${pathwayId}`);
    } catch (error) {
        console.error(`Failed to fetch pathway ${pathwayId}:`, error);
        throw error;
    }
}

export async function getStages(pathwayId: string) {
    try {
        // Assuming endpoint for stages is implicitly under pathway or fetched with pathway. 
        // Adjusting to common REST pattern, or if stages are embedded in pathway, this might be redundant.
        // Based on previous code, stages might be a sub-resource.
        return await fetchWithSigV4(`/api/v1/pathways/${pathwayId}/stages`);
    } catch (error) {
        console.error(`Failed to fetch stages for pathway ${pathwayId}:`, error);
        throw error;
    }
}

export async function createStage(pathwayId: string, data: any) {
    try {
        return await fetchWithSigV4(`/api/v1/pathways/${pathwayId}/stages`, "POST", data);
    } catch (error) {
        console.error(`Failed to create stage for pathway ${pathwayId}:`, error);
        throw error;
    }
}

export async function getStage(pathwayId: string, stageId: string) {
    try {
        return await fetchWithSigV4(`/api/v1/pathways/${pathwayId}/stages/${stageId}`);
    } catch (error) {
        console.error(`Failed to fetch stage ${stageId}:`, error);
        throw error;
    }
}

export async function updateStage(pathwayId: string, stageId: string, data: any) {
    try {
        return await fetchWithSigV4(`/api/v1/pathways/${pathwayId}/stages/${stageId}`, "PUT", data);
    } catch (error) {
        console.error(`Failed to update stage ${stageId}:`, error);
        throw error;
    }
}

export async function deleteStage(pathwayId: string, stageId: string) {
    try {
        return await fetchWithSigV4(`/api/v1/pathways/${pathwayId}/stages/${stageId}`, "DELETE");
    } catch (error) {
        console.error(`Failed to delete stage ${stageId}:`, error);
        throw error;
    }
}
