"use client";

import Image from "next/image";
import { ArrowRight, Minus, Plus, ShoppingBag, Utensils, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
};

type MenuItem = {
  price_override: number | null;
  sort_order: number;
  products: Product | Product[] | null;
};

type WeeklyMenu = { id: string; title: string; start_date: string; end_date: string };

const sampleProducts: Product[] = [
  {
    id: "sample-pollo-limon",
    name: "Pollo al limón",
    description: "Papas rústicas · Ensalada fresca",
    category: "Clásicas",
    price: 6900,
    image_url: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-bowl-mediterraneo",
    name: "Bowl mediterráneo",
    description: "Garbanzos · Hummus · Vegetales",
    category: "Vegetarianas",
    price: 6500,
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-carne-braseada",
    name: "Carne braseada",
    description: "Puré de boniato · Cebollas dulces",
    category: "Proteicas",
    price: 7400,
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-pasta-huerta",
    name: "Pasta de la huerta",
    description: "Tomates asados · Albahaca · Ricota",
    category: "Vegetarianas",
    price: 6300,
    image_url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85",
  },
];

const sampleMenuItems: MenuItem[] = sampleProducts.map((product, sort_order) => ({
  products: product,
  price_override: null,
  sort_order,
}));

const argentinaToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
}).format(new Date());

