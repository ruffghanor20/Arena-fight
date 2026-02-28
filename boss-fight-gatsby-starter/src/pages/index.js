import * as React from "react";
import { withPrefix } from "gatsby";

const features = [
  {
    title: "Combate contra Chefes",
    desc: "Enfrente inimigos únicos com padrões, fases e recompensas exclusivas."
  },
  {
    title: "Progressão de Personagem",
    desc: "Suba de nível, distribua pontos e fortaleça sua build a cada batalha."
  },
  {
    title: "Loja e Upgrades",
    desc: "Compre armas, armaduras, acessórios, poções e evolua seu poder."
  },
  {
    title: "Árvore de Skills",
    desc: "Desbloqueie habilidades com especializações e cooldown estratégico."
  },
  {
    title: "Loot e Drops",
    desc: "Colete recompensas raras, itens exclusivos e equipamentos por tier."
  },
  {
    title: "Sistema Expansível",
    desc: "Base preparada para novos bosses, sets, capítulos e conteúdo futuro."
  }
];

const roadmap = [
  { version: "v1", title: "Base Jogável", desc: "Combate principal, HUD, progressão inicial e sistema de boss." },
  { version: "v2", title: "Economia e Loja", desc: "Moedas, compra de itens, consumíveis e upgrades de atributos." },
  { version: "v3", title: "Builds e Skills", desc: "Árvore de skills, especializações e habilidades com recarga." },
  { version: "v4", title: "Loot Avançado", desc: "Drops raros, equipamentos por slot, tiers e progressão de itens." },
  { version: "v5", title: "Expansão do Mundo", desc: "Novos bosses, sets exclusivos, perfis múltiplos e mais conteúdo." }
];

const changelog = [
  "Adicionado sistema base de combate contra boss.",
  "Interface reorganizada para experiência mais clara e visual.",
  "Estrutura preparada para loja, skills e progressão de equipamentos.",
  "Página oficial do projeto criada para GitHub Pages.",
  "Seções de roadmap, prints e recursos adicionadas."
];

const prints = [
  { title: "Tela de Combate", src: withPrefix("/prints/print-1.png") },
  { title: "Loja e Equipamentos", src: withPrefix("/prints/print-2.png") },
  { title: "Progressão e Status", src: withPrefix("/prints/print-3.png") }
];

const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    fontFamily: "Inter, Arial, sans-serif",
    color: "#e5e7eb",
    background:
      "radial-gradient(circle at top, #2a174a 0%, #12081f 30%, #070b14 65%, #03060d 100%)"
  },
  shell: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1.25rem 4rem"
  },
  sectionTitle: {
    fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
    margin: "0 0 1rem",
    color: "#fff"
  },
  sectionText: {
    color: "#b8c0d4",
    lineHeight: 1.8,
    margin: 0
  },
  card: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
    border: "1px solid rgba(167,139,250,0.16)",
    borderRadius: "20px",
    padding: "1.25rem",
    boxShadow: "0 10px 30px rgba(0,0,0,0.28)"
  },
  hero: {
    padding: "5rem 0 3rem"
  },
  heroPanel: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "28px",
    padding: "3rem",
    background:
      "linear-gradient(135deg, rgba(76,29,149,0.35), rgba(30,41,59,0.45), rgba(10,15,30,0.7))",
    border: "1px solid rgba(167,139,250,0.18)",
    boxShadow: "0 25px 80px rgba(0,0,0,0.45)"
  },
  badge: {
    display: "inline-block",
    padding: "0.45rem 0.8rem",
    borderRadius: "999px",
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#ddd6fe",
    background: "rgba(139,92,246,0.14)",
    border: "1px solid rgba(139,92,246,0.26)"
  },
  heroTitle: {
    fontSize: "clamp(3rem, 8vw, 6rem)",
    lineHeight: 0.95,
    margin: "1rem 0 1rem",
    color: "#ffffff"
  },
  heroText: {
    maxWidth: "760px",
    color: "#cbd5e1",
    fontSize: "1.08rem",
    lineHeight: 1.8,
    marginBottom: "1.75rem"
  },
  heroActions: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap"
  },
  primaryBtn: {
    textDecoration: "none",
    padding: "1rem 1.25rem",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 10px 24px rgba(124,58,237,0.35)"
  },
  secondaryBtn: {
    textDecoration: "none",
    padding: "1rem 1.25rem",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontWeight: 700,
    background: "rgba(255,255,255,0.03)"
  },
  glowOrb: {
    position: "absolute",
    right: "-80px",
    top: "-60px",
    width: "260px",
    height: "260px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(168,85,247,0.22), rgba(168,85,247,0) 70%)",
    pointerEvents: "none"
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem"
  },
  gridPrints: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem"
  },
  printFrame: {
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0b1020"
  },
  printImage: {
    display: "block",
    width: "100%",
    height: "220px",
    objectFit: "cover",
    background:
      "linear-gradient(135deg, rgba(76,29,149,0.18), rgba(30,41,59,0.22), rgba(15,23,42,0.4))"
  },
  timeline: {
    display: "grid",
    gap: "1rem"
  },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: "1rem",
    alignItems: "start"
  },
  versionPill: {
    display: "inline-block",
    textAlign: "center",
    padding: "0.8rem 0.9rem",
    borderRadius: "14px",
    fontWeight: 800,
    color: "#ddd6fe",
    background: "rgba(124,58,237,0.14)",
    border: "1px solid rgba(124,58,237,0.24)"
  },
  changelogList: {
    margin: 0,
    paddingLeft: "1.2rem",
    color: "#cbd5e1",
    lineHeight: 1.9
  },
  footerCta: {
    marginTop: "4rem",
    padding: "2rem",
    borderRadius: "24px",
    textAlign: "center",
    background:
      "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(15,23,42,0.5), rgba(168,85,247,0.08))",
    border: "1px solid rgba(167,139,250,0.14)"
  }
};

