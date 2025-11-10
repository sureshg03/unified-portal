import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  User,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { clearAuthData, getUserInfo, getLSCCode, getLSCName } from '@/lib/auth';
import { StudentAdmissionDetails } from './modules/StudentAdmissionDetails';
import { CounsellorInformation } from './modules/CounsellorInformation';
import { AttendanceModule } from './modules/AttendanceModule';
import { AssignmentMarks } from './modules/AssignmentMarks';
import { ReportsModule } from './modules/ReportsModule';
import { ChangePassword } from './modules/ChangePassword';
import { SettingsModule } from './modules/SettingsModule';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ActivePage = 'dashboard' | 'settings' | 'admissions' | 'applications' | 'reports' | 'materials' | 'counselor' | 'attendance' | 'assignments' | 'password';

export const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userInfo, setUserInfo] = useState(getUserInfo());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const lscCode = getLSCCode();
  const lscName = getLSCName();

  useEffect(() => {
    // Refresh user info
    setUserInfo(getUserInfo());
  }, []);

  const handleLogout = () => {
    clearAuthData();
    toast({
      title: "✅ Logged Out",
      description: "You have been successfully logged out.",
      duration: 3000,
    });
    navigate('/lsc/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    handleLogout();
  };

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
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Dashboard</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome to your Learning Support Centre portal</p>
              </div>
              <Badge variant="outline" className="bg-gradient-primary text-white border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex-shrink-0 w-fit">
                LSC: {lscCode}
              </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="border-0 shadow-medium bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">156</div>
                  <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-medium bg-gradient-to-br from-education-blue/5 to-education-blue/10 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Enrolled Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-education-blue">89</div>
                  <p className="text-xs text-muted-foreground mt-1">+5% from last month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-medium bg-gradient-to-br from-education-orange/5 to-education-orange/10 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-education-orange">23</div>
                  <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-medium bg-gradient-to-br from-education-purple/5 to-education-purple/10 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-education-purple">12</div>
                  <p className="text-xs text-muted-foreground mt-1">Available this semester</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-medium">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl font-semibold">Recent Activity</CardTitle>
                <CardDescription className="text-sm">Latest updates and applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-lg border border-primary/20">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">New application submitted</p>
                      <p className="text-xs text-muted-foreground truncate">Student ID: ST2024001 - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-education-blue/10 to-transparent rounded-lg border border-education-blue/20">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-education-blue rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Assignment marks updated</p>
                      <p className="text-xs text-muted-foreground truncate">Course: CS101 - 4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-education-orange/10 to-transparent rounded-lg border border-education-orange/20">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-education-orange rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">New counselor registered</p>
                      <p className="text-xs text-muted-foreground truncate">Dr. Rajesh Kumar - 6 hours ago</p>
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
            onClick={handleLogoutClick}
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
                  LSC Name: {lscName}
                </h1>
                <p className="text-xs text-muted-foreground truncate">LSC No: {lscCode}</p>
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

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-red-600 hover:bg-red-700">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
