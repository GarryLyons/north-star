"use server";

import { fetchWithSigV4 } from "@/utils/amplify-server-utils";

export interface InviteUserPayload {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    scope: string;
}

export interface CreateInstitutionUserPayload {
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    institutionId: string;
    canCreateUser?: boolean;
    canCreateDepartment?: boolean;
    canCreatePathway?: boolean;
    canManagePermissions?: boolean;
}

export interface CreateDepartmentUserPayload {
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    departmentId: string;
    canCreatePathway?: boolean;
    canCreateUser?: boolean;
}

export interface CreatePathwayUserPayload {
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    pathwayIds: string[];
}

export async function inviteUser(data: InviteUserPayload, userId?: string) {
    try {
        return await fetchWithSigV4("/api/users/invite", "POST", data, userId);
    } catch (error) {
        console.error("Failed to invite user:", error);
        throw error;
    }
}

export async function inviteInstitutionUser(data: CreateInstitutionUserPayload, userId?: string) {
    try {
        return await fetchWithSigV4("/api/users/invite/institution", "POST", data, userId);
    } catch (error) {
        console.error("Failed to invite institution user:", error);
        throw error;
    }
}

export async function inviteDepartmentUser(data: CreateDepartmentUserPayload, userId?: string) {
    try {
        return await fetchWithSigV4("/api/users/invite/department", "POST", data, userId);
    } catch (error) {
        console.error("Failed to invite department user:", error);
        throw error;
    }
}

export async function invitePathwayUser(data: CreatePathwayUserPayload, userId?: string) {
    try {
        return await fetchWithSigV4("/api/users/invite/pathway", "POST", data, userId);
    } catch (error) {
        console.error("Failed to invite pathway user:", error);
        throw error;
    }
}

export async function getCurrentUser(userId?: string) {
    try {
        return await fetchWithSigV4("/api/users/me", "GET", undefined, userId);
    } catch (error) {
        console.error("Failed to fetch current user:", error);
        return null;
    }
}
