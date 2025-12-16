"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthenticator } from "@aws-amplify/ui-react";

const navigation = [
    { name: "Dashboard", href: "/" },
    // { name: "Users", href: "/users" }, // Users not implemented yet, but keeping as placeholder or removing if not in scope. 
    // User requested "no longer shows separate menu items for Institutions, Departments, Pathways".
    // I will keep Dashboard only for now as distinct home.
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuthenticator((context) => [context.user]);

    if (!user) return null; // Don't show sidebar if not logged in (or let layout handle it)

    return (
        <div className="flex flex-col w-64 bg-gray-900 text-white min-h-screen">
            <div className="flex h-16 items-center justify-center font-bold text-xl border-b border-gray-800">
                North Star CMS
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
