"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Archive, ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronDown,
  CirclePlus, LayoutDashboard, LogOut, Package, Pencil, Plus, Save,
  Search, Upload, Utensils, X,
} from "lucide-react";
import { ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

type WeeklyMenu = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

type MenuItem = {
  product_id: string;
  price_override: number | null;
  sort_order: number;
};

type Section = "overview" | "products" | "menus";
type MenuDraftItem = { selected: boolean; price: string };

const categories = ["Clásicas", "Vegetarianas", "Proteicas"];
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
const formatPrice = (amount: number) => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
}).format(amount);
const formatDate = (value: string) => new Intl.DateTimeFormat("es-AR", {
  day: "numeric", month: "short", timeZone: "UTC",
}).format(new Date(`${value}T00:00:00Z`));

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [section, setSection] = useState<Section>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [menus, setMenus] = useState<WeeklyMenu[]>([]);
  const [menuCounts, setMenuCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [productEditing, setProductEditing] = useState<Product | null | undefined>(undefined);
  const [menuEditing, setMenuEditing] = useState<WeeklyMenu | null | undefined>(undefined);
  const [menuItems, setMenuItems] = useState<Record<string, MenuDraftItem>>({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const [productResult, menuResult, itemResult] = await Promise.all([
      supabase.from("products").select("id,name,description,category,price,image_url,is_active,created_at").order("created_at", { ascending: false }),
      supabase.from("weekly_menus").select("id,title,start_date,end_date,status,updated_at").order("start_date", { ascending: false }),
      supabase.from("menu_items").select("menu_id"),
    ]);
    const loadError = productResult.error || menuResult.error || itemResult.error;
    if (loadError) {
      setError(`No se pudieron cargar los datos: ${loadError.message}`);
      setLoading(false);
      return;
    }
    const loadedMenus = (menuResult.data ?? []) as WeeklyMenu[];
    const counts = (itemResult.data ?? []).reduce<Record<string, number>>((result, item) => {
      result[item.menu_id] = (result[item.menu_id] ?? 0) + 1;
      return result;
    }, {});
    setProducts((productResult.data ?? []) as Product[]);
    setMenus(loadedMenus);
    setMenuCounts(counts);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { queueMicrotask(() => { void loadData(); }); }, [loadData]);

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(`No se pudo cerrar la sesión: ${signOutError.message}`);
      return;
    }
    router.replace("/admin/login");
    router.refresh();
  }

  async function editMenu(menu: WeeklyMenu | null) {
    setError("");
    setMenuEditing(menu);
    if (!menu) {
      const start = new Date();
      const day = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setMenuItems({});
      setMenuEditing({
        id: crypto.randomUUID(),
        title: "",
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        status: "draft",
        updated_at: new Date().toISOString(),
      });
      return;
    }
    const { data, error: itemError } = await supabase
      .from("menu_items")
      .select("product_id,price_override,sort_order")
      .eq("menu_id", menu.id)
      .order("sort_order");
    if (itemError) {
      setError(`No se pudieron cargar los platos del menú: ${itemError.message}`);
      setMenuEditing(undefined);
      return;
    }
    const selected = (data ?? []) as MenuItem[];
    setMenuItems(Object.fromEntries(selected.map((item) => [
      item.product_id,
      { selected: true, price: item.price_override?.toString() ?? "" },
    ])));
  }

  const currentMenu = menus.find((menu) => menu.status === "published" && menu.start_date <= today() && menu.end_date >= today());
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand admin-brand" href="/"><span>viandas</span> florida<span className="brand-dot">.</span></Link>
        <span className="admin-sidebar-label">GESTIÓN</span>
        <nav className="admin-nav" aria-label="Administración">
          <button className={section === "overview" ? "active" : ""} onClick={() => { setSection("overview"); setProductEditing(undefined); setMenuEditing(undefined); }}><LayoutDashboard size={17} /> Resumen</button>
          <button className={section === "products" ? "active" : ""} onClick={() => { setSection("products"); setProductEditing(undefined); setMenuEditing(undefined); }}><Package size={17} /> Productos <span>{products.length}</span></button>
          <button className={section === "menus" ? "active" : ""} onClick={() => { setSection("menus"); setProductEditing(undefined); setMenuEditing(undefined); }}><CalendarDays size={17} /> Menús semanales <span>{menus.length}</span></button>
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-status-dot" /> Panel conectado
          <Link href="/">Ver sitio público <ArrowUpRight size={14} /></Link>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">Viandas Florida <span>/</span> {section === "overview" ? "Resumen" : section === "products" ? "Productos" : "Menús semanales"}</div>
          <button className="admin-logout" onClick={signOut}><LogOut size={16} /> Cerrar sesión</button>
        </header>

        <div className="admin-page-content">
          {error && <div className="admin-notice admin-notice-error" role="alert">{error}<button aria-label="Cerrar aviso" onClick={() => setError("")}><X size={16} /></button></div>}
          {loading ? <div className="admin-loading"><span className="admin-spinner" /> Cargando tu panel...</div> : (
            <>
              {section === "overview" && (
                <Overview
                  activeProducts={products.filter((product) => product.is_active).length}
                  currentMenu={currentMenu}
                  menus={menus}
                  productCount={products.length}
                  onEditMenu={(menu) => { setSection("menus"); void editMenu(menu); }}
                  onNewMenu={() => { setSection("menus"); void editMenu(null); }}
                  onViewProducts={() => setSection("products")}
                  onViewMenus={() => setSection("menus")}
                />
              )}
              {section === "products" && (
                productEditing !== undefined ? (
                  <ProductEditor
                    product={productEditing}
                    saving={saving}
                    onCancel={() => setProductEditing(undefined)}
                    onSave={async (event) => {
                      event.preventDefault();
                      setSaving(true);
                      setError("");
                      const form = new FormData(event.currentTarget);
                      const name = String(form.get("name")).trim();
                      const description = String(form.get("description")).trim();
                      const category = String(form.get("category"));
                      const price = Number(form.get("price"));
                      const active = form.get("is_active") === "on";
                      if (name.length < 2 || description.length > 500 || !categories.includes(category) || !Number.isSafeInteger(price) || price < 0 || price > 2147483647) {
                        setError("Ingresá un nombre válido y un precio entero entre 0 y 2.147.483.647.");
                        setSaving(false);
                        return;
                      }

                      let imageUrl = productEditing?.image_url ?? null;
                      const image = form.get("image");
                      let uploadedPath: string | null = null;
                      if (image instanceof File && image.size > 0) {
                        if (!["image/jpeg", "image/png", "image/webp"].includes(image.type) || image.size > 5 * 1024 * 1024) {
                          setError("La imagen debe ser JPG, PNG o WebP y pesar hasta 5 MB.");
                          setSaving(false);
                          return;
                        }
                        const extension = image.type.split("/")[1].replace("jpeg", "jpg");
                        uploadedPath = `${crypto.randomUUID()}.${extension}`;
                        const { error: uploadError } = await supabase.storage.from("dish-images").upload(uploadedPath, image, { contentType: image.type, upsert: false });
                        if (uploadError) {
                          setError(`No se pudo subir la imagen: ${uploadError.message}`);
                          setSaving(false);
                          return;
                        }
                        imageUrl = supabase.storage.from("dish-images").getPublicUrl(uploadedPath).data.publicUrl;
                      }

                      const values = { name, description, category, price, image_url: imageUrl, is_active: active, updated_at: new Date().toISOString() };
                      const result = productEditing
                        ? await supabase.from("products").update(values).eq("id", productEditing.id)
                        : await supabase.from("products").insert(values);
                      if (result.error) {
                        if (uploadedPath) await supabase.storage.from("dish-images").remove([uploadedPath]);
                        setError(`No se pudo guardar el producto: ${result.error.message}`);
                        setSaving(false);
                        return;
                      }
                      setProductEditing(undefined);
                      setSaving(false);
                      await loadData();
                    }}
                  />
                ) : (
                  <ProductsPanel
                    products={filteredProducts}
                    search={search}
                    onSearch={setSearch}
                    onAdd={() => setProductEditing(null)}
                    onEdit={(product) => setProductEditing(product)}
                    onToggle={async (product) => {
                      const { error: updateError } = await supabase.from("products").update({ is_active: !product.is_active, updated_at: new Date().toISOString() }).eq("id", product.id);
                      if (updateError) setError(`No se pudo actualizar el producto: ${updateError.message}`);
                      else await loadData();
                    }}
                  />
                )
              )}
              {section === "menus" && (
                menuEditing ? (
                  <MenuEditor
                    menu={menuEditing}
                    products={products}
                    items={menuItems}
                    saving={saving}
                    onCancel={() => setMenuEditing(undefined)}
                    onToggleProduct={(id, selected) => setMenuItems((current) => ({
                      ...current,
                      [id]: { selected, price: current[id]?.price ?? "" },
                    }))}
                    onPriceChange={(id, price) => setMenuItems((current) => ({
                      ...current,
                      [id]: { selected: current[id]?.selected ?? true, price },
                    }))}
                    onSave={async (event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      const title = String(form.get("title")).trim();
                      const startDate = String(form.get("start_date"));
                      const endDate = String(form.get("end_date"));
                      const status = String(form.get("status"));
                      const selected = products.filter((product) => menuItems[product.id]?.selected);
                      if (title.length < 2 || !startDate || !endDate || endDate < startDate || selected.length === 0) {
                        setError("Revisá el título, las fechas y seleccioná al menos un plato.");
                        return;
                      }
                      for (const product of selected) {
                        const price = menuItems[product.id]?.price.trim();
                        if (price && (!Number.isSafeInteger(Number(price)) || Number(price) < 0 || Number(price) > 2147483647)) {
                          setError(`El precio de ${product.name} debe ser un entero entre 0 y 2.147.483.647.`);
                          return;
                        }
                      }
                      setSaving(true);
                      setError("");
                      const { error: saveError } = await supabase.rpc("save_weekly_menu", {
                        p_id: menuEditing.id,
                        p_title: title,
                        p_start_date: startDate,
                        p_end_date: endDate,
                        p_status: status,
                        p_items: selected.map((product, index) => ({
                          product_id: product.id,
                          price_override: menuItems[product.id]?.price.trim() ? Number(menuItems[product.id].price) : null,
                          sort_order: index,
                        })),
                      });
                      if (saveError) {
                        setError(`No se pudo guardar el menú: ${saveError.message}`);
                        setSaving(false);
                        return;
                      }
                      setMenuEditing(undefined);
                      setSaving(false);
                      await loadData();
                    }}
                  />
                ) : (
                  <MenusPanel
                    menus={menus}
                    menuCounts={menuCounts}
                    onAdd={() => void editMenu(null)}
                    onEdit={(menu) => void editMenu(menu)}
                    onArchive={async (menu) => {
                      const { error: archiveError } = await supabase.from("weekly_menus").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", menu.id);
                      if (archiveError) setError(`No se pudo archivar el menú: ${archiveError.message}`);
                      else await loadData();
                    }}
                  />
                )
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="admin-page-heading">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

function Overview({
  activeProducts, currentMenu, menus, productCount, onEditMenu, onNewMenu, onViewProducts, onViewMenus,
}: {
  activeProducts: number; currentMenu?: WeeklyMenu; menus: WeeklyMenu[]; productCount: number;
  onEditMenu: (menu: WeeklyMenu) => void; onNewMenu: () => void; onViewProducts: () => void; onViewMenus: () => void;
}) {
  return (
    <>
      <PageHeading eyebrow="Tu cocina, en un solo lugar" title="Resumen" description="Administrá tus productos y mantené actualizado el menú semanal." action={<button className="admin-primary-button" onClick={onNewMenu}><Plus size={17} /> Crear menú semanal</button>} />
      <div className="admin-stats-grid">
        <article className="admin-stat-card"><span>Productos activos</span><strong>{activeProducts}</strong><small><Package size={14} /> de {productCount} en catálogo</small></article>
        <article className="admin-stat-card"><span>Menú actual</span><strong className="admin-stat-status">{currentMenu ? "Publicado" : "Sin menú"}</strong><small><CalendarDays size={14} /> {currentMenu ? `${formatDate(currentMenu.start_date)} — ${formatDate(currentMenu.end_date)}` : "Creá uno para empezar"}</small></article>
        <article className="admin-stat-card"><span>Menús creados</span><strong>{menus.length}</strong><small><Archive size={14} /> Incluye borradores y anteriores</small></article>
      </div>
      <div className="admin-overview-grid">
        <section className="admin-card admin-current-menu">
          <div className="admin-card-heading"><div><span className="admin-card-kicker">EN VITRINA</span><h2>Menú publicado</h2></div><CalendarDays size={19} /></div>
          {currentMenu ? <><div className="admin-current-menu-title">{currentMenu.title}</div><p>{formatDate(currentMenu.start_date)} — {formatDate(currentMenu.end_date)}</p><button className="admin-secondary-button" onClick={() => onEditMenu(currentMenu)}><Pencil size={15} /> Editar menú</button></> : <><p>Aún no hay un menú publicado para esta semana.</p><button className="admin-primary-button" onClick={onNewMenu}><CirclePlus size={16} /> Crear primer menú</button></>}
        </section>
        <section className="admin-card admin-quick-actions">
          <div className="admin-card-heading"><div><span className="admin-card-kicker">ATAJOS</span><h2>¿Qué querés hacer?</h2></div><ArrowDownRight size={19} /></div>
          <button onClick={onViewProducts}><span><Package size={17} /> Agregar o actualizar platos</span><ChevronDown size={15} /></button>
          <button onClick={onViewMenus}><span><CalendarDays size={17} /> Revisar otros menús</span><ChevronDown size={15} /></button>
        </section>
      </div>
      <section className="admin-card admin-recent-menus"><div className="admin-card-heading"><div><span className="admin-card-kicker">ACTIVIDAD</span><h2>Menús recientes</h2></div><button className="admin-text-button" onClick={onViewMenus}>Ver todos <ArrowUpRight size={14} /></button></div>
        {menus.length ? <div className="admin-table-wrap"><table><thead><tr><th>Menú</th><th>Semana</th><th>Estado</th><th /></tr></thead><tbody>{menus.slice(0, 4).map((menu) => <tr key={menu.id}><td>{menu.title}</td><td>{formatDate(menu.start_date)} — {formatDate(menu.end_date)}</td><td><StatusBadge status={menu.status} /></td><td><button className="admin-icon-button" aria-label={`Editar ${menu.title}`} onClick={() => onEditMenu(menu)}><Pencil size={15} /></button></td></tr>)}</tbody></table></div> : <p className="admin-empty-note">Todavía no hay menús. Creá uno para mostrar los platos en el sitio.</p>}
      </section>
    </>
  );
}

function ProductsPanel({ products, search, onSearch, onAdd, onEdit, onToggle }: {
  products: Product[]; search: string; onSearch: (value: string) => void; onAdd: () => void; onEdit: (product: Product) => void; onToggle: (product: Product) => void;
}) {
  return (
    <>
      <PageHeading eyebrow="Catálogo" title="Productos" description="Actualizá los platos, sus fotos y precios. Desactivá los que ya no ofrecés." action={<button className="admin-primary-button" onClick={onAdd}><Plus size={17} /> Nuevo producto</button>} />
      <div className="admin-toolbar"><label className="admin-search"><Search size={17} /><input aria-label="Buscar productos" onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por nombre o categoría" value={search} /></label><span>{products.length} producto{products.length === 1 ? "" : "s"}</span></div>
      {products.length ? <div className="admin-products-grid">{products.map((product) => <article className={`admin-product-card ${!product.is_active ? "is-inactive" : ""}`} key={product.id}>
        <div className="admin-product-image">{product.image_url ? <Image alt={product.name} fill sizes="(max-width: 700px) 100vw, 300px" src={product.image_url} unoptimized /> : <Utensils size={25} />}<span className="admin-product-category">{product.category}</span></div>
        <div className="admin-product-info"><div className="admin-product-top"><div><h3>{product.name}</h3><p>{product.description || "Sin descripción"}</p></div><strong>{formatPrice(product.price)}</strong></div><div className="admin-product-actions"><StatusBadge status={product.is_active ? "active" : "inactive"} /><button className="admin-icon-button" onClick={() => onEdit(product)} aria-label={`Editar ${product.name}`}><Pencil size={15} /></button><button className="admin-icon-button" onClick={() => onToggle(product)} aria-label={product.is_active ? `Desactivar ${product.name}` : `Activar ${product.name}`}>{product.is_active ? <Archive size={15} /> : <Check size={15} />}</button></div></div>
      </article>)}</div> : <div className="admin-card admin-empty-state"><Package size={28} /><h2>No hay productos todavía</h2><p>Agregá platos para poder armar tus menús semanales.</p><button className="admin-primary-button" onClick={onAdd}><Plus size={16} /> Crear primer producto</button></div>}
    </>
  );
}

function ProductEditor({ product, saving, onCancel, onSave }: {
  product: Product | null; saving: boolean; onCancel: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [preview, setPreview] = useState(product?.image_url ?? "");
  useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    if (image) setPreview(URL.createObjectURL(image));
    else setPreview(product?.image_url ?? "");
  }

  return (
    <>
      <PageHeading eyebrow="Catálogo" title={product ? "Editar producto" : "Nuevo producto"} description="Los datos se podrán incluir en uno o más menús semanales." />
      <form className="admin-card admin-editor-form" onSubmit={onSave}>
        <div className="admin-form-section-heading"><div><span className="admin-card-kicker">DETALLES DEL PLATO</span><h2>Información del producto</h2></div><Utensils size={19} /></div>
        <div className="admin-form-grid">
          <label className="admin-field admin-field-full">Nombre del plato<input defaultValue={product?.name ?? ""} maxLength={100} name="name" placeholder="Ej: Pollo al limón" required /></label>
          <label className="admin-field">Categoría<select defaultValue={product?.category ?? "Clásicas"} name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="admin-field">Precio (ARS)<input defaultValue={product?.price ?? ""} max="2147483647" min="0" name="price" placeholder="6900" required step="1" type="number" /></label>
          <label className="admin-field admin-field-full">Descripción<textarea defaultValue={product?.description ?? ""} maxLength={500} name="description" placeholder="Contá brevemente qué incluye el plato." rows={3} /></label>
          <div className="admin-field admin-field-full">
            <span className="admin-field-label">Foto del plato <small>JPG, PNG o WebP · hasta 5 MB</small></span>
            <label className="admin-upload-zone">
              {preview ? <Image alt="Vista previa del plato" className="admin-upload-preview" height={130} src={preview} unoptimized width={180} /> : <span className="admin-upload-placeholder"><Upload size={22} /><span>Elegir una foto</span><small>Podés seleccionar una imagen de tu dispositivo</small></span>}
              <input accept="image/jpeg,image/png,image/webp" name="image" onChange={handleImage} type="file" />
            </label>
          </div>
          <label className="admin-switch-field"><input defaultChecked={product?.is_active ?? true} name="is_active" type="checkbox" /><span><strong>Producto activo</strong><small>Disponible para agregar a los menús</small></span></label>
        </div>
        <div className="admin-form-actions"><button className="admin-secondary-button" onClick={onCancel} type="button">Cancelar</button><button className="admin-primary-button" disabled={saving} type="submit"><Save size={16} /> {saving ? "Guardando..." : "Guardar producto"}</button></div>
      </form>
    </>
  );
}

function MenusPanel({ menus, menuCounts, onAdd, onEdit, onArchive }: {
  menus: WeeklyMenu[]; menuCounts: Record<string, number>; onAdd: () => void; onEdit: (menu: WeeklyMenu) => void; onArchive: (menu: WeeklyMenu) => void;
}) {
  const [filter, setFilter] = useState("all");
  const visibleMenus = menus.filter((menu) => filter === "all" || menu.status === filter);
  return (
    <>
      <PageHeading eyebrow="Planificación" title="Menús semanales" description="Armá el menú por fechas, elegí platos y publicalo cuando esté listo." action={<button className="admin-primary-button" onClick={onAdd}><Plus size={17} /> Crear menú semanal</button>} />
      <div className="admin-filter-tabs"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Todos <span>{menus.length}</span></button><button className={filter === "published" ? "active" : ""} onClick={() => setFilter("published")}>Publicados <span>{menus.filter((menu) => menu.status === "published").length}</span></button><button className={filter === "draft" ? "active" : ""} onClick={() => setFilter("draft")}>Borradores <span>{menus.filter((menu) => menu.status === "draft").length}</span></button><button className={filter === "archived" ? "active" : ""} onClick={() => setFilter("archived")}>Archivados <span>{menus.filter((menu) => menu.status === "archived").length}</span></button></div>
      {visibleMenus.length ? <div className="admin-menu-list">{visibleMenus.map((menu) => <article className="admin-menu-card" key={menu.id}>
        <div className="admin-menu-card-date"><CalendarDays size={19} /><span>{formatDate(menu.start_date)}<small>al {formatDate(menu.end_date)}</small></span></div>
        <div className="admin-menu-card-main"><StatusBadge status={menu.status} /><h2>{menu.title}</h2><p><Utensils size={14} /> {menuCounts[menu.id] ?? 0} platos · Actualizado {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(new Date(menu.updated_at))}</p></div>
        <div className="admin-menu-card-actions"><button className="admin-secondary-button" onClick={() => onEdit(menu)}><Pencil size={14} /> Editar</button>{menu.status !== "archived" && <button className="admin-icon-button" aria-label={`Archivar ${menu.title}`} onClick={() => onArchive(menu)}><Archive size={16} /></button>}</div>
      </article>)}</div> : <div className="admin-card admin-empty-state"><CalendarDays size={28} /><h2>No hay menús en esta vista</h2><p>Creá un menú y elegí el período en que querés publicarlo.</p><button className="admin-primary-button" onClick={onAdd}><Plus size={16} /> Crear menú semanal</button></div>}
    </>
  );
}

function MenuEditor({ menu, products, items, saving, onCancel, onToggleProduct, onPriceChange, onSave }: {
  menu: WeeklyMenu; products: Product[]; items: Record<string, MenuDraftItem>; saving: boolean; onCancel: () => void;
  onToggleProduct: (id: string, selected: boolean) => void; onPriceChange: (id: string, price: string) => void; onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const activeProducts = products.filter((product) => product.is_active || items[product.id]?.selected);
  return (
    <>
      <PageHeading eyebrow="Planificación" title={menu.title || "Nuevo menú"} description="Definí el período de vigencia y los platos que verá la clienta." />
      <form className="admin-card admin-editor-form" onSubmit={onSave}>
        <div className="admin-form-section-heading"><div><span className="admin-card-kicker">DATOS DEL MENÚ</span><h2>Semana y publicación</h2></div><CalendarDays size={19} /></div>
        <div className="admin-form-grid">
          <label className="admin-field admin-field-full">Nombre del menú<input defaultValue={menu.title} maxLength={100} name="title" placeholder="Ej: Menú de la semana" required /></label>
          <label className="admin-field">Desde<input defaultValue={menu.start_date} name="start_date" required type="date" /></label>
          <label className="admin-field">Hasta<input defaultValue={menu.end_date} name="end_date" required type="date" /></label>
          <label className="admin-field">Estado<select defaultValue={menu.status} name="status"><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select><small>Solo se muestra en el sitio público durante las fechas elegidas.</small></label>
        </div>
        <div className="admin-menu-products-heading"><div><span className="admin-card-kicker">CARTA DE LA SEMANA</span><h2>Elegí los platos</h2></div><span>{Object.values(items).filter((item) => item.selected).length} seleccionados</span></div>
        {activeProducts.length ?         <div className="admin-menu-product-picker">{activeProducts.map((product) => <div className={`admin-menu-product-option ${items[product.id]?.selected ? "selected" : ""}`} key={product.id}>
          <input checked={Boolean(items[product.id]?.selected)} onChange={(event) => onToggleProduct(product.id, event.target.checked)} type="checkbox" />
          {product.image_url ? <Image alt="" className="admin-menu-product-thumb" height={52} src={product.image_url} unoptimized width={52} /> : <span className="admin-menu-product-thumb admin-no-image"><Utensils size={16} /></span>}
          <span className="admin-menu-product-info"><strong>{product.name}</strong><small>{product.category} · {formatPrice(product.price)}</small></span>
          <span className="admin-menu-override"><small>Precio especial</small><input aria-label={`Precio especial para ${product.name}`} max="2147483647" min="0" onChange={(event) => onPriceChange(product.id, event.target.value)} onClick={(event) => event.stopPropagation()} placeholder={String(product.price)} type="number" value={items[product.id]?.price ?? ""} /><span>ARS</span></span>
        </div>)}</div> : <div className="admin-notice">Primero agregá productos activos desde la sección Productos.</div>}
        <div className="admin-form-actions"><button className="admin-secondary-button" onClick={onCancel} type="button">Cancelar</button><button className="admin-primary-button" disabled={saving || products.length === 0} type="submit"><Save size={16} /> {saving ? "Guardando..." : menu.status === "published" ? "Guardar y publicar" : "Guardar menú"}</button></div>
      </form>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado", active: "Activo", inactive: "Inactivo" };
  return <span className={`admin-status-badge ${status}`}>{labels[status] ?? status}</span>;
}
