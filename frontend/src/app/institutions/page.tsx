"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { getInstitutions } from "@/app/actions/institutions";

interface Institution {
    id: string;
    name: string;
    code: string;
    address: string;
}

export default function InstitutionsList() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthenticator((context) => [context.user]);

    useEffect(() => {
        if (user) {
            fetchInstitutions();
        }
    }, [user]);

    async function fetchInstitutions() {
        try {
            console.log("Fetching institutions list using Server Action...");
            const data = await getInstitutions();
            // Server Action returns data directly (or throws)
            console.log("Institutions fetched:", data);
            setInstitutions(data);
        } catch (error) {
            console.error("Error fetching institutions:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Institutions</h1>
                <Link
                    href="/institutions/new"
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Add Institution
                </Link>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                {loading ? (
                    <div className="p-6 text-center text-gray-500">Loading...</div>
                ) : institutions.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No institutions found.</div>
                ) : (
                    <ul role="list" className="divide-y divide-gray-100">
                        {institutions.map((inst) => (
                            <li key={inst.id} className="relative flex justify-between gap-x-6 py-5 px-6 hover:bg-gray-50">
                                <div className="flex min-w-0 gap-x-4">
                                    <div className="min-w-0 flex-auto">
                                        <p className="text-sm font-semibold leading-6 text-gray-900">
                                            <Link href={`/institutions/${inst.id}`}>
                                                <span className="absolute inset-x-0 -top-px bottom-0" />
                                                {inst.name}
                                            </Link>
                                        </p>
                                        <p className="mt-1 flex text-xs leading-5 text-gray-500">
                                            Code: {inst.code}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-x-4">
                                    <p className="text-sm leading-6 text-gray-900">{inst.address}</p>
                                    <svg
                                        className="h-5 w-5 flex-none text-gray-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
