import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Filter, RefreshCw, DollarSign, Calendar, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/database';
import { format } from 'date-fns';

interface Expense {
  id: string;
  category: 'salaries' | 'maintenance' | 'food' | 'other';
  description: string;
  amount: number;
  date: string;
  created_by: string;
  receipt?: string;
}

// Default expense categories (fallback)
const defaultExpenseCategories = {
  salaries: { label: 'Staff Salaries', color: 'bg-blue-100 text-blue-800', icon: '👥' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-800', icon: '🔧' },
  food: { label: 'Food & Beverages', color: 'bg-green-100 text-green-800', icon: '🍽️' },
  other: { label: 'Other Expenses', color: 'bg-gray-100 text-gray-800', icon: '📋' }
};

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenseCategories, setExpenseCategories] = useState<any>(defaultExpenseCategories);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);
  const { state: sidebarState } = useSidebar();
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    salaries: 0,
    maintenance: 0,
    food: 0,
    other: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Load expense categories from master settings
  const loadExpenseCategories = async () => {
    try {
      const result = await db.masterExpenseCategoriesGetAll();
      if (result.success && result.data) {
        const activeCategories = result.data.filter(category => category.is_active);
        setMasterCategories(activeCategories);
        
        // Build dynamic expense categories object
        const dynamicCategories: any = {};
        const colors = [
          'bg-blue-100 text-blue-800',
          'bg-orange-100 text-orange-800', 
          'bg-green-100 text-green-800',
          'bg-purple-100 text-purple-800',
          'bg-pink-100 text-pink-800',
          'bg-indigo-100 text-indigo-800',
          'bg-gray-100 text-gray-800'
        ];
        const icons = ['💼', '🔧', '🍽️', '📋', '💡', '🎯', '📊'];
        
        activeCategories.forEach((category, index) => {
          const key = category.name.toLowerCase().replace(/\s+/g, '_');
          dynamicCategories[key] = {
            label: category.name,
            color: colors[index % colors.length],
            icon: icons[index % icons.length]
          };
        });
        
        // Merge with default categories if master categories exist
        if (Object.keys(dynamicCategories).length > 0) {
          setExpenseCategories(dynamicCategories);
        } else {
          setExpenseCategories(defaultExpenseCategories);
        }
      } else {
        console.error('Failed to load expense categories:', result.error);
        // Keep default categories as fallback
        setExpenseCategories(defaultExpenseCategories);
      }
    } catch (error) {
      console.error('Error loading expense categories:', error);
      // Keep default categories as fallback
      setExpenseCategories(defaultExpenseCategories);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    category: 'other' as const,
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    receipt: ''
  });

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const expensesData = await db.getAllExpenses();
      setExpenses(expensesData || []);
      
      // Calculate stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthExpenses = expensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      });
      
      setStats({
        total: expensesData.reduce((sum, expense) => sum + expense.amount, 0),
        thisMonth: thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        salaries: expensesData.filter(e => e.category === 'salaries').reduce((sum, expense) => sum + expense.amount, 0),
        maintenance: expensesData.filter(e => e.category === 'maintenance').reduce((sum, expense) => sum + expense.amount, 0),
        food: expensesData.filter(e => e.category === 'food').reduce((sum, expense) => sum + expense.amount, 0),
        other: expensesData.filter(e => e.category === 'other').reduce((sum, expense) => sum + expense.amount, 0)
      });
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
      toast({
        title: "Error",
        description: "Failed to load expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterExpenses = useCallback(() => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.created_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, categoryFilter]);

  useEffect(() => {
    loadExpenses();
    loadExpenseCategories();
  }, [loadExpenses]);

  useEffect(() => {
    filterExpenses();
  }, [filterExpenses]);

  const resetForm = () => {
    setFormData({
      category: 'other',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      receipt: ''
    });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const expenseData = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        created_by: user?.name || 'Unknown',
        receipt: formData.receipt || undefined
      };

      const success = await db.createExpense(expenseData);
      if (success) {
        await loadExpenses();
        setIsAddDialogOpen(false);
        resetForm();
        toast({
          title: "Expense Added",
          description: "Expense has been added successfully.",
        });
      } else {
        throw new Error('Failed to create expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    try {
      const expenseData = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        receipt: formData.receipt || undefined
      };

      const success = await db.updateExpense(selectedExpense.id, expenseData);
      if (success) {
        await loadExpenses();
        setIsEditDialogOpen(false);
        setSelectedExpense(null);
        resetForm();
        toast({
          title: "Expense Updated",
          description: "Expense has been updated successfully.",
        });
      } else {
        throw new Error('Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const success = await db.deleteExpense(expenseToDelete.id);
      if (success) {
        await loadExpenses();
        setIsDeleteDialogOpen(false);
        setExpenseToDelete(null);
        toast({
          title: "Expense Deleted",
          description: "Expense has been removed.",
          variant: "destructive",
        });
      } else {
        throw new Error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount).replace('₹', '₹');
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      receipt: expense.receipt || ''
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Expenses</h1>
            <p className="text-muted-foreground">Track and manage gym expenses across different categories</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(expenseCategories).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.icon} {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter expense description..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="receipt">Receipt/Reference</Label>
                <Input
                  id="receipt"
                  value={formData.receipt}
                  onChange={(e) => setFormData(prev => ({ ...prev, receipt: e.target.value }))}
                  placeholder="Receipt number or reference..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Expense</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 space-y-6">
        {/* Expense Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Salaries</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.salaries)}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.maintenance)}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">🔧</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Food</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.food)}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">🍽️</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Other</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.other)}</p>
                </div>
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">📋</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Expense List</CardTitle>
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(expenseCategories).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      {category.icon} {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={loadExpenses}
                disabled={loading}
                title="Refresh Expenses List"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading expenses...
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || categoryFilter !== 'all' ? 'No expenses found matching your criteria.' : 'No expenses yet. Add your first expense!'}
                </div>
              ) : (
                filteredExpenses.map((expense) => (
                  <Card key={expense.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={expenseCategories[expense.category]?.color || 'bg-gray-100 text-gray-800'}>
                                {expenseCategories[expense.category]?.icon || '📋'} {expenseCategories[expense.category]?.label || expense.category}
                              </Badge>
                              <span className="text-lg font-semibold text-green-600">
                                {formatCurrency(expense.amount)}
                              </span>
                            </div>
                            
                            <h3 className="font-medium text-foreground mb-1">{expense.description}</h3>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>By: {expense.created_by}</span>
                              </div>
                              {expense.receipt && (
                                <div className="flex items-center space-x-1">
                                  <Receipt className="h-3 w-3" />
                                  <span>{expense.receipt}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExpenseToDelete(expense);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditExpense} className="space-y-4">
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(expenseCategories).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.icon} {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter expense description..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-amount">Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-receipt">Receipt/Reference</Label>
                <Input
                  id="edit-receipt"
                  value={formData.receipt}
                  onChange={(e) => setFormData(prev => ({ ...prev, receipt: e.target.value }))}
                  placeholder="Receipt number or reference..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Expense</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium">{expenseToDelete?.description}</p>
                <p className="text-sm text-muted-foreground">
                  {expenseToDelete && formatCurrency(expenseToDelete.amount)} • {expenseToDelete && format(new Date(expenseToDelete.date), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setExpenseToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteExpense}
                >
                  Delete Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};