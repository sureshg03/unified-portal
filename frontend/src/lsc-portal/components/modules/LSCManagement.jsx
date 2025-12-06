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
  Clock, BarChart3, UserCheck, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';

export const LSCManagement = () => {
  const { toast } = useToast();
  const [lscCenters, setLscCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLsc, setEditingLsc] = useState(null);
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

  const handleInputChange = (field, value) => {
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
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.errors || 'Failed to create LSC center';
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleEdit = (lsc) => {
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
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.errors || 'Failed to update LSC center';
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDelete = async (lsc) => {
    if (!confirm(`Are you sure you want to delete LSC Center ${lsc.lsc_name}?`)) return;

    try {
      await api.delete(`/auth/lsc-centers/${lsc.lsc_number}/`);
      toast({ title: "Success", description: `LSC Center ${lsc.lsc_name} deleted successfully` });
      fetchLscCenters();
    } catch (error) {
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
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">Loading LSC Centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* FIXED FLOATING ACTION BAR - NEVER DISAPPEARS */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="h-14 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl font-medium rounded-full"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Center
        </Button>
      </div>

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">LSC Management</h1>
              <p className="text-blue-100 text-lg">Manage and monitor LSC centers across your network</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{filteredCenters.length}</div>
              <div className="text-blue-100">Total Centers</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className="text-blue-100">{currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
              <div className="text-blue-100">Live Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search LSC centers by code, name, email, or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 pr-12 h-12 text-base border-2 border-gray-200 focus:border-blue-400 rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-100 hover:bg-red-500 text-red-600 hover:text-white transition-all shadow-sm hover:shadow-md"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {searchTerm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {filteredCenters.length === 0 ? (
            <p className="text-blue-800">No LSC centers found matching "{searchTerm}"</p>
          ) : (
            <p className="text-blue-800">
              Found <span className="font-semibold">{filteredCenters.length}</span> center(s) matching "{searchTerm}"
            </p>
          )}
        </div>
      )}

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Total</p>
                <p className="text-3xl font-bold text-blue-900">{filteredCenters.length}</p>
                <p className="text-sm text-blue-600">{searchTerm ? `of ${lscCenters.length} total` : 'LSC Centers'}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">Active</p>
                <p className="text-3xl font-bold text-green-900">
                  {filteredCenters.filter(lsc => lsc.is_active).length}
                </p>
                <p className="text-sm text-green-600">Currently operational</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Staff</p>
                <p className="text-3xl font-bold text-purple-900">
                  {filteredCenters.filter(lsc => lsc.is_staff).length}
                </p>
                <p className="text-sm text-purple-600">With privileges</p>
              </div>
              <Key className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider">New</p>
                <p className="text-3xl font-bold text-orange-900">
                  {filteredCenters.filter(lsc => {
                    const joined = new Date(lsc.date_joined);
                    const now = new Date();
                    return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-sm text-orange-600">This month</p>
              </div>
              <Sparkles className="w-12 h-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                LSC Centers Directory
              </CardTitle>
              <CardDescription className="text-base">Complete overview of all registered LSC centers</CardDescription>
            </div>

            <div className="flex items-center gap-4">
              {/* Show entries dropdown - moved to top right */}
              {filteredCenters.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Show entries:</span>
                  <select
                    value={itemsPerPage}
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

              {filteredCenters.length > 0 && (
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="border-green-300 hover:bg-green-100 text-green-700 hover:text-green-800 shadow-md hover:shadow-lg transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCenters.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? 'No LSC Centers Found' : 'No LSC Centers Yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? `No centers match your search for "${searchTerm}".` : 'Get started by creating your first LSC center'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add First LSC Center
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">LSC Code</TableHead>
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Joined</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((lsc, index) => (
                    <TableRow key={lsc.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <span className="font-mono text-sm">{lsc.lsc_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{lsc.lsc_name}</div>
                        {lsc.is_staff && <Badge variant="secondary" className="mt-1 text-xs">Staff</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{lsc.email}</span>
                          </div>
                          {lsc.mobile && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{lsc.mobile}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lsc.is_active ? "default" : "secondary"} className={lsc.is_active ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                          {lsc.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">
                            {new Date(lsc.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(lsc.date_joined).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(lsc)}
                            className="border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-700 shadow-sm hover:shadow-md group/btn"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(lsc)}
                            className="border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700 shadow-sm hover:shadow-md group/btn"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* PAGINATION */}
              {filteredCenters.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                  {/* Info text */}
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                  </div>

                  {/* Page controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
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
                      className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-5 h-5 text-blue-600" />
              Create New LSC Center
            </DialogTitle>
            <DialogDescription>
              Add a new LSC center to the system
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lsc_number">LSC Code *</Label>
              <Input
                id="lsc_number"
                value={formData.lsc_number}
                onChange={(e) => handleInputChange('lsc_number', e.target.value)}
                className="h-10"
                placeholder="e.g., LSC001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lsc_name">LSC Name *</Label>
              <Input
                id="lsc_name"
                value={formData.lsc_name}
                onChange={(e) => handleInputChange('lsc_name', e.target.value)}
                className="h-10"
                placeholder="e.g., ABC Learning Center"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email ID *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-10"
                placeholder="center@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                className="h-10"
                placeholder="+91 9876543210"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="resize-none"
                placeholder="Full address of the LSC center"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="h-10"
                placeholder="Minimum 8 characters"
              />
              <p className="text-xs text-gray-500">Include uppercase, numbers, min 8 chars</p>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="is_staff"
                checked={formData.is_staff}
                onChange={(e) => handleInputChange('is_staff', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Label htmlFor="is_staff" className="text-sm font-medium">
                Staff Member
              </Label>
            </div>
            <p className="text-xs text-gray-500 col-span-1">
              Check this if this LSC center has administrative/staff privileges
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }} className="border border-gray-300 hover:bg-gray-50">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit LSC Center
            </DialogTitle>
            <DialogDescription>
              Update {editingLsc?.lsc_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_lsc_number">LSC Code *</Label>
              <Input
                id="edit_lsc_number"
                value={formData.lsc_number}
                onChange={(e) => handleInputChange('lsc_number', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_lsc_name">LSC Name *</Label>
              <Input
                id="edit_lsc_name"
                value={formData.lsc_name}
                onChange={(e) => handleInputChange('lsc_name', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">Email ID *</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_mobile">Mobile Number</Label>
              <Input
                id="edit_mobile"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit_address">Address</Label>
              <Textarea
                id="edit_address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_password">New Password (optional)</Label>
              <Input
                id="edit_password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-gray-500">Leave empty to keep current password</p>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="edit_is_staff"
                checked={formData.is_staff}
                onChange={(e) => handleInputChange('is_staff', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Label htmlFor="edit_is_staff" className="text-sm font-medium">
                Staff Member
              </Label>
            </div>
            <p className="text-xs text-gray-500 col-span-1">
              Check this if this LSC center has administrative/staff privileges
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingLsc(null); resetForm(); }} className="border border-gray-300 hover:bg-gray-50">
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Edit className="w-4 h-4 mr-2" />
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};