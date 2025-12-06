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
      icon: FileText,
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
      icon: Calendar,
      color: 'education-purple'
    }
  ];

  const handleGenerateReport = () => {
    // Implementation for generating reports
    console.log('Generating report for:', selectedReportType);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Generate comprehensive reports for admissions and applications</p>
        </div>
        <FileText className="h-8 w-8 text-blue-600" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}/10`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Generation */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={!selectedReportType}
            className="w-full md:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((type) => (
          <Card key={type.id} className="border-0 shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-gray-100`}>
                  <type.icon className={`h-6 w-6 ${type.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    Available
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};