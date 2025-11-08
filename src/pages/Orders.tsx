import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";

interface Order {
  id: string;
  token_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  ready_at: string | null;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    checkAuth();

    // Subscribe to order updates
    const channel = supabase
      .channel("order-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);
  };

  const fetchOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setOrders(data || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "preparing":
        return "secondary";
      case "ready":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "preparing":
        return <Clock className="h-4 w-4" />;
      case "ready":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/menu")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">My Orders</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No orders yet</p>
            <Button onClick={() => navigate("/menu")} className="mt-4">
              Browse Menu
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-2xl font-bold">{order.token_number}</span>
                      <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    {order.ready_at && (
                      <p className="mt-1 text-sm text-accent">
                        Ready at: {new Date(order.ready_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ₹{order.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
