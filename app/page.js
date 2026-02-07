import Image from "next/image";

const downloadUrl = "/download";

export const dynamic = "force-static";

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <>
      <div className="ambient-grid" aria-hidden="true" />
      <header className="topbar">
        <div className="logo" aria-label="ADHD-Timebox">
          <span className="logo-ring" aria-hidden="true" />
          <span className="logo-text">ADHD-Timebox</span>
        </div>
        <a id="top-download-btn" className="mini-cta" href={downloadUrl}>
          Download for macOS
        </a>
      </header>

      <main>
        <section className="hero reveal">
          <p className="eyebrow">AI execution coach for ADHD brains</p>
          <h1>
            Plan with words.
            <br />
            Stay in one box.
          </h1>
          <p className="hero-copy">
            ADHD-Timebox turns scattered ideas into clear 15/30/60-minute focus
            boxes. It keeps you on track with gentle interventions and lets you
            park random thoughts without breaking flow.
          </p>
          <div className="hero-ctas">
            <a id="get-app-btn" className="cta-primary" href={downloadUrl}>
              Get the app
            </a>
            <a className="cta-secondary" href="#features">
              See how it works
            </a>
          </div>
        </section>

        <section id="features" className="feature-grid">
          <article className="card reveal">
            <h2>Planning Chat</h2>
            <p>
              Dump what is in your head. The planner helps shape it into
              actionable timeboxes and keeps the start barrier low.
            </p>
          </article>
          <article className="card reveal">
            <h2>Focus Guardian</h2>
            <p>
              During a focus session, the app checks idle time and distraction
              windows, then nudges you back gently instead of shaming you.
            </p>
          </article>
          <article className="card reveal">
            <h2>Thought Parking</h2>
            <p>
              Got a random urge to check something? Park it in a side sheet so
              your current task stays intact.
            </p>
          </article>
          <article className="card reveal">
            <h2>Kind Reviews</h2>
            <p>
              Each box ends with simple outcomes: finished, partial, or stuck.
              You reset without guilt and continue.
            </p>
          </article>
        </section>

        <section className="timeline reveal">
          <h2>The 4-state loop</h2>
          <ol className="timeline-list">
            <li className="timeline-step">
              <p className="timeline-step-copy">
                <strong>Planning</strong> - Turn intent into a concrete box.
              </p>
              <figure className="timeline-shot">
                <Image
                  src="/assets/states/planning.jpg"
                  alt="Planning mode where the assistant structures tasks into a schedule."
                  width={1400}
                  height={998}
                  loading="lazy"
                  fetchPriority="low"
                  sizes="(max-width: 600px) calc(100vw - 64px), (max-width: 880px) 620px, 680px"
                />
              </figure>
            </li>
            <li className="timeline-step">
              <p className="timeline-step-copy">
                <strong>Focusing</strong> - Work one task with a running timer.
              </p>
              <figure className="timeline-shot">
                <Image
                  src="/assets/states/focusing.jpg"
                  alt="Focusing mode with a countdown ring and active task controls."
                  width={1400}
                  height={995}
                  loading="lazy"
                  fetchPriority="low"
                  sizes="(max-width: 600px) calc(100vw - 64px), (max-width: 880px) 620px, 680px"
                />
              </figure>
            </li>
            <li className="timeline-step timeline-step-portrait">
              <p className="timeline-step-copy">
                <strong>Interrupted</strong> - Log outcome and choose next move.
              </p>
              <figure className="timeline-shot">
                <Image
                  src="/assets/states/interrupted.jpg"
                  alt="Interrupted mode showing distraction detection and quick return-to-focus actions."
                  width={897}
                  height={1200}
                  loading="lazy"
                  fetchPriority="low"
                  sizes="(max-width: 600px) calc(100vw - 64px), (max-width: 880px) 360px, 400px"
                />
              </figure>
            </li>
            <li className="timeline-step">
              <p className="timeline-step-copy">
                <strong>Resting</strong> - Recover, then restart cleanly.
              </p>
              <figure className="timeline-shot">
                <Image
                  src="/assets/states/resting.jpg"
                  alt="Resting mode encouraging recovery with options to return or restart."
                  width={1400}
                  height={778}
                  loading="lazy"
                  fetchPriority="low"
                  sizes="(max-width: 600px) calc(100vw - 64px), (max-width: 880px) 620px, 680px"
                />
              </figure>
            </li>
          </ol>
        </section>

        <section className="gemini-map" aria-labelledby="gemini-map-title">
          <p className="eyebrow">Where we use Gemini</p>
          <h2 id="gemini-map-title">Gemini support across every focus state</h2>
          <p className="gemini-map-copy">
            One model powers planning, live focus protection, interruption
            capture, and end-of-box reflection so momentum stays stable.
          </p>
          <div
            className="gemini-graph"
            role="img"
            aria-label="Gemini powers planning chat, focus guardian, thought parking, and kind reviews."
          >
            <div className="gemini-core">Gemini</div>
            <span className="gemini-line gemini-line-top" aria-hidden="true" />
            <span className="gemini-line gemini-line-right" aria-hidden="true" />
            <span
              className="gemini-line gemini-line-bottom"
              aria-hidden="true"
            />
            <span className="gemini-line gemini-line-left" aria-hidden="true" />

            <article className="gemini-node gemini-node-top">
              <h3>Planning Chat</h3>
              <p>Turns raw thoughts into a concrete 15/30/60-minute box.</p>
            </article>
            <article className="gemini-node gemini-node-right">
              <h3>Focus Guardian</h3>
              <p>Detects drift and nudges you back before context is lost.</p>
            </article>
            <article className="gemini-node gemini-node-bottom">
              <h3>Kind Reviews</h3>
              <p>
                Closes each box with outcome logging and a low-friction next
                step.
              </p>
            </article>
            <article className="gemini-node gemini-node-left">
              <h3>Thought Parking</h3>
              <p>Captures random urges without breaking your active task flow.</p>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <p>Built for humans with nonlinear attention.</p>
        <p>{year} ADHD-Timebox</p>
      </footer>
    </>
  );
}
