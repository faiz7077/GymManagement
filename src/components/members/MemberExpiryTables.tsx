import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  MessageCircle, 
  User, 
  Phone,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { db, LegacyMember as Member } from '@/utils/database';

interface MemberExpiryTablesProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'expiring' | 'expired';
}

export const MemberExpiryTables: React.FC<MemberExpiryTablesProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'expiring' 
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'expiring' | 'expired'>(initialTab);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dayRangeFilter, setDayRangeFilter] = useState<string>('30');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, planFilter, statusFilter, dayRangeFilter]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const allMembers = await db.getAllMembers();
      setMembers(allMembers || []);
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!members.length) return [];

    const today = new Date();
    const dayRange = parseInt(dayRangeFilter);

    let filtered = members.filter(member => {
      if (!member.subscriptionEndDate) return false;

      const endDate = new Date(member.subscriptionEndDate);
      const daysUntilExpiry = differenceInDays(endDate, today);

      if (activeTab === 'expiring') {
        return daysUntilExpiry >= 0 && daysUntilExpiry <= dayRange;
      } else {
        return daysUntilExpiry < 0 && Math.abs(daysUntilExpiry) <= dayRange;
      }
    });

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(search) ||
        member.mobileNo.includes(search) ||
        (member.customMemberId && member.customMemberId.toLowerCase().includes(search))
      );
    }

    // Apply plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(member => member.planType === planFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    // Sort by expiry date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.subscriptionEndDate!);
      const dateB = new Date(b.subscriptionEndDate!);
      return activeTab === 'expiring' ? 
        dateA.getTime() - dateB.getTime() : 
        dateB.getTime() - dateA.getTime();
    });
  }, [members, activeTab, searchTerm, planFilter, statusFilter, dayRangeFilter]);

  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMembers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const handleWhatsAppClick = (member: Member) => {
    if (!member.mobileNo) return;

    let formattedNumber = member.mobileNo.replace(/\D/g, '');
    if (formattedNumber.length === 10) {
      formattedNumber = '91' + formattedNumber;
    }

    const today = new Date();
    const endDate = new Date(member.subscriptionEndDate!);
    const daysUntilExpiry = differenceInDays(endDate, today);

    let message;
    if (activeTab === 'expiring') {
      if (daysUntilExpiry === 0) {
        message = `Hello ${member.name}, your gym membership expires today (${format(endDate, 'PPP')}). Please renew your membership to continue enjoying our services. Thank you!`;
      } else {
        message = `Hello ${member.name}, your gym membership will expire in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} on ${format(endDate, 'PPP')}. Please renew your membership soon. Thank you!`;
      }
    } else {
      const daysExpired = Math.abs(daysUntilExpiry);
      message = `Hello ${member.name}, your gym membership expired ${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago on ${format(endDate, 'PPP')}. Please renew your membership to continue using our facilities. Thank you!`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRenewalClick = (member: Member) => {
    // Close the current dialog
    onClose();
    
    // Navigate to receipts page with prefilled member data
    navigate('/receipts', {
      state: {
        selectedMember: {
          id: member.id,
          name: member.name,
          mobile: member.mobileNo,
          email: member.email,
          customMemberId: member.customMemberId,
          planType: member.planType,
          subscriptionEndDate: member.subscriptionEndDate
        },
        openForm: true
      }
    });
  };

  const getDaysDisplay = (member: Member) => {
    const today = new Date();
    const endDate = new Date(member.subscriptionEndDate!);
    const daysUntilExpiry = differenceInDays(endDate, today);

    if (activeTab === 'expiring') {
      if (daysUntilExpiry === 0) {
        return <Badge variant="destructive" className="text-xs">Expires Today</Badge>;
      } else {
        return <Badge variant="secondary" className="text-xs">{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</Badge>;
      }
    } else {
      const daysExpired = Math.abs(daysUntilExpiry);
      return <Badge variant="destructive" className="text-xs">{daysExpired} day{daysExpired !== 1 ? 's' : ''} ago</Badge>;
    }
  };

  const uniquePlans = [...new Set(members.map(m => m.planType).filter(Boolean))];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Member Subscription Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 flex-shrink-0">
            <Button
              variant={activeTab === 'expiring' ? 'default' : 'outline'}
              onClick={() => setActiveTab('expiring')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Expiring Soon ({members.filter(m => {
                if (!m.subscriptionEndDate) return false;
                const days = differenceInDays(new Date(m.subscriptionEndDate), new Date());
                return days >= 0 && days <= parseInt(dayRangeFilter);
              }).length})
            </Button>
            <Button
              variant={activeTab === 'expired' ? 'default' : 'outline'}
              onClick={() => setActiveTab('expired')}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Expired ({members.filter(m => {
                if (!m.subscriptionEndDate) return false;
                const days = differenceInDays(new Date(m.subscriptionEndDate), new Date());
                return days < 0 && Math.abs(days) <= parseInt(dayRangeFilter);
              }).length})
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={dayRangeFilter} onValueChange={setDayRangeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Day Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="15">15 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Plan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {uniquePlans.map(plan => (
                  <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setPlanFilter('all');
                setStatusFilter('all');
                setDayRangeFilter('30');
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <div className="min-w-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>{activeTab === 'expiring' ? 'Days Left' : 'Days Expired'}</TableHead>
                    <TableHead className="text-center">{activeTab === 'expired' ? 'WhatsApp | Renew' : 'WhatsApp'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No {activeTab} members found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMembers.map((member) => (
                      <TableRow key={member.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.member_image || member.memberImage} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.mobileNo}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.planType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(member.subscriptionEndDate!), 'PPP')}
                        </TableCell>
                        <TableCell>
                          {getDaysDisplay(member)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWhatsAppClick(member)}
                              className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                              title={`Send WhatsApp message to ${member.name}`}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            {activeTab === 'expired' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRenewalClick(member)}
                                className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300"
                                title={`Create renewal receipt for ${member.name}`}
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
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
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};