import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Wallet, LogOut, ClipboardList } from "lucide-react";
import menuBanner from "@/assets/menu-banner.jpg";
import foodIdli from "@/assets/food-idli.jpg";
import foodDosa from "@/assets/food-dosa.jpg";
import foodTea from "@/assets/food-tea.jpg";
import foodBiryani from "@/assets/food-biryani.jpg";
import foodSamosa from "@/assets/food-samosa.jpg";
import foodPanipuri from "@/assets/food-panipuri.jpg";
import foodSandwich from "@/assets/food-sandwich.jpg";

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  available: boolean;
}

interface CartItem extends FoodItem {
  quantity: number;
}

const Menu = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wallet, setWallet] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Image mapping
  const foodImages: Record<string, string> = {
    "Idli Sambar": foodIdli,
    "Masala Dosa": foodDosa,
    "Chai": foodTea,
    "Veg Biryani": foodBiryani,
    "Samosa": foodSamosa,
    "Pani Puri": foodPanipuri,
    "Sandwich": foodSandwich,
  };

  useEffect(() => {
    checkAuth();
    fetchFoodItems();
    fetchWallet();
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

  const fetchFoodItems = async () => {
    const { data, error } = await supabase
      .from("food_items")
      .select("*")
      .eq("available", true)
      .order("category");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setFoodItems(data || []);
  };

  const fetchWallet = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single();

    if (data) setWallet(data.balance);
  };

  const addToCart = (item: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + change } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add items to your cart first" });
      return;
    }
    navigate("/checkout", { state: { cart, total: getTotal() } });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">MEC Canteen</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/wallet")}>
              <Wallet className="mr-2 h-4 w-4" />
              ₹{wallet.toFixed(2)}
            </Button>
            <Button variant="outline" onClick={() => navigate("/orders")}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Orders
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative h-48 overflow-hidden md:h-64">
        <img 
          src={menuBanner} 
          alt="MEC Canteen Menu" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Welcome, {profile?.full_name}!</h2>
            <p className="text-white/90 mt-2">Browse our menu and place your order</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Menu Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {foodItems.map((item) => (
            <Card key={item.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="aspect-video bg-muted">
                {foodImages[item.name] ? (
                  <img src={foodImages[item.name]} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.category && (
                      <Badge variant="secondary" className="mt-1">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg font-bold text-primary">₹{item.price}</p>
                </div>
                {item.description && (
                  <p className="mb-3 text-sm text-muted-foreground">{item.description}</p>
                )}
                <Button onClick={() => addToCart(item)} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Floating Cart */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6 w-80 rounded-lg border bg-card p-4 shadow-lg">
            <h3 className="mb-3 flex items-center text-lg font-semibold">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Your Cart ({cart.length})
            </h3>
            <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="w-16 text-right">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-3 border-t pt-3">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹{getTotal().toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={handleCheckout} className="w-full">
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
