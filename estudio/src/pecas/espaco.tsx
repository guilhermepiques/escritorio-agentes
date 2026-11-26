import React from 'react';
import type { PropsPeca } from '../tipos';

/** Espaço vazio entre peças (altura em px). */
export const Espaco: React.FC<PropsPeca<{ altura?: number }>> = ({ dados }) => <div style={{ height: dados.altura ?? 60 }} />;
