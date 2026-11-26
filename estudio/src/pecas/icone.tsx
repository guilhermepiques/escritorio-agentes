import React from 'react';
import { icons } from 'lucide-react';
import type { PropsPeca } from '../tipos';
import { useMovimento, type Movimento } from './emoji';

type Dados = { nome: string; tamanho?: number; cor?: string; movimento?: Movimento; espessura?: number };

/** "alarm-clock" ou "AlarmClock" → componente do Lucide (lucide.dev/icons). */
function acharIcone(nome: string) {
  const pascal = String(nome)
    .split(/[-_\s]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  return (icons as Record<string, React.FC<{ size?: number; color?: string; strokeWidth?: number }>>)[pascal];
}

export const Icone: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => {
  const transform = useMovimento(dados.movimento);
  const Comp = acharIcone(dados.nome);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', transform }}>
      {Comp ? (
        <Comp size={dados.tamanho ?? 260} color={dados.cor ?? estilo.cores.destaque} strokeWidth={dados.espessura ?? 2.2} />
      ) : (
        <div style={{ color: 'red', fontSize: 50, background: '#fff', padding: 20 }}>ÍCONE NÃO EXISTE: {dados.nome}</div>
      )}
    </div>
  );
};
