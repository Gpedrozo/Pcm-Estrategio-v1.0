import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText, FilePlus, FileCheck, Clock, Activity, Gauge,
  Target, TrendingUp, DollarSign, Calendar, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardData {
  osAbertas: number;
  osEmAndamento: number;
  osFechadas: number;
  osTotal: number;
  equipamentosAtivos: number;
  planosAtivos: number;
  osRecentes: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    osAbertas: 0, osEmAndamento: 0, osFechadas: 0, osTotal: 0,
    equipamentosAtivos: 0, planosAtivos: 0, osRecentes: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [osRes, equipRes, planosRes] = await Promise.all([
          supabase.from('ordens_servico').select('id, numero_os, tipo, prioridade, tag, equipamento, status, data_solicitacao').order('created_at', { ascending: false }).limit(100),
          supabase.from('equipamentos').select('id').eq('ativo', true),
          supabase.from('planos_preventivos').select('id').eq('ativo', true),
        ]);

        const os = osRes.data || [];
        setData({
          osAbertas: os.filter(o => o.status === 'ABERTA').length,
          osEmAndamento: os.filter(o => o.status === 'EM_ANDAMENTO').length,
          osFechadas: os.filter(o => o.status === 'FECHADA').length,
          osTotal: os.length,
          equipamentosAtivos: equipRes.data?.length || 0,
          planosAtivos: planosRes.data?.length || 0,
          osRecentes: os.slice(0, 10),
        });
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const indicators = [
    { title: 'OS Abertas', value: data.osAbertas, icon: FileText, color: 'text-warning' },
    { title: 'Em Andamento', value: data.osEmAndamento, icon: Clock, color: 'text-info' },
    { title: 'Fechadas (mês)', value: data.osFechadas, icon: FileCheck, color: 'text-success' },
    { title: 'Total de OS', value: data.osTotal, icon: Activity, color: 'text-primary' },
    { title: 'Equipamentos', value: data.equipamentosAtivos, icon: Gauge, color: 'text-industrial-highlight' },
    { title: 'Planos Ativos', value: data.planosAtivos, icon: Calendar, color: 'text-primary' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ABERTA: 'status-aberta',
      EM_ANDAMENTO: 'status-andamento',
      FECHADA: 'status-fechada',
      AGUARDANDO_MATERIAL: 'status-aguardando',
      AGUARDANDO_APROVACAO: 'status-aguardando',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${map[status] || ''}`}>{status.replace(/_/g, ' ')}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Bem-vindo, {user?.nome}. Visão geral do sistema de manutenção.</p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {indicators.map((ind) => (
          <Card key={ind.title} className="card-industrial">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ind.icon className={`h-5 w-5 ${ind.color}`} />
              </div>
              <div className="text-2xl font-bold font-mono">{ind.value}</div>
              <div className="text-xs text-muted-foreground">{ind.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/os/nova">
          <Button className="w-full h-12 btn-industrial gap-2">
            <FilePlus className="h-4 w-4" /> Nova O.S
          </Button>
        </Link>
        <Link to="/os/fechar">
          <Button variant="outline" className="w-full h-12 btn-industrial-secondary gap-2">
            <FileCheck className="h-4 w-4" /> Fechar O.S
          </Button>
        </Link>
        <Link to="/backlog">
          <Button variant="outline" className="w-full h-12 btn-industrial-secondary gap-2">
            <Target className="h-4 w-4" /> Backlog
          </Button>
        </Link>
        <Link to="/relatorios">
          <Button variant="outline" className="w-full h-12 btn-industrial-secondary gap-2">
            <TrendingUp className="h-4 w-4" /> Relatórios
          </Button>
        </Link>
      </div>

      {/* OS Recentes */}
      <Card className="card-industrial">
        <CardHeader>
          <CardTitle className="text-lg">Últimas Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          {data.osRecentes.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhuma ordem de serviço encontrada. Crie a primeira!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-industrial">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Tipo</th>
                    <th>TAG</th>
                    <th>Equipamento</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.osRecentes.map((os) => (
                    <tr key={os.id}>
                      <td className="font-mono font-medium">{os.numero_os}</td>
                      <td><Badge variant="outline">{os.tipo}</Badge></td>
                      <td className="font-mono">{os.tag}</td>
                      <td>{os.equipamento}</td>
                      <td><Badge variant={os.prioridade === 'URGENTE' ? 'destructive' : 'secondary'}>{os.prioridade}</Badge></td>
                      <td>{statusBadge(os.status)}</td>
                      <td className="text-muted-foreground">{new Date(os.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
