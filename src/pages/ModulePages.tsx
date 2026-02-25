import { Card, CardContent } from '@/components/ui/card';
const page = (title: string, subtitle: string) => () => (
  <div className="space-y-6">
    <div className="page-header"><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>
    <Card className="card-industrial"><CardContent className="p-8 text-center text-muted-foreground">Módulo em desenvolvimento. Em breve disponível.</CardContent></Card>
  </div>
);
export const Solicitacoes = page('Solicitações de Serviço', 'Gerencie solicitações de manutenção');
export const Backlog = page('Backlog de Manutenção', 'Ordens pendentes de programação');
export const Programacao = page('Programação', 'Calendário de manutenção programada');
export const Preventiva = page('Manutenção Preventiva', 'Planos e execuções preventivas');
export const Preditiva = page('Manutenção Preditiva', 'Monitoramento e análises preditivas');
export const Inspecoes = page('Inspeções', 'Roteiros e execuções de inspeção');
export const FMEA = page('FMEA / RCM', 'Análise de modos e efeitos de falha');
export const RCA = page('Análise de Causa Raiz', 'Investigação de falhas e 5 Porquês');
export const Melhorias = page('Melhorias', 'Projetos de melhoria contínua');
export const Hierarquia = page('Hierarquia de Ativos', 'Estrutura organizacional dos equipamentos');
export const Mecanicos = page('Mecânicos', 'Cadastro de mecânicos e técnicos');
export const Materiais = page('Materiais e Peças', 'Controle de estoque e peças');
export const Fornecedores = page('Fornecedores', 'Cadastro de fornecedores');
export const Contratos = page('Contratos', 'Gestão de contratos de manutenção');
export const DocumentosTecnicos = page('Documentos Técnicos', 'POPs, manuais e procedimentos');
export const Lubrificacao = page('Lubrificação', 'Planos e controle de lubrificação');
export const Custos = page('Custos de Manutenção', 'Análise de custos por TAG e período');
export const Relatorios = page('Relatórios', 'Relatórios gerenciais e operacionais');
export const SSMA = page('SSMA', 'Segurança, Saúde e Meio Ambiente');
export const Usuarios = page('Usuários', 'Gerenciamento de usuários do sistema');
export const Auditoria = page('Auditoria', 'Log de ações realizadas no sistema');
export const MasterTI = page('Painel Master TI', 'Configurações avançadas do sistema');
