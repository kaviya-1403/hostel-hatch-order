import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, CheckCircle } from "lucide-react";

interface Order {
  id: string;
  token_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string;
}

const Admin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchOrders();

    // Subscribe to order updates
    const channel = supabase
      .channel("admin-order-updates")
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

    if (profileData?.user_type !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/menu");
      return;
    }

    setProfile(profileData);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setOrders(data || []);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const updates: any = { status };
    if (status === "ready") {
      updates.ready_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Order Updated",
      description: `Order status changed to ${status}`,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="mb-2 text-3xl font-bold">Active Orders</h2>
          <p className="text-muted-foreground">Manage and update order status</p>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No orders yet</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-2xl font-bold">{order.token_number}</span>
                    <Badge variant={order.status === "ready" ? "default" : "secondary"}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Order #{order.user_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-xl font-bold text-primary">
                    ₹{order.total_amount.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  {order.status === "pending" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                      className="w-full"
                      variant="secondary"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === "preparing" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      className="w-full"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "completed")}
                      className="w-full"
                      variant="outline"
                    >
                      Complete Order
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
