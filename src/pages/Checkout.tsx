import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<number>(0);

  const { cart, total } = location.state || { cart: [], total: 0 };

  useEffect(() => {
    if (!cart || cart.length === 0) {
      navigate("/menu");
      return;
    }
    fetchWallet();
  }, []);

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

  const handlePlaceOrder = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      if (wallet < total) {
        toast({
          title: "Insufficient Balance",
          description: "Please recharge your wallet",
          variant: "destructive",
        });
        return;
      }

      // Generate token
      const tokenNumber = `TKN${Date.now().toString().slice(-8)}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          token_number: tokenNumber,
          total_amount: total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item: any) => ({
        order_id: order.id,
        food_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: wallet - total })
        .eq("user_id", session.user.id);

      if (walletError) throw walletError;

      toast({
        title: "Order Placed!",
        description: `Your token number is ${tokenNumber}`,
      });

      navigate("/orders");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
          <div className="space-y-2">
            {cart.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-xl font-semibold">Payment Method</h2>
          <div className="flex items-center justify-between">
            <span>Wallet Balance:</span>
            <span className="text-xl font-bold">₹{wallet.toFixed(2)}</span>
          </div>
          {wallet < total && (
            <p className="mt-2 text-sm text-destructive">
              Insufficient balance. Please recharge your wallet.
            </p>
          )}
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/wallet")}
            variant="outline"
            className="flex-1"
          >
            Recharge Wallet
          </Button>
          <Button
            onClick={handlePlaceOrder}
            disabled={loading || wallet < total}
            className="flex-1"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
