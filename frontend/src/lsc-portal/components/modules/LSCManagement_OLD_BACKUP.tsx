import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building2, Phone, Mail, MapPin, Key, Search, X, Download, Upload, Filter, RefreshCw, Eye, Settings, Users, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import api from '@/lib/api';

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
  const [formData, setFormData] = useState({
    lsc_number: '',
    lsc_name: '',
    email: '',
    mobile: '',
    address: '',
    password: ''
  });

  useEffect(() => {
    fetchLscCenters();
  }, []);

  useEffect(() => {
    // Filter centers based on search term
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
  }, [lscCenters, searchTerm]);

  const fetchLscCenters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/lsc-centers/');
      setLscCenters(response.data.results || []);
    } catch (error) {
      console.error('Error fetching LSC centers:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load LSC centers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      lsc_number: '',
      lsc_name: '',
      email: '',
      mobile: '',
      address: '',
      password: ''
    });
  };

  const handleCreate = async () => {
    // Check for duplicate LSC code
    const existingLsc = lscCenters.find(lsc => lsc.lsc_number.toLowerCase() === formData.lsc_number.toLowerCase());
    if (existingLsc) {
      toast({
        title: "❌ Duplicate LSC Code",
        description: `LSC Center with code '${formData.lsc_number}' already exists.`,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate email
    const existingEmail = lscCenters.find(lsc => lsc.email.toLowerCase() === formData.email.toLowerCase());
    if (existingEmail) {
      toast({
        title: "❌ Duplicate Email",
        description: `LSC Center with email '${formData.email}' already exists.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await api.post('/auth/lsc-centers/', formData);
      toast({
        title: "✅ Success",
        description: `LSC Center ${formData.lsc_name} created successfully`,
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchLscCenters();
    } catch (error: any) {
      console.error('Error creating LSC center:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.errors || 'Failed to create LSC center';
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
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
      password: '' // Don't populate password for security
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLsc) return;

    // Check for duplicate LSC code (excluding current LSC)
    const existingLsc = lscCenters.find(lsc =>
      lsc.lsc_number.toLowerCase() === formData.lsc_number.toLowerCase() && lsc.id !== editingLsc.id
    );
    if (existingLsc) {
      toast({
        title: "❌ Duplicate LSC Code",
        description: `LSC Center with code '${formData.lsc_number}' already exists.`,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate email (excluding current LSC)
    const existingEmail = lscCenters.find(lsc =>
      lsc.email.toLowerCase() === formData.email.toLowerCase() && lsc.id !== editingLsc.id
    );
    if (existingEmail) {
      toast({
        title: "❌ Duplicate Email",
        description: `LSC Center with email '${formData.email}' already exists.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't send empty password
      }

      await api.put(`/auth/lsc-centers/${editingLsc.lsc_number}/`, updateData);
      toast({
        title: "✅ Success",
        description: `LSC Center ${formData.lsc_name} updated successfully`,
      });
      setIsEditDialogOpen(false);
      setEditingLsc(null);
      resetForm();
      fetchLscCenters();
    } catch (error: any) {
      console.error('Error updating LSC center:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.errors || 'Failed to update LSC center';
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (lsc: LSCUser) => {
    if (!confirm(`Are you sure you want to delete LSC Center ${lsc.lsc_name}?`)) {
      return;
    }

    try {
      await api.delete(`/auth/lsc-centers/${lsc.lsc_number}/`);
      toast({
        title: "✅ Success",
        description: `LSC Center ${lsc.lsc_name} deleted successfully`,
      });
      fetchLscCenters();
    } catch (error: any) {
      console.error('Error deleting LSC center:', error);
      toast({
        title: "❌ Error",
        description: "Failed to delete LSC center",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-200/30 to-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Enhanced Header with Actions */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
        <Card className="relative border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      LSC Management
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      Create and manage LSC centers across the network
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 ml-14">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{lscCenters.length} Total Centers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>{lscCenters.filter(lsc => lsc.is_active).length} Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Updated {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-md"
                  onClick={fetchLscCenters}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  className="border-purple-200 hover:bg-purple-50 hover:border-purple-300 shadow-md"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button 
                  variant="outline" 
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-md"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-700 hover:via-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New LSC Center
                    </Button>
                  </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                      Create New LSC Center
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Add a new LSC center to the system with all required details.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                {/* LSC Code and Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lsc_number" className="flex items-center gap-2 font-semibold">
                      <Key className="w-4 h-4 text-cyan-600" />
                      LSC Code *
                    </Label>
                    <div className="relative">
                      <Input
                        id="lsc_number"
                        placeholder="e.g., LC2101"
                        value={formData.lsc_number}
                        onChange={(e) => handleInputChange('lsc_number', e.target.value)}
                        className="border-2 focus:border-cyan-400 focus:ring-cyan-200 pl-4"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lsc_name" className="flex items-center gap-2 font-semibold">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      LSC Name *
                    </Label>
                    <Input
                      id="lsc_name"
                      placeholder="e.g., CDEO LSC Center"
                      value={formData.lsc_name}
                      onChange={(e) => handleInputChange('lsc_name', e.target.value)}
                      className="border-2 focus:border-blue-400 focus:ring-blue-200"
                    />
                  </div>
                </div>

                {/* Email and Mobile Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 font-semibold">
                      <Mail className="w-4 h-4 text-purple-600" />
                      Email ID *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="lsc@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="border-2 focus:border-purple-400 focus:ring-purple-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="flex items-center gap-2 font-semibold">
                      <Phone className="w-4 h-4 text-green-600" />
                      Mobile Number
                    </Label>
                    <Input
                      id="mobile"
                      placeholder="+91 9876543210"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      className="border-2 focus:border-green-400 focus:ring-green-200"
                    />
                  </div>
                </div>

                {/* Address Field */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2 font-semibold">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Full address of the LSC center"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="border-2 focus:border-orange-400 focus:ring-orange-200 resize-none"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 font-semibold">
                    <Key className="w-4 h-4 text-red-600" />
                    LSC Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter secure password (min 8 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="border-2 focus:border-red-400 focus:ring-red-200"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Password must include uppercase, numbers, and be at least 8 characters
                  </p>
                </div>
              </div>
              <DialogFooter className="border-t pt-4 bg-gray-50/50">
                <Button 
                  variant="outline" 
                  onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}
                  className="border-2 hover:bg-gray-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-700 hover:via-blue-700 hover:to-purple-700 shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create LSC Center
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
                
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  MORE LSC CENTERS
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Search Bar */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-white via-cyan-50/30 to-blue-50/30">
        <CardContent className="pt-6 pb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 w-5 h-5 z-10" />
            <Input
              placeholder="🔍 Search LSC centers by code, name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg border-2 border-gray-200 focus:border-cyan-400 rounded-lg shadow-md hover:shadow-lg transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-all z-10"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-3 border border-cyan-200">
              <p className="text-sm font-medium flex items-center gap-2">
                {filteredCenters.length === 0 ? (
                  <>
                    <X className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">No LSC centers found matching "{searchTerm}"</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">
                      Found {filteredCenters.length} LSC center{filteredCenters.length === 1 ? '' : 's'} matching "{searchTerm}"
                    </span>
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-cyan-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {searchTerm ? 'Matching Centers' : 'Total LSC Centers'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-700">{filteredCenters.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm ? `of ${lscCenters.length} total` : 'Active centers'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Centers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {filteredCenters.filter(lsc => lsc.is_active).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {filteredCenters.filter(lsc => lsc.is_staff).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">With staff privileges</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {filteredCenters.filter(lsc => {
                const joinedDate = new Date(lsc.date_joined);
                const now = new Date();
                return joinedDate.getMonth() === now.getMonth() && joinedDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Recently added</p>
          </CardContent>
        </Card>
      </div>

      {/* LSC Centers Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">LSC Centers</CardTitle>
            <CardDescription>
              Manage all LSC centers in the system
            </CardDescription>
          </div>
          {filteredCenters.length > 0 && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              MORE LSC CENTERS
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {filteredCenters.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No LSC Centers Found' : 'No LSC Centers'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? `No centers match your search for "${searchTerm}". Try a different search term.`
                  : 'Get started by creating your first LSC center'
                }
              </p>
              {!searchTerm && (
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-cyan-600 to-blue-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First LSC Center
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="border-green-200 hover:bg-green-50 hover:border-green-300">
                    <Plus className="w-4 h-4 mr-2" />
                    MORE LSC CENTERS
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LSC Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCenters.map((lsc) => (
                    <TableRow key={lsc.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-cyan-600" />
                          {lsc.lsc_number}
                        </div>
                      </TableCell>
                      <TableCell>{lsc.lsc_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {lsc.email}
                          </div>
                          {lsc.mobile && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {lsc.mobile}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant={lsc.is_active ? "default" : "secondary"}>
                            {lsc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {lsc.is_staff && (
                            <Badge variant="outline">Staff</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(lsc.date_joined).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(lsc)}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(lsc)}
                            className="hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit LSC Center
            </DialogTitle>
            <DialogDescription>
              Update the details of {editingLsc?.lsc_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_lsc_number">LSC Code *</Label>
                <Input
                  id="edit_lsc_number"
                  value={formData.lsc_number}
                  onChange={(e) => handleInputChange('lsc_number', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_lsc_name">LSC Name *</Label>
                <Input
                  id="edit_lsc_name"
                  value={formData.lsc_name}
                  onChange={(e) => handleInputChange('lsc_name', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email ID *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_mobile">Mobile Number</Label>
                <Input
                  id="edit_mobile"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">Address</Label>
              <Textarea
                id="edit_address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password">New Password (leave empty to keep current)</Label>
              <Input
                id="edit_password"
                type="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingLsc(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-gradient-to-r from-blue-600 to-purple-600">
              Update LSC Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for Adding More Centers */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="lg"
          className="rounded-full w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 border-4 border-white"
          title="Add More LSC Centers"
        >
          <Plus className="w-8 h-8" />
        </Button>
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          MORE LSC CENTERS
        </div>
      </div>
    </div>
  );
};