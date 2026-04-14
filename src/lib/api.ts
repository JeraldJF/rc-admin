const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string) || "";

// Token management
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem("accessToken");
};

// Auto-logout on 401 error
const handleUnauthorized = () => {
  sessionStorage.clear();
  window.location.href = "/login";
};

// Search Admin by email
export const searchAdminByEmail = async (email: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Admin/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      filters: { email },
    }),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error("Failed to search admin");
  }

  return await response.json();
};

// Get Admin by ID
export const getAdminById = async (osid: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Admin/${osid}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error("Failed to get admin");
  }

  return await response.json();
};

// EmployeeProfile type — used by ViewProfile.tsx
export interface EmployeeProfile {
  osid: string;
  osOwner: string[];
  osCreatedAt: string;
  osUpdatedAt: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: string;
  personalIdentification?: string;
  typeIdentification?: string;
  positionName?: string;
  departmentName?: string;
  companyName?: string;
  admissionDate?: string;
  contractExpiration?: string;
  statusName?: string;
  salary?: string;
}
