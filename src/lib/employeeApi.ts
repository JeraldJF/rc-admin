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
export const searchAllEmployees = async (limit: number, offset: number, nameFilter?: string) => {
    const filters: Record<string, unknown> = {};
    if (nameFilter) filters.fullName = { contains: nameFilter };

    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ filters, limit, offset }),
    });

    if (!response.ok) {
        if (response.status === 401) handleUnauthorized();
        throw new Error(`Search failed with status: ${response.status}`);
    }
    return await response.json();
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
    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ filters: { "email": { eq: email } } }),
    });

    if (!response.ok) {
        if (response.status === 401) handleUnauthorized();
        throw new Error(`Search failed with status: ${response.status}`);
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
    email?: string;
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
}): Promise<{ isDuplicate?: boolean; result?: any }> => {
    const payload = {
        Employee: employeeData
    };

    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/invite`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "omit",
        cache: "no-store",
        body: JSON.stringify(payload),
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

// Add Employee (Admin) - using flat schema format
// noLogoutOn401: skip handleUnauthorized() so callers can attempt fallback paths.
export const addEmployee = async (employeeData: {
    fullName: string;
    email?: string;
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
}, opts?: { noLogoutOn401?: boolean }) => {
    // Wrap the flat data in Employee object as per the API format
    const payload = {
        Employee: employeeData
    };

    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        if (response.status === 401 && !opts?.noLogoutOn401) handleUnauthorized();
        const err: any = new Error("Failed to add employee");
        err.status = response.status;
        throw err;
    }

    return await response.json();
};

// Create Employee — tries admin endpoint first, falls back to anonymous /invite.
// Works whether registry permits POST /Employee for the current JWT role or not,
// and whether inviteRoles is "anonymous" or restricted to "admin".
export type EmployeePayload = {
    fullName: string;
    email?: string;
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
};

export const createEmployee = async (
    employeeData: EmployeePayload
): Promise<{ isDuplicate?: boolean; result?: any }> => {
    // Path A — admin endpoint. Requires admin role in JWT.
    try {
        const result = await addEmployee(employeeData, { noLogoutOn401: true });
        return { result };
    } catch (e: any) {
        const status = e?.status;
        // Only fall back on auth/role failures; other errors propagate.
        if (status !== 401 && status !== 403) throw e;
    }

    // Path B — anonymous invite endpoint. Works when inviteRoles includes "anonymous".
    try {
        return await inviteEmployee(employeeData);
    } catch (e: any) {
        throw new Error(`Create employee failed via both admin and invite paths: ${e?.message || e}`);
    }
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

// Normalize API response to array of credentials
const normalizeCredentialsResponse = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    
    const possibleArrayFields = ['credentials', 'content', 'result'];
    const arrayField = possibleArrayFields.find(field => data?.[field]);
    
    if (arrayField) {
        return Array.isArray(data[arrayField]) ? data[arrayField] : [data[arrayField]];
    }
    
    return data?.credential ? [data] : [];
};

// Extract credential ID from various response structures
const extractCredentialId = (item: any): string | null => {
    return item?.credential?.id || item?.id || null;
};

// Extract subject ID from credential
const extractSubjectId = (item: any): string | null => {
    return item?.credential?.credentialSubject?.id || item?.credentialSubject?.id || null;
};

// Check if credential matches the given osid
const isMatchingCredential = (item: any, osid: string): boolean => {
    const tags = item?.tags || [];
    const subjectId = extractSubjectId(item);
    
    return tags.includes(osid) || 
           subjectId === `did:rcw:${osid}` || 
           subjectId === osid;
};

// Check if a certificate has already been issued for this employee
export const checkCertificateIssued = async (osid: string): Promise<{ issued: boolean; credentialId: string | null }> => {
    try {
        const response = await fetch(
            `${getBaseUrl()}/credential/credentials?tags=${encodeURIComponent(osid)}`,
            {
                headers: { "Accept": "application/json" },
                credentials: "include",
            }
        );
        
        if (!response.ok) {
            return { issued: false, credentialId: null };
        }
        
        const data = await response.json();
        const credentials = normalizeCredentialsResponse(data);
        
        const matchedCredential = credentials.find(item => {
            const credentialId = extractCredentialId(item);
            return credentialId && isMatchingCredential(item, osid);
        });
        
        if (matchedCredential) {
            return { 
                issued: true, 
                credentialId: extractCredentialId(matchedCredential) 
            };
        }
    } catch (e) {
        console.error('Error checking certificate:', e);
    }
    
    return { issued: false, credentialId: null };
};

// Issue a certificate for an employee — admin action only
// Pass providedEmpData to skip the GET /Employee/{osid} fetch (which 401s for
// anonymously-invited records without osOwner under an employee-role JWT).
export const issueEmployeeCertificate = async (osid: string, providedEmpData?: any): Promise<string> => {
    let empData: any = providedEmpData;
    if (!empData) {
        const empRes = await getEmployeeById(osid);
        empData = empRes?.Employee || empRes;
    }
    if (!empData) throw new Error("Failed to fetch employee data for credential issuance");

    // Map schema fields to credential fields
    const name = empData?.fullName || "Unknown";
    const email = empData?.email || "";
    const personalIdentification = empData?.personalIdentification || "";
    const position = empData?.positionName || "Employee";
    const department = empData?.departmentName || "";
    const institution = empData?.companyName || "Sunbird RC";
    const dateOfHire = empData?.admissionDate || "";
    const exitDate = empData?.contractExpiration || "";
    const status = empData?.statusName || "active";
    const documentType = empData?.typeIdentification || "";

    // Use admissionDate as issuanceDate, contractExpiration as expirationDate
    const issuanceDate = dateOfHire || new Date().toISOString();
    const expirationDate = exitDate || "2099-12-31T23:59:59.999Z";

    const issuePayload = {
        credential: {
            "@context": VC_CONTEXT,
            type: ["VerifiableCredential", "Employee"],
            issuer: getIssuerDid(),
            issuanceDate,
            expirationDate,
            credentialSubject: {
                id: `did:rcw:${osid}`,
                type: "Employee",
                name,
                email,
                institution,
                position,
                ...(department && { department }),
                ...(personalIdentification && { personalIdentification }),
                ...(documentType && { documentType }),
                status: status.toLowerCase().includes("active") || status.toLowerCase().includes("activo") ? "active" : "inactive",
                ...(dateOfHire && { dateOfHire }),
                ...(exitDate && { exitDate }),
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

    const response = await fetch(`${getBaseUrl()}/credential/credentials/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        credentials: "include",
        body: JSON.stringify(issuePayload),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to issue credential: ${err}`);
    }

    const issued = await response.json();
    const credentialId = issued?.credential?.id || issued?.id || "";
    if (!credentialId) throw new Error("Credential issued but no ID returned");
    
    return credentialId;
};

// Download Employee Certificate as PDF — auto-issues if not already issued
export const downloadEmployeeCertificate = async (osid: string): Promise<Blob> => {
    let { issued, credentialId } = await checkCertificateIssued(osid);

    if (!issued || !credentialId) {
        credentialId = await issueEmployeeCertificate(osid);
    }

    return fetchCertificatePdf(credentialId);
};

// Fetch an already-issued certificate as PDF by credential ID (no issuance)
export const fetchCertificatePdf = async (credentialId: string): Promise<Blob> => {
    const response = await fetch(
        `${getBaseUrl()}/credential/credentials/${encodeURIComponent(credentialId)}`,
        {
            method: "GET",
            headers: {
                "Accept": "application/pdf",
                "templateid": getTemplateId(),
            },
            credentials: "include",
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to download certificate: ${response.status} ${err}`);
    }

    return await response.blob();
};

// Update Employee (Admin) - using flat schema format
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
    // Wrap the flat data in Employee object as per the API format
    const payload = {
        Employee: employeeData
    };

    const response = await fetch(`${getBaseUrl()}/registry/api/v1/Employee/${employeeId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        if (response.status === 401) handleUnauthorized();
        throw new Error("Failed to update employee");
    }

    return await response.json();
};
