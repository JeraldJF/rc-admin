const BASE_URL = "";

export const setAuthToken = (token: string) => {
  sessionStorage.setItem("accessToken", token);
};

export const getAuthToken = (): string | null => {
  return sessionStorage.getItem("accessToken");
};

export const clearAuthToken = () => {
  sessionStorage.removeItem("accessToken");
};

// Auto-logout on 401 error
const handleUnauthorized = () => {
  clearAuthToken();
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("userEmail");
  sessionStorage.removeItem("userRole");
  window.location.href = "/login";
};

// Login API
export const loginApi = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("client_id", "registry-frontend");
  formData.append("username", username);
  formData.append("password", password);
  formData.append("grant_type", "password");

  const response = await fetch(`${BASE_URL}/auth/realms/sunbird-rc/protocol/openid-connect/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const data = await response.json();
  return data;
};

// Search Teacher by email
export const searchTeacherByEmail = async (email: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Teacher/search`, {
    method: "POST",
    credentials: "include", // Important: allows cookies to be sent
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      offset: 0,
      limit: 10,
      filters: {
        email: {
          eq: email,
        },
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to search teacher");
  }

  const data = await response.json();
  return data;
};

// Get Teacher by ID
export const getTeacherById = async (osid: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Teacher/${osid}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to fetch teacher details");
  }

  const data = await response.json();
  return data;
};

// Search Student by email
export const searchStudentByEmail = async (email: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Student/search`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      filters: {
        email: { eq: email },
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to search student");
  }

  const data = await response.json();
  return data;
};

// Get Student by ID
export const getStudentById = async (osid: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Student/${osid}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to get student");
  }

  const data = await response.json();
  return data;
};

// Search Admin by email
export const searchAdminByEmail = async (email: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Admin/search`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      filters: {
        email: email,
      },
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to search admin");
  }

  const data = await response.json();
  return data;
};

// Get Admin by ID
export const getAdminById = async (osid: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Admin/${osid}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to get admin");
  }

  const data = await response.json();
  return data;
};

// Get Teacher Claims
export const getTeacherClaims = async () => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Teacher/claims`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to fetch claims");
  }

  const data = await response.json();
  return data;
};

// Search all Teachers (Admin)
export const searchAllTeachers = async () => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Teacher/search`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      filters: {},
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to search teachers");
  }

  const data = await response.json();
  return data;
};

// Search all Students (Teacher)
export const searchAllStudents = async () => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Student/search`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      filters: {},
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to search students");
  }

  const data = await response.json();
  return data;
};

// Download Student Certificate
export const downloadStudentCertificate = async (
  studentId: string,
  attestationName: string,
  attestationId: string
) => {
  const token = getAuthToken();

  const response = await fetch(
    `${BASE_URL}/registry/api/v1/Student/${studentId}/attestation/${attestationName}/${attestationId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/pdf",
        "template-id": "cmi8pmik90028ms0jd3ceds7m",
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to download certificate");
  }

  // Return the blob for download
  const blob = await response.blob();
  return blob;
};

// Add Student (Teacher token)
export const addStudent = async (studentData: {
  fullName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  instituteName: string;
  degree?: string;
  grade?: string;
}) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Student`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to add student");
  }

  const data = await response.json();
  return data;
};

// Update Student (Teacher token)
export const updateStudent = async (studentId: string, studentData: {
  fullName?: string;
  dob?: string;
  gender?: string;
  mobile?: string;
  email?: string;
  instituteName?: string;
  degree?: string;
  grade?: string;
}) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Student/${studentId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to update student");
  }

  const data = await response.json();
  return data;
};

// Add Teacher (Admin token)
export const addTeacher = async (teacherData: {
  name: string;
  mobile: string;
  email: string;
  subject: string;
  instituteName: string;
  gender: string;
}) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Teacher`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(teacherData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to add teacher");
  }

  const data = await response.json();
  return data;
};

// Update Teacher (Admin token)
export const updateTeacher = async (teacherId: string, teacherData: {
  name?: string;
  mobile?: string;
  email?: string;
  subject?: string;
  instituteName?: string;
  gender?: string;
}) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Teacher/${teacherId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(teacherData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to update teacher");
  }

  const data = await response.json();
  return data;
};

// Attest/Approve Claim (Teacher token)
export const attestClaim = async (claimId: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/Teacher/claims/${claimId}/attest`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "GRANT_CLAIM",
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to approve claim");
  }

  const data = await response.json();
  return data;
};

// Request for Claim (Student token)
export const requestClaim = async (studentId: string) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/send`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      entityName: "Student",
      entityId: studentId,
      name: "studentInstituteAttest",
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to request claim");
  }

  const data = await response.json();
  return data;
};

// Request attestation for specific field changes (when attestable fields are updated)
export const attestFieldClaim = async (studentId: string, fields: string[]) => {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}/registry/api/v1/send`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      entityName: "Student",
      entityId: studentId,
      name: "studentInstituteAttest",
      fields: fields, // Fields that were changed: degree, grade, instituteName
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw new Error("Failed to request attestation for field changes");
  }

  const data = await response.json();
  return data;
};
