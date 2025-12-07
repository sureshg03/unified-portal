import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  GraduationCap,
  Shield,
  Database,
  Activity,
  UserCog,
  User,
  Calendar,
  Building2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { clearAuthData, getUserInfo, getLSCCode, getLSCName } from '@/lib/auth';
import { AdmissionManagement } from './modules/AdmissionManagement';
import { StudentList } from '../../components/modules/StudentList';
import StudentDetail from '../../components/modules/StudentDetail';
import StudentIDCard from '../../components/modules/StudentIDCard';
import { CounsellorInformation } from './modules/CounsellorInformation';
import { AttendanceModule } from './modules/AttendanceModule';
import { AssignmentMarks } from './modules/AssignmentMarks';
import { ReportsModule } from './modules/ReportsModule';
import { ChangePassword } from './modules/ChangePassword';
import { SettingsModule } from './modules/SettingsModule';
import { AddCourses } from './modules/AddCourses';
import { LSCManagement } from './modules/LSCManagement';
import { NewStudentApplication } from '@/components/modules/NewStudentApplication';
import { MaterialsManagement } from './modules/MaterialsManagement';
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

type ActivePage = 'dashboard' | 'settings' | 'users' | 'lsc-management' | 'reports' | 'system' | 'password' | 'admissions' | 'applications' | 'materials' | 'counselor' | 'attendance' | 'assignments' | 'admission-management' | 'add-courses' | 'admissions-verify' | 'id-card';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userInfo, setUserInfo] = useState(getUserInfo());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const lscCode = getLSCCode();
  const lscName = getLSCName();

  useEffect(() => {
    // Refresh user info
    setUserInfo(getUserInfo());
  }, []);

  // Get active page from URL
  const getActivePage = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    console.log('=== ADMIN DASHBOARD ROUTING DEBUG ===');
    console.log('Full pathname:', location.pathname);
    console.log('Path parts:', pathParts);
    console.log('=====================================');
    
    // Handle direct /id-card/* access (without /lsc/dashboard/admin prefix)
    if (pathParts[0] === 'id-card') {
      console.log('Direct ID Card route detected!');
      return 'id-card';
    }
    
    // If on /lsc/dashboard/admin, return 'dashboard'
    if (pathParts.length === 3 && pathParts[0] === 'lsc' && pathParts[1] === 'dashboard' && pathParts[2] === 'admin') {
      return 'dashboard';
    }

    // Handle admissions sub-routes
    if (pathParts.includes('admissions')) {
      const admissionsIndex = pathParts.indexOf('admissions');
      if (pathParts[admissionsIndex + 1] === 'verify') {
        return 'admissions-verify';
      }
      return 'admissions';
    }

    // Handle ID card route - /lsc/dashboard/admin/id-card/{applicationId}
    if (pathParts.includes('id-card')) {
      console.log('ID Card route detected!');
      return 'id-card';
    }

    const lastPart = pathParts[pathParts.length - 1];
    console.log('Returning last part as active page:', lastPart);
    return lastPart as ActivePage;
  };

  const activePage = getActivePage();
  console.log('Active page:', activePage);

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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-600', path: '/lsc/dashboard/admin' },
    { id: 'admission-management', label: 'Admission Management', icon: GraduationCap, color: 'text-purple-600', path: '/lsc/dashboard/admin/admission-management' },
    { id: 'add-courses', label: 'Add Courses', icon: Plus, color: 'text-green-600', path: '/lsc/dashboard/admin/add-courses' },
    { id: 'admissions', label: 'Student Admission Details', icon: Users, color: 'text-blue-600', path: '/lsc/dashboard/admin/admissions' },
    { id: 'applications', label: 'New Student Application', icon: UserPlus, color: 'text-orange-600', path: '/lsc/dashboard/admin/applications' },
    { id: 'lsc-management', label: 'LSC Management', icon: Building2, color: 'text-cyan-600', path: '/lsc/dashboard/admin/lsc-management' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600', path: '/lsc/dashboard/admin/settings' },
    { id: 'users', label: 'User Management', icon: Users, color: 'text-purple-600', path: '/lsc/dashboard/admin/users' },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText, color: 'text-teal-600', path: '/lsc/dashboard/admin/reports' },
    { id: 'materials', label: 'Materials', icon: BookOpen, color: 'text-green-600', path: '/lsc/dashboard/admin/materials' },
    { id: 'counselor', label: 'Counselor Information', icon: User, color: 'text-pink-600', path: '/lsc/dashboard/admin/counselor' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, color: 'text-yellow-600', path: '/lsc/dashboard/admin/attendance' },
    { id: 'assignments', label: 'Assignment Marks', icon: FileText, color: 'text-red-600', path: '/lsc/dashboard/admin/assignments' },
    { id: 'system', label: 'System Settings', icon: Database, color: 'text-emerald-600', path: '/lsc/dashboard/admin/system' },
    { id: 'password', label: 'Change Password', icon: Lock, color: 'text-rose-600', path: '/lsc/dashboard/admin/password' },
  ];

  const DashboardHome = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-2xl p-8 shadow-2xl border border-blue-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to LSC Admin Portal
              </h1>
              <p className="text-blue-200 text-lg">
                {lscName} • {lscCode}
              </p>
              <p className="text-blue-300 text-sm mt-1">
                Manage admissions, students, and learning resources
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className="bg-white/20 backdrop-blur-xl text-white border border-white/30 px-4 py-2 text-sm font-semibold shadow-lg">
              <Activity className="w-4 h-4 mr-2" />
              Administrator
            </Badge>
            <p className="text-blue-200 text-xs text-right">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-600/10 group-hover:from-blue-600/10 group-hover:to-blue-600/20 transition-all"></div>
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-0">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-gray-900 mb-1">45</div>
            <p className="text-sm text-gray-600 font-medium">Total LSC Centers</p>
            <p className="text-xs text-gray-500 mt-2">+3 new this month</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-purple-600/10 group-hover:from-purple-600/10 group-hover:to-purple-600/20 transition-all"></div>
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-0">Online</Badge>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-gray-900 mb-1">234</div>
            <p className="text-sm text-gray-600 font-medium">Active Users</p>
            <p className="text-xs text-gray-500 mt-2">89% online rate</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-green-600/10 group-hover:from-green-600/10 group-hover:to-green-600/20 transition-all"></div>
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-700 border-0">Growing</Badge>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-gray-900 mb-1">2,847</div>
            <p className="text-sm text-gray-600 font-medium">Total Applications</p>
            <p className="text-xs text-gray-500 mt-2">+156 this week</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-orange-600/10 group-hover:from-orange-600/10 group-hover:to-orange-600/20 transition-all"></div>
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <Badge className="bg-orange-100 text-orange-700 border-0">Healthy</Badge>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-gray-900 mb-1">99.8%</div>
            <p className="text-sm text-gray-600 font-medium">System Health</p>
            <p className="text-xs text-gray-500 mt-2">Uptime this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent System Activity */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
                <CardDescription className="text-gray-600 mt-1">Latest system events and actions</CardDescription>
              </div>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">New LSC Center Registered</p>
                    <p className="text-xs text-gray-600">LSC Code: LC2156</p>
                    <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">New</Badge>
                </div>
              </div>
              
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserCog className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">User Permissions Updated</p>
                    <p className="text-xs text-gray-600">5 users modified</p>
                    <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">Update</Badge>
                </div>
              </div>
              
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">System Backup Completed</p>
                    <p className="text-xs text-gray-600">Database: online_edu</p>
                    <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">Success</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
                <CardDescription className="text-gray-600 mt-1">Common administrative tasks</CardDescription>
              </div>
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => navigate('/lsc/dashboard/admin/lsc-management')}
                className="h-auto py-6 flex flex-col gap-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Add New LSC</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/lsc/dashboard/admin/users')}
                className="h-auto py-6 flex flex-col gap-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserCog className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Manage Users</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/lsc/dashboard/admin/reports')}
                className="h-auto py-6 flex flex-col gap-3 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Generate Report</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/lsc/dashboard/admin/system')}
                className="h-auto py-6 flex flex-col gap-3 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">System Status</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );

  // Render content based on active page
  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'admission-management':
        return <AdmissionManagement />;
      case 'add-courses':
        return <AddCourses />;
      case 'settings':
        return <SettingsModule />;
      case 'users':
        return (
          <div className="flex items-center justify-center h-96">
            <Card className="border-0 shadow-lg max-w-md text-center">
              <CardHeader>
                <CardTitle className="text-xl">Coming Soon</CardTitle>
                <CardDescription>User Management section is under development</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This admin feature will be available in the next update.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case 'admissions':
        return <StudentList />;
      case 'admissions-verify':
        return <StudentDetail />;
      case 'id-card':
        return <StudentIDCard />;
      case 'applications':
        return (
          <div className="w-full p-8 bg-white">
            <h1 className="text-3xl font-bold text-red-600 mb-4">TEST - Applications Route Works!</h1>
            <p className="text-gray-700 mb-4">If you see this, the route is working correctly.</p>
            <NewStudentApplication />
          </div>
        );
      case 'reports':
        return <ReportsModule />;
      case 'materials':
        return <MaterialsManagement />;
      case 'counselor':
        return <CounsellorInformation />;
      case 'attendance':
        return <AttendanceModule />;
      case 'assignments':
        return <AssignmentMarks />;
      case 'lsc-management':
        return <LSCManagement />;
      case 'system':
        return (
          <div className="flex items-center justify-center h-96">
            <Card className="border-0 shadow-lg max-w-md text-center">
              <CardHeader>
                <CardTitle className="text-xl">Coming Soon</CardTitle>
                <CardDescription>System Settings section is under development</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This admin feature will be available in the next update.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case 'password':
        return <ChangePassword />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Subtle Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-xl flex flex-col relative z-10`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Shield className="w-7 h-7 text-blue-900" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-white truncate">LSC Admin</h2>
                <p className="text-xs text-blue-200 truncate">System Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 font-semibold shadow-sm border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {sidebarOpen && (
                  <span className="text-sm truncate">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 text-red-600 hover:bg-red-50 font-medium"
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Professional Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  {lscName}
                </h1>
                <p className="text-xs text-gray-600 truncate flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {lscCode}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{userInfo?.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Online</span>
              </div>

              {/* Admin Badge */}
              <Badge className="bg-blue-900 text-white border-0 px-4 py-2 text-xs font-semibold shadow-sm">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Administrator
              </Badge>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
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
              Are you sure you want to log out? You will need to sign in again to access the admin panel.
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

