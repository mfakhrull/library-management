"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserList from "./components/user-list";
import UserForm from "./components/user-form";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Handle selecting a user for editing
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setActiveTab("edit");
  };
  
  // Reset selected user when switching to add tab
  const handleTabChange = (value) => {
    if (value === "add") {
      setSelectedUser(null);
    }
    setActiveTab(value);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <Breadcrumbs items={["Admin", "User Management"]} />
      
      <Card className="border-none shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">User Management</CardTitle>
          <CardDescription>
            Manage all library users - add, edit, delete users, and control their access.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="list">User List</TabsTrigger>
              <TabsTrigger value="add">Add User</TabsTrigger>
              {selectedUser && (
                <TabsTrigger value="edit">Edit User</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              <UserList onEditUser={handleEditUser} />
            </TabsContent>
            
            <TabsContent value="add" className="mt-6">
              <UserForm onSuccess={() => setActiveTab("list")} />
            </TabsContent>
            
            <TabsContent value="edit" className="mt-6">
              {selectedUser && (
                <UserForm 
                  user={selectedUser} 
                  onSuccess={() => setActiveTab("list")} 
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}