// Centralized API type definitions

// Teacher Profile
export interface TeacherProfile {
    osUpdatedAt: string;
    gender: string;
    osUpdatedBy: string;
    subject: string;
    mobile: string;
    osid: string;
    osOwner: string[];
    instituteName: string;
    osCreatedAt: string;
    name: string;
    osCreatedBy: string;
    email: string;
}

// Student Profile
export interface StudentProfile {
    osUpdatedAt: string;
    gender: string;
    osUpdatedBy: string;
    mobile: string;
    osid: string;
    osOwner: string[];
    instituteName: string;
    osCreatedAt: string;
    fullName: string;
    osCreatedBy: string;
    email: string;
    dob: string;
    degree?: string;
    grade?: string;
    studentInstituteAttest?: any[];
}

// Claim (used in Claims page UI)
export interface Claim {
    id: string;
    studentName: string;
    instituteName: string;
    teacherName?: string;
    dateRequested: string;
    dateApproved?: string;
    status: "pending" | "approved";
    attestationId?: string; // For download API
}

// API Claim Response (from backend)
export interface ApiClaim {
    id: string;
    entity: string;
    entityId: string;
    propertyURI: string;
    createdAt: string;
    updatedAt: string;
    attestedOn: string | null;
    status: "OPEN" | "CLOSED";
    conditions: string;
    attestorEntity: string;
    requestorName: string;
    propertyData: string;
    attestationId: string;
    attestationName: string;
    attestorUserId: string | null;
    closed: boolean;
}

// Claims Response
export interface ClaimsResponse {
    totalPages: number;
    content: ApiClaim[];
    totalElements: number;
}

// Authentication Types
export interface LoginResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token?: string;
    token_type: string;
    session_state?: string;
    scope?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
}
