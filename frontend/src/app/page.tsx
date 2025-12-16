"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";

interface Institution {
  id: string;
  name: string;
  code: string;
  address: string;
}

export default function Home() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthenticator((context) => [context.user]);
  const router = useRouter();

  useEffect(() => {
    // If not logged in, AuthWrapper in Layout or useEffect usually handles redirect,
    // but good to keep safe.
    if (!user) {
      router.push("/login");
      return;
    }
    fetchInstitutions();
  }, [user, router]);

  async function fetchInstitutions() {
    try {
      // Use 127.0.0.1 to avoid CORS/Network issues
      const res = await fetch("http://127.0.0.1:5271/api/v1/institutions");
      if (res.ok) {
        const data = await res.json();
        setInstitutions(data);
      } else {
        console.error("Failed to fetch institutions");
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Link
          href="/institutions/new"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Add Institution
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-base font-semibold leading-6 text-gray-900 mb-4">Institutions</h2>

          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading...</div>
          ) : institutions.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No institutions found. Get started by adding one.</div>
          ) : (
            <div className="mt-4 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Code</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {institutions.map((inst) => (
                        <tr key={inst.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/institutions/${inst.id}`)}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {inst.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{inst.code}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{inst.address}</td>
                          <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <span className="text-indigo-600 hover:text-indigo-900">View<span className="sr-only">, {inst.name}</span></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
