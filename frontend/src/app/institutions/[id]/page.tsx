"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { fetchWithKey } from "@/utils/api";

interface Institution {
    id: string;
    name: string;
    code: string;
    address: string;
}

export default function InstitutionDetail() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthenticator((context) => [context.user]);
    const [formData, setFormData] = useState<Institution | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && params.id) {
            fetchInstitution(params.id as string);
        }
    }, [user, params.id]);

    async function fetchInstitution(id: string) {
        try {
            const res = await fetchWithKey(`http://127.0.0.1:5271/api/v1/institutions/${id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData(data);
            } else {
                console.error("Failed to fetch institution");
            }
        } catch (error) {
            console.error("Error fetching institution:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData) return;
        setSaving(true);

        try {
            // Note: Backend PUT not implemented yet in this session plan, checking...
            // Plan said: PUT /api/v1/institutions/{id}
            // I only implemented Create (POST) and List (GET).
            // I need to implement UPDATE in backend?
            // Wait, "Institution Controller" code I wrote earlier:
            // I check my own code.
            // POST and GET {id} and GET (List).
            // I missed PUT!
            // So Frontend Submit will fail if I try to PUT.
            // I will add PUT to backend now as well.
            // For now, I'll just console log "Not Implemented" or try POST? 
            // POST usually creates new.
            // I will implement PUT in backend quickly as well.

            const res = await fetchWithKey(`http://127.0.0.1:5271/api/v1/institutions/${formData.id}`, {
                method: "PUT", // Need to implement this backend side
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert("Institution updated successfully");
                router.push("/institutions");
            } else {
                // Fallback for now if 405/404
                alert("Update failed (Backend might not support update yet)");
            }
        } catch (error) {
            console.error("Error updating institution:", error);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!formData) return <div>Institution not found</div>;

    return (
        <div className="max-w-xl">
            <Breadcrumbs
                items={[
                    { name: "Institutions", href: "/institutions", current: false },
                    { name: formData.name, href: `/institutions/${formData.id}`, current: true },
                ]}
            />
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Institution</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                        Institution Name
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="code" className="block text-sm font-medium leading-6 text-gray-900">
                        Institution Code
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="code"
                            id="code"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                        Address
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="address"
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-x-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>

            <div className="mt-12 border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
                    <button
                        onClick={() => router.push(`/institutions/${formData.id}/departments/new`)}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Add Department
                    </button>
                </div>
                <DepartmentsList institutionId={formData.id} />
            </div>
        </div>
    );
}

function DepartmentsList({ institutionId }: { institutionId: string }) {
    const [departments, setDepartments] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchDepartments();
    }, [institutionId]);

    async function fetchDepartments() {
        try {
            const res = await fetchWithKey(`http://127.0.0.1:5271/api/v1/institutions/${institutionId}/departments`);
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    }

    if (departments.length === 0) {
        return <p className="mt-4 text-sm text-gray-500">No departments found.</p>;
    }

    return (
        <ul role="list" className="mt-4 divide-y divide-gray-100 border rounded-md border-gray-200">
            {departments.map((dept) => (
                <li
                    key={dept.id}
                    className="relative flex justify-between gap-x-6 py-4 px-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/institutions/${institutionId}/departments/${dept.id}`)}
                >
                    <div className="flex min-w-0 gap-x-4">
                        <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                {dept.name}
                            </p>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
