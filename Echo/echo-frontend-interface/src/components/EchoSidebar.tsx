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
    <Sidebar collapsible="none" className="bg-sidebar border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl relative flex items-center justify-center shadow-glow bg-gradient-primary overflow-hidden">
            <img
              src="/echo-logo.svg"
              alt="ECHO Logo"
              className="w-full h-full object-contain p-1 drop-shadow-sm"
              loading="lazy"
            />
          </div>
          <div className="leading-tight select-none">
            <h1 className="font-extrabold text-lg tracking-tight text-gradient-brand">ECHO</h1>
            <p className="text-sidebar-foreground/60 text-[11px] uppercase tracking-wide">Productivity AI</p>
          </div>
        </div>
      </div>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    className={`
                      w-full justify-start rounded-lg transition-all duration-200 mb-2
                      ${activeTab === item.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-accent-foreground/20 shadow-subtle'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-primary' : ''}`} />
                    <span className="ml-3">{item.label}</span>
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
