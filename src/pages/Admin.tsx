import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, CheckCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Order {
  id: string;
  token_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string;
}

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  available: boolean;
}

const Admin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchOrders();
    fetchFoodItems();

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

  const fetchFoodItems = async () => {
    const { data, error } = await supabase
      .from("food_items")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setFoodItems(data || []);
  };

  const handleSaveFoodItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      category: formData.get("category") as string,
      image_url: formData.get("image_url") as string,
      available: formData.get("available") === "on",
    };

    if (editingItem) {
      const { error } = await supabase
        .from("food_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Menu item updated" });
    } else {
      const { error } = await supabase
        .from("food_items")
        .insert([itemData]);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Menu item added" });
    }

    setIsDialogOpen(false);
    setEditingItem(null);
    fetchFoodItems();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
      .from("food_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Menu item deleted" });
    fetchFoodItems();
  };

  const toggleAvailability = async (item: FoodItem) => {
    const { error } = await supabase
      .from("food_items")
      .update({ available: !item.available })
      .eq("id", item.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Item ${!item.available ? "enabled" : "disabled"}` });
    fetchFoodItems();
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
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Active Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
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
          </TabsContent>

          <TabsContent value="menu">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold">Menu Management</h2>
                <p className="text-muted-foreground">Add, edit, or remove menu items</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingItem(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveFoodItem} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" defaultValue={editingItem?.name} required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" defaultValue={editingItem?.description || ""} />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input id="price" name="price" type="number" step="0.01" defaultValue={editingItem?.price} required />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" name="category" defaultValue={editingItem?.category || ""} />
                    </div>
                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input id="image_url" name="image_url" type="url" defaultValue={editingItem?.image_url || ""} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="available" name="available" defaultChecked={editingItem?.available ?? true} />
                      <Label htmlFor="available">Available</Label>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingItem ? "Update" : "Add"} Item
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {foodItems.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No menu items yet</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {foodItems.map((item) => (
                  <Card key={item.id} className="p-6">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="mb-4 h-32 w-full rounded-lg object-cover"
                      />
                    )}
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xl font-bold">{item.name}</h3>
                        <Badge variant={item.available ? "default" : "secondary"}>
                          {item.available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      {item.category && (
                        <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-xl font-bold text-primary">₹{item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAvailability(item)}
                        className="flex-1"
                      >
                        {item.available ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
