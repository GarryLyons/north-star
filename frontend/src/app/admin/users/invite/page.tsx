"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import {
    inviteUser,
    inviteInstitutionUser,
    inviteDepartmentUser,
    invitePathwayUser,
    getCurrentUser
} from "@/app/actions/users";
import { getInstitutions, getDepartments, getPathways } from "@/app/actions/institutions";

// Types for fetched data
interface Institution { id: string; name: string; }
interface Department { id: string; name: string; institutionId: string; }
interface Pathway { id: string; name: string; departmentId: string; }

// Role Constants
const ROLES = {
    SUPER_ADMIN: "super-admin",
    INSTITUTION_USER: "institution-user",
    DEPARTMENT_USER: "department-user",
    PATHWAY_USER: "pathway-user"
};

export default function InviteUserPage() {
    // Auth Hook
    const { user } = useAuthenticator((context) => [context.user]);
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    // Form State
    const [role, setRole] = useState(ROLES.INSTITUTION_USER);
    const [baseData, setBaseData] = useState({ email: "", firstName: "", lastName: "" });

    // Scope State
    const [selectedInstitution, setSelectedInstitution] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedPathways, setSelectedPathways] = useState<string[]>([]);

    // Toggles State
    const [toggles, setToggles] = useState({
        canCreateUser: false,
        canCreateDepartment: false,
        canCreatePathway: false,
        canManagePermissions: false
    });

    // Data Sources
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [pathways, setPathways] = useState<Pathway[]>([]);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Current User State
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [availableRoles, setAvailableRoles] = useState(Object.values(ROLES));

    // Fetch Initial Data
    useEffect(() => {
        const loadData = async () => {
            // Only load if user is present (to grab ID)
            if (!user) return;

            try {
                // 1. Get Current User using ID for context
                const userId = user.userId;
                const fetchedUser = await getCurrentUser(userId);
                setCurrentUser(fetchedUser);

                // 2. Adjust Roles & Scope based on User
                if (fetchedUser) {
                    if (fetchedUser.role !== "super-admin") {
                        // Remove Super Admin from options
                        setAvailableRoles(Object.values(ROLES).filter(r => r !== ROLES.SUPER_ADMIN));

                        // If Institution User, lock Institution
                        if (fetchedUser.role === "institution-user" && fetchedUser.scope) {
                            const instId = fetchedUser.scope.replace("inst:", "");
                            setSelectedInstitution(instId);
                        }
                    } else {
                        // Super Admin
                        setAvailableRoles(Object.values(ROLES));
                    }
                }

                // 3. Load Institutions
                const data = await getInstitutions(userId);
                if (Array.isArray(data)) setInstitutions(data);
                else setInstitutions([]);

            } catch (err) {
                console.error("Failed to load initial data", err);
            } finally {
                setIsLoadingData(false);
            }
        };
        loadData();
    }, [user]);

    // Fetch Departments when Institution changes
    useEffect(() => {
        if (selectedInstitution && (role === ROLES.DEPARTMENT_USER || role === ROLES.PATHWAY_USER)) {
            // Need department list. Requires correct user context? 
            // In theory getDepartments works for Inst Users if they own the inst.
            const userId = user?.userId;
            getDepartments(selectedInstitution).then(data => {
                if (Array.isArray(data)) setDepartments(data);
                else setDepartments([]);
            }).catch(console.error);
        } else {
            setDepartments([]);
            // Only reset Dept if NOT locked by User Scope 
            if (currentUser?.role !== "department-user") {
                setSelectedDepartment("");
            }
        }
    }, [selectedInstitution, role, currentUser, user]);

    // Fetch Pathways when Department changes
    useEffect(() => {
        if (selectedDepartment && role === ROLES.PATHWAY_USER) {
            getPathways(selectedDepartment).then(data => {
                if (Array.isArray(data)) setPathways(data);
                else setPathways([]);
            }).catch(console.error);
        } else {
            setPathways([]);
            setSelectedPathways([]);
        }
    }, [selectedDepartment, role]);


    const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBaseData({ ...baseData, [e.target.name]: e.target.value });
    };

    const handleToggle = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePathwayToggle = (pathwayId: string) => {
        setSelectedPathways(prev =>
            prev.includes(pathwayId) ? prev.filter(id => id !== pathwayId) : [...prev, pathwayId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        const userId = user?.userId;

        try {
            switch (role) {
                case ROLES.SUPER_ADMIN:
                    await inviteUser({
                        email: baseData.email,
                        firstName: baseData.firstName,
                        lastName: baseData.lastName,
                        role: "super-admin",
                        scope: "global"
                    }, userId);
                    break;
                case ROLES.INSTITUTION_USER:
                    await inviteInstitutionUser({
                        ...baseData,
                        institutionId: selectedInstitution,
                        canCreateUser: toggles.canCreateUser,
                        canCreateDepartment: toggles.canCreateDepartment,
                        canCreatePathway: toggles.canCreatePathway,
                        canManagePermissions: toggles.canManagePermissions
                    }, userId);
                    break;
                case ROLES.DEPARTMENT_USER:
                    await inviteDepartmentUser({
                        ...baseData,
                        departmentId: selectedDepartment,
                        canCreateUser: toggles.canCreateUser,
                        canCreatePathway: toggles.canCreatePathway
                    }, userId);
                    break;
                case ROLES.PATHWAY_USER:
                    await invitePathwayUser({
                        ...baseData,
                        pathwayIds: selectedPathways
                    }, userId);
                    break;
            }
            setMessage({ type: "success", text: `Invitation sent to ${baseData.email}` });
            setBaseData({ email: "", firstName: "", lastName: "" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to invite user. Please check inputs and permissions." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 pb-20">
            <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Invite New User</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Configure role, scope, and permissions.</p>
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20" : "bg-red-50 text-red-700 dark:bg-red-900/20"}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {availableRoles.map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setRole(value)}
                                        className={`px-4 py-2 text-sm rounded-lg border transition-all ${role === value
                                            ? "bg-blue-600 border-blue-600 text-white shadow-md transform scale-[1.02]"
                                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                                    >
                                        {value.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">First Name</label>
                                <input name="firstName" value={baseData.firstName} onChange={handleBaseChange} required className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Last Name</label>
                                <input name="lastName" value={baseData.lastName} onChange={handleBaseChange} required className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Email Address</label>
                            <input type="email" name="email" value={baseData.email} onChange={handleBaseChange} required className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" />
                        </div>

                        {/* Scope Selection */}
                        {role !== ROLES.SUPER_ADMIN && (
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Scope Definition</h3>

                                {/* Institution Selector */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">Institution</label>
                                    <select
                                        value={selectedInstitution}
                                        onChange={(e) => setSelectedInstitution(e.target.value)}
                                        required
                                        disabled={currentUser?.role === "institution-user"}
                                        className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800"
                                    >
                                        <option value="">Select Institution...</option>
                                        {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                                    </select>
                                </div>

                                {/* Department Selector */}
                                {(role === ROLES.DEPARTMENT_USER || role === ROLES.PATHWAY_USER) && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium">Department</label>
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                            required
                                            disabled={!selectedInstitution}
                                            className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
                                        >
                                            <option value="">Select Department...</option>
                                            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Pathway Selector (Multi) */}
                                {role === ROLES.PATHWAY_USER && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium">Pathways (Select at least one)</label>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2 dark:border-zinc-700">
                                            {pathways.length === 0 && <p className="text-sm text-zinc-400 p-2">Select a department to view pathways.</p>}
                                            {pathways.map(path => (
                                                <label key={path.id} className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPathways.includes(path.id)}
                                                        onChange={() => handlePathwayToggle(path.id)}
                                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    />
                                                    <span className="text-sm">{path.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Permission Toggles */}
                        {role !== ROLES.SUPER_ADMIN && role !== ROLES.PATHWAY_USER && (
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Permissions</h3>
                                <p className="text-xs text-zinc-400 mb-4">Users always get VIEW and EDIT_PATHWAY (for their scope) by default.</p>

                                <div className="space-y-3">
                                    {(role === ROLES.INSTITUTION_USER || role === ROLES.DEPARTMENT_USER) && (
                                        <label className="flex items-start gap-3">
                                            <input type="checkbox" checked={toggles.canCreateUser} onChange={() => handleToggle('canCreateUser')} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                                            <div>
                                                <span className="block text-sm font-medium">Create Users</span>
                                                <span className="block text-xs text-zinc-500">Can invite other users within their scope.</span>
                                            </div>
                                        </label>
                                    )}

                                    {role === ROLES.INSTITUTION_USER && (
                                        <label className="flex items-start gap-3">
                                            <input type="checkbox" checked={toggles.canCreateDepartment} onChange={() => handleToggle('canCreateDepartment')} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                                            <div>
                                                <span className="block text-sm font-medium">Create Departments</span>
                                                <span className="block text-xs text-zinc-500">Can add new departments to their institution.</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Create Pathway available to Inst AND Dept */}
                                    <label className="flex items-start gap-3">
                                        <input type="checkbox" checked={toggles.canCreatePathway} onChange={() => handleToggle('canCreatePathway')} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                                        <div>
                                            <span className="block text-sm font-medium">Create Pathways</span>
                                            <span className="block text-xs text-zinc-500">Can create new clinical pathways.</span>
                                        </div>
                                    </label>

                                    {role === ROLES.INSTITUTION_USER && (
                                        <label className="flex items-start gap-3">
                                            <input type="checkbox" checked={toggles.canManagePermissions} onChange={() => handleToggle('canManagePermissions')} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                                            <div>
                                                <span className="block text-sm font-medium">Manage Permissions</span>
                                                <span className="block text-xs text-zinc-500">Can modify permissions of other users.</span>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white transition-all ${isSubmitting ? "bg-zinc-400" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                                {isSubmitting ? "Sending..." : "Send Invitation"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
