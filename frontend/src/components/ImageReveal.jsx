import { motion, useSpring } from 'motion/react';
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ImageReveal() {
  const [img, setImg] = useState({
    src: null,
    alt: '',
    opacity: 0,
  });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const list = [
    {
      img: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80',
      label: 'Casual Style',
      tag: 'Everyday',
      link: '/category/casual'
    },
    {
      img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&q=80',
      label: 'Formal Attire',
      tag: 'Executive',
      link: '/category/formal'
    },
    {
      img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1000&q=80',
      label: 'Party Wear',
      tag: 'Social',
      link: '/category/party-wear'
    },
    {
      img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      label: 'Gym Wear',
      tag: 'Active',
      link: '/category/gym-wear'
    },
  ];

  const spring = {
    stiffness: 150,
    damping: 15,
    mass: 0.1,
  };

  const imagePos = {
    x: useSpring(0, spring),
    y: useSpring(0, spring),
  };

  const handleMove = (e) => {
    if (!imageRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const { clientX, clientY } = e;
    const relativeX = clientX - containerRect.left;
    const relativeY = clientY - containerRect.top;
    imagePos.x.set(relativeX - imageRef.current.offsetWidth / 2);
    imagePos.y.set(relativeY - imageRef.current.offsetHeight / 2);
  };

  const handleImageInteraction = (item, opacity) => {
    setImg({ src: item.img, alt: item.label, opacity });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      className="relative w-full max-w-5xl mx-auto px-6 py-4"
    >
      {list.map((item) => (
        <Link
          key={item.label}
          to={item.link}
          onMouseEnter={() => handleImageInteraction(item, 1)}
          onMouseMove={() => handleImageInteraction(item, 1)}
          onMouseLeave={() => handleImageInteraction(item, 0)}
          className="w-full py-6 cursor-pointer flex justify-between items-center text-white border-b border-white/10 last:border-none group/item transition-colors hover:text-purple-400 dark:hover:text-neonCyan text-left"
        >
          <p className="text-3xl md:text-5xl font-black font-syne uppercase tracking-wide group-hover/item:translate-x-3 transition-transform duration-300">
            {item.label}
          </p>
          <span className="flex items-center gap-2 text-xs md:text-sm font-semibold tracking-wider uppercase text-gray-400 group-hover/item:text-white transition-colors duration-300">
            {item.tag} 
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 dark:bg-neonCyan inline-block group-hover/item:scale-125 transition-transform duration-300"></span>
          </span>
        </Link>
      ))}

      <motion.img
        ref={imageRef}
        src={img.src || null}
        alt={img.alt}
        className="w-[300px] h-[220px] rounded-2xl object-cover absolute top-0 left-0 transition-opacity duration-300 ease-in-out pointer-events-none shadow-[0_15px_50px_rgba(0,0,0,0.5)] border border-white/10 z-30"
        style={{
          x: imagePos.x,
          y: imagePos.y,
          opacity: img.opacity,
        }}
      />
    </div>
  );
}
