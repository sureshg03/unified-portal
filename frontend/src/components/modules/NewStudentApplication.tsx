import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Calendar, AlertCircle, ExternalLink, CheckCircle2, XCircle, Sparkles, Clock, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ApplicationSettings {
  id: number;
  admission_code: string;
  admission_type: string;
  admission_year: string;
  admission_key: string;
  status: 'OPEN' | 'CLOSED' | 'SCHEDULED' | 'EXPIRED';
  is_active: boolean;
  opening_date: string;
  closing_date: string;
  is_open: boolean;
  is_close: boolean;
  max_applications: number;
  current_applications: number;
  created_at: string;
  updated_at: string;
}

export const NewStudentApplication = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  console.log('NewStudentApplication component mounted');
  console.log('Loading:', loading, 'Settings:', settings, 'Error:', error);

  useEffect(() => {
    console.log('useEffect triggered - fetching settings');
    fetchApplicationSettings();
  }, []);

  // Auto-refresh every 5 seconds for real-time status updates
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      console.log('Auto-refreshing application status...');
      fetchApplicationSettings(true); // Pass true for background refresh (no loading state)
    }, 5000); // 5 seconds - faster real-time updates

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled]);

  // Listen for visibility changes - refresh when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible - refreshing data');
        fetchApplicationSettings(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Listen for window focus - refresh when user focuses window
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused - refreshing data');
      fetchApplicationSettings(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchApplicationSettings = async (isBackgroundRefresh = false) => {
    try {
      // Only show loading state on initial load, not on background refreshes
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError(null);
      
      console.log('Fetching application settings...');
      
      // Fetch active application settings
      const response = await api.get('/application-settings/');
      
      console.log('Application settings response:', response.data);
      
      if (response.data && response.data.length > 0) {
        // Get the first active setting or the most recent one
        const activeSetting = response.data.find((s: ApplicationSettings) => s.is_active && (s.is_open || s.status === 'OPEN')) || response.data[0];
        console.log('Selected setting:', activeSetting);
        
        // Detect status change and show notification
        const currentStatus = activeSetting.is_open || activeSetting.status === 'OPEN' ? 'OPEN' : 'CLOSED';
        if (isBackgroundRefresh && previousStatus !== null && previousStatus !== currentStatus) {
          // Status changed! Show notification
          if (currentStatus === 'OPEN') {
            toast({
              title: "🎉 Applications Now Open!",
              description: `Applications for ${activeSetting.admission_year} are now accepting submissions. You can guide students to apply.`,
              variant: "default",
              className: "bg-green-50 border-green-500",
            });
          } else {
            toast({
              title: "Applications Closed",
              description: `The application period for ${activeSetting.admission_year} has been closed by admin.`,
              variant: "default",
              className: "bg-red-50 border-red-500",
            });
          }
        }
        
        setPreviousStatus(currentStatus);
        setSettings(activeSetting);
        setLastRefresh(new Date());
      } else {
        console.log('No application settings found');
        setError('No application settings found. Please contact administrator.');
      }
    } catch (err: any) {
      console.error('Error fetching application settings:', err);
      setError(err.response?.data?.message || 'Failed to fetch application settings');
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const handleManualRefresh = () => {
    toast({
      title: "Refreshing...",
      description: "Checking for application status updates",
    });
    fetchApplicationSettings();
  };

  // Get LSC info from localStorage
  const getLSCInfo = () => {
    const userInfoStr = localStorage.getItem('user_info');
    let lscCode = '';
    let lscName = '';
    
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        lscCode = userInfo.lsc_code || userInfo.lsc_number || userInfo.lscNumber || userInfo.lscCode || '';
        lscName = userInfo.lsc_name || userInfo.lscName || userInfo.center_name || userInfo.centerName || userInfo.admin_name || userInfo.adminName || '';
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
    
    return { lscCode, lscName };
  };

  // Generate unique referral URL with LSC code and name
  const generateReferralURL = () => {
    const { lscCode, lscName } = getLSCInfo();
    if (!lscCode) return `${window.location.origin}/student/signup`;
    
    // Create URL with query parameters
    const params = new URLSearchParams();
    params.set('ref', lscCode);
    if (lscName) params.set('center', lscName);
    
    return `${window.location.origin}/student/signup?${params.toString()}`;
  };

  const handleNavigateToStudentSignup = () => {
    const { lscCode, lscName } = getLSCInfo();
    
    console.log('LSC Info:', { lscCode, lscName });
    
    // Store in sessionStorage so signup page can access it
    sessionStorage.setItem('referral_lsc_code', lscCode);
    sessionStorage.setItem('referral_lsc_name', lscName);
    
    // Open student signup with referral URL
    const referralURL = generateReferralURL();
    console.log('Opening referral URL:', referralURL);
    window.open(referralURL, '_blank');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>No Application Settings</CardTitle>
            <CardDescription>Application settings have not been configured yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact the system administrator to configure application settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOpen = settings.is_open || settings.status === 'OPEN';

  return (
    <div className="w-full space-y-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Modern Header with Refresh */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isOpen ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} shadow-lg`}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Student Applications
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline"
                className={`${isOpen ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'} text-lg px-4 py-2 font-semibold shadow-md`}
              >
                {isOpen ? (
                  <><CheckCircle2 className="w-5 h-5 mr-2" /> OPEN</>
                ) : (
                  <><XCircle className="w-5 h-5 mr-2" /> CLOSED</>
                )}
              </Badge>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="icon"
                className="rounded-full shadow-md hover:shadow-lg transition-all"
                title="Refresh status"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <Card className={`border shadow-lg overflow-hidden ${isOpen ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 border-gray-300'}`}>
          <div className={`h-2 ${isOpen ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500' : 'bg-gradient-to-r from-gray-400 via-slate-400 to-gray-500'}`} />
          
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Calendar className={`w-6 h-6 ${isOpen ? 'text-green-600' : 'text-gray-600'}`} />
                  {settings.admission_year} Academic Year
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Application Code: <span className="font-semibold">{settings.admission_code}</span> • Type: <span className="font-semibold">{settings.admission_type}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Application Period Timeline */}
            <div className={`${isOpen ? 'bg-white/60' : 'bg-white/40'} backdrop-blur-sm rounded-xl p-6 border ${isOpen ? 'border-green-200' : 'border-gray-200'} shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Opening Date</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <p className="text-lg font-bold text-gray-900">{formatDate(settings.opening_date)}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 px-4">
                  <div className={`h-1 w-24 rounded-full ${isOpen ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Closing Date</p>
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-lg font-bold text-gray-900">{formatDate(settings.closing_date)}</p>
                    <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Action Section - Conditional on Status */}
            {isOpen ? (
              <div className="space-y-6">
                {/* Success Alert with Animation */}
                <Alert className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white shadow-xl">
                  <CheckCircle2 className="h-5 w-5 text-white animate-pulse" />
                  <AlertDescription className="text-white font-medium text-base">
                    🎉 <strong>Great News!</strong> Applications are now OPEN for {settings.admission_year}. Help students start their journey today!
                  </AlertDescription>
                </Alert>

                {/* Professional Call-to-Action Card */}
                <Card className="border-2 border-purple-200 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                          <UserPlus className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          Help Students Apply Now
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                          Click the button below to open the student signup portal. Guide prospective students through the application process and help them secure their admission for the {settings.admission_year} academic year.
                        </p>
                        
                        <Button 
                          onClick={handleNavigateToStudentSignup}
                          size="lg"
                          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6 rounded-xl"
                        >
                          <ExternalLink className="w-5 h-5 mr-3" />
                          Open Student Signup Portal
                         
                        </Button>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Opens in a new tab • Students can create account and apply instantly
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Share URL Card with Unique Referral Link */}
                <Card className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-indigo-600" />
                      Your Unique Referral Link
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {(() => {
                        const { lscCode, lscName } = getLSCInfo();
                        return lscCode ? `Personalized for ${lscName} (${lscCode})` : 'Share this link with students';
                      })()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg p-3 border-2 border-purple-300 dark:border-purple-700">
                      <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        ✨ Unique URL for Your Center
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        Students who register through this link will be automatically linked to your LSC center.
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-indigo-300 shadow-inner">
                      <code className="text-indigo-600 dark:text-indigo-400 font-mono text-sm break-all">
                        {generateReferralURL()}
                      </code>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const url = generateReferralURL();
                          navigator.clipboard.writeText(url);
                          toast({
                            title: "✅ Link Copied!",
                            description: "Your unique referral link copied to clipboard",
                          });
                        }}
                        className="border-indigo-300 hover:bg-indigo-100"
                      >
                        📋 Copy Link
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const url = generateReferralURL();
                          const { lscName } = getLSCInfo();
                          const message = `🎓 Apply for admission at ${lscName}!\n\nRegister here: ${url}`;
                          navigator.clipboard.writeText(message);
                          toast({
                            title: "✅ Message Copied!",
                            description: "Share this message on WhatsApp, SMS, or social media",
                          });
                        }}
                        className="border-green-300 hover:bg-green-100"
                      >
                        💬 Copy Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Closed Status Alert */}
                <Alert variant="destructive" className="bg-gradient-to-r from-red-500 to-rose-600 border-0 text-white shadow-xl">
                  <XCircle className="h-5 w-5 text-white" />
                  <AlertDescription className="text-white font-medium text-base">
                    <strong>Applications Closed.</strong> The application period has ended. Students cannot submit new applications at this time.
                  </AlertDescription>
                </Alert>

                {/* Closed State Card */}
                <Card className="border border-gray-300 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="inline-flex p-6 bg-gray-300 dark:bg-gray-700 rounded-full mb-6">
                      <XCircle className="w-16 h-16 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Application Period Ended
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                      The admission application window for {settings.admission_year} ({settings.admission_code}) is currently closed. 
                      Please check back when applications reopen.
                    </p>
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950/20 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Waiting for Applications to Open?
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          This page automatically refreshes every 5 seconds. You'll see the status change instantly when admin opens applications!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
};
