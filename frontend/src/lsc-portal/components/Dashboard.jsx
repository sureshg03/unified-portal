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



type ActivePage = 'dashboard' | 'settings' | 'admissions' | 'applications' | 'reports' | 'materials' | 'counselor' | 'attendance' | 'assignments' | 'password';

export const Dashboard = ({ lscNumber, onLogout }) => {
  const [activePage, setActivePage] = useState<>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon, color: 'text-primary' },
    { id: 'settings', label: 'Settings', icon, color: 'text-education-blue' },
    { id: 'admissions', label: 'Student Admission Details', icon, color: 'text-education-purple' },
    { id: 'applications', label: 'New Student Application', icon, color: 'text-education-orange' },
    { id: 'reports', label: 'Reports', icon, color: 'text-primary' },
    { id: 'materials', label: 'Materials', icon, color: 'text-education-blue' },
    { id: 'counselor', label: 'Counselor Information', icon, color: 'text-education-purple' },
    { id: 'attendance', label: 'Attendance', icon, color: 'text-education-orange' },
    { id: 'assignments', label: 'Assignment Marks', icon, color: 'text-primary' },
    { id: 'password', label: 'Change Password', icon, color: 'text-education-blue' },
  ];

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard' (
          <>
            {/* Hero Header */}
            <>
              <><>
              <><>
              <><>
              
              <>
                <>
                  <>
                    <>Welcome Back!<>
                    <>👋<>
                  <>
                  <>Your Learning Support Centre portal - Manage everything in one place<>
                <>
                <>
                  <>LSC: {lscNumber}<>
                <>
              <>
            <>

            {/* Ultra-Modern Stats Cards */}
            <>
              {/* Card 1 - Total Applications */}
              <>
                <><>
                <>
                  <><>
                  <>
                    <>
                      <>Total Applications<>
                      <>
                        <>
                      <>
                    <>
                  <>
                  <>
                    <>156<>
                    <>
                      <>+12%<>
                      <>from last month<>
                    <>
                  <>
                <>
              <>

              {/* Card 2 - Enrolled Students */}
              <>
                <><>
                <>
                  <><>
                  <>
                    <>
                      <>Enrolled Students<>
                      <>
                        <>
                      <>
                    <>
                  <>
                  <>
                    <>89<>
                    <>
                      <>+5%<>
                      <>from last month<>
                    <>
                  <>
                <>
              <>

              {/* Card 3 - Pending Reviews */}
              <>
                <><>
                <>
                  <><>
                  <>
                    <>
                      <>Pending Reviews<>
                      <>
                        <>
                      <>
                    <>
                  <>
                  <>
                    <>23<>
                    <>
                      <>Urgent<>
                      <>Requires attention<>
                    <>
                  <>
                <>
              <>

              {/* Card 4 - Active Programs */}
              <>
                <><>
                <>
                  <><>
                  <>
                    <>
                      <>Active Programs<>
                      <>
                        <>
                      <>
                    <>
                  <>
                  <>
                    <>12<>
                    <>
                      <>Active<>
                      <>Available this semester<>
                    <>
                  <>
                <>
              <>
            <>

            {/* Recent Activity with Modern Design */}
            <>
              <><>
              <>
                <>
                  <>
                    <>Recent Activity<>
                    <>Latest updates and applications<>
                  <>
                  <>
                    View All
                  <>
                <>
              <>
              <>
                <>
                  <>
                    <>
                      <>
                        <><>
                        <><>
                      <>
                      <>
                        <>New application submitted<>
                        <>Student ID • 2 hours ago<>
                      <>
                      <>New<>
                    <>
                  <>

                  <>
                    <>
                      <><>
                      <>
                        <>Assignment marks updated<>
                        <>Course • 4 hours ago<>
                      <>
                      <>Updated<>
                    <>
                  <>

                  <>
                    <>
                      <><>
                      <>
                        <>New counselor registered<>
                        <>Dr. Rajesh Kumar • 6 hours ago<>
                      <>
                      <>Registered<>
                    <>
                  <>
                <>
              <>
            <>
          <>
        );
      
      case 'admissions' <>;
      
      case 'counselor' <>;
      
      case 'attendance' <>;
      
      case 'assignments' <>;
      
      case 'reports' <>;
      
      case 'password' <>;
      
      case 'settings' <>;
      
      default (
          <>
            <>
              <>
                <>Coming Soon<>
                <>
                  The {menuItems.find(item => item.id === activePage)?.label} section is under development
                <>
              <>
              <>
                <>
                  This feature will be available in the next update.
                <>
              <>
            <>
          <>
        );
    }
  };

  return (
    <>
      {/* Sidebar */}
      <>
        {/* Header */}
        <>
          <>
            <>
              <>
            <>
            {sidebarOpen && (
              <>
                <>Periyar University<>
                <>LSC Portal<>
              <>
            )}
          <>
        <>

        {/* Navigation */}
        <>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <> setActivePage(item.id as ActivePage)}
                className={`w-full flex items-center gap-3 p-2.5 sm-3 rounded-lg text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-primary text-white shadow-soft scale-[1.02]' 
                    : 'text-foreground hover-muted/50 hover-[1.02]'
                }`}
                title={!sidebarOpen ? item.label }
              >
                <>
                {sidebarOpen && (
                  <>{item.label}<>
                )}
              <>
            );
          })}
        <>

        {/* Logout */}
        <>
          <>
            <>
            {sidebarOpen && <>Logout<>}
          <>
        <>
      <>

      {/* Main Content */}
      <>
        {/* Top Bar */}
        <>
          <>
            <>
              <> setSidebarOpen(!sidebarOpen)}
                className="text-muted-foreground hover-foreground flex-shrink-0 h-8 w-8 p-0 sm-9 sm-9"
              >
                <>
              <>
              <>
                <>
                  LSC Name Arts & Science College
                <>
                <>LSC No: {lscNumber}<>
              <>
            <>
            
            <>
              <>
                <>Create DEB ID<>
                <>DEB<>
              <>
              <>
                <>Create ABC ID<>
                <>ABC<>
              <>
            <>
          <>
        <>

        {/* Content */}
        <>
          <>
            {renderContent()}
          <>
        <>
      <>
    <>
  );
};


