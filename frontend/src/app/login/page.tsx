"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function AuthRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.push("/");
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-lg font-medium text-gray-700">
                Login successful. Redirecting...
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Authenticator>
                <AuthRedirect />
            </Authenticator>
        </div>
    );
}
