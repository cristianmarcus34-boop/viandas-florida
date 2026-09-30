"use client";

import { ArrowRight, Camera, ChevronDown, Clock3, Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";

const categories = ["Todos", "Clásicas", "Vegetarianas", "Proteicas"];
const dishes = [
  { name: "Pollo al limón", detail: "Papas rústicas · Ensalada fresca", category: "Clásicas", price: "$6.900", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85" },
  { name: "Bowl mediterráneo", detail: "Garbanzos · Hummus · Vegetales", category: "Vegetarianas", price: "$6.500", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85" },
  { name: "Carne braseada", detail: "Puré de boniato · Cebollas dulces", category: "Proteicas", price: "$7.400", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85" },
  { name: "Pasta de la huerta", detail: "Tomates asados · Albahaca · Ricota", category: "Vegetarianas", price: "$6.300", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85" },
];
const whatsapp = "https://wa.me/5491128386926?text=Hola%20Viandas%20Florida%2C%20quiero%20hacer%20un%20pedido";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleDishes = activeCategory === "Todos" ? dishes : dishes.filter((dish) => dish.category === activeCategory);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Viandas Florida, inicio"><span>viandas</span> florida<span className="brand-dot">.</span></a>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"}>
          <a href="#menu" onClick={() => setMenuOpen(false)}>El menú</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a><a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
        </nav>
        <a className="header-order" href={whatsapp} target="_blank" rel="noreferrer">Pedí tu vianda <ArrowRight size={16} /></a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy"><p className="eyebrow">Comida real, todos los días <span>✳</span></p><h1>Comer bien<br /><em>te queda cerca.</em></h1><p className="hero-text">Viandas caseras, abundantes y listas para disfrutar. Cocinamos como en casa para que vos tengas una cosa menos de qué ocuparte.</p><div className="hero-actions"><a className="button button-dark" href="#menu">Ver el menú <ArrowRight size={17} /></a><a className="text-link" href="#como-funciona">Conocé cómo funciona <ChevronDown size={16} /></a></div><div className="hero-note"><div className="note-avatars"><span>AG</span><span>LM</span><span>+2k</span></div><p><strong>4.9/5</strong> de nuestros clientes<br />vuelven a pedir.</p></div></div>
        <div className="hero-visual"><div className="hero-image"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=90" alt="Bowl colorido de comida casera" /></div><div className="floating-card"><span className="card-icon"><Clock3 size={17} /></span><p><strong>Entregas de lunes a viernes</strong><br />En Florida y alrededores</p></div><span className="scribble">hecho<br /><em>con cariño</em></span></div>
      </section>

      <section className="marquee" aria-label="Características"><span>Fresco</span><i>✳</i><span>Casero</span><i>✳</i><span>Abundante</span><i>✳</i><span>Rico</span><i>✳</i><span>Fresco</span></section>

      <section className="menu-section" id="menu"><div className="section-heading"><div><p className="eyebrow">Lo que sale de la cocina</p><h2>El menú de esta semana</h2></div><p>Platos que reconfortan, ingredientes que reconocés<br className="desktop-only" /> y porciones que realmente llenan.</p></div><div className="category-tabs">{categories.map((category) => <button className={activeCategory === category ? "active" : ""} key={category} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><div className="dish-grid">{visibleDishes.map((dish) => <article className="dish-card" key={dish.name}><div className="dish-image"><img src={dish.image} alt={dish.name} /><span className="dish-tag">{dish.category}</span></div><div className="dish-info"><div><h3>{dish.name}</h3><p>{dish.detail}</p></div><strong>{dish.price}</strong></div></article>)}</div><div className="menu-footer"><p>El menú cambia todas las semanas según lo que nos inspira.</p><a className="text-link" href={whatsapp} target="_blank" rel="noreferrer">Pedí el menú completo <ArrowRight size={16} /></a></div></section>

      <section className="process-section" id="como-funciona"><div className="process-intro"><p className="eyebrow">Así de simple</p><h2>Tu almuerzo,<br /><em>resuelto.</em></h2><p>Elegís, pedís y disfrutás. Sin cocinar, sin pensar qué comer y sin resignar sabor.</p><a className="button button-light" href={whatsapp} target="_blank" rel="noreferrer">Hacer un pedido <MessageCircle size={17} /></a></div><div className="steps"><div className="step"><span>01</span><h3>Elegí tus viandas</h3><p>Mirás el menú semanal y elegís tus platos favoritos.</p></div><div className="step"><span>02</span><h3>Escribinos por WhatsApp</h3><p>Te confirmamos disponibilidad y coordinamos el envío.</p></div><div className="step"><span>03</span><h3>Recibí y disfrutá</h3><p>Te llegan listas para calentar, servir y disfrutar.</p></div></div></section>
      <section className="closing-section" id="contacto"><div><p className="eyebrow">Para vos, para todos los días</p><h2>Una buena comida<br /><em>cambia el día.</em></h2></div><a className="circle-cta" href={whatsapp} target="_blank" rel="noreferrer">Pedí ahora <ArrowRight /></a></section>
      <footer className="site-footer"><a className="brand" href="#inicio"><span>viandas</span> florida<span className="brand-dot">.</span></a><p>Comida casera en Florida y alrededores.</p><div className="footer-links"><a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a><a href="#contacto"><Camera size={15} /> Instagram</a><a href="#inicio">Volver arriba ↑</a></div></footer>
    </main>
  );
}
