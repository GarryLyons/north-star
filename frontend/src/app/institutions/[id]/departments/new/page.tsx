"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { createDepartment } from "@/app/actions/institutions";

export default function NewDepartment() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuthenticator((context) => [context.user]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const institutionId = params.id as string;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            await createDepartment(institutionId, { name });
            router.push(`/institutions/${institutionId}`);
        } catch (error) {
            console.error("Error creating department:", error);
            alert("Error creating department: " + String(error));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl">
            <Breadcrumbs
                items={[
                    { name: "Institution", href: `/institutions/${institutionId}`, current: false },
                    { name: "New Department", href: "#", current: true },
                ]}
            />
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Add Department</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                        Department Name
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                        disabled={loading}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create"}
                    </button>
                </div>
            </form>
        </div>
    );
}
