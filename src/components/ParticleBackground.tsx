import React from 'react';

export function ParticleBackground({ scrollContainerRef }: { scrollContainerRef: React.RefObject<HTMLElement | null> }) {
  // O componente original de canvas foi substituído por um gradiente CSS puro
  // para melhor performance (60fps mobile e desktop).
  // Os gradientes principais já estão sendo renderizados no App.tsx.
  return null;
}

