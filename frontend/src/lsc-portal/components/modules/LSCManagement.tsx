import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Edit, Trash2, Building2, Phone, Mail, MapPin, Key, Search, X, 
  FileSpreadsheet, RefreshCw, Calendar, Users, TrendingUp, Sparkles, 
  Clock, BarChart3, UserCheck, ChevronLeft, ChevronRight 
} from 'lucide-react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';

interface LSCUser {
  id: number;
  lsc_number: string;
  lsc_name: string;
  email: string;
  mobile: string;
  address: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export const LSCManagement = () => {
  const { toast } = useToast();
  const [lscCenters, setLscCenters] = useState<LSCUser[]>([]);
  const [filteredCenters, setFilteredCenters] = useState<LSCUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLsc, setEditingLsc] = useState<LSCUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    lsc_number: '',
    lsc_name: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    is_staff: false
  });

  useEffect(() => {
    fetchLscCenters();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCenters(lscCenters);
    } else {
      const filtered = lscCenters.filter(lsc =>
        lsc.lsc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lsc.lsc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lsc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lsc.mobile && lsc.mobile.includes(searchTerm))
      );
      setFilteredCenters(filtered);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [lscCenters, searchTerm]);

  const fetchLscCenters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/lsc-centers/');
      setLscCenters(response.data.results || []);
    } catch (error) {
      console.error('Error fetching LSC centers:', error);
      toast({
        title: "Error",
        description: "Failed to load LSC centers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      lsc_number: '',
      lsc_name: '',
      email: '',
      mobile: '',
      address: '',
      password: '',
      is_staff: false
    });
  };

  const handleCreate = async () => {
    const existingLsc = lscCenters.find(lsc => lsc.lsc_number.toLowerCase() === formData.lsc_number.toLowerCase());
    if (existingLsc) {
      toast({ title: "Duplicate LSC Code", description: `LSC Center with code '${formData.lsc_number}' already exists.`, variant: "destructive" });
      return;
    }

    const existingEmail = lscCenters.find(lsc => lsc.email.toLowerCase() === formData.email.toLowerCase());
    if (existingEmail) {
      toast({ title: "Duplicate Email", description: `LSC Center with email '${formData.email}' already exists.`, variant: "destructive" });
      return;
    }

    try {
      await api.post('/auth/lsc-centers/', formData);
      toast({ title: "Success", description: `LSC Center ${formData.lsc_name} created successfully` });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchLscCenters();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.errors || 'Failed to create LSC center';
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleEdit = (lsc: LSCUser) => {
    setEditingLsc(lsc);
    setFormData({
      lsc_number: lsc.lsc_number,
      lsc_name: lsc.lsc_name,
      email: lsc.email,
      mobile: lsc.mobile || '',
      address: lsc.address || '',
      password: '',
      is_staff: lsc.is_staff
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLsc) return;

    const existingLsc = lscCenters.find(lsc => lsc.lsc_number.toLowerCase() === formData.lsc_number.toLowerCase() && lsc.id !== editingLsc.id);
    if (existingLsc) {
      toast({ title: "Duplicate LSC Code", description: `LSC Center with code '${formData.lsc_number}' already exists.`, variant: "destructive" });
      return;
    }

    const existingEmail = lscCenters.find(lsc => lsc.email.toLowerCase() === formData.email.toLowerCase() && lsc.id !== editingLsc.id);
    if (existingEmail) {
      toast({ title: "Duplicate Email", description: `LSC Center with email '${formData.email}' already exists.`, variant: "destructive" });
      return;
    }

    try {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      await api.put(`/auth/lsc-centers/${editingLsc.lsc_number}/`, updateData);
      toast({ title: "Success", description: `LSC Center ${formData.lsc_name} updated successfully` });
      setIsEditDialogOpen(false);
      setEditingLsc(null);
      resetForm();
      fetchLscCenters();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.errors || 'Failed to update LSC center';
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDelete = async (lsc: LSCUser) => {
    if (!confirm(`Are you sure you want to delete LSC Center ${lsc.lsc_name}?`)) return;

    try {
      await api.delete(`/auth/lsc-centers/${lsc.lsc_number}/`);
      toast({ title: "Success", description: `LSC Center ${lsc.lsc_name} deleted successfully` });
      fetchLscCenters();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete LSC center", variant: "destructive" });
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredCenters.map((lsc, index) => ({
        'S.No': index + 1,
        'LSC Code': lsc.lsc_number,
        'LSC Name': lsc.lsc_name,
        'Email': lsc.email,
        'Mobile': lsc.mobile || 'N/A',
        'Address': lsc.address || 'N/A',
        'Status': lsc.is_active ? 'Active' : 'Inactive',
        'Staff Member': lsc.is_staff ? 'Yes' : 'No',
        'Date Joined': new Date(lsc.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws, 'LSC Centers');
      const filename = `LSC_Centers_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({ title: "Export Successful", description: `Downloaded ${filteredCenters.length} center(s)` });
    } catch (error) {
      toast({ title: "Export Failed", description: "Failed to export data", variant: "destructive" });
    }
  };

  // Pagination calculations
  const totalItems = filteredCenters.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredCenters.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-600 text-base font-medium">Loading LSC Centers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen relative">

      {/* FIXED FLOATING ACTION BAR - NEVER DISAPPEARS */}
      <div className="fixed top-20 right-6 z-50 flex items-center gap-3 p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200">
        <Button size="sm" variant="outline" onClick={fetchLscCenters} className="h-10 px-3" title="Refresh">
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
        </Button>

        {/* ADD CENTER - PURE BUTTON */}
        <Button
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
          className="h-10 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg font-medium"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Center
        </Button>

        <Button size="sm" onClick={exportToExcel} className="h-10 px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg" title="Export">
          <FileSpreadsheet className="w-4 h-4" />
        </Button>
      </div>

      {/* HEADER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5"></div>
        <Card className="relative border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                      LSC Management
                    </h1>
                    <p className="text-gray-600 text-base mt-1 font-medium">
                      Manage and monitor LSC centers across your network
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 min-h-[160px]">
                    <div className="relative p-8 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><BarChart3 className="w-8 h-8" /></div>
                        <Sparkles className="w-5 h-5 text-white/60 animate-pulse" />
                      </div>
                      <div className="text-4xl font-bold mb-1">{filteredCenters.length}</div>
                      <div className="text-blue-100 text-sm font-medium">Total Centers</div>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 min-h-[160px]">
                    <div className="relative p-8 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><Calendar className="w-8 h-8" /></div>
                        <Sparkles className="w-5 h-5 text-white/60 animate-pulse" />
                      </div>
                      <div className="text-2xl font-bold mb-1">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-purple-100 text-sm font-medium">{currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 min-h-[160px]">
                    <div className="relative p-8 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><Clock className="w-8 h-8" /></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-3xl font-bold mb-1 font-mono">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                      <div className="text-orange-100 text-sm font-medium">Live Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH BAR */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
        <CardContent className="pt-6 pb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
            <Input
              placeholder="Search LSC centers by code, name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-12 h-12 text-base border-2 border-gray-200 focus:border-blue-400 rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-100 hover:bg-red-500 text-red-600 hover:text-white transition-all shadow-sm hover:shadow-md"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchTerm && (
            <div className={`mt-4 flex items-center justify-between rounded-xl p-4 border-2 shadow-sm ${
              filteredCenters.length === 0 ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
            }`}>
              <p className="text-sm font-semibold flex items-center gap-2">
                {filteredCenters.length === 0 ? (
                  <>
                    <X className="w-5 h-5 text-red-600 animate-pulse" />
                    <span className="text-red-700">No LSC centers found matching "{searchTerm}"</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 text-green-600" />
                    <span className="text-green-700">
                      Found <span className="font-bold text-green-800">{filteredCenters.length}</span> center(s)
                    </span>
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl group-hover:bg-blue-400/20 transition-all"></div>
          <CardContent className="pt-6 pb-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Users className="w-6 h-6 text-white" /></div>
              <Badge className="bg-blue-100 text-blue-700 border-0">Total</Badge>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1">{filteredCenters.length}</div>
            <p className="text-sm text-gray-600 font-medium">{searchTerm ? `of ${lscCenters.length} total` : 'LSC Centers'}</p>
          </CardContent>
        </Card>

        <Card className="group relative border-0 shadow-lg bg-gradient-to-br from-green-50 to-white hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl group-hover:bg-green-400/20 transition-all"></div>
          <CardContent className="pt-6 pb-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6 text-white" /></div>
              <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-green-800 bg-clip-text text-transparent mb-1">
              {filteredCenters.filter(lsc => lsc.is_active).length}
            </div>
            <p className="text-sm text-gray-600 font-medium">Currently operational</p>
          </CardContent>
        </Card>

        <Card className="group relative border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl group-hover:bg-purple-400/20 transition-all"></div>
          <CardContent className="pt-6 pb-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Building2 className="w-6 h-6 text-white" /></div>
              <Badge className="bg-purple-100 text-purple-700 border-0">Staff</Badge>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-purple-800 bg-clip-text text-transparent mb-1">
              {filteredCenters.filter(lsc => lsc.is_staff).length}
            </div>
            <p className="text-sm text-gray-600 font-medium">With privileges</p>
          </CardContent>
        </Card>

        <Card className="group relative border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl group-hover:bg-orange-400/20 transition-all"></div>
          <CardContent className="pt-6 pb-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Calendar className="w-6 h-6 text-white" /></div>
              <Badge className="bg-orange-100 text-orange-700 border-0">New</Badge>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-br from-orange-600 to-orange-800 bg-clip-text text-transparent mb-1">
              {filteredCenters.filter(lsc => {
                const joined = new Date(lsc.date_joined);
                const now = new Date();
                return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-sm text-gray-600 font-medium">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
        <CardHeader className="flex flex-row items-center justify-between border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"><Building2 className="w-6 h-6 text-white" /></div>
              LSC Centers Directory
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-gray-600 font-medium">Complete overview of all registered LSC centers</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Show entries dropdown - moved to top right */}
            {filteredCenters.length > 0 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="entries-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Show entries:
                </Label>
                <select
                  id="entries-select"
                  value={itemsPerPage.toString()}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="w-20 h-9 border-2 border-gray-200 focus:border-blue-400 rounded-lg bg-white shadow-sm hover:shadow-md transition-all px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            )}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 text-sm font-semibold rounded-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Centers
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCenters.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-block mb-6 p-6 bg-blue-50 rounded-2xl"><Building2 className="w-16 h-16 text-blue-600 mx-auto" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{searchTerm ? 'No LSC Centers Found' : 'No LSC Centers Yet'}</h3>
              <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                {searchTerm ? `No centers match your search for "${searchTerm}".` : 'Get started by creating your first LSC center'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                  <Plus className="w-5 h-5 mr-2" /> Add First LSC Center
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b-2 border-gray-200">
                    <TableHead className="font-bold text-gray-700">LSC Code</TableHead>
                    <TableHead className="font-bold text-gray-700">Name</TableHead>
                    <TableHead className="font-bold text-gray-700">Contact</TableHead>
                    <TableHead className="font-bold text-gray-700">Status</TableHead>
                    <TableHead className="font-bold text-gray-700">Joined</TableHead>
                    <TableHead className="text-right font-bold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((lsc, index) => (
                    <TableRow key={lsc.id} className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg group-hover:scale-110 transition-all">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-blue-700 font-bold">{lsc.lsc_number}</span>
                        </div>
                      </TableCell>
                      <TableCell><div className="font-semibold text-gray-900">{lsc.lsc_name}</div></TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="p-1 bg-purple-100 rounded"><Mail className="w-3 h-3 text-purple-600" /></div>
                            <span className="font-medium">{lsc.email}</span>
                          </div>
                          {lsc.mobile && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="p-1 bg-green-100 rounded"><Phone className="w-3 h-3 text-green-600" /></div>
                              <span className="font-medium">{lsc.mobile}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={lsc.is_active ? "default" : "secondary"} className={`${lsc.is_active ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md" : "bg-gray-400 text-white"}`}>
                            {lsc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {lsc.is_staff && <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0 shadow-sm">Staff</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600 font-medium">
                            {new Date(lsc.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(lsc)} className="border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-500 text-blue-600 hover:text-white shadow-sm hover:shadow-md group/btn" title="Edit">
                            <Edit className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(lsc)} className="border-2 border-red-200 hover:border-red-400 hover:bg-red-500 text-red-600 hover:text-white shadow-sm hover:shadow-md group/btn" title="Delete">
                            <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* PAGINATION */}
          {filteredCenters.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-gray-200">
              {/* Pagination info and controls */}
              <div className="flex items-center gap-6">
                {/* Info text */}
                <div className="text-sm text-gray-600 font-medium">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                </div>

                {/* Page controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-500 text-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all px-3 py-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Prev</span>
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 border-2 ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700'
                          } shadow-sm hover:shadow-md transition-all`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-500 text-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all px-3 py-2"
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg"><Building2 className="w-6 h-6 text-white" /></div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Create New LSC Center</DialogTitle>
                <DialogDescription className="text-sm text-gray-600">Add a new LSC center to the system</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lsc_number" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Key className="w-4 h-4 text-blue-600" />LSC Code *</Label>
                <Input id="lsc_number" placeholder="e.g., LC2101" value={formData.lsc_number} onChange={(e) => handleInputChange('lsc_number', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lsc_name" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Building2 className="w-4 h-4 text-blue-600" />LSC Name *</Label>
                <Input id="lsc_name" placeholder="e.g., CDEO LSC Center" value={formData.lsc_name} onChange={(e) => handleInputChange('lsc_name', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Mail className="w-4 h-4 text-blue-600" />Email ID *</Label>
                <Input id="email" type="email" placeholder="lsc@example.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Phone className="w-4 h-4 text-blue-600" />Mobile Number</Label>
                <Input id="mobile" placeholder="+91 9876543210" value={formData.mobile} onChange={(e) => handleInputChange('mobile', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700"><MapPin className="w-4 h-4 text-blue-600" />Address</Label>
              <Textarea id="address" placeholder="Full address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} rows={3} className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Key className="w-4 h-4 text-blue-600" />Password *</Label>
              <Input id="password" type="password" placeholder="Min 8 characters" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className="h-10" />
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">Include uppercase, numbers, min 8 chars</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_staff"
                  checked={formData.is_staff}
                  onChange={(e) => handleInputChange('is_staff', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor="is_staff" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Staff Member
                </Label>
              </div>
              <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">Check this if this LSC center has administrative/staff privileges</p>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }} className="border border-gray-300 hover:bg-gray-50">Cancel</Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" />Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg"><Edit className="w-6 h-6 text-white" /></div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Edit LSC Center</DialogTitle>
                <DialogDescription className="text-sm text-gray-600">Update {editingLsc?.lsc_name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_lsc_number" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Key className="w-4 h-4 text-blue-600" />LSC Code *</Label>
                <Input id="edit_lsc_number" value={formData.lsc_number} onChange={(e) => handleInputChange('lsc_number', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_lsc_name" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Building2 className="w-4 h-4 text-blue-600" />LSC Name *</Label>
                <Input id="edit_lsc_name" value={formData.lsc_name} onChange={(e) => handleInputChange('lsc_name', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Mail className="w-4 h-4 text-blue-600" />Email ID *</Label>
                <Input id="edit_email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_mobile" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Phone className="w-4 h-4 text-blue-600" />Mobile Number</Label>
                <Input id="edit_mobile" value={formData.mobile} onChange={(e) => handleInputChange('mobile', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address" className="flex items-center gap-2 text-sm font-medium text-gray-700"><MapPin className="w-4 h-4 text-blue-600" />Address</Label>
              <Textarea id="edit_address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} rows={3} className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Key className="w-4 h-4 text-blue-600" />New Password (optional)</Label>
              <Input id="edit_password" type="password" placeholder="Leave empty to keep current" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className="h-10" />
              <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">Leave empty to keep current password</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_staff"
                  checked={formData.is_staff}
                  onChange={(e) => handleInputChange('is_staff', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor="edit_is_staff" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Staff Member
                </Label>
              </div>
              <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">Check this if this LSC center has administrative/staff privileges</p>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingLsc(null); resetForm(); }} className="border border-gray-300 hover:bg-gray-50">Cancel</Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white"><Edit className="w-4 h-4 mr-2" />Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};