export default function CompetitiveLandingPage() {
  return (
    <main className="page competitive-landing">
      <section className="hero">
        <div className="section-kicker">V2 · COMPETITIVO</div>
        <h1>Tu laboratorio competitivo</h1>
        <p className="hero-copy">
          La siguiente etapa del proyecto combinará generación de equipos, edición manual y explicaciones para aprender por qué funciona cada decisión.
        </p>
      </section>

      <section className="competitive-preview-grid">
        <article className="config-card">
          <span className="section-kicker">SINGLES 6V6</span>
          <h2>Construcción individual</h2>
          <p className="hero-copy">Roles, sets, objetos, naturalezas, EVs y análisis de amenazas.</p>
        </article>
        <article className="config-card">
          <span className="section-kicker">DOBLES / VGC</span>
          <h2>Sinergia de campo</h2>
          <p className="hero-copy">Velocidad, soporte, leads, partners y formatos oficiales.</p>
        </article>
        <article className="config-card">
          <span className="section-kicker">MODO APRENDIZAJE</span>
          <h2>Entender el equipo</h2>
          <p className="hero-copy">Explicaciones de roles, matchups y decisiones sin obligarte a conocer el competitivo de memoria.</p>
        </article>
      </section>

      <div className="data-warning competitive-roadmap-note">
        ⚙️ <span><b>Base competitiva en construcción.</b> Esta etapa prepara navegación, persistencia y carga modular antes de activar el motor competitivo.</span>
      </div>
    </main>
  );
}
