import { Bell, Search, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useApp();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-[#8A94B3]/30 bg-white px-8">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A94B3]" />
        <Input
          placeholder="Search keywords, briefs..."
          className="pl-12 bg-white border-[#8A94B3]/30 rounded-xl h-12 focus:ring-2 focus:ring-[#1B64F2] focus:border-[#1B64F2]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-[#F6F8FC] transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD84D]">
                <User className="h-5 w-5 text-[#0B1F3B]" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-[#0B1F3B]">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-[#5B6B8A]">
                  {user?.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl border-[#8A94B3]/30 shadow-lg bg-white">
            <DropdownMenuLabel className="pb-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-[#0B1F3B]">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-[#5B6B8A]">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#8A94B3]/30" />
            <DropdownMenuItem 
              onClick={() => navigate('/settings')}
              className="cursor-pointer rounded-lg mx-1 my-1 text-[#0B1F3B] hover:bg-[#F6F8FC]"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#8A94B3]/30" />
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="cursor-pointer rounded-lg mx-1 my-1 text-red-600 hover:bg-red-50 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}