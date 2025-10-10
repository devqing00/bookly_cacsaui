'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Table, AdminStats } from '@/types';
import { BASE_TABLE_NAMES, TOTAL_TENTS, getTableName } from '@/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EditUserModal from '@/components/EditUserModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ResetDataModal from '@/components/ResetDataModal';
import LoginModal from '@/components/LoginModal';
import Link from 'next/link';
import { generateBadgePDF, generateBatchBadgesPDF, downloadBadge, type BadgeData } from '@/lib/badgeGenerator';

// Type for organized table data by base table and tent
interface BaseTableData {
  baseTableNumber: number;
  baseTableName: string;
  tents: {
    [tentNumber: number]: (Table & { id: string }) | null;
  };
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tables, setTables] = useState<(Table & { id: string })[]>([]);
  const [organizedTables, setOrganizedTables] = useState<BaseTableData[]>([]);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'full'>('all');
  const [editUser, setEditUser] = useState<Table | null>(null);
  const [deleteUser, setDeleteUser] = useState<{ table: Table; seatIndex: number } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const prevSearchQuery = useRef('');
  const [stats, setStats] = useState<AdminStats>({
    totalTables: 0,
    totalAttendees: 0,
    averageTableCapacity: 0,
    fullTables: 0,
    availableSeats: 0,
    checkedInCount: 0,
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('adminSessionToken');
    if (token) {
      // Verify token with server
      fetch('/api/admin/auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminSessionToken');
        }
      })
      .catch(() => {
        localStorage.removeItem('adminSessionToken');
      });
    }
  }, []);

  // Handle successful login
  const handleLogin = (token: string) => {
    localStorage.setItem('adminSessionToken', token);
    setIsAuthenticated(true);
    
    // Check if there's a redirect URL
    const redirect = searchParams.get('redirect');
    if (redirect) {
      toast.success('Login successful! Redirecting...');
      setTimeout(() => {
        router.push(redirect);
      }, 500);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminSessionToken');
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  // Real-time Firestore listener
  useEffect(() => {
    const tablesRef = collection(db, 'tables');
    const q = query(tablesRef, orderBy('tableNumber', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tablesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            // Ensure tableName is populated
            tableName: data.tableName || getTableName(data.tableNumber, data.tent) || `Table ${data.tableNumber}`,
          } as Table & { id: string };
        });

        setTables(tablesData);
        
        // Organize tables by base table and tent
        const organized: BaseTableData[] = [];
        for (let baseTableNum = 1; baseTableNum <= 9; baseTableNum++) {
          const baseTableData: BaseTableData = {
            baseTableNumber: baseTableNum,
            baseTableName: BASE_TABLE_NAMES[baseTableNum],
            tents: {},
          };
          
          // Initialize all tent slots
          for (let tentNum = 1; tentNum <= TOTAL_TENTS; tentNum++) {
            const matchingTable = tablesData.find(
              t => t.tableNumber === baseTableNum && t.tent === tentNum
            );
            baseTableData.tents[tentNum] = matchingTable || null;
          }
          
          organized.push(baseTableData);
        }
        
        setOrganizedTables(organized);
        setLoading(false);
        
        // Show toast for new registrations (skip on initial load)
        if (!loading && snapshot.docChanges().length > 0) {
          const changes = snapshot.docChanges();
          const newRegistrations = changes.filter(change => change.type === 'added');
          
          if (newRegistrations.length > 0) {
            toast.success('New registration received!', {
              description: 'Dashboard updated automatically',
            });
          }
        }
      },
      (error) => {
        console.error('Error fetching tables:', error);
        toast.error('Failed to load tables');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading]);

  // Calculate statistics
  useEffect(() => {
    // Filter to only tables with attendees
    const tablesWithAttendees = tables.filter(t => t.attendees.length > 0);
    
    const totalAttendees = tables.reduce((sum, table) => 
      sum + table.attendees.length, 0
    );
    
    // Calculate full tables based on actual seat count (only count tables with attendees)
    const fullTables = tablesWithAttendees.filter(t => {
      const actualSeats = t.attendees.length;
      return actualSeats >= t.maxCapacity;
    }).length;
    
    const totalSeats = tables.reduce((sum, table) => sum + table.maxCapacity, 0);
    const availableSeats = totalSeats - totalAttendees;
    
    // Calculate average capacity only for tables with attendees
    const avgCapacity = tablesWithAttendees.length > 0 
      ? (totalAttendees / tablesWithAttendees.length) 
      : 0;

    setStats({
      totalTables: tablesWithAttendees.length, // Only count tables with attendees
      totalAttendees,
      averageTableCapacity: avgCapacity,
      fullTables,
      availableSeats,
      checkedInCount: 0, // Will be implemented with check-in system
    });
  }, [tables]);

  // Filter organized tables based on search query (memoized to prevent recalculation)
  const filteredOrganizedTables = useMemo(() => {
    return organizedTables.map(baseTable => {
      if (!searchQuery.trim()) {
        return baseTable;
      }

      const query = searchQuery.toLowerCase().trim();
      
      // Check if base table number matches
      const tableNumberMatches = baseTable.baseTableNumber.toString().includes(query);
      
      // Check if table name matches
      const tableNameMatches = baseTable.baseTableName.toLowerCase().includes(query);

      // Filter tents to only show those with matching attendees
      const filteredTents: typeof baseTable.tents = {};
      
      Object.entries(baseTable.tents).forEach(([tentNum, tentTable]) => {
        if (!tentTable) return;
        
        // Filter attendees within this tent
        const matchingAttendees = tentTable.attendees.filter(attendee => {
          const nameMatches = attendee.name.toLowerCase().includes(query);
          const emailMatches = attendee.email.toLowerCase().includes(query);
          const phoneMatches = attendee.phone?.toLowerCase().includes(query);
          return nameMatches || emailMatches || phoneMatches;
        });

        // Include this tent if it has matching attendees OR if the table number/name matches
        if (matchingAttendees.length > 0 || tableNumberMatches || tableNameMatches) {
          filteredTents[Number(tentNum)] = {
            ...tentTable,
            attendees: matchingAttendees.length > 0 ? matchingAttendees : tentTable.attendees,
          };
        }
      });

      return {
        ...baseTable,
        tents: filteredTents,
      };
    }).filter(baseTable => {
      // Only show base tables that have at least one tent with attendees after filtering
      return Object.values(baseTable.tents).some(tent => tent && tent.attendees.length > 0);
    });
  }, [organizedTables, searchQuery]);

  // Auto-expand accordions when searching (only when search query changes)
  useEffect(() => {
    // Only run if search query actually changed
    if (searchQuery.trim() !== prevSearchQuery.current) {
      prevSearchQuery.current = searchQuery.trim();
      
      if (searchQuery.trim()) {
        // Expand all accordions that have matching results
        const accordionsToOpen = new Set<string>();
        filteredOrganizedTables.forEach(baseTable => {
          Object.keys(baseTable.tents).forEach(tentNum => {
            const tent = baseTable.tents[Number(tentNum)];
            if (tent && tent.attendees.length > 0) {
              accordionsToOpen.add(`${baseTable.baseTableNumber}-${tentNum}`);
            }
          });
        });
        setOpenAccordions(accordionsToOpen);
      }
    }
  }, [searchQuery, filteredOrganizedTables]);

  // Helper function to highlight search matches
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-neutral-900 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Toggle accordion
  const toggleAccordion = (baseTableNumber: number, tentNumber: number) => {
    const key = `${baseTableNumber}-${tentNumber}`;
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Expand all accordions (useful for search results)
  const expandAll = () => {
    const allKeys = new Set<string>();
    filteredOrganizedTables.forEach(baseTable => {
      Object.keys(baseTable.tents).forEach(tentNum => {
        allKeys.add(`${baseTable.baseTableNumber}-${tentNum}`);
      });
    });
    setOpenAccordions(allKeys);
  };

  // Collapse all accordions
  const collapseAll = () => {
    setOpenAccordions(new Set());
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvRows = [];
    csvRows.push(['Table', 'Seat', 'Name', 'Email', 'Phone', 'Gender', 'Registered At']);

    tables.forEach(table => {
      table.attendees.forEach((attendee, index) => {
        csvRows.push([
          table.tableNumber,
          index + 1,
          attendee.name,
          attendee.email,
          attendee.phone || 'N/A',
          attendee.gender || 'N/A',
          attendee.registeredAt ? new Date(attendee.registeredAt).toLocaleString() : 'N/A',
        ]);
      });
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fellowship-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Registration data exported successfully!');
  };

  // Edit user handler
  const handleEditClick = (table: Table & { id: string }, attendeeIndex: number) => {
    const attendee = table.attendees[attendeeIndex];
    setEditUser({
      ...table,
      seatIndex: attendeeIndex,
      ...attendee,
    } as unknown as Table);
  };

  // Delete user handler
  const handleDeleteClick = (table: Table & { id: string }, attendeeIndex: number) => {
    setDeleteUser({
      table: table as unknown as Table,
      seatIndex: attendeeIndex,
    });
  };

  // Refresh data after modal actions
  const refreshData = () => {
    // Data will auto-refresh due to real-time listener
  };

  // Print badge handler
  const handlePrintBadge = async (table: Table, attendeeIndex: number) => {
    const attendee = table.attendees[attendeeIndex];
    
    const badgeData: BadgeData = {
      name: attendee.name,
      email: attendee.email,
      phone: attendee.phone,
      gender: attendee.gender,
      tableNumber: table.tableNumber,
      tent: table.tent,
      tableName: table.tableName,
      seatNumber: attendeeIndex + 1,
      qrCodeData: JSON.stringify({
        name: attendee.name,
        email: attendee.email,
        table: table.tableNumber,
        tent: table.tent,
        seat: attendeeIndex + 1,
      }),
    };

    try {
      const toastId = toast.loading('Generating badge...');
      const blob = await generateBadgePDF(badgeData);
      downloadBadge(blob, `badge-${attendee.name.replace(/\s+/g, '-')}.pdf`);
      toast.dismiss(toastId);
      toast.success('Badge downloaded successfully!');
    } catch (error) {
      console.error('Badge generation error:', error);
      toast.error('Failed to generate badge');
    }
  };

  // Print all badges for a table
  const handlePrintTableBadges = async (table: Table) => {
    const badges: BadgeData[] = table.attendees
      .map((attendee, index) => ({
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        gender: attendee.gender,
        tableNumber: table.tableNumber,
        tent: table.tent,
        tableName: table.tableName,
        seatNumber: index + 1,
        qrCodeData: JSON.stringify({
          name: attendee.name,
          email: attendee.email,
          table: table.tableNumber,
          tent: table.tent,
          seat: index + 1,
        }),
      }));

    try {
      const toastId = toast.loading(`Generating ${badges.length} badges...`);
      const blob = await generateBatchBadgesPDF(badges);
      downloadBadge(blob, `table-${table.tableNumber}-tent-${table.tent}-badges.pdf`);
      toast.dismiss(toastId);
      toast.success(`${badges.length} badges downloaded successfully!`);
    } catch (error) {
      console.error('Batch badge generation error:', error);
      toast.error('Failed to generate badges');
    }
  };

  // Print all badges for all attendees
  const handlePrintAllBadges = async () => {
    const allBadges: BadgeData[] = [];
    
    tables.forEach(table => {
      table.attendees.forEach((attendee, index) => {
        allBadges.push({
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          gender: attendee.gender,
          tableNumber: table.tableNumber,
          tent: table.tent,
          tableName: table.tableName,
          seatNumber: index + 1,
          qrCodeData: JSON.stringify({
            name: attendee.name,
            email: attendee.email,
            table: table.tableNumber,
            tent: table.tent,
            seat: index + 1,
          }),
        });
      });
    });

    if (allBadges.length === 0) {
      toast.error('No attendees to print badges for');
      return;
    }

    try {
      const toastId = toast.loading(`Generating ${allBadges.length} badges...`);
      const blob = await generateBatchBadgesPDF(allBadges);
      downloadBadge(blob, `all-badges-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.dismiss(toastId);
      toast.success(`${allBadges.length} badges downloaded successfully!`);
    } catch (error) {
      console.error('Batch badge generation error:', error);
      toast.error('Failed to generate all badges');
    }
  };

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return <LoginModal isOpen={true} onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-300 border-t-burgundy-700 mx-auto"></div>
          <p className="mt-4 text-sm text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-burgundy-700 to-burgundy-800 flex items-center justify-center shadow-burgundy">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mb-2">
                Love Feast Dashboard
              </h1>
              <p className="text-sm text-neutral-600">
                Real-time view of all registered attendees and table assignments for CACSAUI&apos;s Love Feast
              </p>
            </div>
          </div>
          
          {/* Stats Grid - Improved Responsiveness */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-neutral-200 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-soft relative overflow-hidden group hover:shadow-medium transition-shadow"
            >
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-golden-50 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10 opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <p className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-1 uppercase tracking-widest relative z-10">Tables</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 relative z-10">{stats.totalTables}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-neutral-200 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-soft relative overflow-hidden group hover:shadow-medium transition-shadow"
            >
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-blue-50 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10 opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <p className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-1 uppercase tracking-widest relative z-10">Attendees</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 relative z-10">{stats.totalAttendees}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-neutral-200 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-soft relative overflow-hidden group hover:shadow-medium transition-shadow"
            >
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-amber-50 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10 opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <p className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-1 uppercase tracking-widest relative z-10">Avg/Table</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 relative z-10">{stats.averageTableCapacity.toFixed(1)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-neutral-200 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-soft relative overflow-hidden group hover:shadow-medium transition-shadow"
            >
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-red-50 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10 opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <p className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-1 uppercase tracking-widest relative z-10">Full</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 relative z-10">{stats.fullTables}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-neutral-200 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-soft relative overflow-hidden group hover:shadow-medium transition-shadow"
            >
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-burgundy-50 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10 opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <p className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-1 uppercase tracking-widest relative z-10">Available</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 relative z-10">{stats.availableSeats}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white border border-neutral-200 rounded-lg sm:rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-soft relative overflow-hidden group hover:shadow-medium transition-shadow"
            >
              <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-purple-50 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10 opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <p className="text-[10px] sm:text-xs font-medium text-neutral-500 mb-1 uppercase tracking-widest relative z-10">Checked In</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900 relative z-10">{stats.checkedInCount}</p>
            </motion.div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-6">
            {/* Search Input */}
            <div className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or table number..."
                className="w-full px-4 py-2.5 pl-10 pr-10 border border-neutral-300 rounded-lg focus:border-golden-500 focus:ring-0 focus:outline-none transition-all"
              />
              <svg className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  title="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Info */}
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800">
                      Found <span className="font-semibold">{
                        filteredOrganizedTables.reduce((total, baseTable) => {
                          return total + Object.values(baseTable.tents).reduce((sum, tent) => {
                            return sum + (tent?.attendees.length || 0);
                          }, 0);
                        }, 0)
                      }</span> result(s) for &quot;{searchQuery}&quot;
                    </p>
                  </div>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-green-800">
                    <span className="font-semibold">Accordions auto-expanded!</span> Sections with matching results are highlighted with a blue border and opened automatically. Matching text is highlighted in yellow.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Filter and Action Buttons - Improved Responsive Grid */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              {/* Row 1: Main filters and actions */}
              <div className="flex flex-wrap gap-2 flex-1">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'available' | 'full')}
                  className="flex-1 sm:flex-initial min-w-[120px] px-3 py-2.5 border border-neutral-300 rounded-lg focus:border-golden-500 focus:ring-0 focus:outline-none transition-all bg-white text-sm"
                  aria-label="Filter tables by status"
                >
                  <option value="all">All Tables</option>
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                </select>

                <Link
                  href="/check-registration"
                  className="flex-1 sm:flex-initial px-3 py-2.5 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  title="Check Registration"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden lg:inline">Check Reg</span>
                  <span className="lg:hidden">Check</span>
                </Link>

                <Link
                  href="/check-in"
                  className="flex-1 sm:flex-initial px-3 py-2.5 border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  title="Love Feast Check-In"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden lg:inline">Check-In</span>
                  <span className="lg:hidden">In</span>
                </Link>

                <Link
                  href="/activity-log"
                  className="flex-1 sm:flex-initial px-3 py-2.5 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  title="Activity Log"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden lg:inline">Activity</span>
                  <span className="lg:hidden">Log</span>
                </Link>
              </div>

              {/* Row 2: Action buttons */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={expandAll}
                  className="flex-1 sm:flex-initial px-3 py-2.5 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5"
                  title="Expand all accordions"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="hidden md:inline">Expand All</span>
                  <span className="md:hidden">Expand</span>
                </button>

                <button
                  onClick={collapseAll}
                  className="flex-1 sm:flex-initial px-3 py-2.5 border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5"
                  title="Collapse all accordions"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="hidden md:inline">Collapse All</span>
                  <span className="md:hidden">Collapse</span>
                </button>

                <button
                  onClick={handlePrintAllBadges}
                  disabled={tables.length === 0}
                  className="flex-1 sm:flex-initial px-3 py-2.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title="Print All Badges"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="hidden md:inline">Print All</span>
                  <span className="md:hidden">Print</span>
                </button>

                <button
                  onClick={exportToCSV}
                  disabled={tables.length === 0}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-burgundy-700 to-burgundy-800 hover:from-burgundy-800 hover:to-burgundy-900 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg shadow-burgundy transition-all duration-150 active:shadow-none active:translate-y-0.5 flex items-center justify-center gap-1.5 group disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title="Export to CSV"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span className="hidden md:inline">Export CSV</span>
                  <span className="md:hidden">Export</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex-1 sm:flex-initial px-3 py-2.5 border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  title="Logout from admin dashboard"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden md:inline">Logout</span>
                  <span className="md:hidden">Exit</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tables Grid - Accordion Structure by Base Table */}
        {tables.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-neutral-200 shadow-soft">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-neutral-500">No registrations yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrganizedTables.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-neutral-200 shadow-soft">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <p className="text-neutral-500 text-lg font-medium mb-2">No results found</p>
                <p className="text-neutral-400 text-sm">Try adjusting your search query</p>
              </div>
            ) : (
              filteredOrganizedTables.map((baseTable, baseIndex) => {
              // Check if this base table has any attendees across all tents
              const hasAttendees = Object.values(baseTable.tents).some(
                tent => tent && tent.attendees.length > 0
              );

              if (!hasAttendees) return null;

              return (
                <motion.div
                  key={baseTable.baseTableNumber}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: baseIndex * 0.05, duration: 0.3 }}
                  className="bg-white border border-neutral-200 rounded-xl shadow-soft overflow-hidden"
                >
                  {/* Base Table Header */}
                  <div className="bg-gradient-to-r from-burgundy-50 to-golden-50 px-6 py-4 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-burgundy-700 to-burgundy-800 flex items-center justify-center text-white font-bold shadow-burgundy">
                        {baseTable.baseTableNumber}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-burgundy-900">
                          {baseTable.baseTableName}
                        </h2>
                        <p className="text-sm text-neutral-600">
                          Table {baseTable.baseTableNumber} - All Tents
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tent Accordions */}
                  <div className="divide-y divide-neutral-200">
                    {[1, 2, 3].map(tentNum => {
                      const tentTable = baseTable.tents[tentNum];
                      const accordionKey = `${baseTable.baseTableNumber}-${tentNum}`;
                      const isOpen = openAccordions.has(accordionKey);
                      const attendeeCount = tentTable?.attendees.length || 0;
                      const maxCapacity = tentTable?.maxCapacity || 8;
                      const hasSearchResults = searchQuery.trim() && tentTable && tentTable.attendees.length > 0;

                      return (
                        <div key={tentNum}>
                          {/* Accordion Header */}
                          <button
                            onClick={() => toggleAccordion(baseTable.baseTableNumber, tentNum)}
                            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                              hasSearchResults ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-burgundy-700 bg-burgundy-100 px-3 py-1 rounded-full">
                                  Tent {tentNum}
                                </span>
                                <span className="text-sm text-neutral-700 font-medium">
                                  {getTableName(baseTable.baseTableNumber, tentNum)}
                                </span>
                                {hasSearchResults && (
                                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                    {attendeeCount} match{attendeeCount !== 1 ? 'es' : ''}
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs font-medium px-3 py-1 rounded-full ${
                                attendeeCount >= maxCapacity 
                                  ? 'bg-red-100 text-red-700' 
                                  : attendeeCount >= maxCapacity * 0.8
                                  ? 'bg-amber-100 text-amber-700'
                                  : attendeeCount > 0
                                  ? 'bg-golden-100 text-burgundy-700'
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}>
                                {attendeeCount}/{maxCapacity} seats
                              </div>
                            </div>
                            <svg 
                              className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Accordion Content */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 py-4 bg-neutral-50">
                                  {!tentTable || tentTable.attendees.length === 0 ? (
                                    <p className="text-sm text-neutral-500 text-center py-4">
                                      No attendees yet for this tent
                                    </p>
                                  ) : (
                                    <div>
                                      {/* Print badges button for this tent */}
                                      {tentTable.attendees.length > 0 && (
                                        <div className="mb-4 flex justify-end">
                                          <button
                                            onClick={() => handlePrintTableBadges(tentTable)}
                                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Print all badges for this tent
                                          </button>
                                        </div>
                                      )}

                                      {/* Attendees Table */}
                                      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                                        <table className="min-w-full divide-y divide-neutral-200">
                                          <thead className="bg-neutral-100">
                                            <tr>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                                Seat
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                                Name
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                                Email
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                                Phone
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                                Gender
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                                Registered
                                              </th>
                                              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                                                Actions
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-neutral-200">
                                            {tentTable.attendees.map((attendee, idx) => (
                                              <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                  <span className="text-sm font-medium text-neutral-900">
                                                    #{idx + 1}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-neutral-900">
                                                      {highlightMatch(attendee.name, searchQuery)}
                                                    </span>
                                                    {attendee.checkedIn && (
                                                      <span className="text-xs px-1.5 py-0.5 bg-golden-100 text-burgundy-700 rounded-full">
                                                        ✓
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <span className="text-sm text-neutral-600">
                                                    {highlightMatch(attendee.email, searchQuery)}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <span className="text-sm text-neutral-600">
                                                    {attendee.phone ? highlightMatch(attendee.phone, searchQuery) : '-'}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                                    {attendee.gender || '-'}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                  <span className="text-xs text-neutral-500">
                                                    {attendee.registeredAt
                                                      ? format(
                                                          attendee.registeredAt instanceof Date
                                                            ? attendee.registeredAt
                                                            : new Date((attendee.registeredAt as { seconds: number }).seconds * 1000),
                                                          'MMM d, h:mm a'
                                                        )
                                                      : '-'}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                  <div className="flex items-center justify-end gap-1">
                                                    <button
                                                      onClick={() => handlePrintBadge(tentTable, idx)}
                                                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                      title="Print badge"
                                                    >
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                      </svg>
                                                    </button>
                                                    <button
                                                      onClick={() => handleEditClick(tentTable, idx)}
                                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                      title="Edit user"
                                                    >
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                      </svg>
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteClick(tentTable, idx)}
                                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                      title="Delete user"
                                                    >
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            }))}
          </div>
        )}

        {/* Danger Zone Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 border-2 border-red-200 rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 sm:px-6 py-3 border-b border-red-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="font-bold text-red-900 text-sm sm:text-base">Danger Zone</h3>
            </div>
          </div>
          <div className="bg-white px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-900 mb-1">Reset All Data</h4>
                <p className="text-sm text-neutral-600">
                  Permanently delete all tables, attendees, and activity logs. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset All Data
              </button>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-700 hover:text-burgundy-700 transition-colors duration-150 inline-flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Registration
          </Link>
        </div>
      </div>

      {/* Modals */}
      {editUser && (
        <EditUserModal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          onSuccess={refreshData}
          user={editUser}
        />
      )}

      {deleteUser && (
        <DeleteConfirmModal
          isOpen={!!deleteUser}
          onClose={() => setDeleteUser(null)}
          onSuccess={refreshData}
          user={deleteUser}
        />
      )}

      <ResetDataModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900"><p className="text-white text-xl">Loading...</p></div>}>
      <AdminPageContent />
    </Suspense>
  );
}
