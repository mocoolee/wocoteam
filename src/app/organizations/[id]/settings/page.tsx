"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, Users, Settings } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

interface Member {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  role: 'owner' | 'admin' | 'member';
  title: string | null;
}

export default function OrganizationSettingsPage({ params }: { params: { id: string } }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: ""
  });
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    parent_id: null as string | null
  });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadOrganizationData();
  }, []);

  async function loadOrganizationData() {
    try {
      // 加载组织信息
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', params.id)
        .single();

      if (orgError) throw orgError;
      setOrganization(org);
      setFormData({
        name: org.name,
        description: org.description || "",
        logo_url: org.logo_url || ""
      });

      // 加载用户角色
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: roleData } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', params.id)
          .eq('user_id', userData.user.id)
          .single();
        
        setUserRole(roleData?.role || null);
      }

      // 加载部门列表
      const { data: deps, error: depsError } = await supabase
        .from('departments')
        .select('*')
        .eq('organization_id', params.id);

      if (depsError) throw depsError;
      setDepartments(deps || []);

      // 加载成员列表
      const { data: mems, error: memsError } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          title,
          user:profiles (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', params.id);

      if (memsError) throw memsError;
      setMembers(mems || []);

    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateOrganization(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          logo_url: formData.logo_url.trim() || null
        })
        .eq('id', params.id);

      if (error) throw error;

      toast({
        title: "更新成功",
        description: "组织信息已更新",
      });

      loadOrganizationData();
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('departments')
        .insert([{
          name: newDepartment.name.trim(),
          description: newDepartment.description.trim() || null,
          parent_id: newDepartment.parent_id,
          organization_id: params.id
        }]);

      if (error) throw error;

      toast({
        title: "添加成功",
        description: "部门已添加",
      });

      setNewDepartment({
        name: "",
        description: "",
        parent_id: null
      });

      loadOrganizationData();
    } catch (error: any) {
      toast({
        title: "添加失败",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteDepartment(departmentId: string) {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);

      if (error) throw error;

      toast({
        title: "删除成功",
        description: "部门已删除",
      });

      loadOrganizationData();
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    try {
      // 先查找用户
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newMemberEmail.trim())
        .single();

      if (userError) throw new Error("找不到该用户");

      // 添加成员
      const { error } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: params.id,
          user_id: userData.id,
          role: newMemberRole
        }]);

      if (error) throw error;

      toast({
        title: "添加成功",
        description: "成员已添加",
      });

      setNewMemberEmail("");
      setNewMemberRole('member');

      loadOrganizationData();
    } catch (error: any) {
      toast({
        title: "添加失败",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleUpdateMemberRole(memberId: string, newRole: 'admin' | 'member') {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "更新成功",
        description: "成员角色已更新",
      });

      loadOrganizationData();
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "移除成功",
        description: "成员已移除",
      });

      loadOrganizationData();
    } catch (error: any) {
      toast({
        title: "移除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  if (!organization || userRole !== 'owner') {
    return <div className="text-center py-12">没有访问权限</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">组织设置</h1>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            部门管理
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            成员管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateOrganization} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">组织名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">组织描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  />
                </div>

                <Button type="submit">保存更改</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>添加部门</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDepartment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dept-name">部门名称</Label>
                  <Input
                    id="dept-name"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dept-description">部门描述</Label>
                  <Textarea
                    id="dept-description"
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-dept">上级部门</Label>
                  <select
                    id="parent-dept"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newDepartment.parent_id || ""}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, parent_id: e.target.value || null }))}
                  >
                    <option value="">无</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <Button type="submit">添加部门</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <Card key={dept.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{dept.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">删除</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            此操作将删除该部门及其所有关联数据，且无法恢复。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteDepartment(dept.id)}>
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">{dept.description || '暂无描述'}</p>
                  {dept.parent_id && (
                    <p className="text-sm text-gray-500 mt-2">
                      上级部门: {departments.find(d => d.id === dept.parent_id)?.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>添加成员</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member-email">成员邮箱</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-role">角色</Label>
                  <select
                    id="member-role"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'member')}
                  >
                    <option value="member">普通成员</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>

                <Button type="submit">添加成员</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {member.user.avatar_url && (
                      <img
                        src={member.user.avatar_url}
                        alt={member.user.full_name || member.user.email}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    {member.user.full_name || member.user.email}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">角色</p>
                      {member.role === 'owner' ? (
                        <p className="font-medium">所有者</p>
                      ) : (
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 mt-1"
                          value={member.role}
                          onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as 'admin' | 'member')}
                        >
                          <option value="member">普通成员</option>
                          <option value="admin">管理员</option>
                        </select>
                      )}
                    </div>

                    {member.role !== 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">移除成员</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认移除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要移除该成员吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>
                              确认移除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 