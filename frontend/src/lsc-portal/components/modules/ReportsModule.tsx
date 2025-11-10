import { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const ReportsModule = () => {
  const [selectedReportType, setSelectedReportType] = useState('');

  const reportTypes = [
    { id: 'coe', name: 'COE Report', description: 'Centre of Excellence report', icon: FileText, color: 'text-primary' },
    { id: 'application', name: 'Application Report', description: 'Student application summary', icon: Users, color: 'text-education-blue' },
    { id: 'unpaid', name: 'Unpaid Application Report', description: 'Pending payment applications', icon: DollarSign, color: 'text-education-orange' },
    { id: 'confirmed', name: 'Confirmed Report', description: 'Confirmed admissions', icon: TrendingUp, color: 'text-primary' },
    { id: 'not-confirmed', name: 'Not Confirmed Report', description: 'Pending confirmations', icon: FileText, color: 'text-education-purple' },
    { id: 'cancelled', name: 'Cancelled Report', description: 'Cancelled applications', icon: FileText, color: 'text-destructive' }
  ];

  const quickStats = [
    {
      title: 'Total Applications',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'primary'
    },
    {
      title: 'Confirmed Admissions',
      value: '856',
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'education-blue'
    },
    {
      title: 'Pending Payments',
      value: '234',
      change: '-5%',
      changeType: 'negative',
      icon: DollarSign,
      color: 'education-orange'
    },
    {
      title: 'Revenue Generated',
      value: '₹12.5L',
      change: '+15%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'education-purple'
    }
  ];

  const recentReports = [
    { name: 'Monthly Application Report', date: '2024-01-15', status: 'Generated', size: '2.3 MB' },
    { name: 'Fee Collection Summary', date: '2024-01-14', status: 'Processing', size: '1.8 MB' },
    { name: 'Student Enrollment Report', date: '2024-01-13', status: 'Generated', size: '3.1 MB' },
    { name: 'Course Wise Analysis', date: '2024-01-12', status: 'Generated', size: '2.7 MB' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">Generate comprehensive reports and analytics</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-medium">
          <Download className="w-4 h-4 mr-2" />
          Export All Reports
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`border-0 shadow-medium bg-gradient-to-br from-${stat.color}/5 to-${stat.color}/10`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Icon className="w-4 h-4 mr-2" />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</div>
                <p className={`text-xs mt-1 ${stat.changeType === 'positive' ? 'text-primary' : 'text-destructive'}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Generation */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Generate New Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  className="border border-border hover:shadow-medium transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                  onClick={() => setSelectedReportType(report.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-muted/50`}>
                        <Icon className={`w-5 h-5 ${report.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground mb-1">{report.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                        <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-education-blue" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{report.name}</h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-xs text-muted-foreground">Generated on {report.date}</p>
                      <p className="text-xs text-muted-foreground">Size: {report.size}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={report.status === 'Generated' ? 'bg-primary text-primary-foreground' : 'bg-education-orange text-white'}>
                    {report.status}
                  </Badge>
                  {report.status === 'Generated' && (
                    <Button size="sm" variant="outline" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Builder */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-education-purple" />
            Custom Report Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Report Type</label>
              <Select>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student Report</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="academic">Academic Report</SelectItem>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date Range</label>
              <Select>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Format</label>
              <Select>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button className="bg-gradient-secondary hover:opacity-90 shadow-medium">
              <FileText className="w-4 h-4 mr-2" />
              Generate Custom Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};