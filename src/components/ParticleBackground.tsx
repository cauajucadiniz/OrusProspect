import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  density: number;
  opacity: number;
  color: string;
}

export function ParticleBackground({ scrollContainerRef }: { scrollContainerRef: React.RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let particlesArray: Particle[] = [];
    
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 40 : 120;
    
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    let mouse = {
      x: -1000,
      y: -1000,
      radius: isMobile ? 0 : 150
    };
    
    let scrollOffset = 0;
    let lastScrollTop = 0;
    
    const colors = ['#C9B076', '#E6D5A7', '#8C7541', '#ffffff'];

    const init = () => {
      particlesArray = [];
      for (let i = 0; i < particleCount; i++) {
        let size = (Math.random() * (isMobile ? 1 : 2)) + 0.5;
        let x = Math.random() * w;
        let y = Math.random() * h;
        let density = (Math.random() * 30) + 1;
        let opacity = Math.random() * 0.5 + 0.1;
        let color = colors[Math.floor(Math.random() * colors.length)];
        particlesArray.push({ x, y, size, baseX: x, baseY: y, density, opacity, color });
      }
    };
    
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      
      for (let i = 0; i < particlesArray.length; i++) {
        const p = particlesArray[i];
        
        ctx.beginPath();
        ctx.arc(p.x, p.y + scrollOffset * (p.density * 0.05), p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        // Check mouse collision
        if (!isMobile) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - (p.y + scrollOffset * (p.density * 0.05)); 
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            ctx.globalAlpha = p.opacity;
            
            if (distance < mouse.radius) {
              ctx.globalAlpha = 0.8;
              ctx.shadowBlur = 10;
              ctx.shadowColor = p.color;
              
              const forceDirectionX = dx / distance;
              const forceDirectionY = dy / distance;
              
              const maxDistance = mouse.radius;
              const force = (maxDistance - distance) / maxDistance;
              const directionX = forceDirectionX * force * p.density;
              const directionY = forceDirectionY * force * p.density;
              
              // Repel
              p.x -= directionX;
              p.baseY -= directionY; // Modify baseY to persist the repel across scroll
            } else {
              ctx.shadowBlur = 0;
              // Return to base
              if (p.x !== p.baseX) {
                let dx = p.x - p.baseX;
                p.x -= dx / 10;
              }
              if (p.baseY !== p.y) {
                 let dy = p.baseY - p.y;
                 p.baseY -= dy / 10;
              }
            }
        }
        
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }
      
      // Connect nearby particles
      if (!isMobile) {
          for (let i = 0; i < particlesArray.length; i++) {
            for (let j = i; j < particlesArray.length; j++) {
                const p1 = particlesArray[i];
                const p2 = particlesArray[j];
                const p1y = p1.y + scrollOffset * (p1.density * 0.05);
                const p2y = p2.y + scrollOffset * (p2.density * 0.05);
                
                const dx = p1.x - p2.x;
                const dy = p1y - p2y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 80) {
                  ctx.beginPath();
                  ctx.strokeStyle = p1.color;
                  ctx.lineWidth = 0.2;
                  ctx.globalAlpha = 0.1 * (1 - distance / 80);
                  ctx.moveTo(p1.x, p1y);
                  ctx.lineTo(p2.x, p2y);
                  ctx.stroke();
                  ctx.globalAlpha = 1;
                }
            }
          }
      }
      
      requestAnimationFrame(draw);
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      init();
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    
    const handleClick = (e: MouseEvent) => {
      // Create a small burst effect on click
      for(let i=0; i<30; i++) {
         let size = (Math.random() * 3) + 1;
         let x = e.clientX + (Math.random() * 40 - 20);
         let y = e.clientY + (Math.random() * 40 - 20);
         // Find actual Y ignoring scroll
         // y = baseY + scrollOffset * density
         // baseY = y - scrollOffset * density
         let density = (Math.random() * 20) + 10;
         let baseY = y - scrollOffset * (density * 0.05);
         
         particlesArray.push({ 
           x, y: baseY, size, baseX: x, baseY: baseY, 
           density, opacity: 1, color: colors[Math.floor(Math.random() * colors.length)] 
         });
      }
    };

    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const currentScroll = scrollContainerRef.current.scrollTop;
        // Parallax effect: negative means particles move UP when we scroll down
        scrollOffset = -currentScroll;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('click', handleClick);
    
    const container = scrollContainerRef.current;
    if (container) {
       container.addEventListener('scroll', handleScroll);
    }
    
    init();
    draw();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      if (container) {
         container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [scrollContainerRef]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0" 
    />
  );
}
