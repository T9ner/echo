import { Home, CheckSquare, Target, Calendar, MessageCircle, BarChart3 } from 'lucide-react';
import { ActiveTab } from '@/types';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface EchoSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const navigationItems = [
  { id: 'main' as const, label: 'Dashboard', icon: Home },
  { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
  { id: 'habits' as const, label: 'Habits', icon: Target },
  { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
  { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
];

export function EchoSidebar({ activeTab, onTabChange }: EchoSidebarProps) {
  return (
    <Sidebar collapsible="none" className="bg-sidebar border-sidebar-border h-full w-64">
      {/* Clean Header */}
      <div className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="leading-tight select-none">
            <h1 className="font-bold text-lg tracking-tight text-gradient-brand">ECHO</h1>
            <p className="text-sidebar-foreground/60 text-xs uppercase tracking-wide">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Clean Navigation */}
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    className={`
                      w-full justify-start rounded-lg p-3 transition-smooth
                      ${activeTab === item.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-primary' : ''}`} />
                    <span className="ml-3 font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
