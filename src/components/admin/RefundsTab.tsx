import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface Refund {
  id: string;
  user_id: string;
  subscription_id: string;
  paystack_reference: string;
  amount: number;
  reason: string | null;
  status: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  created_at: string;
  processed_at: string | null;
  profiles: {
    email: string;
    full_name: string | null;
  };
  subscriptions: {
    plan: string;
  };
}

export default function RefundsTab() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRefunds();
    
    // Real-time subscription
    const channel = supabase
      .channel('refunds_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'refunds' },
        () => {
          fetchRefunds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("refunds")
      .select(`
        *,
        profiles(email, full_name),
        subscriptions(plan)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRefunds(data as Refund[]);
    }
    setLoading(false);
  };

 const updateRefundStatus = async (refundId: string, status: string) => {
  setProcessing(refundId);
  
  if (status === "success") {
    // Call process-refund edge function to approve
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: { refundId, action: 'approve' }
      });

      if (error) {
        console.error("Invocation error:", error);
        throw error;
      }
      
      if (data?.error) {
        console.error("Response error:", data.error);
        throw new Error(data.error);
      }

      alert(`✅ ${data.message || 'Refund approved successfully'}`);
      await fetchRefunds();
    } catch (err: any) {
      console.error("Refund approval error:", err);
      alert(`❌ Error: ${err.message || 'Failed to approve refund'}`);
    }
  } else if (status === "failed") {
    // Reject refund
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: { refundId, action: 'reject' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      alert('Refund rejected successfully');
      await fetchRefunds();
    } catch (err: any) {
      alert(`Error rejecting refund: ${err.message}`);
    }
  } else {
    // For 'processing' status, just update database
    const { error } = await supabase
      .from("refunds")
      .update({ status })
      .eq("id", refundId);

    if (!error) {
      await fetchRefunds();
    } else {
      alert(`Error updating status: ${error.message}`);
    }
  }
  
  setProcessing(null);
};



  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const formatAmount = (amount: number) => {
    // Amount is in pesewas, convert to GHS
    return `GHS ${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1246C9] mx-auto"></div>
          <p className="mt-2 text-[#5B6B8A]">Loading refund requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (refunds.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-[#8A94B3] mx-auto mb-3" />
          <p className="text-[#5B6B8A]">No refund requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#5B6B8A]">Total Requests</p>
            <p className="text-2xl font-bold text-[#0B1F3B]">{refunds.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#5B6B8A]">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {refunds.filter(r => r.status === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#5B6B8A]">Processed</p>
            <p className="text-2xl font-bold text-green-600">
              {refunds.filter(r => r.status === "success").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[#5B6B8A]">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {refunds.filter(r => r.status === "failed").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refund Requests */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {refunds.map((refund) => (
          <Card key={refund.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base truncate">
                    {refund.profiles?.email}
                  </CardTitle>
                  {refund.profiles?.full_name && (
                    <p className="text-sm text-[#5B6B8A] mt-1">
                      {refund.profiles.full_name}
                    </p>
                  )}
                </div>
                {getStatusIcon(refund.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-center">
                <Badge className={`${getStatusColor(refund.status)} capitalize`}>
                  {refund.status}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {refund.subscriptions?.plan}
                </Badge>
              </div>

              {/* Amount */}
              <div className="bg-[#F6F8FC] p-3 rounded-lg">
                <p className="text-xs text-[#5B6B8A] mb-1">Refund Amount</p>
                <p className="text-lg font-bold text-[#0B1F3B]">
                  {formatAmount(refund.amount)}
                </p>
              </div>

              {/* Bank Details */}
              {refund.bank_name && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1 border border-blue-200">
                  <p className="font-medium text-blue-900">Bank Details</p>
                  <div className="text-blue-700">
                    <p><span className="font-medium">Bank:</span> {refund.bank_name}</p>
                    <p><span className="font-medium">Account:</span> {refund.account_number}</p>
                    <p><span className="font-medium">Name:</span> {refund.account_name}</p>
                  </div>
                </div>
              )}

              {/* Reason */}
              {refund.reason && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-gray-700 mb-1">Reason</p>
                  <p className="text-gray-600 text-xs">{refund.reason}</p>
                </div>
              )}

              {/* Payment Reference */}
              <div className="text-xs bg-gray-50 p-2 rounded">
                <p className="font-medium text-gray-700">Payment Ref</p>
                <p className="text-gray-600 truncate">{refund.paystack_reference}</p>
              </div>

              {/* Dates */}
              <div className="text-xs text-[#5B6B8A] space-y-1">
                <p>Requested: {format(new Date(refund.created_at), "MMM dd, yyyy HH:mm")}</p>
                {refund.processed_at && (
                  <p>Processed: {format(new Date(refund.processed_at), "MMM dd, yyyy HH:mm")}</p>
                )}
              </div>

              {/* Actions */}
              {refund.status === "pending" && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => updateRefundStatus(refund.id, "processing")}
                    variant="outline"
                    disabled={processing === refund.id}
                  >
                    Process
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => updateRefundStatus(refund.id, "failed")}
                    variant="destructive"
                    disabled={processing === refund.id}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {refund.status === "processing" && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => updateRefundStatus(refund.id, "success")}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={processing === refund.id}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => updateRefundStatus(refund.id, "failed")}
                    variant="destructive"
                    disabled={processing === refund.id}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
