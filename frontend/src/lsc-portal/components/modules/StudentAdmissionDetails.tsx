import { useState } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const StudentAdmissionDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLSC, setSelectedLSC] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');

  const mockData = [
    {
      id: 1,
      applicationNo: 'APP2024001',
      name: 'Rajesh Kumar',
      program: 'MBA',
      community: 'OBC',
      payment: 'Paid',
      status: 'Confirmed'
    },
    {
      id: 2,
      applicationNo: 'APP2024002',
      name: 'Priya Sharma',
      program: 'MCA',
      community: 'General',
      payment: 'Pending',
      status: 'Applied'
    },
    {
      id: 3,
      applicationNo: 'APP2024003',
      name: 'Amit Singh',
      program: 'M.Com',
      community: 'SC',
      payment: 'Paid',
      status: 'Confirmed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-primary text-primary-foreground';
      case 'Applied': return 'bg-education-orange text-white';
      case 'Rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentColor = (payment: string) => {
    return payment === 'Paid' 
      ? 'bg-primary text-primary-foreground' 
      : 'bg-education-orange text-white';
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Student Admission Details
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Manage and view all student applications</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-medium flex-shrink-0 w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary flex-shrink-0" />
            Search & Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Learning Support Centre</label>
              <Select value={selectedLSC} onValueChange={setSelectedLSC}>
                <SelectTrigger className="bg-input border-border h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="-- Select LSC --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lsc1">Vidhyaa Arts & Science College</SelectItem>
                  <SelectItem value="lsc2">Government Arts College</SelectItem>
                  <SelectItem value="lsc3">Salem College</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Admission Batch</label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="bg-input border-border h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="-- Select Batch --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch1">2024-2026</SelectItem>
                  <SelectItem value="batch2">2023-2025</SelectItem>
                  <SelectItem value="batch3">2022-2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">Programme Applied</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="bg-input border-border h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="-- Select Programme --" />
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
                  placeholder="Search applications..."
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

      {/* Results Card */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold">
            Application Summary Report for Open and Distance Learning (ODL) Admission 2025
          </CardTitle>
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
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-semibold text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((student, index) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">{student.applicationNo}</TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{student.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">{student.program}</TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">{student.community}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={`${getPaymentColor(student.payment)} text-xs`}>
                        {student.payment}
                      </Badge>
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
                        <Button size="sm" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
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