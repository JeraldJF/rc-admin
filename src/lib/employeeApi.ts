import { getAuthToken } from './api';

import { getConfig } from './config';

const getBaseUrl = () => getConfig().VITE_API_BASE_URL || '';

// Auto-logout on 401 error
const handleUnauthorized = () => {
    sessionStorage.clear();
    window.location.href = "/login";
};

// Employee API Functions

// Search all Employees (Admin)
export const searchAllEmployees = async () => {
    const token = getAuthToken();

    // Helper to perform search
    const performSearch = async (payload: any) => {
        const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            if (response.status === 401) handleUnauthorized();
            throw new Error(`Search failed with status: ${response.status}`);
        }
        return await response.json();
    };

    try {
        // Attempt 1: Standard with limit (Best Practice)
        return await performSearch({
            filters: {},
            limit: 1000,
            offset: 0
        });
    } catch (error) {
        try {
            // Attempt 2: Minimal payload
            return await performSearch({ filters: {} });
        } catch (e) {
            try {
                // Attempt 3: Filter by role (flat schema)
                return await performSearch({ filters: { "role": { eq: "employee" } } });
            } catch (e2) {
                // Attempt 4: Osid exists
                return await performSearch({ filters: { "osid": { neq: "null" } } });
            }
        }
    }
};

// Search Employee by personal identification (cédula)
export const searchEmployeeByPersonalId = async (personalId: string) => {
    const token = getAuthToken();

    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ filters: { "personalIdentification": { eq: personalId } } }),
    });

    if (!response.ok) {
        if (response.status === 401) handleUnauthorized();
        throw new Error(`Search by personalId failed: ${response.status}`);
    }
    return await response.json();
};

// Search Employee by email
export const searchEmployeeByEmail = async (email: string) => {
    const token = getAuthToken();

    // Helper to perform search
    const performSearch = async (filterObj: any) => {
        const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ filters: filterObj }),
        });

        if (!response.ok) {
            if (response.status === 401) handleUnauthorized();
            throw new Error(`Search failed with status: ${response.status}`);
        }
        return await response.json();
    };

    return await performSearch({ "email": { eq: email } });
};

// Get Employee by ID
export const getEmployeeById = async (osid: string) => {
    const token = getAuthToken();

    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/${osid}`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error("Failed to fetch employee details");
    }

    const data = await response.json();
    return data;
};

// Self-register Employee via invite (no admin token required — public endpoint)
// Returns { isDuplicate: true } when the record already exists (duplicate email).
export const inviteEmployee = async (employeeData: {
    fullName: string;
    email: string;
    personalIdentification?: string;
    mobile?: string;
    role?: 'admin' | 'employee';
}): Promise<{ isDuplicate?: boolean; result?: any }> => {
    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/invite`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(employeeData),
    });

    const data = await response.json();

    if (!response.ok || data?.params?.status === "UNSUCCESSFUL") {
        const errmsg: string = data?.params?.errmsg || "";
        if (errmsg.includes("duplicate key")) {
            return { isDuplicate: true };
        }
        throw new Error(`Self-registration failed: ${errmsg || response.status}`);
    }

    return { result: data };
};

// Add Employee (Admin token)
export const addEmployee = async (employeeData: {
    fullName: string;
    email: string;
    personalIdentification?: string;
    typeIdentification?: string;
    mobile?: string;
    role?: 'admin' | 'employee';
    positionName?: string;
    departmentName?: string;
    companyName?: string;
    admissionDate?: string;
    contractExpiration?: string;
    statusName?: string;
    salary?: string;
}) => {
    const token = getAuthToken();

    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error("Failed to add employee");
    }

    const data = await response.json();
    return data;
};

// Credential service config — sourced from Vite environment variables
// Required env vars: VITE_ISSUER_DID, VITE_SCHEMA_ID, VITE_SCHEMA_VERSION, VITE_TEMPLATE_ID
const getIssuerDid = () => getConfig().VITE_ISSUER_DID || '';
const getSchemaId = () => getConfig().VITE_SCHEMA_ID || '';
const getSchemaVersion = () => getConfig().VITE_SCHEMA_VERSION || '';
const getTemplateId = () => getConfig().VITE_TEMPLATE_ID || '';
// JSON-LD context required for Ed25519 signing — fields must map to absolute IRIs
const VC_CONTEXT = [
    "https://www.w3.org/2018/credentials/v1",
    {
        "@context": {
            "id": "@id",
            "schema": "https://schema.org/",
            "@version": 1.1,
            "Employee": {
                "@id": "https://github.com/sunbird-specs/vc-specs#Employee",
                "@context": {
                    "id": "@id",
                    "name": "schema:Text",
                    "email": "schema:email",
                    "status": "schema:Text",
                    "@version": 1.1,
                    "position": "schema:Text",
                    "@protected": true,
                    "dateOfHire": "schema:Text",
                    "institution": "schema:Text",
                    "department": "schema:Text",
                    "personalIdentification": "schema:Text",
                    "documentType": "schema:Text",
                    "organizationalUnit": "schema:Text",
                },
            },
            "@protected": true,
        },
    },
    "https://w3id.org/security/suites/ed25519-2020/v1",
];

