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
              title: " Applications Now Open!",
              description: `Applications for ${activeSetting.admission_year} are now accepting submissions. You can guide students to apply.`,
              className: "bg-green-50 border-green-500",
            });
          } else {
            toast({
              title: "Applications Closed",
              description: `The application period for ${activeSetting.admission_year} has been closed by admin.`,
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
    <div className="w-full space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Professional Header */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Student Application Management
              </h1>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`${isOpen ? 'border-green-600 bg-green-50 text-green-700' : 'border-red-600 bg-red-50 text-red-700'} text-sm px-4 py-1.5 font-semibold`}
              >
                {isOpen ? (
                  <><CheckCircle2 className="w-4 h-4 mr-1.5" /> OPEN</>
                ) : (
                  <><XCircle className="w-4 h-4 mr-1.5" /> CLOSED</>
                )}
              </Badge>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
                title="Refresh status"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Application Details Card */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {settings.admission_year} Academic Year
                </CardTitle>
                <CardDescription className="text-sm mt-2 text-gray-600">
                  Application Code: <span className="font-semibold text-gray-900">{settings.admission_code}</span> • Type: <span className="font-semibold text-gray-900">{settings.admission_type}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Application Period Timeline */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Application Period</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Opening Date</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-green-600' : 'bg-gray-400'}`} />
                    <p className="text-base font-semibold text-gray-900">{formatDate(settings.opening_date)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Closing Date</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-green-600' : 'bg-red-600'}`} />
                    <p className="text-base font-semibold text-gray-900">{formatDate(settings.closing_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Action Section - Conditional on Status */}
            {isOpen ? (
              <div className="space-y-4">
                {/* Success Alert */}
                <Alert className="bg-green-50 border-green-600 border-l-4">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 font-medium text-sm">
                    Applications are now open for {settings.admission_year}. You can guide students to apply.
                  </AlertDescription>
                </Alert>

                {/* Action Card */}
                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Guide Students to Apply
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                          Open the student signup portal to help prospective students create accounts and submit their applications for the {settings.admission_year} academic year.
                        </p>

                        <Button
                          onClick={handleNavigateToStudentSignup}
                          size="lg"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Student Signup Portal
                        </Button>

                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Opens in a new tab
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Share URL Card */}
                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardHeader className="border-b border-gray-200 bg-gray-50">
                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      Your Referral Link
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600">
                      {(() => {
                        const { lscCode, lscName } = getLSCInfo();
                        return lscCode ? `For ${lscName} (${lscCode})` : 'Share this link with students';
                      })()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-900 mb-1">
                        Unique URL for Your Center
                      </p>
                      <p className="text-xs text-blue-700">
                        Students who register through this link will be automatically linked to your LSC center.
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                      <code className="text-blue-600 font-mono text-xs break-all">
                        {generateReferralURL()}
                      </code>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = generateReferralURL();
                          navigator.clipboard.writeText(url);
                          toast({
                            title: "Link Copied",
                            description: "Your referral link copied to clipboard",
                          });
                        }}
                        className="border-gray-300 hover:bg-gray-50 text-sm"
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = generateReferralURL();
                          const { lscName } = getLSCInfo();
                          const message = `Apply for admission at ${lscName}!\n\nRegister here: ${url}`;
                          navigator.clipboard.writeText(message);
                          toast({
                            title: "Message Copied",
                            description: "Share on WhatsApp or social media",
                          });
                        }}
                        className="border-gray-300 hover:bg-gray-50 text-sm"
                      >
                        Copy Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Closed Status Alert */}
                <Alert className="bg-red-50 border-red-600 border-l-4">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium text-sm">
                    Applications are closed. The application period has ended. Students cannot submit new applications at this time.
                  </AlertDescription>
                </Alert>

                {/* Closed State Card */}
                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex p-4 bg-gray-100 rounded-lg mb-4">
                      <XCircle className="w-12 h-12 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Application Period Ended
                    </h3>
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                      The admission application window for {settings.admission_year} ({settings.admission_code}) is currently closed.
                      Please check back when applications reopen.
                    </p>
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border border-blue-200 bg-blue-50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Waiting for Applications to Open?
                        </p>
                        <p className="text-xs text-blue-700">
                          This page automatically refreshes every 5 seconds. You'll see the status change instantly when admin opens applications.
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
