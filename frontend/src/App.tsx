import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Box,
  LayoutDashboard,
  Moon,
  Radio,
  Send,
  Sun,
  Zap,
} from "lucide-react";
import { statuses } from "./api/types";
import { useLive } from "./hooks/useLive";
import { useSimulation } from "./hooks/useSimulation";
import { scenarios } from "./simulation/scenarios";
import { epoch } from "./simulation/engine";
import { Architecture } from "./components/Architecture";
import { Composer } from "./components/Composer";
import { DeliveryTable, Inspector } from "./components/Deliveries";
import {
  Lessons,
  ManualExperiments,
  RedisWindow,
  SimulationControls,
} from "./components/Learning";
import {
  DeliveryProgress,
  FirstSteps,
  SetupGuide,
} from "./components/GettingStarted";
import { nextSteps, statusLabels } from "./content/plainLanguage";
const pages = [
  "Start here",
  "Send a test",
  "Your deliveries",
  "How it works",
] as const;
type Page = (typeof pages)[number];
const navIcons = [LayoutDashboard, Send, Box, BookOpen];
const descriptions: Record<Page, string> = {
  "Start here": "See how reliable webhook delivery works.",
  "Send a test": "Send an example message. Then watch what happens.",
  "Your deliveries":
    "See which messages arrived and which are still on their way.",
  "How it works": "Try a guided example, or learn about one part at a time.",
};
export default function App() {
  const [page, setPage] = useState<Page>("Start here");
  const [sim, setSim] = useState(true);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("hookrelay:theme") === "dark";
    } catch {
      return false;
    }
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [existing, setExisting] = useState("");
  const [idError, setIdError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [showDemo, setShowDemo] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showDemo && sim && page === "Start here")
      demoRef.current?.querySelector(".practice-workspace")?.scrollIntoView?.({
        block: "start",
        behavior: "instant",
      });
  }, [showDemo, sim, page]);
  const [showSetup, setShowSetup] = useState(false);
  const [learnTab, setLearnTab] = useState<"tests" | "lessons">("tests");
  const live = useLive(!sim);
  const simulation = useSimulation(sim);
  const records = sim ? simulation.state.records : live.records;
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("hookrelay:theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);
  useEffect(() => {
    if (sim) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sim]);
  const navigate = (p: Page) => {
    setPage(p);
    setSelected(null);
    window.scrollTo?.({ top: 0, behavior: "instant" });
  };
  const switchMode = (practice: boolean) => {
    setSim(practice);
    setSelected(null);
    setShowSetup(!practice);
    setPage("Start here");
  };
  const counts = statuses.reduce(
    (a, s) => ({ ...a, [s]: records.filter((d) => d.status === s).length }),
    {} as Record<(typeof statuses)[number], number>,
  );
  return (
    <div className="app-shell beginner-ui">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Start here");
          }}
        >
          <span className="brand-icon">
            <Zap size={22} />
          </span>
          HookRelay
        </a>
        <span className="nav-caption">YOUR GUIDE</span>
        <nav aria-label="Main navigation">
          {pages.map((p, i) => {
            const Icon = navIcons[i];
            return (
              <button
                key={p}
                className={`nav-link ${page === p ? "selected" : ""}`}
                onClick={() => navigate(p)}
                aria-current={page === p ? "page" : undefined}
              >
                <Icon size={19} />
                {p}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-guide">
          <BookOpen size={22} />
          <strong>You can start without any setup.</strong>
          <p>
            Practice mode uses examples. It is safe to pause, start over and try
            again.
          </p>
          <button
            onClick={() => {
              switchMode(true);
              setShowDemo(true);
              simulation.reset("success");
              simulation.start();
            }}
          >
            Try the first example <ArrowRight size={16} />
          </button>
        </div>
        <div className="sidebar-footer">
          <button className="theme-button" onClick={() => setDark((v) => !v)}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}{" "}
            {dark ? "Use light colours" : "Use dark colours"}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="mode-help">Choose how to test</span>
          <div className="mode-switch" aria-label="Operating mode">
            <button
              aria-pressed={sim}
              className={sim ? "selected" : ""}
              onClick={() => switchMode(true)}
            >
              <BookOpen size={16} />
              Practice <span className="mode-description">No setup</span>
            </button>
            <button
              aria-pressed={!sim}
              className={!sim ? "selected" : ""}
              onClick={() => switchMode(false)}
            >
              <Radio size={16} />
              Real backend{" "}
              <span className="mode-description">Your running app</span>
            </button>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <h1>{page}</h1>
              <p>{descriptions[page]}</p>
            </div>
          </div>
          <div className="mode-banner">
            <BookOpen size={19} />
            <p>
              <strong>
                {sim
                  ? "Practice mode · learning simulation"
                  : "Real backend · live mode"}
              </strong>
              <br />
              {sim
                ? "These are pretend messages. You can explore without running the backend."
                : "These are real messages. Start your backend before sending a test."}
            </p>
          </div>
          {!sim && Object.keys(live.errors).length > 0 && (
            <div className="error-box" role="alert">
              <h3>We could not get the latest delivery update</h3>
              <p>
                Your message may already be saved. Do not send another copy just
                because this check failed.
              </p>
              <ol>
                <li>Check that the HookRelay API is running.</li>
                <li>Check its address in the setup steps.</li>
                <li>
                  Try checking again below. This will not send another message.
                </li>
              </ol>
              <div className="button-row">
                <button onClick={live.retry}>Check again</button>
                <button
                  onClick={() => {
                    setShowSetup(true);
                    navigate("Start here");
                  }}
                >
                  Show setup help
                </button>
              </div>
              <details>
                <summary>Technical error details</summary>
                {Object.entries(live.errors).map(([id, error]) => (
                  <p key={id}>
                    {id}: {error}
                  </p>
                ))}
              </details>
              <p>
                Earlier results may be out of date. You are still in real mode.
              </p>
            </div>
          )}
          {page === "Start here" && (
            <>
              <FirstSteps
                sim={sim}
                onSend={() => navigate("Send a test")}
                onDemo={() => {
                  simulation.reset("success");
                  simulation.start();
                  setShowDemo(true);
                }}
                onSetup={() => setShowSetup((v) => !v)}
              />
              {sim && showDemo && (
                <div className="guided-test" ref={demoRef}>
                  <SimulationControls simulation={simulation} />
                  {records[0] && (
                    <button
                      className="text-button latest-inspect"
                      onClick={() => setSelected(records[0].id)}
                    >
                      Open latest message details
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setLearnTab("tests");
                      navigate("How it works");
                    }}
                  >
                    Next: try a test where something goes wrong{" "}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {!sim && (
                <details
                  className="setup-disclosure"
                  open={showSetup}
                  onToggle={(e) => setShowSetup(e.currentTarget.open)}
                >
                  <summary>Setup steps for real testing</summary>
                  <SetupGuide />
                </details>
              )}
              {records.length > 0 && (
                <section className="panel recent">
                  <div className="section-heading">
                    <div>
                      <h2>
                        {sim
                          ? "Your practice messages"
                          : "Deliveries tracked in this browser"}
                      </h2>
                      <p>
                        {sim
                          ? "Only examples from this practice session."
                          : "Only messages added in this browser. This is not a count of all backend activity."}
                      </p>
                    </div>
                    <button onClick={() => navigate("Your deliveries")}>
                      See all
                    </button>
                  </div>
                  <div className="simple-counts">
                    <span>
                      <b>{records.length}</b> messages
                    </span>
                    <span>
                      <b>{counts.DELIVERED}</b> delivered
                    </span>
                    <span>
                      <b>
                        {counts.PENDING +
                          counts.WAITING +
                          counts.PROCESSING +
                          counts.RETRY_SCHEDULED}
                      </b>{" "}
                      still on the way
                    </span>
                    <span>
                      <b>{counts.FAILED + counts.DEAD}</b> stopped
                    </span>
                  </div>
                  <DeliveryTable
                    compact
                    records={records}
                    onInspect={setSelected}
                  />
                  <details>
                    <summary>Show counts for each stage</summary>
                    {statuses.map((s) => (
                      <p key={s}>
                        {statusLabels[s]}: {counts[s]}
                      </p>
                    ))}
                  </details>
                </section>
              )}
              <details className="panel advanced-disclosure">
                <summary>Curious about what happens behind the scenes?</summary>
                <Architecture sim={sim} active={simulation.state.component} />
                <h3>Can this page check all the services?</h3>
                <p>
                  {sim
                    ? "No real services are checked in practice mode."
                    : "A delivery response shows that the API replied, but does not prove the other services are healthy."}
                </p>
                <p>
                  {sim
                    ? "All service activity here is simulated."
                    : `API: ${live.checked ? "a response was received" : "unknown"}. PostgreSQL, Kafka, Redis, sender and receiver health: unknown. There are no supported health checks for these services.`}
                </p>
              </details>
            </>
          )}
          {page === "Send a test" && (
            <>
              {sim && simulation.state.scenario !== "success" && (
                <div className="note">
                  <h3>Your current practice test</h3>
                  <p>
                    Messages will follow “
                    {
                      scenarios.find((s) => s.id === simulation.state.scenario)
                        ?.name
                    }
                    ”. Starting fresh below clears earlier practice messages.
                  </p>
                  <button onClick={() => simulation.reset("success")}>
                    Start fresh with a successful delivery
                  </button>
                </div>
              )}
              <Composer
                key={String(sim)}
                sim={sim}
                onSim={simulation.send}
                onTrack={live.track}
                onInspect={setSelected}
                renderResult={(id) => {
                  if (!id) return null;
                  const delivery = records.find((d) => d.id === id);
                  return delivery ? (
                    <DeliveryProgress
                      delivery={delivery}
                      sim={sim}
                      onInspect={() => setSelected(id)}
                    />
                  ) : (
                    <section className="panel">
                      <p role="status">
                        {live.errors[id] ||
                          "Message saved. Waiting for its first delivery update…"}
                      </p>
                    </section>
                  );
                }}
              />
              <div className="note">
                <h3>
                  {sim
                    ? "Want to try a failure or a busy receiver?"
                    : "Need help connecting?"}
                </h3>
                <p>
                  {sim
                    ? "The guided tests set up each situation for you and explain the result."
                    : "Open the setup guide if your real message cannot be sent."}
                </p>
                <button
                  onClick={() => {
                    if (sim) {
                      setLearnTab("tests");
                      navigate("How it works");
                    } else {
                      setShowSetup(true);
                      navigate("Start here");
                    }
                  }}
                >
                  {sim ? "Choose a guided test" : "Open setup guide"}{" "}
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {page === "Your deliveries" && (
            <>
              <section className="panel">
                <h2>
                  {sim
                    ? "Your practice messages"
                    : "Deliveries tracked in this browser"}
                </h2>
                <p>
                  {sim
                    ? "Click a message to see what happened. Starting over clears practice messages."
                    : "Messages you send here are added automatically. You can also add a delivery ID, the reference number returned by the API."}
                </p>
                {!sim && (
                  <details>
                    <summary>Add a message sent somewhere else</summary>
                    <form
                      className="track-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!existing.trim() || existing.trim().length > 200) {
                          setIdError(
                            "Paste a delivery ID between 1 and 200 characters.",
                          );
                          return;
                        }
                        live.track(existing.trim());
                        setExisting("");
                        setIdError("");
                      }}
                    >
                      <input
                        aria-label="Existing delivery ID"
                        placeholder="Paste the delivery ID here"
                        value={existing}
                        onChange={(e) => setExisting(e.target.value)}
                      />
                      <button>Look up this message</button>
                    </form>
                  </details>
                )}
                {idError && (
                  <p role="alert" className="error">
                    {idError}
                  </p>
                )}
                <DeliveryTable records={records} onInspect={setSelected} />
                {live.loading && !sim && (
                  <p role="status">Checking your messages…</p>
                )}
                {!records.length && (
                  <button
                    className="primary"
                    onClick={() => navigate("Send a test")}
                  >
                    Send your first message <ArrowRight size={16} />
                  </button>
                )}
              </section>
              <details className="panel advanced-disclosure">
                <summary>What does each result mean?</summary>
                {statuses.map((s) => (
                  <p key={s}>
                    <strong>{statusLabels[s]}</strong> ({s}) — {nextSteps[s]}
                  </p>
                ))}
              </details>
            </>
          )}
          {page === "How it works" && (
            <>
              <div className="tabs learning-tabs">
                <button
                  className={learnTab === "tests" ? "selected" : ""}
                  aria-pressed={learnTab === "tests"}
                  onClick={() => setLearnTab("tests")}
                >
                  Try a guided test
                </button>
                <button
                  className={learnTab === "lessons" ? "selected" : ""}
                  aria-pressed={learnTab === "lessons"}
                  onClick={() => setLearnTab("lessons")}
                >
                  Read short lessons
                </button>
              </div>
              {learnTab === "lessons" ? (
                <Lessons />
              ) : sim ? (
                <>
                  <SimulationControls simulation={simulation} />
                  {records[0] && (
                    <button
                      className="text-button latest-inspect"
                      onClick={() => setSelected(records[0].id)}
                    >
                      Open latest message details
                    </button>
                  )}
                  <section className="panel recent">
                    <h2>Messages in this test</h2>
                    <DeliveryTable records={records} onInspect={setSelected} />
                  </section>
                  {["rate", "redis"].includes(simulation.state.scenario) && (
                    <RedisWindow simulation={simulation} sim />
                  )}
                  <details className="panel advanced-disclosure">
                    <summary>
                      Show the technical diagram and sending-limit details
                    </summary>
                    <Architecture sim active={simulation.state.component} />
                    {!["rate", "redis"].includes(simulation.state.scenario) && (
                      <RedisWindow simulation={simulation} sim />
                    )}
                  </details>
                </>
              ) : (
                <>
                  <ManualExperiments />
                  <details className="panel advanced-disclosure">
                    <summary>More technical detail</summary>
                    <RedisWindow simulation={simulation} sim={false} />
                    <Architecture sim={false} active="" />
                  </details>
                </>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>HookRelay · Learn by sending one message at a time.</span>
            <span>{sim ? "PRACTICE — SIMULATED" : "REAL BACKEND — LIVE"}</span>
          </footer>
        </main>
      </div>
      {selected && (
        <Inspector
          key={`${sim}-${selected}`}
          delivery={records.find((d) => d.id === selected)}
          history={
            (sim ? simulation.state.history : live.history)[selected] || []
          }
          sim={sim}
          now={sim ? epoch + simulation.state.time * 1000 : now}
          onClose={() => setSelected(null)}
          error={live.errors[selected]}
        />
      )}
    </div>
  );
}
