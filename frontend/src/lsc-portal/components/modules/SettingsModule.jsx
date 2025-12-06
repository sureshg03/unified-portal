import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Database,
  Mail,
  Shield,
  Globe,
  Bell,
  Key,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export const SettingsModule = () => {
  const { toast } = useToast();
  const [applicationSettings, setApplicationSettings] = useState([]);
  const [systemSettings, setSystemSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mock settings data
  const mockApplicationSettings = [
    {
      id: 'app_name',
      label: 'Application Name',
      value: 'CDOE Education Portal',
      type: 'text',
      category: 'General'
    },
    {
      id: 'app_version',
      label: 'Version',
      value: '2.1.0',
      type: 'text',
      category: 'General',
      readonly: true
    },
    {
      id: 'maintenance_mode',
      label: 'Maintenance Mode',
      value: false,
      type: 'boolean',
      category: 'System'
    },
    {
      id: 'max_file_size',
      label: 'Max File Upload Size (MB)',
      value: '10',
      type: 'number',
      category: 'Uploads'
    },
    {
      id: 'email_notifications',
      label: 'Email Notifications',
      value: true,
      type: 'boolean',
      category: 'Notifications'
    }
  ];

  const mockSystemSettings = [
    {
      id: 'smtp_host',
      label: 'SMTP Host',
      value: 'smtp.gmail.com',
      type: 'text',
      category: 'Email'
    },
    {
      id: 'smtp_port',
      label: 'SMTP Port',
      value: '587',
      type: 'number',
      category: 'Email'
    },
    {
      id: 'db_host',
      label: 'Database Host',
      value: 'localhost',
      type: 'text',
      category: 'Database'
    },
    {
      id: 'db_name',
      label: 'Database Name',
      value: 'cd oe_portal',
      type: 'text',
      category: 'Database'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setApplicationSettings(mockApplicationSettings);
      setSystemSettings(mockSystemSettings);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSettingChange = (id, value, isSystem = false) => {
    if (isSystem) {
      setSystemSettings(prev =>
        prev.map(setting =>
          setting.id === id ? { ...setting, value } : setting
        )
      );
    } else {
      setApplicationSettings(prev =>
        prev.map(setting =>
          setting.id === id ? { ...setting, value } : setting
        )
      );
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);

    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Success",
        description: "Settings saved successfully!",
      });
    }, 2000);
  };

  const groupedAppSettings = applicationSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  const groupedSystemSettings = systemSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">Configure application and system settings</p>
        </div>
        <Settings className="h-8 w-8 text-blue-600" />
      </div>

      {/* Application Settings */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedAppSettings).map(([category, settings]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.id} className="text-sm font-medium">
                      {setting.label}
                      {setting.readonly && (
                        <Badge variant="secondary" className="ml-2 text-xs">Read Only</Badge>
                      )}
                    </Label>
                    {setting.type === 'boolean' ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={setting.id}
                          checked={setting.value}
                          onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
                          disabled={setting.readonly}
                        />
                        <span className="text-sm text-gray-600">
                          {setting.value ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : setting.type === 'select' ? (
                      <Select
                        value={setting.value}
                        onValueChange={(value) => handleSettingChange(setting.id, value)}
                        disabled={setting.readonly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : setting.type === 'textarea' ? (
                      <Textarea
                        id={setting.id}
                        value={setting.value}
                        onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                        disabled={setting.readonly}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={setting.id}
                        type={setting.type}
                        value={setting.value}
                        onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                        disabled={setting.readonly}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Settings
            <Badge variant="destructive" className="ml-2">Admin Only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedSystemSettings).map(([category, settings]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={`system-${setting.id}`} className="text-sm font-medium">
                      {setting.label}
                    </Label>
                    <Input
                      id={`system-${setting.id}`}
                      type={setting.type}
                      value={setting.value}
                      onChange={(e) => handleSettingChange(setting.id, e.target.value, true)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Settings Summary */}
      <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Settings className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{applicationSettings.length}</div>
              <p className="text-sm text-gray-600">Application Settings</p>
            </div>
            <div>
              <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{systemSettings.length}</div>
              <p className="text-sm text-gray-600">System Settings</p>
            </div>
            <div>
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {applicationSettings.filter(s => s.type === 'boolean' && s.value).length +
                 systemSettings.filter(s => s.category === 'Security').length}
              </div>
              <p className="text-sm text-gray-600">Security Settings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};