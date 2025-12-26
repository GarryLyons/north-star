"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import RichTextEditor from "@/components/RichTextEditor";
import { getPathway, updatePathway, getStages } from "@/app/actions/institutions";

interface Pathway {
    id: string;
    name: string;
    subtext?: string;
    description?: string; // HTML
    departmentId: string;
}

export default function PathwayDetail() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthenticator((context) => [context.user]);
    const [pathway, setPathway] = useState<Pathway | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", subtext: "", description: "" });

    // Parse IDs from URL
    const institutionId = params.id as string; // Needed for breadcrumbs
    const departmentId = params.deptId as string;
    const pathwayId = params.pathId as string;

    useEffect(() => {
        if (user && departmentId && pathwayId) {
            fetchPathway();
        }
    }, [user, departmentId, pathwayId]);

    async function fetchPathway() {
        try {
            const data = await getPathway(departmentId, pathwayId);
            setPathway(data);
            setEditForm({
                name: data.name || "",
                subtext: data.subtext || "",
                description: data.description || ""
            });
        } catch (error) {
            console.error("Error fetching pathway:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            const updatedData = {
                id: pathwayId,
                name: editForm.name,
                subtext: editForm.subtext,
                description: editForm.description,
                departmentId: departmentId
            };
            await updatePathway(departmentId, pathwayId, updatedData);
            setPathway({ ...pathway!, ...editForm });
            setIsEditing(false);
        } catch (e) {
            console.error("Failed to save", e);
            alert("Error saving changes.");
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!pathway) return <div>Pathway not found</div>;

    return (
        <div className="max-w-4xl">
            <Breadcrumbs
                items={[
                    { name: "Institution", href: `/institutions/${institutionId}`, current: false },
                    { name: "Department", href: `/institutions/${institutionId}/departments/${departmentId}`, current: false },
                    { name: pathway.name, href: "#", current: true },
                ]}
            />

            {/* Homepage Content Section */}
            <div className="bg-white shadow sm:rounded-lg mb-8 p-6">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Homepage Content</h2>
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        {isEditing ? "Save Changes" : "Edit Content"}
                    </button>
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subtext</label>
                            <input
                                type="text"
                                value={editForm.subtext}
                                onChange={e => setEditForm({ ...editForm, subtext: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description (HTML)</label>
                            <RichTextEditor
                                value={editForm.description}
                                onChange={val => setEditForm({ ...editForm, description: val })}
                                className="mt-1"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="prose max-w-none">
                        <h1 className="text-3xl font-bold text-gray-900">{pathway.name}</h1>
                        {pathway.subtext && <p className="text-xl text-gray-600 mt-2">{pathway.subtext}</p>}
                        {pathway.description && (
                            <div className="mt-4" dangerouslySetInnerHTML={{ __html: pathway.description }} />
                        )}
                        {!pathway.description && <p className="mt-4 text-gray-500 italic">No description provided.</p>}
                    </div>
                )}
            </div>

            {/* Timeline/Stages Section */}
            <div className="mt-12 border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Timeline / Stages</h2>
                    <button
                        onClick={() => router.push(`/institutions/${institutionId}/departments/${departmentId}/pathways/${pathwayId}/stages/new`)}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Add Stage
                    </button>
                </div>
                <StagesList pathwayId={pathwayId} institutionId={institutionId} departmentId={departmentId} />
            </div>
        </div>
    );
}

function StagesList({ pathwayId, institutionId, departmentId }: { pathwayId: string, institutionId: string, departmentId: string }) {
    const [stages, setStages] = useState<any[]>([]);

    // In a real app, use SWR or React Query or useEffect
    useEffect(() => {
        fetchStages();
    }, [pathwayId]);

    async function fetchStages() {
        try {
            const data = await getStages(pathwayId);
            setStages(data);
        } catch (e) {
            console.error("Fetch stages failed", e);
        }
    }

    if (stages.length === 0) return <p className="mt-4 text-sm text-gray-500">No stages found.</p>;

    return (
        <ul className="mt-4 space-y-4">
            {stages.map((stage, index) => (
                <li key={stage.id} className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">{index + 1}. {stage.title}</h3>
                            <p className="mt-1 text-sm text-gray-500">{stage.summary}</p>
                            <p className="mt-1 text-xs text-gray-400">Duration: {stage.estimatedDuration} days</p>
                        </div>
                        <div className="flex gap-2">
                            {/* Reordering buttons placeholders */}
                            <button className="text-gray-400 hover:text-gray-600" title="Move Up">&uarr;</button>
                            <button className="text-gray-400 hover:text-gray-600" title="Move Down">&darr;</button>
                            <Link
                                href={`/institutions/${institutionId}/departments/${departmentId}/pathways/${pathwayId}/stages/${stage.id}`}
                                className="ml-4 text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                                Edit
                            </Link>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
