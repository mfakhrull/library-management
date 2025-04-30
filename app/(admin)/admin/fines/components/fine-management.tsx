"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FineSettings } from "./fine-settings";
import { FineList } from "./fine-list";
import { FineReports } from "./fine-reports";

export function FineManagement() {
  return (
    <Tabs defaultValue="fines" className="space-y-4">
      <TabsList>
        <TabsTrigger value="fines">Fines List</TabsTrigger>
        <TabsTrigger value="settings">Fine Settings</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="fines" className="space-y-4">
        <FineList />
      </TabsContent>
      <TabsContent value="settings" className="space-y-4">
        <FineSettings />
      </TabsContent>
      <TabsContent value="reports" className="space-y-4">
        <FineReports />
      </TabsContent>
    </Tabs>
  );
}