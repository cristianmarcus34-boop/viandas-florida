"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import PublicMenu from "@/app/public-menu";

const whatsapp = "https://wa.me/5491128386926?text=Hola%20Viandas%20Florida%2C%20quiero%20hacer%20un%20pedido";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Viandas Florida, inicio"><Image alt="" aria-hidden="true" className="brand-logo" height={44} src="/imagenes/logoredondoviandas.jpeg" width={44} /><span className="brand-name"><span>viandas</span> florida<span className="brand-dot">.</span></span></a>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"}>
          <a href="#menu" onClick={() => setMenuOpen(false)}>El menú</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a><a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
        </nav>
        <a className="header-order" href={whatsapp} target="_blank" rel="noreferrer">Pedí tu vianda <ArrowRight size={16} /></a>
        <button aria-expanded={menuOpen} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy"><p className="eyebrow">Comida real, todos los días <span>✳</span></p><h1>Comer bien<br /><em>te queda cerca.</em></h1><p className="hero-text">Viandas caseras, abundantes y listas para disfrutar. Cocinamos como en casa para que vos tengas una cosa menos de qué ocuparte.</p><div className="hero-actions"><a className="button button-dark" href="#menu">Ver el menú <ArrowRight size={17} /></a><a className="text-link" href="#como-funciona">Conocé cómo funciona <ChevronDown size={16} /></a></div><div className="hero-note"><MessageCircle size={25} /><p><strong>Pedido directo</strong><br />Lo coordinamos por WhatsApp.</p></div></div>
        <div className="hero-visual"><div className="hero-image"><Image src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=90" alt="Bowl colorido de comida casera" fill priority sizes="(max-width: 760px) 100vw, 45vw" unoptimized /></div><div className="floating-card"><span className="card-icon"><MessageCircle size={17} /></span><p><strong>Pedidos por WhatsApp</strong><br />Consultá disponibilidad</p></div><span className="scribble">hecho<br /><em>con cariño</em></span></div>
      </section>

      <section className="marquee" aria-label="Características"><span>Fresco</span><i>✳</i><span>Casero</span><i>✳</i><span>Abundante</span><i>✳</i><span>Rico</span><i>✳</i><span>Fresco</span></section>

      <PublicMenu whatsapp={whatsapp} />

      <section className="process-section" id="como-funciona"><div className="process-intro"><p className="eyebrow">Así de simple</p><h2>Tu almuerzo,<br /><em>resuelto.</em></h2><p>Elegís, pedís y disfrutás. Sin cocinar, sin pensar qué comer y sin resignar sabor.</p><a className="button button-light" href={whatsapp} target="_blank" rel="noreferrer">Hacer un pedido <MessageCircle size={17} /></a></div><div className="steps"><div className="step"><span>01</span><h3>Elegí tus viandas</h3><p>Mirás el menú semanal y elegís tus platos favoritos.</p></div><div className="step"><span>02</span><h3>Escribinos por WhatsApp</h3><p>Te confirmamos disponibilidad y coordinamos el envío.</p></div><div className="step"><span>03</span><h3>Recibí y disfrutá</h3><p>Te llegan listas para calentar, servir y disfrutar.</p></div></div></section>
      <section className="closing-section" id="contacto"><div><p className="eyebrow">Para vos, para todos los días</p><h2>Una buena comida<br /><em>cambia el día.</em></h2></div><a className="circle-cta" href={whatsapp} target="_blank" rel="noreferrer">Pedí ahora <ArrowRight /></a></section>
      <footer className="site-footer"><a className="brand" href="#inicio"><Image alt="" aria-hidden="true" className="brand-logo" height={24} src="/imagenes/logoredondoviandas.jpeg" width={24} /><span className="brand-name"><span>viandas</span> florida<span className="brand-dot">.</span></span></a><p>Viandas caseras hechas con cariño.</p><div className="footer-credit"><Image src="/iconos/logo-agenciadigitalpowa-redondo.png" alt="" width={18} height={18} /><span>Desarrollo Agencia Digital Powa</span></div><div className="footer-links"><a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a><a href="#inicio">Volver arriba ↑</a><Link aria-label="Acceso al panel de administración" className="footer-admin-link" href="/admin/login">Admin</Link></div></footer>
    </main>
  );
}