// Check if a certificate has already been issued for this employee (by admin)
export const checkCertificateIssued = async (osid: string): Promise<{ issued: boolean; credentialId: string | null }> => {
    const token = getAuthToken();
    try {
        const tagsRes = await fetch(
            `${getBaseUrl()}/credential/credentials?tags=${encodeURIComponent(osid)}`,
            { headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` } }
        );
        if (tagsRes.ok) {
            const creds = await tagsRes.json();
            if (Array.isArray(creds) && creds.length > 0 && creds[0]?.id) {
                const subject = creds[0]?.credentialSubject;
                if (subject?.name && subject?.position) {
                    return { issued: true, credentialId: creds[0].id };
                }
            }
        }
    } catch (e) {
        // Certificate check failed - return not issued
    }
    return { issued: false, credentialId: null };
};

// Issue a certificate for an employee — admin action only. Returns the new credentialId.
export const issueEmployeeCertificate = async (osid: string): Promise<string> => {
    const token = getAuthToken();

    const empRes = await getEmployeeById(osid);
    const empData = empRes?.Employee || empRes;
    if (!empData) throw new Error("Failed to fetch employee data for credential issuance");
    const name = empData?.fullName || empData?.name || "Unknown";
    const email = empData?.email || "";
    const personalIdentification = empData?.personalIdentification || "";
    const position = empData?.positionName || "Employee";
    const department = empData?.departmentName || "";
    const institution = empData?.companyName || empData?.email || "Sunbird RC";
    const dateOfHire = empData?.admissionDate || "";

    const issuePayload = {
        credential: {
            "@context": VC_CONTEXT,
            type: ["VerifiableCredential", "Employee"],
            issuer: getIssuerDid(),
            issuanceDate: new Date().toISOString(),
            expirationDate: "2030-12-31T00:00:00.000Z",
            credentialSubject: {
                id: `did:rcw:${osid}`,
                type: "Employee",
                name,
                email,
                institution,
                position,
                ...(department && { department }),
                ...(personalIdentification && { personalIdentification }),
                status: "active",
                ...(dateOfHire && { dateOfHire }),
            },
            credentialSchema: {
                id: getSchemaId(),
                type: "JsonSchemaValidator2018",
            },
        },
        credentialSchemaId: getSchemaId(),
        credentialSchemaVersion: getSchemaVersion(),
        tags: ["employee", osid],
    };

    const issueRes = await fetch(`${getBaseUrl()}/credential/credentials/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(issuePayload),
    });
    if (!issueRes.ok) {
        const err = await issueRes.text();
        throw new Error(`Failed to issue credential: ${err}`);
    }
    const issued = await issueRes.json();
    const credentialId = issued?.credential?.id || issued?.id || "";
    if (!credentialId) throw new Error("Credential issued but no ID returned");
    return credentialId;
};

// Download Employee Certificate as PDF. Certificate must have been issued by admin first.
export const downloadEmployeeCertificate = async (osid: string): Promise<Blob> => {
    const token = getAuthToken();

    // Find existing credential — do NOT auto-issue
    const { issued, credentialId } = await checkCertificateIssued(osid);
    if (!issued || !credentialId) {
        throw new Error("No certificate has been issued for this employee yet. Please contact your administrator.");
    }

    const pdfRes = await fetch(
        `${getBaseUrl()}/credential/credentials/${encodeURIComponent(credentialId)}`,
        {
            method: "GET",
            headers: {
                "Accept": "application/pdf",
                "templateId": getTemplateId(),
                "Authorization": `Bearer ${token}`,
            },
        }
    );
    if (!pdfRes.ok) {
        const err = await pdfRes.text();
        throw new Error(`Failed to download certificate: ${pdfRes.status} ${err}`);
    }
    return await pdfRes.blob();
};

// Update Employee (Admin token)
export const updateEmployee = async (employeeId: string, employeeData: Partial<{
    fullName?: string;
    email?: string;
    mobile?: string;
    personalIdentification?: string;
    typeIdentification?: string;
    role?: 'admin' | 'employee';
    positionName?: string;
    departmentName?: string;
    companyName?: string;
    admissionDate?: string;
    contractExpiration?: string;
    statusName?: string;
    salary?: string;
}>) => {
    const token = getAuthToken();

    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/${employeeId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
        }
        throw new Error("Failed to update employee");
    }

    const data = await response.json();
    return data;
};
