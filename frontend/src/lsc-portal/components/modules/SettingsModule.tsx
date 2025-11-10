import { useState, useEffect } from 'react';
import {
  Settings,
  Calendar,
  Users,
  Bell,
  Shield,
  Wrench,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import api, { settingsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface ApplicationSetting {
  id: number;
  application_type: string;
  is_open: boolean;
  opening_date: string | null;
  closing_date: string | null;
  max_applications: number;
  current_applications: number;
  description: string;
  instructions: string;
}

interface SystemSetting {
  id: number;
  setting_type: string;
  key: string;
  value: string;
  description: string;
  is_active: boolean;
}

export const SettingsModule = () => {
  const [applicationSettings, setApplicationSettings] = useState<ApplicationSetting[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('applications');

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    site_title: '',
    contact_email: '',
    support_phone: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    sms_enabled: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: '3600',
    max_login_attempts: '5'
  });

  const [maintenanceSettings, setMaintenanceSettings] = useState({
    maintenance_mode: false
  });

  useEffect(() => {
    // Temporarily disable API calls to prevent redirects
    // fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [appResponse, generalResponse, notificationResponse, securityResponse, maintenanceResponse] = await Promise.allSettled([
        settingsAPI.getApplicationSettings(),
        settingsAPI.getSystemSettingsByType('GENERAL'),
        settingsAPI.getSystemSettingsByType('NOTIFICATION'),
        settingsAPI.getSystemSettingsByType('SECURITY'),
        settingsAPI.getSystemSettingsByType('MAINTENANCE')
      ]);

      // Handle application settings
      if (appResponse.status === 'fulfilled') {
        setApplicationSettings(appResponse.value.data);
      } else {
        console.warn('Failed to load application settings:', appResponse.reason);
        // Set empty array if API fails
        setApplicationSettings([]);
      }

      // Handle system settings with fallbacks
      const processSettingsSafely = (response: any) => {
        if (response.status === 'fulfilled') {
          return response.value.data.reduce((acc: any, setting: SystemSetting) => {
            acc[setting.key] = setting.value === 'true' ? true : setting.value === 'false' ? false : setting.value;
            return acc;
          }, {} as any);
        } else {
          console.warn('Failed to load system settings:', response.reason);
          return {};
        }
      };

      setGeneralSettings(prev => ({ ...prev, ...processSettingsSafely(generalResponse) }));
      setNotificationSettings(prev => ({ ...prev, ...processSettingsSafely(notificationResponse) }));
      setSecuritySettings(prev => ({ ...prev, ...processSettingsSafely(securityResponse) }));
      setMaintenanceSettings(prev => ({ ...prev, ...processSettingsSafely(maintenanceResponse) }));

    } catch (error) {
      console.error('Error fetching settings:', error);
      // Don't show error toast here as it might cause logout
      // The API interceptor handles 401 errors
    } finally {
      setLoading(false);
    }
  };

  const toggleApplicationStatus = async (setting: ApplicationSetting) => {
    try {
      const response = await settingsAPI.toggleApplicationStatus(setting.id);
      setApplicationSettings(prev =>
        prev.map(s => s.id === setting.id ? response.data : s)
      );
      toast.success(`${setting.application_type} application ${response.data.is_open ? 'opened' : 'closed'}`);
    } catch (error: any) {
      console.error('Error toggling application status:', error);
      // Don't redirect on API errors, just show error message
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error('Failed to update application status. This feature may not be available yet.');
      }
    }
  };

  const updateApplicationDeadlines = async (setting: ApplicationSetting, openingDate: string, closingDate: string) => {
    try {
      const response = await settingsAPI.updateApplicationDeadlines(setting.id, {
        opening_date: openingDate,
        closing_date: closingDate
      });
      setApplicationSettings(prev =>
        prev.map(s => s.id === setting.id ? response.data : s)
      );
      toast.success('Application deadlines updated successfully');
    } catch (error: any) {
      console.error('Error updating deadlines:', error);
      // Don't redirect on API errors
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error('Failed to update deadlines. This feature may not be available yet.');
      }
    }
  };

  const saveSystemSettings = async (settingType: string, settings: Record<string, any>) => {
    try {
      setSaving(true);

      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        try {
          // First try to update existing setting
          const existingSettings = systemSettings.filter(s => s.setting_type === settingType && s.key === key);
          if (existingSettings.length > 0) {
            await settingsAPI.updateSystemSetting(existingSettings[0].id, {
              ...existingSettings[0],
              value: String(value)
            });
          } else {
            // Create new setting
            await settingsAPI.createSystemSetting({
              setting_type: settingType,
              key: key,
              value: String(value),
              description: `${settingType} setting for ${key}`,
              is_active: true
            });
          }
        } catch (error) {
          console.error(`Error updating ${key}:`, error);
          // Continue with other settings instead of failing completely
        }
      }

      toast.success('Settings saved successfully');
      await fetchSettings(); // Refresh data
    } catch (error: any) {
      console.error('Error saving settings:', error);
      // Don't redirect on API errors
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error('Failed to save settings. This feature may not be available yet.');
      }
    } finally {
      setSaving(false);
    }
  };

  const getApplicationStatusColor = (setting: ApplicationSetting) => {
    if (!setting.is_open) return 'bg-red-100 text-red-800 border-red-200';
    // Check if within deadline (if opening_date exists and current date is after opening, or no opening date set)
    const now = new Date();
    const openingDate = setting.opening_date ? new Date(setting.opening_date) : null;
    const closingDate = setting.closing_date ? new Date(setting.closing_date) : null;
    
    if (closingDate && now > closingDate) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (openingDate && now < openingDate) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getApplicationStatusText = (setting: ApplicationSetting) => {
    if (!setting.is_open) return 'Closed';
    // Check if within deadline
    const now = new Date();
    const openingDate = setting.opening_date ? new Date(setting.opening_date) : null;
    const closingDate = setting.closing_date ? new Date(setting.closing_date) : null;
    
    if (closingDate && now > closingDate) return 'Expired';
    if (openingDate && now < openingDate) return 'Scheduled';
    return 'Open';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  // Always show fallback UI since settings API is not implemented yet
  const hasData = false;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage application settings, system configuration, and preferences</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Settings Management</span>
            </CardTitle>
            <CardDescription>
              Advanced settings and configuration options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-12">
              <Settings className="w-20 h-20 mx-auto text-primary/50 mb-6" />
              <h3 className="text-xl font-semibold mb-3">Settings Coming Soon</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                The advanced settings management system is currently under development. 
                This feature will allow you to configure application settings, system preferences, 
                notifications, security policies, and maintenance options.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Globe className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm font-medium">General</span>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm font-medium">Notifications</span>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm font-medium">Security</span>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Wrench className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm font-medium">Maintenance</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                For now, you can manage your account through the "Change Password" section.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage application settings, system configuration, and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="applications" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Applications</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Maintenance</span>
          </TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Application Management</span>
              </CardTitle>
              <CardDescription>
                Control application openings, deadlines, and capacity limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {applicationSettings.map((setting) => (
                <Card key={setting.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{setting.application_type} Applications</h3>
                        <Badge className={getApplicationStatusColor(setting)}>
                          {getApplicationStatusText(setting)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={setting.is_open}
                          onCheckedChange={() => toggleApplicationStatus(setting)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {setting.is_open ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`opening-${setting.id}`}>Opening Date</Label>
                        <Input
                          id={`opening-${setting.id}`}
                          type="datetime-local"
                          defaultValue={setting.opening_date ? new Date(setting.opening_date).toISOString().slice(0, 16) : ''}
                          onBlur={(e) => {
                            const closingDate = (document.getElementById(`closing-${setting.id}`) as HTMLInputElement)?.value;
                            if (e.target.value && closingDate) {
                              updateApplicationDeadlines(setting, e.target.value, closingDate);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`closing-${setting.id}`}>Closing Date</Label>
                        <Input
                          id={`closing-${setting.id}`}
                          type="datetime-local"
                          defaultValue={setting.closing_date ? new Date(setting.closing_date).toISOString().slice(0, 16) : ''}
                          onBlur={(e) => {
                            const openingDate = (document.getElementById(`opening-${setting.id}`) as HTMLInputElement)?.value;
                            if (openingDate && e.target.value) {
                              updateApplicationDeadlines(setting, openingDate, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Max Applications</Label>
                        <Input
                          type="number"
                          defaultValue={setting.max_applications}
                          onBlur={(e) => {
                            // TODO: Implement max applications update
                          }}
                        />
                      </div>
                      <div>
                        <Label>Current Applications</Label>
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                          <span className="text-lg font-semibold">{setting.current_applications}</span>
                          <span className="text-sm text-muted-foreground">
                            / {setting.max_applications}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        defaultValue={setting.description}
                        placeholder="Application description..."
                        onBlur={(e) => {
                          // TODO: Implement description update
                        }}
                      />
                    </div>

                    <div>
                      <Label>Instructions</Label>
                      <Textarea
                        defaultValue={setting.instructions}
                        placeholder="Application instructions..."
                        onBlur={(e) => {
                          // TODO: Implement instructions update
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>General Settings</span>
              </CardTitle>
              <CardDescription>
                Basic system configuration and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-title">Site Title</Label>
                  <Input
                    id="site-title"
                    value={generalSettings.site_title}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, site_title: e.target.value }))}
                    placeholder="Enter site title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={generalSettings.contact_email}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <Input
                    id="support-phone"
                    value={generalSettings.support_phone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, support_phone: e.target.value }))}
                    placeholder="+91-1234567890"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSystemSettings('GENERAL', generalSettings)}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_enabled}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, email_enabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.sms_enabled}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, sms_enabled: checked }))
                    }
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  SMS notifications may incur additional charges. Make sure your SMS gateway is configured.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSystemSettings('NOTIFICATION', notificationSettings)}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (seconds)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: e.target.value }))}
                    placeholder="3600"
                  />
                  <p className="text-xs text-muted-foreground">
                    Time in seconds before automatic logout
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, max_login_attempts: e.target.value }))}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of failed attempts before account lockout
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSystemSettings('SECURITY', securitySettings)}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5" />
                <span>Maintenance Settings</span>
              </CardTitle>
              <CardDescription>
                System maintenance and downtime management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable maintenance mode to temporarily disable the portal
                  </p>
                </div>
                <Switch
                  checked={maintenanceSettings.maintenance_mode}
                  onCheckedChange={(checked) =>
                    setMaintenanceSettings(prev => ({ ...prev, maintenance_mode: checked }))
                  }
                />
              </div>

              {maintenanceSettings.maintenance_mode && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maintenance mode is currently enabled. The portal is not accessible to regular users.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSystemSettings('MAINTENANCE', maintenanceSettings)}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};