export default function HomePage() {
  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroPanel}>
            <div style={styles.glowOrb} />
            <span style={styles.badge}>Projeto RPG • Boss Fight</span>

            <h1 style={styles.heroTitle}>Boss Fight</h1>

            <p style={styles.heroText}>
              Entre na arena, evolua seu personagem e desafie chefes cada vez mais
              poderosos. Um projeto com foco em combate, progressão, loja, builds,
              loot e expansão contínua.
            </p>

            <div style={styles.heroActions}>
              <a href={withPrefix("/game/")} style={styles.primaryBtn}>
                Jogar Agora
              </a>

              <a
                href="https://github.com/ruffghanor20/Boss-fight"
                target="_blank"
                rel="noreferrer"
                style={styles.secondaryBtn}
              >
                Ver Repositório
              </a>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "4rem" }}>
          <h2 style={styles.sectionTitle}>Recursos</h2>
          <div style={styles.grid3}>
            {features.map((item) => (
              <div key={item.title} style={styles.card}>
                <h3 style={{ marginTop: 0, marginBottom: "0.75rem", color: "#fff" }}>
                  {item.title}
                </h3>
                <p style={styles.sectionText}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "4rem" }}>
          <h2 style={styles.sectionTitle}>Prints do Projeto</h2>
          <p style={{ ...styles.sectionText, marginBottom: "1rem" }}>
            Coloque suas imagens em <strong>static/prints/</strong> com os nomes
            <strong> print-1.png</strong>, <strong>print-2.png</strong> e
            <strong> print-3.png</strong>.
          </p>

          <div style={styles.gridPrints}>
            {prints.map((print) => (
              <div key={print.title} style={styles.printFrame}>
                <img
                  src={print.src}
                  alt={print.title}
                  style={styles.printImage}
                  loading="lazy"
                />
                <div style={{ padding: "1rem" }}>
                  <strong style={{ color: "#fff" }}>{print.title}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "4rem" }}>
          <h2 style={styles.sectionTitle}>Roadmap</h2>
          <div style={styles.timeline}>
            {roadmap.map((item) => (
              <div key={item.version} style={{ ...styles.card, ...styles.timelineItem }}>
                <div>
                  <span style={styles.versionPill}>{item.version}</span>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.5rem", color: "#fff" }}>{item.title}</h3>
                  <p style={styles.sectionText}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "4rem" }}>
          <h2 style={styles.sectionTitle}>Changelog</h2>
          <div style={styles.card}>
            <ul style={styles.changelogList}>
              {changelog.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section style={styles.footerCta}>
          <h2 style={{ ...styles.sectionTitle, marginBottom: "0.75rem" }}>
            Pronto para enfrentar o próximo chefe?
          </h2>
          <p style={{ ...styles.sectionText, maxWidth: "760px", margin: "0 auto 1.5rem" }}>
            Acesse a build, acompanhe a evolução do projeto e entre na arena.
          </p>
          <a href={withPrefix("/game/")} style={styles.primaryBtn}>
            Jogar Agora
          </a>
        </section>
      </div>
    </main>
  );
}

export function Head() {
  return <title>Boss Fight | RPG Boss Battle Project</title>;
}
