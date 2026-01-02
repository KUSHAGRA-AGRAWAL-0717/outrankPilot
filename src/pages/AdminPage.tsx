// AdminPage.tsx - COMPLETE ADMIN DASHBOARD
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "./../components/admin/UsersTab";
import SubscriptionsTab from "./../components/admin/SubscriptionsTab";
import UsageTab from "./../components/admin/UsageTab";
import FlagsTab from "./../components/admin/FlagsTab";
import LogsTab from "./../components/admin/LogsTab";
import CostsTab from "./../components/admin/CostsTab";
import WhiteLabelTab from "./../components/admin/WhiteLabelTab";

export default function AdminPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage users, subscriptions, and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 h-14 mb-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="flags">Flags</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="costs">AI Costs</TabsTrigger>
          <TabsTrigger value="whitelabel">White-label</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersTab />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsTab />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageTab />
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          <FlagsTab />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <LogsTab />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <CostsTab />
        </TabsContent>

        <TabsContent value="whitelabel" className="space-y-4">
          <WhiteLabelTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
