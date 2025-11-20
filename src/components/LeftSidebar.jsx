// src/components/LeftSidebar.jsx
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function LeftSidebar({ maxWidth = 300 }) {
  const [tree, setTree] = useState([]); // [{ cat, children: [] }]
  const [loading, setLoading] = useState(true);
  const [openCatId, setOpenCatId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to load categories");
        const all = await res.json();
        if (!mounted) return;
        const map = {};
        all.forEach(c => {
          const parentKey = c.parent ? String(c.parent) : "root";
          map[parentKey] = map[parentKey] || [];
          map[parentKey].push(c);
        });
        const top = (map["root"] || []).sort((a,b) => (a.meta?.sortOrder||0)-(b.meta?.sortOrder||0) || a.name.localeCompare(b.name));
        const built = top.map(t => ({
          cat: t,
          children: (map[String(t._id)] || []).sort((a,b)=> (a.meta?.sortOrder||0)-(b.meta?.sortOrder||0) || a.name.localeCompare(b.name))
        }));
        setTree(built);
      } catch (err) {
        console.error("LeftSidebar load error", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function handleKeyOpen(catId, e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenCatId(openCatId === catId ? null : catId);
    }
  }

  return (
    <>
      <style jsx>{`
        .ls-wrapper {
          position: fixed;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1000;
          display: flex;
          align-items: center;
          pointer-events: none; /* hamburger will enable pointer-events */
        }

        .hamburger {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          padding: 8px;
          cursor: pointer;
          pointer-events: auto;
          align-items: center;
          outline: none;
        }

        .bar {
          width: 20px;
          height: 2px;
          background: #333;
          border-radius: 2px;
        }

        /* panel closed state */
        .panel {
          width: 0;
          overflow: visible;
          transition: width 220ms ease;
          pointer-events: none;
        }

        .panel-inner {
          position: relative;
          left: 46px; /* distance from hamburger */
          top: -8px;
          width: ${maxWidth}px;
          max-width: ${maxWidth}px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
          padding: 12px;
          transform-origin: left center;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 160ms ease, transform 160ms ease;
          pointer-events: auto;
        }

        /* ONLY open when hamburger is hovered/focused OR panel itself hovered/focused */
        .hamburger:hover + .panel,
        .hamburger:focus + .panel,
        .panel:hover,
        .panel:focus-within {
          width: calc(${maxWidth}px + 56px);
          pointer-events: auto;
        }
        .hamburger:hover + .panel .panel-inner,
        .hamburger:focus + .panel .panel-inner,
        .panel:hover .panel-inner,
        .panel:focus-within .panel-inner {
          opacity: 1;
          transform: translateX(0);
        }

        .major-list { list-style: none; padding: 0; margin: 0; display: flex; gap: 8px; flex-direction: column; }
        .major-item { padding: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .major-item:hover, .major-item:focus { background: #f6f8fb; }
        .major-title { font-weight: 700; color: #111; }
        .children { list-style: none; padding-left: 12px; margin: 6px 0 0 0; display: none; }
        .children a { display: block; padding: 6px 8px; border-radius: 6px; color: #333; text-decoration: none; font-size: 14px; }
        .children a:hover { background: #f3f6ff; }

        .major-item:hover .children,
        .major-item:focus-within .children,
        .major-item.open .children {
          display: block;
        }

        .cat-path { font-size: 12px; color: #666; margin-top: 4px; }
      `}</style>

      <div className="ls-wrapper" aria-hidden={false}>
        <div
          className="hamburger"
          role="button"
          tabIndex={0}
          aria-label="Open categories"
          title="Browse categories (hover)"
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </div>

        <div className="panel" aria-hidden="true">
          <div className="panel-inner" role="menu" aria-label="Category navigation">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800 }}>Categories</div>
              <div style={{ fontSize: 13, color: "#666" }}>{loading ? "Loading…" : `${tree.length} groups`}</div>
            </div>

            <nav>
              <ul className="major-list" role="list">
                {tree.map(({ cat, children }) => {
                  const isOpen = openCatId === String(cat._id);
                  return (
                    <li
                      key={cat._id}
                      className={`major-item ${isOpen ? "open" : ""}`}
                      onMouseEnter={() => setOpenCatId(String(cat._id))}
                      onMouseLeave={() => setOpenCatId(null)}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <Link href={`/products?categoryId=${cat._id}`} legacyBehavior><a className="major-title" style={{ textDecoration: "none" }}>{cat.name}</a></Link>
                        <div className="cat-path">{cat.path}</div>
                      </div>

                      <div style={{ marginLeft: 8 }}>
                        <button
                          onClick={() => setOpenCatId(isOpen ? null : String(cat._id))}
                          onKeyDown={(e) => handleKeyOpen(String(cat._id), e)}
                          aria-expanded={isOpen}
                          aria-controls={`children-${cat._id}`}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#666" }}
                          title={isOpen ? "Collapse" : "Expand"}
                        >
                          ▾
                        </button>
                      </div>

                      <ul id={`children-${cat._id}`} className="children" role="list">
                        {children.length === 0 && <li style={{ fontSize: 13, color: "#999", padding: "6px 8px" }}>No subcategories</li>}
                        {children.map(child => (
                          <li key={child._id}>
                            <Link href={`/products?categoryId=${child._id}`} legacyBehavior>
                              <a>{child.name}</a>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
              Tip: hover the three-dash icon to open. Click a category to view products.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
