import { useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  UserPlus, 
  FileText, 
  BookOpen, 
  Lock, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentAdmissionDetails } from './modules/StudentAdmissionDetails';
import { CounsellorInformation } from './modules/CounsellorInformation';
import { AttendanceModule } from './modules/AttendanceModule';
import { AssignmentMarks } from './modules/AssignmentMarks';
import { ReportsModule } from './modules/ReportsModule';
import { ChangePassword } from './modules/ChangePassword';
import { SettingsModule } from './modules/SettingsModule';

interface DashboardProps {
  lscNumber: string;
  onLogout: () => void;
}

type ActivePage = 'dashboard' | 'settings' | 'admissions' | 'applications' | 'reports' | 'materials' | 'counselor' | 'attendance' | 'assignments' | 'password';

export const Dashboard = ({ lscNumber, onLogout }: DashboardProps) => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-primary' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-education-blue' },
    { id: 'admissions', label: 'Student Admission Details', icon: Users, color: 'text-education-purple' },
    { id: 'applications', label: 'New Student Application', icon: UserPlus, color: 'text-education-orange' },
    { id: 'reports', label: 'Reports', icon: FileText, color: 'text-primary' },
    { id: 'materials', label: 'Materials', icon: BookOpen, color: 'text-education-blue' },
    { id: 'counselor', label: 'Counselor Information', icon: User, color: 'text-education-purple' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, color: 'text-education-orange' },
    { id: 'assignments', label: 'Assignment Marks', icon: FileText, color: 'text-primary' },
    { id: 'password', label: 'Change Password', icon: Lock, color: 'text-education-blue' },
  ];

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-purple-600 p-8 shadow-2xl">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    <span>Welcome Back!</span>
                    <span className="animate-bounce">👋</span>
                  </h1>
                  <p className="text-white/90 text-base sm:text-lg">Your Learning Support Centre portal - Manage everything in one place</p>
                </div>
                <Badge className="relative bg-yellow-400 backdrop-blur-xl text-purple-900 border-yellow-300 px-6 py-3 text-sm shadow-xl hover:scale-105 transition-transform w-fit">
                  <span className="relative font-semibold">LSC: {lscNumber}</span>
                </Badge>
              </div>
            </div>

            {/* Ultra-Modern Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 - Total Applications */}
              <div className="group relative">
                <div className="absolute inset-0 bg-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-purple-600">156</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                      <p className="text-xs text-gray-500">from last month</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Card 2 - Enrolled Students */}
              <div className="group relative">
                <div className="absolute inset-0 bg-yellow-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-xl hover:shadow-yellow-500/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Enrolled Students</CardTitle>
                      <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-yellow-600">89</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+5%</span>
                      <p className="text-xs text-gray-500">from last month</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Card 3 - Pending Reviews */}
              <div className="group relative">
                <div className="absolute inset-0 bg-purple-700 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-xl hover:shadow-purple-700/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
                      <div className="w-10 h-10 bg-purple-700 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-purple-700">23</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Urgent</span>
                      <p className="text-xs text-gray-500">Requires attention</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Card 4 - Active Programs */}
              <div className="group relative">
                <div className="absolute inset-0 bg-yellow-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-xl hover:shadow-yellow-600/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Active Programs</CardTitle>
                      <div className="w-10 h-10 bg-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-yellow-600">12</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Active</span>
                      <p className="text-xs text-gray-500">Available this semester</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity with Modern Design */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-600"></div>
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-purple-600">Recent Activity</CardTitle>
                    <CardDescription className="text-sm mt-1">Latest updates and applications</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl hover:bg-purple-50 hover:border-purple-300">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="group relative overflow-hidden rounded-2xl bg-purple-50 p-4 border-l-4 border-purple-600 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-purple-600 rounded-full animate-ping"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">New application submitted</p>
                        <p className="text-xs text-gray-500 truncate mt-1">Student ID: ST2024001 • 2 hours ago</p>
                      </div>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">New</Badge>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden rounded-2xl bg-yellow-50 p-4 border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Assignment marks updated</p>
                        <p className="text-xs text-gray-500 truncate mt-1">Course: CS101 • 4 hours ago</p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">Updated</Badge>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden rounded-2xl bg-purple-50 p-4 border-l-4 border-purple-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-purple-700 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">New counselor registered</p>
                        <p className="text-xs text-gray-500 truncate mt-1">Dr. Rajesh Kumar • 6 hours ago</p>
                      </div>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">Registered</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'admissions':
        return <StudentAdmissionDetails />;
      
      case 'counselor':
        return <CounsellorInformation />;
      
      case 'attendance':
        return <AttendanceModule />;
      
      case 'assignments':
        return <AssignmentMarks />;
      
      case 'reports':
        return <ReportsModule />;
      
      case 'password':
        return <ChangePassword />;
      
      case 'settings':
        return <SettingsModule />;
      
      default:
        return (
          <div className="flex items-center justify-center h-96">
            <Card className="border-0 shadow-medium max-w-md text-center">
              <CardHeader>
                <CardTitle className="text-xl">Coming Soon</CardTitle>
                <CardDescription>
                  The {menuItems.find(item => item.id === activePage)?.label} section is under development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This feature will be available in the next update.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-gradient-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } transition-all duration-300 ease-in-out bg-card border-r border-border shadow-medium flex flex-col flex-shrink-0`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-sm text-foreground truncate">Periyar University</h2>
                <p className="text-xs text-muted-foreground truncate">LSC Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 sm:space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id as ActivePage)}
                className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-primary text-white shadow-soft scale-[1.02]' 
                    : 'text-foreground hover:bg-muted/50 hover:scale-[1.02]'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : item.color}`} />
                {sidebarOpen && (
                  <span className="truncate text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 sm:p-4 border-t border-border flex-shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-left transition-all duration-200 text-destructive hover:bg-destructive/10 hover:scale-[1.02]"
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="bg-card border-b border-border shadow-soft px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0 h-8 w-8 p-0 sm:h-9 sm:w-9"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-sm font-medium text-foreground truncate">
                  LSC Name: Vidhyaa Arts & Science College
                </h1>
                <p className="text-xs text-muted-foreground truncate">LSC No: {lscNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-primary/10 text-primary hover:bg-primary/20 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Create DEB ID</span>
                <span className="sm:hidden">DEB</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Create ABC ID</span>
                <span className="sm:hidden">ABC</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-background">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};