import { SchemaProperty } from "@/components/SchemaProperty";
import { SchemaSection } from "@/components/SchemaSection";
import { CodeBlock } from "@/components/CodeBlock";
import { InfoCard } from "@/components/InfoCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, GraduationCap, Database, Shield, Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Documentation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-primary/10 via-background to-accent/5 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-12 h-12 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Student & Teacher Schema Specs
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="gap-2 hover:bg-accent transition-colors rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-semibold">Back to Login</span>
            </Button>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl">
            A technical, concise title covering detailed specifications and rules.
          </p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 py-4 overflow-x-auto">
            <a href="#overview" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              Overview
            </a>
            <a href="#student" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              Student Schema
            </a>
            <a href="#teacher" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              Teacher Schema
            </a>
            <a href="#osconfig" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap">
              Configuration
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-16">
          {/* Overview Section */}
          <section id="overview">
            <SchemaSection
              title="Overview"
              description="Understanding the JSON Schema structure and purpose"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-semibold">Student Schema</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Defines the structure for student records including personal information, 
                    academic details, and verifiable credentials with attestation policies.
                  </p>
                  <div className="flex gap-2">
                    <Badge>Verifiable Credentials</Badge>
                    <Badge variant="secondary">Attestation</Badge>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-8 h-8 text-accent" />
                    <h3 className="text-xl font-semibold">Teacher Schema</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Defines the structure for teacher records with professional information, 
                    contact details, and role-based access configuration.
                  </p>
                  <div className="flex gap-2">
                    <Badge>Role-Based Access</Badge>
                    <Badge variant="secondary">Privacy Controls</Badge>
                  </div>
                </Card>
              </div>

              <InfoCard title="JSON Schema Standard" variant="info">
                <p>
                  Both schemas follow the <strong>JSON Schema Draft-07</strong> specification. 
                  This ensures data validation, type safety, and consistent structure across the system.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Type validation for all properties</li>
                  <li>Required field enforcement</li>
                  <li>Enum constraints for predefined values</li>
                  <li>Format validation (dates, emails, etc.)</li>
                </ul>
              </InfoCard>
            </SchemaSection>
          </section>

          {/* Student Schema Section */}
          <section id="student">
            <SchemaSection
              title="Student Schema"
              description="Detailed breakdown of the Student entity structure"
            >
              <Tabs defaultValue="example" className="w-full">
                <TabsList>
                  <TabsTrigger value="example">JSON Example</TabsTrigger>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="credentials">Credentials</TabsTrigger>
                  <TabsTrigger value="attestation">Attestation</TabsTrigger>
                </TabsList>

                <TabsContent value="example" className="space-y-4 mt-6">
                  <p className="text-muted-foreground">Complete Student schema with all configuration:</p>
                  <CodeBlock
                    code={JSON.stringify({
                      "$schema": "http://json-schema.org/draft-07/schema",
                      "type": "object",
                      "properties": {
                        "Student": { "$ref": "#/definitions/Student" }
                      },
                      "required": ["Student"],
                      "title": "Student",
                      "definitions": {
                        "Student": {
                          "$id": "#/properties/Student",
                          "type": "object",
                          "title": "Student",
                          "required": ["fullName", "dob", "gender", "mobile", "email", "instituteName"],
                          "properties": {
                            "fullName": { "type": "string", "title": "Full Name" },
                            "instituteName": {
                              "type": "string",
                              "enum": ["IIT Delhi", "IIT Bombay", "NIT Trichy", "Delhi University", "Anna University"]
                            },
                            "degree": {
                              "type": "string",
                              "enum": ["B.Tech", "M.Tech", "B.Sc", "M.Sc", "MBA", "PhD"]
                            },
                            "grade": { "type": "string" },
                            "dob": { "type": "string", "format": "date" },
                            "gender": { "type": "string", "enum": ["Male", "Female", "Other"] },
                            "mobile": { "type": "string", "title": "Mobile number" },
                            "email": { "type": "string", "title": "Email ID" }
                          }
                        }
                      },
                      "_osConfig": {
                        "systemFields": ["osCreatedAt", "osCreatedBy", "osUpdatedAt", "osUpdatedBy", "_osCredentialId", "_osAttestedData"],
                        "privateFields": ["$.email", "$.mobile", "$.dob", "$.gender"],
                        "uniqueIndexFields": ["email"],
                        "roles": ["Teacher"],
                        "inviteRoles": ["Teacher"],
                        "ownershipAttributes": [{ "userId": "$.email", "email": "$.email", "mobile": "$.mobile" }]
                      }
                    }, null, 2)}
                    language="json"
                  />
                </TabsContent>

                <TabsContent value="properties" className="space-y-4 mt-6">
                  <InfoCard title="Required Fields" variant="warning">
                    The Student schema has 6 mandatory fields that must be provided: 
                    fullName, dob, gender, mobile, email, and instituteName.
                  </InfoCard>

                  <div className="grid gap-4">
                    <SchemaProperty
                      name="fullName"
                      type="string"
                      title="Full Name"
                      required
                      description="The complete legal name of the student as it appears on official documents."
                    />

                    <SchemaProperty
                      name="instituteName"
                      type="string"
                      required
                      enum={["IIT Delhi", "IIT Bombay", "NIT Trichy", "Delhi University", "Anna University"]}
                      description="The educational institution where the student is enrolled. Must be one of the predefined institutes."
                    />

                    <SchemaProperty
                      name="degree"
                      type="string"
                      enum={["B.Tech", "M.Tech", "B.Sc", "M.Sc", "MBA", "PhD"]}
                      description="The academic degree program the student is pursuing."
                    />

                    <SchemaProperty
                      name="grade"
                      type="string"
                      description="The current grade or academic performance indicator (e.g., GPA, percentage, or letter grade)."
                    />

                    <SchemaProperty
                      name="dob"
                      type="string"
                      format="date"
                      required
                      description="Date of birth in ISO 8601 format (YYYY-MM-DD). This field is marked as private."
                    />

                    <SchemaProperty
                      name="gender"
                      type="string"
                      required
                      enum={["Male", "Female", "Other"]}
                      description="The gender identity of the student. This is a private field."
                    />

                    <SchemaProperty
                      name="mobile"
                      type="string"
                      title="Mobile number"
                      required
                      description="Contact phone number. This is a private field and a unique identifier."
                    />

                    <SchemaProperty
                      name="email"
                      type="string"
                      title="Email ID"
                      required
                      description="Email address for communication. This is a private field and serves as a unique identifier."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="credentials" className="space-y-4 mt-6">
                  <InfoCard title="Verifiable Credentials" variant="success">
                    The Student schema includes support for W3C Verifiable Credentials, 
                    enabling cryptographically secure, tamper-proof academic records.
                  </InfoCard>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Credential Template Structure</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Context</p>
                        <p className="text-sm">W3C Verifiable Credentials v1 with custom StudentCredential schema</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Credential Types</p>
                        <div className="flex gap-2 mt-1">
                          <Badge>VerifiableCredential</Badge>
                          <Badge variant="secondary">StudentCredential</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Issuer</p>
                        <code className="text-sm">https://www.sunbirdrc.dev</code>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Subject Properties</p>
                        <p className="text-sm">fullName, instituteName, degree, grade</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Example Credential Subject</h3>
                    <CodeBlock
                      code={`{
  "id": "urn:student@example.com",
  "type": "StudentCredential",
  "fullName": "John Doe",
  "instituteName": "IIT Delhi",
  "degree": "B.Tech",
  "grade": "8.5"
}`}
                    />
                  </Card>
                </TabsContent>

                <TabsContent value="attestation" className="space-y-4 mt-6">
                  <InfoCard title="Attestation Policy" variant="security">
                    Students can request attestation of their academic records by teachers from 
                    the same institution, ensuring credibility and verification.
                  </InfoCard>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">studentInstituteAttest Policy</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Attested Properties</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">fullName</Badge>
                          <Badge variant="outline">email</Badge>
                          <Badge variant="outline">instituteName</Badge>
                          <Badge variant="outline">degree</Badge>
                          <Badge variant="outline">grade</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Attestation Type</p>
                        <Badge>MANUAL</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Attestor</p>
                        <code className="text-sm">did:internal:ClaimPluginActor?entity=Teacher</code>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Conditions</p>
                        <Card className="p-3 bg-muted/50">
                          <code className="text-xs">
                            ATTESTOR#$.instituteName#.equalsIgnoreCase(REQUESTER#$.instituteName#)
                          </code>
                        </Card>
                        <p className="text-xs text-muted-foreground mt-2">
                          The teacher (attestor) must be from the same institution as the student (requester).
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </SchemaSection>
          </section>

          {/* Teacher Schema Section */}
          <section id="teacher">
            <SchemaSection
              title="Teacher Schema"
              description="Detailed breakdown of the Teacher entity structure"
            >
              <Tabs defaultValue="example" className="w-full">
                <TabsList>
                  <TabsTrigger value="example">JSON Example</TabsTrigger>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                </TabsList>

                <TabsContent value="example" className="space-y-4 mt-6">
                  <p className="text-muted-foreground">Complete Teacher schema with all configuration:</p>
                  <CodeBlock
                    code={JSON.stringify({
                      "$schema": "http://json-schema.org/draft-07/schema",
                      "type": "object",
                      "properties": {
                        "Teacher": { "$ref": "#/definitions/Teacher" }
                      },
                      "required": ["Teacher"],
                      "title": "Teacher",
                      "definitions": {
                        "Teacher": {
                          "$id": "#/properties/Teacher",
                          "type": "object",
                          "title": "The Teacher Schema",
                          "required": ["name", "mobile", "email", "subject", "instituteName"],
                          "properties": {
                            "name": { "type": "string" },
                            "gender": { "type": "string" },
                            "mobile": { "type": "string" },
                            "email": { "type": "string" },
                            "subject": { "type": "string" },
                            "instituteName": {
                              "type": "string",
                              "enum": ["IIT Delhi", "IIT Bombay", "NIT Trichy", "Delhi University", "Anna University"]
                            }
                          }
                        }
                      },
                      "_osConfig": {
                        "systemFields": ["osCreatedAt", "osUpdatedAt", "osCreatedBy", "osUpdatedBy"],
                        "uniqueIndexFields": ["email", "mobile"],
                        "privateFields": ["$.instituteName", "$.email", "$.mobile", "$.gender"],
                        "roles": ["admin"],
                        "inviteRoles": ["admin"],
                        "ownershipAttributes": [{
                          "email": "/email",
                          "mobile": "/mobile",
                          "userId": "/mobile"
                        }]
                      }
                    }, null, 2)}
                    language="json"
                  />
                </TabsContent>

                <TabsContent value="properties" className="space-y-4 mt-6">
                  <InfoCard title="Required Fields" variant="warning">
                    The Teacher schema has 5 mandatory fields: name, mobile, email, subject, and instituteName.
                  </InfoCard>

                  <div className="grid gap-4 mt-6">
                <SchemaProperty
                  name="name"
                  type="string"
                  required
                  description="The full name of the teacher."
                />

                <SchemaProperty
                  name="gender"
                  type="string"
                  description="The gender of the teacher. This is a private field."
                />

                <SchemaProperty
                  name="mobile"
                  type="string"
                  required
                  description="Contact phone number. Marked as private and used as a unique identifier."
                />

                <SchemaProperty
                  name="email"
                  type="string"
                  required
                  description="Email address for communication. Marked as private and used as a unique identifier."
                />

                <SchemaProperty
                  name="subject"
                  type="string"
                  required
                  description="The subject or specialization area that the teacher teaches."
                />

                <SchemaProperty
                  name="instituteName"
                  type="string"
                  required
                  enum={["IIT Delhi", "IIT Bombay", "NIT Trichy", "Delhi University", "Anna University"]}
                  description="The educational institution where the teacher is employed. Marked as private."
                />
              </div>
                </TabsContent>
              </Tabs>
            </SchemaSection>
          </section>

          {/* OS Config Section */}
          <section id="osconfig">
            <SchemaSection
              title="Configuration (_osConfig)"
              description="System-level configuration for security, access control, and data management"
            >
              <Tabs defaultValue="system" className="w-full">
                <TabsList>
                  <TabsTrigger value="system">System Fields</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
                  <TabsTrigger value="roles">Roles & Access</TabsTrigger>
                </TabsList>

                <TabsContent value="system" className="space-y-4 mt-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      System Fields
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatically managed fields that track record lifecycle and metadata.
                    </p>
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <code className="text-sm font-medium flex-1">osCreatedAt</code>
                        <span className="text-xs text-muted-foreground">Timestamp when the record was created</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <code className="text-sm font-medium flex-1">osUpdatedAt</code>
                        <span className="text-xs text-muted-foreground">Timestamp when the record was last updated</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <code className="text-sm font-medium flex-1">osCreatedBy</code>
                        <span className="text-xs text-muted-foreground">Identifier of the user who created the record</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <code className="text-sm font-medium flex-1">osUpdatedBy</code>
                        <span className="text-xs text-muted-foreground">Identifier of the user who last updated the record</span>
                      </div>
                    </div>
                  </Card>

                  <InfoCard title="Student-Specific System Fields" variant="info">
                    <p className="mb-2">The Student schema includes additional system fields for credential management:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><code className="text-xs">_osCredentialId</code> - Unique identifier for the verifiable credential</li>
                      <li><code className="text-xs">_osAttestedData</code> - Stores attestation-related metadata</li>
                    </ul>
                  </InfoCard>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-4 mt-6">
                  <InfoCard title="Data Privacy Protection" variant="security">
                    Private fields are hidden from public API responses and can only be accessed 
                    by authorized users with appropriate permissions.
                  </InfoCard>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Student Private Fields</h3>
                      <div className="space-y-2">
                        <Badge variant="outline">$.email</Badge>
                        <Badge variant="outline">$.mobile</Badge>
                        <Badge variant="outline">$.dob</Badge>
                        <Badge variant="outline">$.gender</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        These fields contain sensitive personal information and are protected.
                      </p>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Teacher Private Fields</h3>
                      <div className="space-y-2">
                        <Badge variant="outline">$.instituteName</Badge>
                        <Badge variant="outline">$.email</Badge>
                        <Badge variant="outline">$.mobile</Badge>
                        <Badge variant="outline">$.gender</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Professional and personal information protected from unauthorized access.
                      </p>
                    </Card>
                  </div>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Unique Index Fields</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      These fields must be unique across all records, preventing duplicate entries.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Student</p>
                        <Badge>email</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Teacher</p>
                        <Badge>email</Badge>
                        <Badge className="ml-2">mobile</Badge>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="roles" className="space-y-4 mt-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Role-Based Access Control
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium mb-3">Student Schema Roles</p>
                        <div className="space-y-2">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium">Roles</p>
                            <Badge className="mt-1">Teacher</Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              Teachers can access and attest student records.
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium">Invite Roles</p>
                            <Badge className="mt-1">Teacher</Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              Teachers can invite new students to the system.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-3">Teacher Schema Roles</p>
                        <div className="space-y-2">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium">Roles</p>
                            <Badge className="mt-1">admin</Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              Administrators can manage teacher records.
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium">Invite Roles</p>
                            <Badge className="mt-1">admin</Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              Administrators can invite new teachers.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Ownership Attributes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      These attributes define how records are linked to user identities for access control.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Student Ownership</p>
                        <CodeBlock
                          code={`{
  "userId": "$.email",
  "email": "$.email",
  "mobile": "$.mobile"
}`}
                        />
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Teacher Ownership</p>
                        <CodeBlock
                          code={`{
  "email": "/email",
  "mobile": "/mobile",
  "userId": "/mobile"
}`}
                        />
                      </div>
                    </div>

                    <InfoCard title="Ownership Mapping" variant="info">
                      <p className="text-sm">
                        Ownership attributes map JSON paths from the schema to identity fields. 
                        Users can only access records where the ownership attributes match their identity credentials.
                      </p>
                    </InfoCard>
                  </Card>
                </TabsContent>
              </Tabs>
            </SchemaSection>
          </section>

          {/* Summary Section */}
          <section className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Summary
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Data Structure</h3>
                <p className="text-sm text-muted-foreground">
                  Both schemas provide comprehensive data validation with type checking, 
                  required fields, and enumerated values for consistency.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Security & Privacy</h3>
                <p className="text-sm text-muted-foreground">
                  Sensitive information is protected through private fields, unique constraints, 
                  and role-based access control mechanisms.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Verifiable Credentials</h3>
                <p className="text-sm text-muted-foreground">
                  Student records support W3C Verifiable Credentials with attestation policies, 
                  enabling trusted academic record verification.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>RC Manager © 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Documentation;
