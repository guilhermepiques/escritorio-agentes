import React from 'react';
import type { PropsPeca } from '../tipos';
import { fonte } from '../estilos/fontes';

type Dados = { texto: string; cor?: string; corTexto?: string };

export const Etiqueta: React.FC<PropsPeca<Dados>> = ({ dados, estilo }) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <div
      style={{
        ...fonte(estilo.fonteApoio),
        fontSize: 46,
        padding: '12px 34px',
        borderRadius: 999,
        background: dados.cor ?? estilo.cores.contorno,
        color: dados.corTexto ?? estilo.cores.destaque,
        textTransform: 'uppercase',
        letterSpacing: 2,
      }}
    >
      {dados.texto}
    </div>
  </div>
);
