import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Shield, GraduationCap } from "lucide-react";
import heroImage from "@/assets/hero-food.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-5xl font-bold text-primary-foreground md:text-7xl">
            MEC Canteen
          </h1>
          <p className="mb-8 max-w-2xl text-xl text-primary-foreground/90 md:text-2xl">
            Order your favorite food with ease. Fast, simple, and delicious!
          </p>
        </div>
      </section>

      {/* Portal Selection */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">Choose Your Portal</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Admin Portal */}
          <Link to="/auth?type=admin">
            <Card className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-[var(--shadow-hover)]">
              <div className="bg-gradient-to-br from-destructive to-destructive/80 p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-white/20 p-6 backdrop-blur-sm">
                    <Shield className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Admin Portal</h3>
                <p className="text-white/90">Manage orders and menu items</p>
              </div>
              <div className="bg-card p-6">
                <Button className="w-full bg-destructive hover:bg-destructive/90">
                  Admin Login
                </Button>
              </div>
            </Card>
          </Link>

          {/* Staff Portal */}
          <Link to="/auth?type=staff">
            <Card className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-[var(--shadow-hover)]">
              <div className="bg-gradient-to-br from-secondary to-secondary/80 p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-white/20 p-6 backdrop-blur-sm">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Staff Portal</h3>
                <p className="text-white/90">Place orders for staff members</p>
              </div>
              <div className="bg-card p-6">
                <Button className="w-full bg-secondary hover:bg-secondary/90">
                  Staff Login
                </Button>
              </div>
            </Card>
          </Link>

          {/* Student Portal */}
          <Link to="/auth?type=student">
            <Card className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-[var(--shadow-hover)]">
              <div className="bg-[var(--gradient-hero)] p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-white/20 p-6 backdrop-blur-sm">
                    <GraduationCap className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Student Portal</h3>
                <p className="text-white/90">Order food and track your orders</p>
              </div>
              <div className="bg-card p-6">
                <Button className="w-full">
                  Student Login
                </Button>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Choose MEC Canteen?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-card p-6 text-center shadow-[var(--shadow-card)]">
              <div className="mb-4 text-4xl">🚀</div>
              <h3 className="mb-2 text-xl font-semibold">Fast Ordering</h3>
              <p className="text-muted-foreground">Quick and easy food ordering system</p>
            </div>
            <div className="rounded-lg bg-card p-6 text-center shadow-[var(--shadow-card)]">
              <div className="mb-4 text-4xl">💳</div>
              <h3 className="mb-2 text-xl font-semibold">Digital Wallet</h3>
              <p className="text-muted-foreground">Recharge and pay from your wallet</p>
            </div>
            <div className="rounded-lg bg-card p-6 text-center shadow-[var(--shadow-card)]">
              <div className="mb-4 text-4xl">🔔</div>
              <h3 className="mb-2 text-xl font-semibold">Order Tracking</h3>
              <p className="text-muted-foreground">Get notified when your food is ready</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
