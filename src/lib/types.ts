export type Usuario = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  tipo: 'cliente' | 'dono_bomba' | 'admin';
  status: 'pendente' | 'aprovado' | 'rejeitado';
  criado_em: string;
};

export type Bomba = {
  id: string;
  uid_dono: string;
  nome_dono: string;
  cidade: string;
  estado: string;
  tipo: string;
  capacidade: '500' | '1000' | '2000';
  status: 'aprovado' | 'pendente' | 'rejeitado';
  cidades_atendidas: string[];
  telefone_dono: string;
  criado_em: string;
};

export type Solicitacao = {
  id: string;
  uid_cliente: string;
  nome_cliente: string;
  telefone_cliente: string;
  uid_dono_bomba: string;
  nome_dono_bomba: string;
  telefone_dono: string;
  uid_bomba: string;
  capacidade: string;
  volume: number;
  data_servico: string;
  hora_servico: string;
  observacoes: string;
  status: 'agendado' | 'finalizado' | 'cancelado' | 'aceita' | 'pendente' | 'recusada';
  criado_em: string;
};

export type Ordem = {
  id: string;
  numero_ordem: number;
  uid_cliente: string;
  nome_cliente: string;
  telefone_cliente: string;
  uid_dono_bomba: string;
  nome_dono_bomba: string;
  telefone_dono: string;
  capacidade: string;
  volume: number;
  data_servico: string;
  hora_servico: string;
  status: 'agendado' | 'finalizado';
  criado_em: string;
};

export const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];
