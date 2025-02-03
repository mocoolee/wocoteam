"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export default function CreateOrganizationPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: ""
  });
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 验证表单
      if (!formData.name.trim()) {
        throw new Error("组织名称不能为空");
      }

      // 创建组织
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          logo_url: formData.logo_url.trim() || null
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 自动添加创建者为管理员的逻辑已经通过触发器实现

      toast({
        title: "创建成功",
        description: "组织已创建成功！",
      });

      // 跳转到组织详情页
      router.push(`/organizations/${org.id}`);
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">创建新组织</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">组织名称</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="输入组织名称"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">组织描述</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="描述你的组织（可选）"
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
            placeholder="输入logo图片URL（可选）"
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "创建中..." : "创建组织"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            取消
          </Button>
        </div>
      </form>
    </div>
  );
} 