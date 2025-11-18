import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CalendarIcon, Save } from "lucide-react";
import { institutes } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2.5">{children}</div>
);

const AddEntity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    schema: "Student" as "Student" | "Teacher",
    gender: "Male",
    fullName: "",
    name: "",
    mobile: "",
    email: "",
    subject: "",
    instituteName: "",
    dob: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.dob) newErrors.dob = "Date of Birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.schema) newErrors.schema = "Schema is required";

    if (formData.schema === "Student") {
      if (!formData.fullName) newErrors.fullName = "Full Name is required";
      if (!formData.mobile) newErrors.mobile = "Mobile number is required";
      if (!formData.email) newErrors.email = "Email ID is required";
      if (!formData.instituteName) newErrors.instituteName = "Institute Name is required";
    } else if (formData.schema === "Teacher") {
      if (!formData.name) newErrors.name = "Name is required";
      if (!formData.mobile) newErrors.mobile = "Mobile is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.instituteName) newErrors.instituteName = "Institute Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      toast({
        title: "✅ Entity added successfully",
        description: "The record has been created.",
        variant: "success",
      });
      navigate("/registry");
    }
  };

  const handleCancel = () => {
    navigate("/registry");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2 hover:bg-accent transition-colors rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">Back</span>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-2xl font-bold text-foreground">Add New Entity</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card shadow-lg border-border rounded-xl overflow-hidden">
            <CardContent className="pt-8 px-8 pb-8 space-y-6">
              {/* Schema Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField>
                  <Label htmlFor="schema" className="text-sm font-semibold text-foreground">
                    Schema <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.schema}
                    onValueChange={(value) => {
                      setFormData({ 
                        schema: value as "Student" | "Teacher",
                        gender: "Male",
                        fullName: "",
                        name: "",
                        mobile: "",
                        email: "",
                        subject: "",
                        instituteName: "",
                        dob: "",
                      });
                      setErrors({});
                    }}
                  >
                    <SelectTrigger className={`bg-background border-input hover:border-primary/60 focus:border-primary transition-all duration-200 rounded-lg h-11 ${errors.schema ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                      <SelectValue placeholder="Select schema" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.schema && <p className="text-sm font-medium text-destructive">{errors.schema}</p>}
                </FormField>
              </div>

              {/* Student Fields */}
              {formData.schema === "Student" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={`rounded-lg h-11 ${errors.fullName ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        placeholder="Enter full name"
                      />
                      {errors.fullName && <p className="text-sm font-medium text-destructive">{errors.fullName}</p>}
                    </FormField>
                    <FormField>
                      <Label htmlFor="gender" className="text-sm font-semibold text-foreground">
                        Gender <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger className={`rounded-lg h-11 ${errors.gender ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-sm font-medium text-destructive">{errors.gender}</p>}
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label className="text-sm font-semibold text-foreground">
                        Date of Birth <span className="text-destructive">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-lg h-11",
                              !formData.dob && "text-muted-foreground",
                              errors.dob ? "border-destructive ring-2 ring-destructive/20" : ""
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dob ? format(new Date(formData.dob), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.dob ? new Date(formData.dob) : undefined}
                            onSelect={(date) => setFormData({ ...formData, dob: date ? format(date, "yyyy-MM-dd") : "" })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.dob && <p className="text-sm font-medium text-destructive">{errors.dob}</p>}
                    </FormField>
                    <FormField>
                      <Label htmlFor="instituteName" className="text-sm font-semibold text-foreground">
                        Institute Name <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.instituteName}
                        onValueChange={(value) => setFormData({ ...formData, instituteName: value })}
                      >
                        <SelectTrigger className={`rounded-lg h-11 ${errors.instituteName ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                          <SelectValue placeholder="Select institute" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {institutes.map((institute) => (
                            <SelectItem key={institute} value={institute}>{institute}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.instituteName && <p className="text-sm font-medium text-destructive">{errors.instituteName}</p>}
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label htmlFor="mobile" className="text-sm font-semibold text-foreground">
                        Mobile number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className={`rounded-lg h-11 ${errors.mobile ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        placeholder="+855 12 345 678"
                      />
                      {errors.mobile && <p className="text-sm font-medium text-destructive">{errors.mobile}</p>}
                    </FormField>
                    <FormField>
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                        Email ID <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`rounded-lg h-11 ${errors.email ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        placeholder="email@example.com"
                      />
                      {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                    </FormField>
                  </div>
                </>
              )}

              {/* Teacher Fields */}
              {formData.schema === "Teacher" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`rounded-lg h-11 ${errors.name ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        placeholder="Enter name"
                      />
                      {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
                    </FormField>
                    <FormField>
                      <Label htmlFor="gender" className="text-sm font-semibold text-foreground">
                        Gender <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger className={`rounded-lg h-11 ${errors.gender ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-sm font-medium text-destructive">{errors.gender}</p>}
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label className="text-sm font-semibold text-foreground">
                        Date of Birth <span className="text-destructive">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-lg h-11",
                              !formData.dob && "text-muted-foreground",
                              errors.dob ? "border-destructive ring-2 ring-destructive/20" : ""
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dob ? format(new Date(formData.dob), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.dob ? new Date(formData.dob) : undefined}
                            onSelect={(date) => setFormData({ ...formData, dob: date ? format(date, "yyyy-MM-dd") : "" })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.dob && <p className="text-sm font-medium text-destructive">{errors.dob}</p>}
                    </FormField>
                    <FormField>
                      <Label htmlFor="instituteName" className="text-sm font-semibold text-foreground">
                        Institute Name <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.instituteName}
                        onValueChange={(value) => setFormData({ ...formData, instituteName: value })}
                      >
                        <SelectTrigger className={`rounded-lg h-11 ${errors.instituteName ? "border-destructive ring-2 ring-destructive/20" : ""}`}>
                          <SelectValue placeholder="Select institute" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {institutes.map((institute) => (
                            <SelectItem key={institute} value={institute}>{institute}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.instituteName && <p className="text-sm font-medium text-destructive">{errors.instituteName}</p>}
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField>
                      <Label htmlFor="mobile" className="text-sm font-semibold text-foreground">
                        Mobile number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className={`rounded-lg h-11 ${errors.mobile ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        placeholder="+855 12 345 678"
                      />
                      {errors.mobile && <p className="text-sm font-medium text-destructive">{errors.mobile}</p>}
                    </FormField>
                    <FormField>
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                        Email ID <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`rounded-lg h-11 ${errors.email ? "border-destructive ring-2 ring-destructive/20" : ""}`}
                        placeholder="email@example.com"
                      />
                      {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                    </FormField>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} className="rounded-lg px-6">
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg px-8 bg-primary hover:bg-primary/90 gap-2">
              <Save className="h-4 w-4" />
              Save Entity
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddEntity;
