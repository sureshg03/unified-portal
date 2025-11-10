import { useState } from 'react';
import { Save, Upload, User, Phone, Mail, MapPin, Calendar, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export const CounsellorInformation = () => {
  const [formData, setFormData] = useState({
    counsellorName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: '',
    aadhaarCard: '',
    qualification: '',
    highestQualification: '',
    programmeAssigned: '',
    mobileNumber: '',
    alternateNumber: '',
    emailId: '',
    currentDesignation: '',
    workingExperience: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    pincode: '',
    district: '',
    state: ''
  });

  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    toast({
      title: "Success",
      description: "Counsellor information saved successfully!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Counsellor Information
        </h1>
        <p className="text-muted-foreground">Complete the counsellor registration form</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <User className="w-5 h-5 mr-2 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="counsellorName" className="text-sm font-medium">
                  Counsellor Name (IN CAPITAL LETTER) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="counsellorName"
                  placeholder="COUNSELLOR NAME"
                  value={formData.counsellorName}
                  onChange={(e) => handleInputChange('counsellorName', e.target.value.toUpperCase())}
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherName" className="text-sm font-medium">
                  Father Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fatherName"
                  placeholder="Father Name"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherName" className="text-sm font-medium">
                  Mother Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="motherName"
                  placeholder="Mother Name"
                  value={formData.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaarCard" className="text-sm font-medium">
                  Aadhaar Card <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="aadhaarCard"
                  placeholder="Aadhaar Card Number"
                  value={formData.aadhaarCard}
                  onChange={(e) => handleInputChange('aadhaarCard', e.target.value)}
                  className="bg-input border-border"
                  maxLength={12}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <GraduationCap className="w-5 h-5 mr-2 text-education-blue" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="qualification" className="text-sm font-medium">
                  Qualification <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="qualification"
                  placeholder="Qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="highestQualification" className="text-sm font-medium">
                  Highest Qualification <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.highestQualification} onValueChange={(value) => handleInputChange('highestQualification', value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phd">Ph.D</SelectItem>
                    <SelectItem value="postgrad">Post Graduate</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="programmeAssigned" className="text-sm font-medium">
                  Programme Assigned <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.programmeAssigned} onValueChange={(value) => handleInputChange('programmeAssigned', value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select Programme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mba">MBA</SelectItem>
                    <SelectItem value="mca">MCA</SelectItem>
                    <SelectItem value="mcom">M.Com</SelectItem>
                    <SelectItem value="ma">MA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <Phone className="w-5 h-5 mr-2 text-education-orange" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-sm font-medium">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mobileNumber"
                  placeholder="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  className="bg-input border-border"
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternateNumber" className="text-sm font-medium">
                  Alternate Number <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="alternateNumber"
                  placeholder="Alternate Number"
                  value={formData.alternateNumber}
                  onChange={(e) => handleInputChange('alternateNumber', e.target.value)}
                  className="bg-input border-border"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailId" className="text-sm font-medium">
                  E-mail ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="emailId"
                  type="email"
                  placeholder="Enter E-mail id"
                  value={formData.emailId}
                  onChange={(e) => handleInputChange('emailId', e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentDesignation" className="text-sm font-medium">
                  Current Designation
                </Label>
                <Input
                  id="currentDesignation"
                  placeholder="Designation"
                  value={formData.currentDesignation}
                  onChange={(e) => handleInputChange('currentDesignation', e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workingExperience" className="text-sm font-medium">
                  Year Of Working Experience
                </Label>
                <Input
                  id="workingExperience"
                  placeholder="Experience"
                  value={formData.workingExperience}
                  onChange={(e) => handleInputChange('workingExperience', e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <MapPin className="w-5 h-5 mr-2 text-education-purple" />
              Communication Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="addressLine1" className="text-sm font-medium">
                  Line 1 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="addressLine1"
                  placeholder="Address Line 1"
                  value={formData.addressLine1}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  className="bg-input border-border resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2" className="text-sm font-medium">
                  Line 2 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="addressLine2"
                  placeholder="Address Line 2"
                  value={formData.addressLine2}
                  onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  className="bg-input border-border resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine3" className="text-sm font-medium">
                  Line 3 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="addressLine3"
                  placeholder="Address Line 3"
                  value={formData.addressLine3}
                  onChange={(e) => handleInputChange('addressLine3', e.target.value)}
                  className="bg-input border-border resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-sm font-medium">
                    Pincode <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    className="bg-input border-border"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district" className="text-sm font-medium">
                    District <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="district"
                    placeholder="District"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="bg-input border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="bg-input border-border"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <Upload className="w-5 h-5 mr-2 text-primary" />
              Photo Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <User className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Photo Preview</p>
                </div>
              </div>
              <div className="flex-1">
                <Button type="button" variant="outline" className="mb-2">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <p className="text-sm text-muted-foreground">
                  Upload a recent passport-size photograph (JPG, PNG, max 2MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button 
            type="submit" 
            className="bg-gradient-primary hover:opacity-90 shadow-medium px-8 py-3 text-base font-semibold"
          >
            <Save className="w-5 h-5 mr-2" />
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
};