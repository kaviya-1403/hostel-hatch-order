import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wallet as WalletIcon, Plus } from "lucide-react";

const Wallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [rechargeAmount, setRechargeAmount] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
      return;
    }

    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single();

    if (data) setBalance(data.balance);
  };

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("wallets")
        .update({ balance: balance + amount })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Recharge Successful!",
        description: `₹${amount.toFixed(2)} added to your wallet`,
      });

      setBalance(balance + amount);
      setRechargeAmount("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const quickAmounts = [50, 100, 200, 500];

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
        <h1 className="mb-6 text-3xl font-bold">My Wallet</h1>

        <Card className="mb-6 bg-[var(--gradient-hero)] p-8 text-center text-white">
          <WalletIcon className="mx-auto mb-4 h-12 w-12" />
          <p className="mb-2 text-sm opacity-90">Current Balance</p>
          <p className="text-5xl font-bold">₹{balance.toFixed(2)}</p>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Recharge Wallet</h2>
          
          <div className="mb-4">
            <Label htmlFor="amount">Enter Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Quick Recharge</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setRechargeAmount(amount.toString())}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleRecharge} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Money
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Note: This is a demo. In production, this would integrate with a payment gateway.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