const formatPrice = (amount: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(amount);

export default function PublicMenu({ whatsapp }: { whatsapp: string }) {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [menu, setMenu] = useState<WeeklyMenu | null>(configured ? null : {
    id: "sample-weekly-menu",
    title: "Selección ilustrativa",
    start_date: "",
    end_date: "",
  });
  const [items, setItems] = useState<MenuItem[]>(configured ? [] : sampleMenuItems);
  const [category, setCategory] = useState("Todos");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const supabase = useMemo(() => configured ? createClient() : null, [configured]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    async function loadMenu() {
      const { data: menuData, error: menuError } = await client
        .from("weekly_menus")
        .select("id,title,start_date,end_date")
        .eq("status", "published")
        .lte("start_date", argentinaToday())
        .gte("end_date", argentinaToday())
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (menuError) {
        setError(`No pudimos cargar el menú: ${menuError.message}`);
        setLoading(false);
        return;
      }
      if (!menuData) {
        setMenu(null);
        setItems([]);
        setLoading(false);
        return;
      }
      const { data: itemData, error: itemError } = await client
        .from("menu_items")
        .select("price_override,sort_order,products(id,name,description,category,price,image_url)")
        .eq("menu_id", menuData.id)
        .eq("is_available", true)
        .order("sort_order");
      if (!active) return;
      if (itemError) {
        setError(`No pudimos cargar los platos: ${itemError.message}`);
        setLoading(false);
        return;
      }
      setMenu(menuData as WeeklyMenu);
      setItems((itemData ?? []) as MenuItem[]);
      setLoading(false);
    }

    void loadMenu();
    return () => { active = false; };
  }, [supabase]);

  const dishes = items.flatMap((item) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    return product ? [{ ...product, price: item.price_override ?? product.price }] : [];
  });
  const categories = ["Todos", ...new Set(dishes.map((dish) => dish.category))];
  const visibleDishes = category === "Todos" ? dishes : dishes.filter((dish) => dish.category === category);
  const orderItems = dishes.filter((dish) => (quantities[dish.id] ?? 0) > 0);
  const itemCount = orderItems.reduce((count, dish) => count + quantities[dish.id], 0);
  const orderTotal = orderItems.reduce((total, dish) => total + dish.price * quantities[dish.id], 0);

  function changeQuantity(productId: string, change: number) {
    setQuantities((current) => {
      const nextQuantity = Math.min(99, Math.max(0, (current[productId] ?? 0) + change));
      return { ...current, [productId]: nextQuantity };
    });
  }

  function createWhatsAppOrder() {
    const message = [
      `Hola Viandas Florida, quiero hacer un pedido${menu?.title ? ` (${menu.title})` : ""}:`,
      "",
      ...orderItems.map((dish) => `${quantities[dish.id]} x ${dish.name} — ${formatPrice(dish.price * quantities[dish.id])}`),
      "",
      `Total estimado: ${formatPrice(orderTotal)}`,
      ...(orderNote.trim() ? ["", `Nota: ${orderNote.trim()}`] : []),
      "",
      configured
        ? "Entiendo que el pedido queda sujeto a confirmación de disponibilidad y entrega."
        : "Estoy consultando la carta de muestra; por favor, confirmen el menú vigente, los precios y la disponibilidad.",
    ].join("\n");
    const number = new URL(whatsapp).pathname.replaceAll("/", "");
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  useEffect(() => {
    if (!checkoutOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCheckoutOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), textarea:not(:disabled)',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [checkoutOpen]);

  return (
    <section className="menu-section" id="menu">
      <div className="section-heading">
        <div><p className="eyebrow">{menu?.title ?? "Lo que sale de la cocina"}</p><h2>El menú de esta semana</h2></div>
        <p>Platos que reconfortan, ingredientes que reconocés<br className="desktop-only" /> y porciones que realmente llenan.</p>
      </div>
      {!configured && <div className="menu-sample-notice"><strong>Carta de muestra temporal</strong><span>Platos, fotos y precios ilustrativos para probar el pedido. Consultá por WhatsApp el menú vigente y los valores actuales.</span></div>}
      {loading ? <div className="public-menu-message">Cargando el menú de la semana...</div> : error ? <div className="public-menu-message public-menu-error" role="alert">{error}</div> : !menu ? (
        <div className="public-menu-message">Estamos preparando el menú de esta semana. ¡Volvé pronto!</div>
      ) : dishes.length === 0 ? (
        <div className="public-menu-message">El menú semanal fue publicado y pronto agregaremos los platos.</div>
      ) : (
        <>
          <div aria-label="Filtrar platos por categoría" className="category-tabs" role="group">{categories.map((item) => <button aria-pressed={category === item} className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="dish-grid">{visibleDishes.map((dish) => <article className="dish-card" key={dish.id}>
            <div className="dish-image">{dish.image_url ? <Image alt={dish.name} fill sizes="(max-width: 760px) 50vw, 30vw" src={dish.image_url} unoptimized /> : <div className="dish-no-image"><Utensils size={27} /></div>}<span className="dish-tag">{dish.category}</span></div>
            <div className="dish-info"><div><h3>{dish.name}</h3><p>{dish.description}</p></div><strong>{formatPrice(dish.price)}</strong></div>
            <div className="dish-order-controls">
              {(quantities[dish.id] ?? 0) > 0 ? <>
                <button aria-label={`Quitar una porción de ${dish.name}`} onClick={() => changeQuantity(dish.id, -1)}><Minus size={15} /></button>
                <span aria-live="polite">{quantities[dish.id]}</span>
                <button aria-label={`Agregar una porción de ${dish.name}`} onClick={() => changeQuantity(dish.id, 1)}><Plus size={15} /></button>
              </> : <button className="dish-add-button" onClick={() => changeQuantity(dish.id, 1)}><Plus size={14} /> Agregar al pedido</button>}
            </div>
          </article>)}</div>
          <div className="menu-footer"><p>El menú cambia todas las semanas según lo que nos inspira.</p><span className="menu-order-hint">Elegí tus platos y armá el pedido para WhatsApp.</span></div>
        </>
      )}
      {itemCount > 0 && <button aria-label={`Ver pedido: ${itemCount} producto${itemCount === 1 ? "" : "s"}, ${formatPrice(orderTotal)}`} className="order-cart-bar" onClick={() => setCheckoutOpen(true)}>
        <span className="order-cart-count">{itemCount}</span><span>Ver pedido</span><strong>{formatPrice(orderTotal)}</strong><ArrowRight size={17} />
      </button>}
      {checkoutOpen && <div className="order-dialog-backdrop" onClick={() => setCheckoutOpen(false)}>
        <section aria-labelledby="order-dialog-title" aria-modal="true" className="order-dialog" onClick={(event) => event.stopPropagation()} ref={dialogRef} role="dialog" tabIndex={-1}>
          <div className="order-dialog-heading"><div><p className="eyebrow">Tu selección</p><h2 id="order-dialog-title">Tu pedido</h2></div><button aria-label="Cerrar pedido" className="order-dialog-close" onClick={() => setCheckoutOpen(false)} ref={closeButtonRef}><X size={20} /></button></div>
          <div className="order-dialog-items">{orderItems.map((dish) => <div className="order-dialog-item" key={dish.id}>
            <div><strong>{dish.name}</strong><small>{formatPrice(dish.price)} c/u</small></div>
            <div className="order-line-controls"><button aria-label={`Quitar una porción de ${dish.name}`} onClick={() => changeQuantity(dish.id, -1)}><Minus size={13} /></button><span>{quantities[dish.id]}</span><button aria-label={`Agregar una porción de ${dish.name}`} onClick={() => changeQuantity(dish.id, 1)}><Plus size={13} /></button></div>
            <strong>{formatPrice(dish.price * quantities[dish.id])}</strong>
          </div>)}</div>
          <label className="order-note-field">Nota para el pedido <span>opcional</span><textarea maxLength={250} onChange={(event) => setOrderNote(event.target.value)} placeholder="Aclaraciones sobre tu pedido" rows={3} value={orderNote} /></label>
          <div className="order-total"><span>Total estimado</span><strong>{formatPrice(orderTotal)}</strong></div>
          <p className="order-confirmation-note">El envío y la disponibilidad se confirman por WhatsApp. El pedido todavía no está confirmado.</p>
          {orderItems.length > 0 ? <a className="order-whatsapp-button" href={createWhatsAppOrder()} rel="noreferrer" target="_blank"><ShoppingBag size={17} /> {configured ? "Continuar por WhatsApp" : "Consultar esta muestra por WhatsApp"} <ArrowRight size={16} /></a> : <button className="order-whatsapp-button" onClick={() => setCheckoutOpen(false)}>Volver al menú</button>}
        </section>
      </div>}
    </section>
  );
}
