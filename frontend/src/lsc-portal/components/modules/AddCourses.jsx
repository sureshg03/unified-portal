import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, BookOpen, DollarSign, Calendar, Users, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export const AddCourses = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    course_short_code: '',
    course_full_name: '',
    branch_name: '',
    num_semesters: '',
    num_years: '',
    course_code: '',
    degree: '',
    application_fee: '',
    language: '',
    code2: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/courses/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          num_semesters: parseInt(formData.num_semesters),
          num_years: parseInt(formData.num_years),
          application_fee: parseFloat(formData.application_fee)
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast({
          title: "Success",
          description: "Course added successfully!",
        });
        // Reset form
        setFormData({
          course_short_code: '',
          course_full_name: '',
          branch_name: '',
          num_semesters: '',
          num_years: '',
          course_code: '',
          degree: '',
          application_fee: '',
          language: '',
          code2: ''
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add course.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "Error",
        description: "An error occurred while adding the course.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Course</h1>
          <p className="text-gray-600 mt-2">Create and manage course offerings for students</p>
        </div>
        <BookOpen className="h-8 w-8 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Course Information
              </CardTitle>
              <CardDescription>
                Fill in the details below to add a new course to the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Course Short Code */}
                  <div className="space-y-2">
                    <Label htmlFor="course_short_code">
                      Course Short Code *
                    </Label>
                    <Input
                      id="course_short_code"
                      name="course_short_code"
                      value={formData.course_short_code}
                      onChange={handleInputChange}
                      placeholder="e.g., BCA, MCA"
                      required
                    />
                  </div>

                  {/* Course Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="course_full_name">
                      Course Full Name *
                    </Label>
                    <Input
                      id="course_full_name"
                      name="course_full_name"
                      value={formData.course_full_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Bachelor of Computer Applications"
                      required
                    />
                  </div>

                  {/* Branch Name */}
                  <div className="space-y-2">
                    <Label htmlFor="branch_name">
                      Branch Name
                    </Label>
                    <Input
                      id="branch_name"
                      name="branch_name"
                      value={formData.branch_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Computer Science"
                    />
                  </div>

                  {/* Degree */}
                  <div className="space-y-2">
                    <Label htmlFor="degree">
                      Degree *
                    </Label>
                    <Input
                      id="degree"
                      name="degree"
                      value={formData.degree}
                      onChange={handleInputChange}
                      placeholder="e.g., BCA, MCA, B.Tech"
                      required
                    />
                  </div>

                  {/* Number of Semesters */}
                  <div className="space-y-2">
                    <Label htmlFor="num_semesters">
                      Number of Semesters *
                    </Label>
                    <Input
                      id="num_semesters"
                      name="num_semesters"
                      type="number"
                      value={formData.num_semesters}
                      onChange={handleInputChange}
                      placeholder="e.g., 6"
                      required
                    />
                  </div>

                  {/* Number of Years */}
                  <div className="space-y-2">
                    <Label htmlFor="num_years">
                      Number of Years *
                    </Label>
                    <Input
                      id="num_years"
                      name="num_years"
                      type="number"
                      value={formData.num_years}
                      onChange={handleInputChange}
                      placeholder="e.g., 3"
                      required
                    />
                  </div>

                  {/* Course Code */}
                  <div className="space-y-2">
                    <Label htmlFor="course_code">
                      Course Code
                    </Label>
                    <Input
                      id="course_code"
                      name="course_code"
                      value={formData.course_code}
                      onChange={handleInputChange}
                      placeholder="e.g., CS101"
                    />
                  </div>

                  {/* Application Fee */}
                  <div className="space-y-2">
                    <Label htmlFor="application_fee">
                      Application Fee (₹) *
                    </Label>
                    <Input
                      id="application_fee"
                      name="application_fee"
                      type="number"
                      step="0.01"
                      value={formData.application_fee}
                      onChange={handleInputChange}
                      placeholder="e.g., 500.00"
                      required
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor="language">
                      Language
                    </Label>
                    <Input
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      placeholder="e.g., English"
                    />
                  </div>

                  {/* Code 2 */}
                  <div className="space-y-2">
                    <Label htmlFor="code2">
                      Secondary Code
                    </Label>
                    <Input
                      id="code2"
                      name="code2"
                      value={formData.code2}
                      onChange={handleInputChange}
                      placeholder="Additional code if needed"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading} className="min-w-32">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Course...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Course
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Course Management Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Course Short Code should be unique and concise (e.g., BCA, MCA)</li>
                <li>• Degree field is used for student applications and should match exactly</li>
                <li>• Application fee is in rupees and will be charged to students</li>
                <li>• Number of semesters and years should be consistent with the course duration</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};


