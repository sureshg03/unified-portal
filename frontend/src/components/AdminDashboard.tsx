import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
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
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { clearAuthData, getUserInfo, getLSCCode, getLSCName } from '@/lib/auth';
import { ChangePassword } from './modules/ChangePassword';
import { SettingsModule } from './modules/SettingsModule';
import { StudentAdmissionDetails } from './modules/StudentAdmissionDetails';
import { CounsellorInformation } from './modules/CounsellorInformation';
import { AttendanceModule } from './modules/AttendanceModule';
import { AssignmentMarks } from './modules/AssignmentMarks';
import { ReportsModule } from './modules/ReportsModule';
import { AdmissionManagement } from './modules/AdmissionManagement';
import { LSCManagement } from './modules/LSCManagement';
import { NewStudentApplication } from './modules/NewStudentApplication';
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

type ActivePage = 'dashboard' | 'settings' | 'users' | 'lsc-management' | 'reports' | 'system' | 'password' | 'admissions' | 'applications' | 'materials' | 'counselor' | 'attendance' | 'assignments' | 'admission-management';

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
  const getActivePage = (): ActivePage => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    
    // If on /dashboard/admin, return 'dashboard'
    if (lastPart === 'admin' || pathParts.length === 2) {
      return 'dashboard';
    }
    
    return lastPart as ActivePage;
  };

  const activePage = getActivePage();

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
    { id: 'applications', label: 'New Student Application', icon: UserPlus, color: 'text-orange-600', path: '/lsc/dashboard/admin/applications' },
    { id: 'lsc-management', label: 'LSC Management', icon: Building2, color: 'text-cyan-600', path: '/lsc/dashboard/admin/lsc-management' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600', path: '/lsc/dashboard/admin/settings' },
    { id: 'users', label: 'User Management', icon: Users, color: 'text-purple-600', path: '/lsc/dashboard/admin/users' },
    { id: 'admissions', label: 'Student Admission Details', icon: Users, color: 'text-blue-600', path: '/lsc/dashboard/admin/admissions' },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText, color: 'text-teal-600', path: '/lsc/dashboard/admin/reports' },
    { id: 'materials', label: 'Materials', icon: BookOpen, color: 'text-green-600', path: '/lsc/dashboard/admin/materials' },
    { id: 'counselor', label: 'Counselor Information', icon: User, color: 'text-pink-600', path: '/lsc/dashboard/admin/counselor' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, color: 'text-yellow-600', path: '/lsc/dashboard/admin/attendance' },
    { id: 'assignments', label: 'Assignment Marks', icon: FileText, color: 'text-red-600', path: '/lsc/dashboard/admin/assignments' },
    { id: 'system', label: 'System Settings', icon: Database, color: 'text-emerald-600', path: '/lsc/dashboard/admin/system' },
    { id: 'password', label: 'Change Password', icon: Lock, color: 'text-rose-600', path: '/lsc/dashboard/admin/password' },
  ];

  const DashboardHome = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            System-wide management and analytics
          </p>
        </div>
        <Badge variant="outline" className="bg-gradient-to-r from-purple-700 to-purple-600 text-white border-0 px-4 py-2 w-fit">
          <Shield className="w-4 h-4 mr-2" />
          Admin Access
        </Badge>
      </div>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total LSC Centers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">45</div>
            <p className="text-xs text-gray-500 mt-1">+3 this month</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">234</div>
            <p className="text-xs text-gray-500 mt-1">89% online rate</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">2,847</div>
            <p className="text-xs text-gray-500 mt-1">+156 this week</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700">99.8%</div>
            <p className="text-xs text-gray-500 mt-1">Uptime this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent System Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent System Activity</CardTitle>
          <CardDescription>Latest administrative actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-transparent rounded-lg border border-indigo-200">
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New LSC Center registered</p>
                <p className="text-xs text-muted-foreground">LSC Code: LC2156 - 1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-200">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">User permissions updated</p>
                <p className="text-xs text-muted-foreground">5 users modified - 3 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-200">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System backup completed</p>
                <p className="text-xs text-muted-foreground">Database: online_edu - 5 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto py-6 flex flex-col gap-2 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <UserPlus className="w-6 h-6" />
              <span>Add New LSC</span>
            </Button>
            <Button className="h-auto py-6 flex flex-col gap-2 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <UserCog className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
            <Button className="h-auto py-6 flex flex-col gap-2 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <FileText className="w-6 h-6" />
              <span>Generate Report</span>
            </Button>
            <Button className="h-auto py-6 flex flex-col gap-2 bg-gradient-to-br from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700">
              <Activity className="w-6 h-6" />
              <span>System Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } transition-all duration-500 ease-in-out bg-white/80 backdrop-blur-2xl border-r border-purple-100/50 shadow-2xl flex flex-col relative z-10`}
      >
        {/* Header with Glass Effect */}
        <div className="p-5 border-b border-purple-100/50 bg-purple-50/30">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base text-purple-600 truncate">Admin Portal</h2>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  System Management
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation with Modern Design */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`relative w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-300 group ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-2xl shadow-purple-500/50 scale-[1.02]' 
                    : 'text-gray-700 hover:bg-purple-50 hover:scale-[1.02] hover:shadow-lg'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-purple-600 rounded-xl blur opacity-50 animate-pulse"></div>
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : item.color} transition-transform group-hover:scale-110`} />
                {sidebarOpen && (
                  <span className="text-sm font-semibold truncate relative z-10 group-hover:translate-x-1 transition-transform">
                    {item.label}
                  </span>
                )}
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full relative z-10 animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout with Enhanced Design */}
        <div className="p-4 border-t border-purple-100/50 bg-red-50/30">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-300 text-red-600 hover:bg-red-50 hover:scale-[1.02] hover:shadow-xl group"
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {sidebarOpen && <span className="text-sm font-semibold group-hover:translate-x-1 transition-transform">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar with Glass Morphism */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-purple-100/50 shadow-xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-purple-600 truncate">
                  {lscName}
                </h1>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  LSC Code: {lscCode} • {userInfo?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Quick Actions */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all">
                  <Activity className="w-4 h-4 mr-1" />
                  Activity
                </Button>
              </div>
              
              {/* Admin Badge with Animation */}
              <div className="relative group">
                <div className="absolute inset-0 bg-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Badge className="relative bg-purple-600 text-white border-0 px-4 py-2 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <Shield className="w-3 h-3 mr-1" />
                  Administrator
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Content with Enhanced Styling */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <div className="animate-fadeIn">
              <Routes>
                <Route index element={<DashboardHome />} />
                <Route path="admission-management" element={<AdmissionManagement />} />
                <Route path="settings" element={<SettingsModule />} />
                <Route path="users" element={
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
                } />
                <Route path="admissions" element={<StudentAdmissionDetails />} />
                <Route path="applications" element={<NewStudentApplication />} />
                <Route path="reports" element={<ReportsModule />} />
                <Route path="materials" element={
                  <div className="flex items-center justify-center h-96">
                    <Card className="border-0 shadow-lg max-w-md text-center">
                      <CardHeader>
                        <CardTitle className="text-xl">Coming Soon</CardTitle>
                        <CardDescription>Materials section is under development</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          This admin feature will be available in the next update.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                } />
                <Route path="counselor" element={<CounsellorInformation />} />
                <Route path="attendance" element={<AttendanceModule />} />
                <Route path="assignments" element={<AssignmentMarks />} />
                <Route path="lsc-management" element={<LSCManagement />} />
                <Route path="system" element={
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
                } />
                <Route path="password" element={<ChangePassword />} />
              </Routes>
            </div>
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
