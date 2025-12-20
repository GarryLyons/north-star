"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { fetchWithKey } from "@/utils/api";

export default function NewInstitution() {
    const router = useRouter();
    const { user } = useAuthenticator((context) => [context.user]);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        address: "",
    });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        console.log("handleSubmit called. Submitting form data:", formData);
        const apiUrl = "http://127.0.0.1:5271/api/v1/institutions";
        console.log("Sending POST request to:", apiUrl);

        try {
            const res = await fetchWithKey(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            console.log("Response received. Status:", res.status);

            if (res.ok) {
                router.push("/"); // Redirect to Dashboard (root) instead of /institutions
            } else {
                const errorText = await res.text();
                console.error("Failed to create institution. Status:", res.status, "Message:", errorText);
                alert(`Failed to create institution: ${res.status} ${errorText}`);
            }
        } catch (error) {
            console.error("NETWORK/FETCH ERROR creating institution:", error);
            alert("Error creating institution: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl">
            <Breadcrumbs
                items={[
                    { name: "New Institution", href: "#", current: true },
                ]}
            />
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Institution</h1>

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
