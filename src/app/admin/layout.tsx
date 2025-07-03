
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const authStatus = localStorage.getItem('admin-auth');
      if (authStatus !== 'true') {
        router.replace('/admin/login');
      } else {
        setIsAuth(true);
      }
    } catch (error) {
        console.error("Could not access localStorage", error);
        router.replace('/admin/login');
    } finally {
        setIsLoading(false);
    }
  }, [router]);
  
  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex items-center space-x-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  if (!isAuth) {
    return null; // Redirecting...
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
