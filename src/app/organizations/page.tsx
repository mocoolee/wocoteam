"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  _count?: {
    members: number;
    departments: number;
    projects: number;
  }
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const { data: orgs, error } = await supabase
          .from('organizations')
          .select(`
            *,
            organization_members!inner (id),
            departments (id),
            projects (id)
          `)
          .throwOnError();

        if (error) throw error;

        // 处理数据，添加计数
        const processedOrgs = orgs.map(org => ({
          ...org,
          _count: {
            members: org.organization_members?.length || 0,
            departments: org.departments?.length || 0,
            projects: org.projects?.length || 0
          }
        }));

        setOrganizations(processedOrgs);
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrganizations();
  }, [supabase]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的组织</h1>
        <Button onClick={() => router.push('/organizations/create')}>
          <Plus className="w-4 h-4 mr-2" />
          创建组织
        </Button>
      </div>

      {loading ? (
        <div className="text-center">加载中...</div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">您还没有加入任何组织</p>
          <Button onClick={() => router.push('/organizations/create')}>
            创建第一个组织
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {org.logo_url && (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  {org.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 line-clamp-2 mb-4">
                  {org.description || '暂无描述'}
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
                  <div>
                    <p className="font-medium">{org._count?.members}</p>
                    <p>成员</p>
                  </div>
                  <div>
                    <p className="font-medium">{org._count?.departments}</p>
                    <p>部门</p>
                  </div>
                  <div>
                    <p className="font-medium">{org._count?.projects}</p>
                    <p>项目</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link
                  href={`/organizations/${org.id}`}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  查看详情 →
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 