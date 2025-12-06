import { useState } from 'react';
import { Search, Calendar, Users, Download, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const AttendanceModule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  // Mock data for attendance records
  const attendanceRecords = [
    {
      id: 1,
      studentName: 'John Doe',
      studentId: 'STU001',
      course: 'BCA',
      semester: '6th',
      totalClasses: 45,
      attendedClasses: 42,
      percentage: 93.3,
      status: 'Excellent'
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      studentId: 'STU002',
      course: 'MCA',
      semester: '4th',
      totalClasses: 40,
      attendedClasses: 35,
      percentage: 87.5,
      status: 'Good'
    },
    {
      id: 3,
      studentName: 'Bob Johnson',
      studentId: 'STU003',
      course: 'BCA',
      semester: '2nd',
      totalClasses: 50,
      attendedClasses: 38,
      percentage: 76.0,
      status: 'Average'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Average': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = attendanceRecords.filter(record =>
    record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage student attendance records</p>
        </div>
        <Users className="h-8 w-8 text-blue-600" />
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bca">BCA</SelectItem>
                <SelectItem value="mca">MCA</SelectItem>
                <SelectItem value="btech">B.Tech</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1st Semester</SelectItem>
                <SelectItem value="2">2nd Semester</SelectItem>
                <SelectItem value="3">3rd Semester</SelectItem>
                <SelectItem value="4">4th Semester</SelectItem>
                <SelectItem value="5">5th Semester</SelectItem>
                <SelectItem value="6">6th Semester</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <div className="grid grid-cols-1 gap-6">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{record.studentName}</h3>
                    <p className="text-sm text-gray-600">ID: {record.studentId}</p>
                    <p className="text-sm text-gray-600">{record.course} - {record.semester} Semester</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{record.percentage}%</div>
                  <p className="text-sm text-gray-600">{record.attendedClasses}/{record.totalClasses} classes</p>
                  <Badge className={`mt-2 ${getStatusColor(record.status)}`}>
                    {record.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${record.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{filteredRecords.length}</div>
            <p className="text-sm text-gray-600">Total Students</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(filteredRecords.reduce((acc, record) => acc + record.percentage, 0) / filteredRecords.length)}%
            </div>
            <p className="text-sm text-gray-600">Average Attendance</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 font-bold">!</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredRecords.filter(record => record.percentage < 75).length}
            </div>
            <p className="text-sm text-gray-600">Low Attendance</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredRecords.filter(record => record.percentage >= 90).length}
            </div>
            <p className="text-sm text-gray-600">Excellent Attendance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};