import { useState } from 'react';
import { Search, Calendar, Users, Download, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const AttendanceModule = () => {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const mockAttendanceData = [
    {
      id: 1,
      applicationNo: 'APP2024001',
      name: 'Rajesh Kumar',
      program: 'MBA',
      community: 'OBC',
      payment: 'Paid',
      attendance: '85%',
      status: 'Active'
    },
    {
      id: 2,
      applicationNo: 'APP2024002',
      name: 'Priya Sharma',
      program: 'MCA',
      community: 'General',
      payment: 'Paid',
      attendance: '92%',
      status: 'Active'
    },
    {
      id: 3,
      applicationNo: 'APP2024003',
      name: 'Amit Singh',
      program: 'M.Com',
      community: 'SC',
      payment: 'Pending',
      attendance: '78%',
      status: 'Inactive'
    }
  ];

  const getAttendanceColor = (attendance: string) => {
    const percent = parseInt(attendance);
    if (percent >= 90) return 'text-primary';
    if (percent >= 75) return 'text-education-orange';
    return 'text-destructive';
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Attendance Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Monitor and manage student attendance records</p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <Button variant="outline" className="shadow-soft flex-1 sm:flex-none">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Mark Attendance</span>
            <span className="sm:hidden">Mark</span>
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90 shadow-medium flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-0 shadow-medium bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center">
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-primary">156</div>
            <p className="text-xs text-muted-foreground mt-1">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-medium bg-gradient-to-br from-education-blue/5 to-education-blue/10 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Present Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-education-blue">142</div>
            <p className="text-xs text-muted-foreground mt-1">91% attendance</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-medium bg-gradient-to-br from-education-orange/5 to-education-orange/10 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Absent Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-education-orange">14</div>
            <p className="text-xs text-muted-foreground mt-1">9% absent</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-medium bg-gradient-to-br from-education-purple/5 to-education-purple/10 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-education-purple">87%</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Card */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary flex-shrink-0" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Mode of Study</label>
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="bg-input border-border h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="OPEN DISTANCE LEARNING" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="odl">Open Distance Learning</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Programme Applied</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="bg-input border-border h-10 sm:h-11 text-sm">
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

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border h-10 sm:h-11 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button className="bg-gradient-primary hover:opacity-90 shadow-soft w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold">Student Attendance Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-none sm:rounded-lg border-0 sm:border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">S.No</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Application No</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Name</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Programme</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Community</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Payment</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Attendance</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAttendanceData.map((student, index) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">{student.applicationNo}</TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{student.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">{student.program}</TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">{student.community}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={`${student.payment === 'Paid' ? 'bg-primary text-primary-foreground' : 'bg-education-orange text-white'} text-xs`}>
                        {student.payment}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-semibold text-xs sm:text-sm whitespace-nowrap ${getAttendanceColor(student.attendance)}`}>
                      {student.attendance}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={`${getStatusColor(student.status)} text-xs`}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2 whitespace-nowrap">
                        <Button size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/10">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-education-blue/10">
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-education-blue" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-4 sm:px-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Showing 1 to 3 of 3 entries
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="text-xs sm:text-sm h-8 sm:h-9">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled className="text-xs sm:text-sm h-8 sm:h-9">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};