import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "./../components/admin/UsersTab";
import SubscriptionsTab from "./../components/admin/SubscriptionsTab";
import UsageTab from "./../components/admin/UsageTab";
import CostsTab from "./../components/admin/CostsTab";
import BlogTab from "./../components/admin/BlogTab";

export default function AdminPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-[#F6F8FC] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#0B1F8A] via-[#1246C9] to-[#1B64F2] bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-[#5B6B8A] mt-2 text-sm md:text-base">
            Manage users, subscriptions, blog posts, and system settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto md:h-14 mb-6 bg-white border border-[#8A94B3]/30 p-1">
          <TabsTrigger 
            value="users"
            className="data-[state=active]:bg-[#FFD84D] data-[state=active]:text-[#0B1F3B] text-[#5B6B8A] py-2"
          >
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="subscriptions"
            className="data-[state=active]:bg-[#FFD84D] data-[state=active]:text-[#0B1F3B] text-[#5B6B8A] py-2"
          >
            Subscriptions
          </TabsTrigger>
          <TabsTrigger 
            value="blog"
            className="data-[state=active]:bg-[#FFD84D] data-[state=active]:text-[#0B1F3B] text-[#5B6B8A] py-2"
          >
            Blog Posts
          </TabsTrigger>
          <TabsTrigger 
            value="usage"
            className="data-[state=active]:bg-[#FFD84D] data-[state=active]:text-[#0B1F3B] text-[#5B6B8A] py-2"
          >
            Usage
          </TabsTrigger>
          <TabsTrigger 
            value="costs"
            className="data-[state=active]:bg-[#FFD84D] data-[state=active]:text-[#0B1F3B] text-[#5B6B8A] py-2"
          >
            AI Costs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersTab />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsTab />
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
          <BlogTab />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageTab />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <CostsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}