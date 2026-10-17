import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, Plus, Eye, Edit, ChevronLeft, ChevronRight, X, Briefcase, FileText, Clock, CheckCircle2, Wallet } from "lucide-react";
import { fetchEngagements, fetchEngagementStats, type EngagementRecord, type EngagementStats } from "@/lib/engagements";
import { fetchOrganizations, type OrganizationRecord } from "@/lib/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/educert/AdminPageShell";

export default function EngagementManagement() {
  const navigate = useNavigate();
  const [engagements, setEngagements] = useState<EngagementRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("none");
  const [organizationFilter, setOrganizationFilter] = useState("none");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadEngagements();
    loadStats();
    loadOrganizations();
  }, [currentPage, statusFilter, organizationFilter]);

  const loadEngagements = async () => {
    try {
      setLoading(true);
      const response = await fetchEngagements(
        currentPage,
        10,
        search,
        statusFilter === "none" ? "" : statusFilter,
        organizationFilter === "none" ? "" : organizationFilter
      );
      setEngagements(response.engagements);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error("Failed to load engagements:", error);
      toast.error("Failed to load engagements");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetchEngagementStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await fetchOrganizations();
      setOrganizations(response);
    } catch (error) {
      console.error("Failed to load organizations:", error);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "none" ? "" : value);
    setCurrentPage(1);
  };

  const handleOrganizationChange = (value: string) => {
    setOrganizationFilter(value === "none" ? "" : value);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
      case "CONFIRMED":
      case "IN_PROGRESS":
        return "bg-secondary-container text-on-secondary-container";
      case "COMPLETED":
        return "bg-surface-container-high text-on-surface-variant";
      case "OUTSTANDING":
        return "bg-error-container text-on-error-container";
      case "CANCELLED":
        return "bg-outline text-on-surface";
      default:
        return "bg-surface-container text-on-surface";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-tertiary";
      case "CONFIRMED":
      case "IN_PROGRESS":
        return "bg-primary-container";
      case "COMPLETED":
        return "bg-outline";
      case "OUTSTANDING":
        return "bg-error";
      case "CANCELLED":
        return "bg-outline";
      default:
        return "bg-secondary";
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getOrganizationInitials = (name: string) => {
    console.log(name)
    if (!name) return "OR";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AdminPageShell withSidebar>
      <div className="w-full max-w-[1280px] mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Commercial Operations</span>
            <span className="text-muted-foreground text-sm">•</span>
            <span className="text-xs uppercase tracking-wider text-primary font-bold">Engagements</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Engagements</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Directory of commercial and corporate training commitments, contracted seat quotas, and fulfillment progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default">
            <Download className="mr-2 h-4 w-4" />
            Export / Reports
          </Button>
          <Button onClick={() => navigate("/training/engagement-creation")} size="default">
            <Plus className="mr-2 h-4 w-4" />
            New Engagement
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-background shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 p-1.5 rounded-md bg-blue-500/20 opacity-90">
              <Briefcase className="h-3 w-3 text-blue-500" />
            </div>
            <div className="mt-4 relative z-10">
              <div className="flex items-baseline gap-2 flex-col">
                <span className="text-3xl font-bold">{stats.total_engagements}</span>
                <span className="text-xs font-bold text-primary">Active SOWs</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{formatCurrency(stats.total_committed)} committed</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-400/20 opacity-90">
              <FileText className="h-3 w-3 text-gray-400" />
            </div>
            <div className="mt-4 relative z-10">
              <div className="flex items-baseline gap-2 flex-col">
                <span className="text-3xl font-bold">{stats.draft_count}</span>
                <span className="text-xs font-bold text-gray-400">In Review</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Pending commercial sign-off</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 p-1.5 rounded-md bg-green-500/20 opacity-90">
              <Clock className="h-3 w-3 text-green-500" />
            </div>
            <div className="mt-4 relative z-10">
              <div className="flex items-baseline gap-2 flex-col">
                <span className="text-3xl font-bold">{stats.active_count}</span>
                <span className="text-xs font-bold text-green-500">Executing</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Active across field batches</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 p-1.5 rounded-md bg-emerald-500/20 opacity-90">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            </div>
            <div className="mt-4 relative z-10">
              <div className="flex items-baseline gap-2 flex-col">
                <span className="text-3xl font-bold">{stats.completed_count}</span>
                <span className="text-xs font-bold text-emerald-500">Reconciled</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Fully trained & certified</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-2 right-2 p-1.5 rounded-md bg-orange-500/20 opacity-90">
              <Wallet className="h-3 w-3 text-orange-500" />
            </div>
            <div className="mt-4 relative z-10">
              <div className="flex items-baseline gap-2 flex-col">
                <span className="text-2xl font-bold">{formatCurrency(stats.outstanding_count)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Pending billing/invoicing</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-3 bg-background rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search engagement name, SOW reference, or organization..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Status: All</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed / Active</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={organizationFilter} onValueChange={handleOrganizationChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Org: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Org: All Organizations</SelectItem>
                {organizations.filter(org => org.id).map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => { setSearch(""); setStatusFilter("none"); setOrganizationFilter("none"); setCurrentPage(1); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Engagement & Ref</th>
                <th className="py-3 px-4 font-semibold">Organization</th>
                <th className="py-3 px-4 font-semibold">Training Items</th>
                <th className="py-3 px-4 font-semibold">Agreed Trainees</th>
                <th className="py-3 px-4 font-semibold">Start Date</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : engagements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No engagements found
                  </td>
                </tr>
              ) : (
                engagements.map((engagement) => (
                  <tr key={engagement.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <button
                          onClick={() => navigate(`/training/engagement-management/${engagement.id}`)}
                          className="font-semibold text-primary hover:underline text-left leading-tight"
                        >
                          {engagement.name}
                        </button>
                        <span className="text-xs text-muted-foreground tracking-wider font-mono uppercase mt-0.5">
                          {engagement.reference_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-bold text-primary">
                          {getOrganizationInitials(engagement.organization_name || "")}
                        </div>
                        <span className="font-semibold truncate max-w-[140px]" title={engagement.organization_name}>
                          {engagement.organization_name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className="text-xs">
                        {engagement.item_count || 0}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-semibold">
                      {engagement.total_trainees || 0} 
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      {formatDate(engagement.expected_delivery_start)}
                    </td>
                    <td className="py-4 px-4 font-bold">
                      {formatCurrency(engagement.total_amount, engagement.currency)}
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(engagement.status)}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${getStatusDotColor(engagement.status)}`} />
                        {engagement.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">
                      {formatDate(engagement.created_at)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/training/engagement-management/${engagement.id}`)}>
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-muted flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="text-muted-foreground">
            Showing <span className="font-bold">{(currentPage - 1) * 10 + 1}</span> to{" "}
            <span className="font-bold">{Math.min(currentPage * 10, total)}</span> of{" "}
            <span className="font-bold">{total}</span> engagements
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </AdminPageShell>
  );
}
