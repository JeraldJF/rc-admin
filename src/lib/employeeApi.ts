import { getConfig } from './config';

const getBaseUrl = () => getConfig().VITE_API_BASE_URL || '';

// Auto-logout on 401 — destroys the server session before redirecting
const handleUnauthorized = async () => {
  try {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  sessionStorage.clear();
  window.location.href = "/login";
};

// Employee API Functions

// Search all Employees (Admin)
export const searchAllEmployees = async () => {
    const performSearch = async (payload: any) => {
        const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            if (response.status === 401) handleUnauthorized();
            throw new Error(`Search failed with status: ${response.status}`);
        }
        return await response.json();
    };

    try {
        return await performSearch({ filters: {}, limit: 1000, offset: 0 });
    } catch (error) {
        try {
            return await performSearch({ filters: {} });
        } catch (e) {
            try {
                return await performSearch({ filters: { "role": { eq: "employee" } } });
            } catch (e2) {
                return await performSearch({ filters: { "osid": { neq: "null" } } });
            }
        }
    }
};

// Search Employee by personal identification (cédula)
export const searchEmployeeByPersonalId = async (personalId: string) => {
    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "include",
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
    const performSearch = async (filterObj: any) => {
        const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            credentials: "include",
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

// Search Employee by osOwner field (employees have osOwner set to their email)
export const searchEmployeeByOsOwner = async (email: string) => {
    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ filters: { "osOwner": { eq: email } } }),
    });

    if (!response.ok) {
        if (response.status === 401) handleUnauthorized();
        throw new Error(`Search by osOwner failed: ${response.status}`);
    }
    return await response.json();
};

// Get Employee by ID
export const getEmployeeById = async (osid: string) => {
    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/${osid}`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
        credentials: "include",
    });

    if (!response.ok) {
        if (response.status === 401) handleUnauthorized();
        throw new Error("Failed to fetch employee details");
    }

    return await response.json();
};

// Self-register Employee via invite (no session required — public endpoint)
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

// Add Employee (Admin)
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
    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
        if (response.status === 401) handleUnauthorized();
        throw new Error("Failed to add employee");
    }

    return await response.json();
};

// Credential service config — sourced from runtime config
const getIssuerDid = () => getConfig().VITE_ISSUER_DID || '';
const getSchemaId = () => getConfig().VITE_SCHEMA_ID || '';
const getSchemaVersion = () => getConfig().VITE_SCHEMA_VERSION || '';
const getTemplateId = () => getConfig().VITE_TEMPLATE_ID || '';

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

// Check if a certificate has already been issued for this employee
export const checkCertificateIssued = async (osid: string): Promise<{ issued: boolean; credentialId: string | null }> => {
    try {
        const tagsRes = await fetch(
            `${getBaseUrl()}/credential/credentials?tags=${encodeURIComponent(osid)}`,
            {
                headers: { "Accept": "application/json" },
                credentials: "include",
            }
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

// Issue a certificate for an employee — admin action only
export const issueEmployeeCertificate = async (osid: string): Promise<string> => {
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
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        credentials: "include",
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

// Download Employee Certificate as PDF
export const downloadEmployeeCertificate = async (osid: string): Promise<Blob> => {
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
            },
            credentials: "include",
        }
    );
    if (!pdfRes.ok) {
        const err = await pdfRes.text();
        throw new Error(`Failed to download certificate: ${pdfRes.status} ${err}`);
    }
    return await pdfRes.blob();
};

// Update Employee (Admin)
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
    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/${employeeId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
        if (response.status === 401) handleUnauthorized();
        throw new Error("Failed to update employee");
    }

    return await response.json();
};
