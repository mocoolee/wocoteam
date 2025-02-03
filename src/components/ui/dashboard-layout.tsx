'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Users,
  FileText,
  ClipboardList,
  BarChart,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

const sidebarItems: SidebarItem[] = [
  {
    title: '儀表板',
    href: '/dashboard',
    icon: LayoutGrid,
  },
  {
    title: '專案計畫',
    href: '/projects',
    icon: FileText,
  },
  {
    title: '任務管理',
    href: '/tasks',
    icon: ClipboardList,
  },
  {
    title: '團隊成員',
    href: '/team',
    icon: Users,
  },
  {
    title: '報表管理',
    href: '/reports',
    icon: BarChart,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform lg:static lg:translate-x-0',
          !isSidebarOpen && '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-14 items-center border-b px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <LayoutGrid className="h-6 w-6" />
              <span>Wocoteam</span>
            </Link>
          </div>

          {/* Sidebar content */}
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                    {item.count && (
                      <span className="ml-auto text-xs">{item.count}</span>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </ScrollArea>

          {/* Sidebar footer */}
          <div className="border-t p-3">
            <div className="space-y-1">
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  個人設定
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-red-500 hover:text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
} 