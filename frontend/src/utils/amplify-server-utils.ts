import { SignatureV4 } from "@aws-sdk/signature-v4";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { fromIni } from "@aws-sdk/credential-providers"; // Import explicit file provider
import { HttpRequest } from "@aws-sdk/protocol-http";

const REGION = process.env.AWS_REGION || "eu-west-2";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5271";
const AWS_PROFILE = process.env.AWS_PROFILE;

export async function fetchWithSigV4(
    path: string,
    method: string = "GET",
    body?: unknown
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

    const request = new HttpRequest({
        method: method,
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port ? Number(endpoint.port) : undefined,
        path: endpoint.pathname + endpoint.search,
        headers: {
            host: endpoint.hostname,
            "Content-Type": "application/json",
        },
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

    return res.json();
}
