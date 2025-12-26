import { SignatureV4 } from "@aws-sdk/signature-v4";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { fromIni } from "@aws-sdk/credential-providers";
import { HttpRequest } from "@aws-sdk/protocol-http";

const REGION = process.env.AWS_REGION || "eu-west-2";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5271";
const AWS_PROFILE = process.env.AWS_PROFILE;

// NOTE: We need to access the Auth Session to get the 'sub'.
// Server Actions have access to cookies.

// We need to import the configured Amplify Server Context Runner.
// If it doesn't exist in a separate file, we might need to rely on the default import pattern.
// Let's assume standard Next.js Amplify setup using `createServerRunner`.

// Actually, simpler: Use `cookies()` to create the runner inline if needed, or import from where it is defined.
// The user has `utils/amplify-server-utils.ts`. 


export async function fetchWithSigV4(
    path: string,
    method: string = "GET",
    body?: unknown,
    userId?: string // Optional override for local dev identity impersonation
) {
    // Ensure we are server-side
    if (typeof window !== "undefined") {
        throw new Error("fetchWithSigV4 must be called server-side only");
    }

    const endpoint = new URL(path, API_URL);

    // Explicitly use profile if set, otherwise default chain
    const credentials = AWS_PROFILE
        ? fromIni({ profile: AWS_PROFILE })
        : defaultProvider();

    const signer = new SignatureV4({
        credentials,
        region: REGION,
        service: "execute-api",
        sha256: (await import("@aws-crypto/sha256-js")).Sha256,
    });

    const headers: any = {
        host: endpoint.hostname,
        "Content-Type": "application/json",
    };

    // HARDCODED DEV BYPASS
    // Since we don't have @aws-amplify/adapter-nextjs set up for server-side session fetching yet,
    // and Kestrel doesn't validate SigV4, we manually inject the user ID for local dev.
    if (process.env.NODE_ENV === "development") {
        if (userId) {
            headers["x-user-sub"] = userId;
        } else {
            // Fallback to hardcoded super admin ONLY if no specific user is passed
            headers["x-user-sub"] = "b6d2a294-a031-70a9-7653-d25985210f91";
        }
    }

    const request = new HttpRequest({
        method: method,
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port ? Number(endpoint.port) : undefined,
        path: endpoint.pathname + endpoint.search,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const signedRequest = await signer.sign(request);

    const res = await fetch(endpoint.toString(), {
        method: signedRequest.method,
        headers: signedRequest.headers,
        body: signedRequest.body,
    });

    if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${await res.text()}`);
    }

    if (res.status === 204) {
        return null;
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
}
