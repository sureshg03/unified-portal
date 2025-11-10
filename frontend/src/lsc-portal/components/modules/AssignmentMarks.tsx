import { useState } from 'react';
import { Search, FileText, Calculator, Download, Eye, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const AssignmentMarks = () => {
  const [selectedLSC, setSelectedLSC] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedPCode, setSelectedPCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const mockMarksData = [
    {
      id: 1,
      slNo: 1,
      regNo: 'REG2024001',
      name: 'Rajesh Kumar',
      program: 'MBA',
      pCode: 'MBA101',
      internalMarks: 85,
      status: 'Submitted'
    },
    {
      id: 2,
      slNo: 2,
      regNo: 'REG2024002',
      name: 'Priya Sharma',
      program: 'MCA',
      pCode: 'MCA101',
      internalMarks: 92,
      status: 'Submitted'
    },
    {
      id: 3,
      slNo: 3,
      regNo: 'REG2024003',
      name: 'Amit Singh',
      program: 'M.Com',
      pCode: 'COM101',
      internalMarks: 78,
      status: 'Pending'
    }
  ];

  const getMarksColor = (marks: number) => {
    if (marks >= 90) return 'text-primary';
    if (marks >= 75) return 'text-education-blue';
    if (marks >= 50) return 'text-education-orange';
    return 'text-destructive';
  };

  const getStatusColor = (status: string) => {
    return status === 'Submitted' 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-education-orange text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Assignment Marks & Internal Assessment
          </h1>
          <p className="text-muted-foreground mt-2">Manage internal marks and assignment evaluations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            Add Marks
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90 shadow-medium">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer hover:shadow-medium transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Add Counsellor</p>
                <p className="text-xs text-muted-foreground">Register new counsellor</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft bg-gradient-to-br from-education-blue/5 to-education-blue/10 cursor-pointer hover:shadow-medium transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-education-blue/20 rounded-lg">
                <Calculator className="w-5 h-5 text-education-blue" />
              </div>
              <div>
                <p className="font-semibold text-sm">Add Attendance</p>
                <p className="text-xs text-muted-foreground">Mark student attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft bg-gradient-to-br from-education-orange/5 to-education-orange/10 cursor-pointer hover:shadow-medium transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-education-orange/20 rounded-lg">
                <FileText className="w-5 h-5 text-education-orange" />
              </div>
              <div>
                <p className="font-semibold text-sm">Add Assignment Mark</p>
                <p className="text-xs text-muted-foreground">Enter assignment scores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft bg-gradient-to-br from-education-purple/5 to-education-purple/10 cursor-pointer hover:shadow-medium transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-education-purple/20 rounded-lg">
                <Calculator className="w-5 h-5 text-education-purple" />
              </div>
              <div>
                <p className="font-semibold text-sm">Add Internal & Model Mark</p>
                <p className="text-xs text-muted-foreground">Internal assessment marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Card */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Search className="w-5 h-5 mr-2 text-primary" />
            Search & Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Learning Support Centre</label>
              <Select value={selectedLSC} onValueChange={setSelectedLSC}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="-- Select LSC --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lsc1">Vidhyaa Arts & Science College</SelectItem>
                  <SelectItem value="lsc2">Government Arts College</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Admission Batch</label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="-- Select Batch --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024-2026</SelectItem>
                  <SelectItem value="2023">2023-2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Programme Applied</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="-- Select Programme --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mba">MBA</SelectItem>
                  <SelectItem value="mca">MCA</SelectItem>
                  <SelectItem value="mcom">M.Com</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Semester</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="-- Select Semester --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem1">Semester 1</SelectItem>
                  <SelectItem value="sem2">Semester 2</SelectItem>
                  <SelectItem value="sem3">Semester 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">P_Code/P_Name</label>
              <Select value={selectedPCode} onValueChange={setSelectedPCode}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="-- Select P_Code/P_Name --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mba101">MBA101 - Management Principles</SelectItem>
                  <SelectItem value="mca101">MCA101 - Computer Fundamentals</SelectItem>
                  <SelectItem value="com101">COM101 - Business Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button className="bg-gradient-primary hover:opacity-90 shadow-soft">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Marks Table */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Internal Marks & Assignment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Sl.No</TableHead>
                  <TableHead className="font-semibold">Reg No.</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Programme</TableHead>
                  <TableHead className="font-semibold">P_Code/P_Name</TableHead>
                  <TableHead className="font-semibold">Internal Marks</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMarksData.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{student.slNo}</TableCell>
                    <TableCell className="font-mono text-sm">{student.regNo}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.program}</TableCell>
                    <TableCell className="font-mono text-sm">{student.pCode}</TableCell>
                    <TableCell className={`font-bold text-lg ${getMarksColor(student.internalMarks)}`}>
                      {student.internalMarks}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                          <Eye className="w-4 h-4 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-education-blue/10">
                          <Edit className="w-4 h-4 text-education-blue" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing 0 to 0 of 0 entries
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};