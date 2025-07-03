'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LogOut, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isAuth, setIsAuth] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuth(true);
      } else {
        setIsAuth(false);
        if (pathname !== '/admin/login') {
            router.replace('/admin/login');
        }
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router, pathname]);
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/admin/login');
    } catch (error) {
        console.error("Logout error:", error);
        toast({ variant: 'destructive', title: "Logout Failed", description: "Could not log you out. Please try again." });
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center space-y-4">
                <ShieldCheck className="w-12 h-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Verifying authentication...</p>
            </div>
        </div>
    );
  }

  // If on login page, don't show the layout, just the page content
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuth) {
    // onAuthStateChanged should handle the redirect, this is a fallback.
    return null; 
  }

  return (
    <SidebarProvider>
        <Sidebar side="left" collapsible="icon" className="border-r-0">
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <ShieldCheck className="w-8 h-8 text-sidebar-primary" />
                <h1 className="font-headline text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Admin Panel</h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/admin/dashboard" tooltip="Dashboard" isActive={pathname.startsWith('/admin/dashboard')}>
                            <LayoutDashboard />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <Separator className="my-2 bg-sidebar-border" />
                <SidebarMenu>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
             <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="md:hidden" />
                  <h2 className="font-headline text-2xl font-bold">Dashboard</h2>
                </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
