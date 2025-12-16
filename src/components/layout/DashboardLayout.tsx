import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  History,
  Settings,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Investigation', href: '/investigation', icon: FileSearch },
  { name: 'Case Files', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];
function NavLinks() {
  const location = useLocation();
  return (
    <>
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-white'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )
          }
        >
          <item.icon
            className={cn(
              'mr-3 h-5 w-5 flex-shrink-0',
              location.pathname === item.href
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-slate-500 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
            )}
            aria-hidden="true"
          />
          {item.name}
        </NavLink>
      ))}
    </>
  );
}
function SidebarContent() {
    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center gap-x-2">
                <ShieldCheck className="h-8 w-8 text-sky-600 dark:text-sky-500" />
                <span className="font-bold text-lg text-slate-800 dark:text-slate-200">GuardianScreen</span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            <NavLinks />
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  return (
    <div>
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden -ml-2.5">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 lg:hidden" aria-hidden="true" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
                <ThemeToggle className="relative top-0 right-0" />
            </div>
          </div>
        </div>
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}