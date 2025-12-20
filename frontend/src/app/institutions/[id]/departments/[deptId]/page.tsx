"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { fetchWithKey } from "@/utils/api";

interface Department {
    id: string;
    name: string;
    institutionId: string;
}

export default function DepartmentDetail() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthenticator((context) => [context.user]);
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);

    // Parse IDs from URL
    const institutionId = params.id as string;
    const departmentId = params.deptId as string;

    useEffect(() => {
        if (user && institutionId && departmentId) {
            fetchDepartment();
        }
    }, [user, institutionId, departmentId]);

    async function fetchDepartment() {
        try {
            const res = await fetchWithKey(`http://127.0.0.1:5271/api/v1/institutions/${institutionId}/departments/${departmentId}`);
            if (res.ok) {
                const data = await res.json();
                setDepartment(data);
            } else {
                console.error("Failed to fetch department");
            }
        } catch (error) {
            console.error("Error fetching department:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!department) return <div>Department not found</div>;

    return (
        <div className="max-w-4xl">
            <Breadcrumbs
                items={[
                    { name: "Institution", href: `/institutions/${institutionId}`, current: false },
                    { name: department.name, href: "#", current: true },
                ]}
            />
            <div className="flex items-center gap-x-4 mb-6">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
                    &larr; Back
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">Department: {department.name}</h1>
            </div>

            <div className="bg-white shadow sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Details</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p><strong>ID:</strong> {department.id}</p>
                        <p><strong>Institution ID:</strong> {department.institutionId}</p>
                    </div>
                </div>
            </div>

            {/* Pathways Section */}
            <div className="mt-12 border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Pathways</h2>
                    <button
                        onClick={() => router.push(`/institutions/${institutionId}/departments/${departmentId}/pathways/new`)}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Add Pathway
                    </button>
                </div>
                <PathwaysList institutionId={institutionId} departmentId={departmentId} />
            </div>
        </div>
    );
}

function PathwaysList({ institutionId, departmentId }: { institutionId: string; departmentId: string }) {
    const [pathways, setPathways] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchPathways();
    }, [institutionId, departmentId]);

    async function fetchPathways() {
        try {
            const res = await fetchWithKey(`http://127.0.0.1:5271/api/v1/departments/${departmentId}/pathways`);
            if (res.ok) {
                const data = await res.json();
                setPathways(data);
            }
        } catch (error) {
            console.error("Failed to fetch pathways", error);
        }
    }

    if (pathways.length === 0) {
        return <p className="mt-4 text-sm text-gray-500">No pathways found.</p>;
    }

    return (
        <ul role="list" className="mt-4 divide-y divide-gray-100 border rounded-md border-gray-200">
            {pathways.map((path) => (
                <li
                    key={path.id}
                    className="relative flex justify-between gap-x-6 py-4 px-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/institutions/${institutionId}/departments/${departmentId}/pathways/${path.id}`)}
                >
                    <div className="flex min-w-0 gap-x-4">
                        <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                {path.name}
                            </p>
                            {path.description && (
                                <p className="mt-1 flex text-xs leading-5 text-gray-500">{path.description}</p>
                            )}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
