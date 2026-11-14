import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDemoRequest, getWebsiteContent, getStudentAchievements } from "./utils/storage";
import { signInAdmin } from "./lib/auth";

const programs = [
  ["01", "Little Learners", "Nursery–Class 5", "Build joyful early skills in English, Hindi, Maths, reading and homework habits."],
  ["02", "Middle School Success", "Classes 6–8", "Strengthen Maths, Science, English and Social Science through clear, regular practice."],
  ["03", "Boards & Senior Secondary", "Classes 9–12", "Focused BSEB and CBSE preparation for board exams, PCM, Commerce and strong results."]
];

import logo from "./assets/kritarth-gyan-ganga-logo.png";

function Brand() {
  return <a className="brand" href="#home" aria-label="Kritarth Gyan Ganga home"><img className="site-logo" src={logo} alt="Kritarth Gyan Ganga logo" /><span>Kritarth <em>Gyan Ganga</em></span></a>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [message, setMessage] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const content = getWebsiteContent();

  const openAuth = (mode = "login") => {
    setAuthMode(mode);
    setMessage("");
    setAuthOpen(true);
    setMenuOpen(false);
  };

  const [authLoading, setAuthLoading] = useState(false);

  const submitAuth = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
      const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    if (authMode === "register") {
      setMessage("Public account creation is disabled. Please use the Login button or contact the administrator for access.");
      return;
    } else {
      setAuthLoading(true);
      try {
        const result = await signInAdmin(email, password);
        if (result.error) {
          setMessage(result.error.message || "Unable to sign in. Check your administrator credentials.");
          return;
        }
        setMessage("Login successful. Opening your dashboard…");
        setTimeout(() => navigate("/admin"), 350);
      } catch (err) {
        setMessage(err?.message || "An unexpected sign-in error occurred.");
      } finally {
        setAuthLoading(false);
      }
    }
  };

  return <>
    <div className="topline"><div className="container"><span><b>Admissions open:</b> Nursery to Class 12 batches now enrolling.</span><span>Call us: {content.phone}</span></div></div>
    <header>
      <div className="container nav-wrap">
        <Brand />
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? "×" : "☰"}</button>
        <nav className={menuOpen ? "open" : ""}>
          <a href="#programs" onClick={() => setMenuOpen(false)}>Programs</a>
          <a href="#approach" onClick={() => setMenuOpen(false)}>Our approach</a>
          <a className="button booking" href="#enquire" onClick={() => setMenuOpen(false)}>Book a free session <span>→</span></a>
          <button className="button account" onClick={() => openAuth("login")}>Log in</button>
        </nav>
      </div>
    </header>

    <main>
      <section className="hero" id="home"><div className="container hero-grid">
        <div className="hero-copy"><span className="eyebrow">{content.heroEyebrow}</span><h1>{content.heroHeading.includes("Brighter futures.") ? <>Strong foundations. <mark>Brighter futures.</mark></> : content.heroHeading}</h1><p>{content.heroDescription}</p><div className="actions"><a className="button" href="#enquire">Find the right class <span>→</span></a><a className="button light" href="#approach">How we teach <span>↓</span></a></div><div className="family-proof"><div className="avatars"><i>R</i><i>P</i><i>A</i></div><span>Supporting families in <b>Patna and across Bihar</b></span></div></div>
        <div className="hero-picture"><div className="portrait" style={content.heroImage ? {backgroundImage:`url(${content.heroImage})`,backgroundSize:"cover",backgroundPosition:"center"} : undefined}></div><span className="sparkle">✦</span><span className="plus">+</span><div className="next-class"><small>Next live class</small><strong>{content.nextClass}</strong></div></div>
      </div></section>

      <section className="stats"><div className="container stats-grid"><div><b>Nursery–12</b><span>support for every school stage</span></div><div><b>BSEB + CBSE</b><span>board-focused learning support</span></div><div><b>1:10</b><span>maximum small-batch size</span></div><div><b>Monthly</b><span>progress updates for parents</span></div></div></section>

      <section id="programs"><div className="container"><SectionHeading eyebrow="From first words to final boards" title="Right support for every class and every child." copy="From early reading to board-exam preparation, we build skills, study habits and confidence at the right pace." /><div className="program-grid">{programs.map(([number, title, level, copy]) => <article className="program-card" key={number}><span className="program-number">{number}</span><h3>{title}</h3><p className="level">{level}</p><p>{copy}</p><a href="#enquire">Explore classes →</a></article>)}</div></div></section>

      <section className="approach" id="approach"><div className="container approach-grid"><div className="teacher-image"><div style={content.approachImage ? {backgroundImage:`url(${content.approachImage})`} : undefined}></div><p>“The best question is the one you ask.”</p></div><div><span className="eyebrow">The Kritarth Gyan Ganga way</span><h2>Teaching that understands the child, the syllabus and the board.</h2><div className="steps"><Step number="01" title="Start with a friendly assessment" copy="We identify your child's level, school board and learning needs before suggesting a batch." /><Step number="02" title="Learn in small, focused batches" copy="Experienced teachers break lessons into simple steps, with homework help and regular revision." /><Step number="03" title="Keep parents in the loop" copy="Monthly tests and progress updates help families see improvements in effort, skills and marks." /></div></div></div></section>

      <section className="results" id="results"><div className="container"><SectionHeading eyebrow="Student achievements" title="Growing confidence. Outstanding results." copy="From first classroom answers to board-exam milestones, our students learn to aim higher and achieve more." /><AchievementCarousel /></div></section>

      <section className="enquire" id="enquire"><div className="container enquire-grid"><div><span className="eyebrow">Admissions open in Bihar</span><h2>Let’s find the right batch.</h2><p>Tell us your child's class and school board. We’ll arrange a friendly, no-pressure assessment with one of our learning advisors.</p><small>● Usually replies within one school day</small></div><form className="enquiry-form" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const classSelection = String(form.get("className") || "");
          const classNameMap = {
            "Nursery–UKG": "Nursery",
            "Class 1–5": "Class 1",
            "Class 6–8": "Class 6",
            "Class 9–10": "Class 9",
            "Class 11–12": "Class 11"
          };
          const subject = String(form.get("subject") || "All subjects");
          const created = addDemoRequest({
            name: String(form.get("parentName") || "").trim(),
            parent: String(form.get("parentName") || "").trim(),
            className: classNameMap[classSelection] || classSelection,
            subject,
            phone: String(form.get("phone") || "").trim(),
            email: "",
            preferredDate: new Date().toISOString().slice(0, 10),
            preferredTime: "",
            mode: "Online",
            status: "New",
            notes: `Public website free assessment request. Class preference: ${classSelection}. Subject preference: ${subject}.`
          });
          if (created) {
            setEnquiryMessage("Free class request successful! Your request has been submitted successfully. We’ll contact you shortly.");
            event.currentTarget.reset();
          }
        }}>
          <label>Parent / guardian name<input name="parentName" required placeholder="Your name" /></label>
          <label>Phone number<input name="phone" required type="tel" placeholder="98765 43210" /></label>
          <label className="full">Student's class<select name="className" required defaultValue=""><option value="" disabled>Select a class</option><option>Nursery–UKG</option><option>Class 1–5</option><option>Class 6–8</option><option>Class 9–10</option><option>Class 11–12</option></select></label>
          <label className="full">Subject of interest<select name="subject" required defaultValue=""><option value="" disabled>Choose a subject</option><option>All subjects</option><option>Maths</option><option>Science</option><option>English / Hindi</option><option>Physics / Chemistry</option><option>Commerce</option></select></label>
          <button className="button full" type="submit">Request a free assessment <span>→</span></button>
          {enquiryMessage && <p className="success">{enquiryMessage}</p>}
        </form></div></section>
    </main>

    <footer><div className="container footer-main"><div><Brand /><p>Personal, caring tuition for Nursery to Class 12—helping students build confidence, skills and brighter futures.</p><a className="yellow" href="https://www.google.com/maps/search/?api=1&query=Hiramiya%20Ward%20No%2004%20Rosera%20Samastipur%20Bihar%20848210" target="_blank" rel="noreferrer">● Hiramiya Ward No - 04, Rosera, Samastipur, Bihar</a></div><FooterColumn title="Programmes" links={["Nursery–Class 5", "Classes 6–8", "Classes 9–10", "Classes 11–12"]} /><FooterColumn title="Quick links" links={["Our approach", "Student achievements", "Book a free session", "Admissions enquiry"]} /><div><h3>Contact us</h3><p><small>Director</small>{content.directorName || "Saroj Kumar"}</p><p><small>Phone</small><a href={`tel:${String(content.phone||"").replace(/\s+/g,"")}`}>{content.phone}</a></p><p><small>Email</small><a href={`mailto:${content.email||""}`}>{content.email}</a></p><p><small>Location</small>{content.address}</p><p><small>Hours</small>Monday–Saturday · 8:00 AM–7:00 PM</p><div className="social-links"><small>Follow us</small><div className="social-links-row">{content.linkedin && <a href={content.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}{content.instagram && <a href={content.instagram} target="_blank" rel="noreferrer">Instagram</a>}{content.facebook && <a href={content.facebook} target="_blank" rel="noreferrer">Facebook</a>}{content.twitter && <a href={content.twitter} target="_blank" rel="noreferrer">X / Twitter</a>}{content.youtube && <a href={content.youtube} target="_blank" rel="noreferrer">YouTube</a>}</div></div></div></div><div className="container footer-bottom"><span>© 2026 Kritarth Gyan Ganga. All rights reserved.</span><span>Privacy policy · Terms of use · Contact</span></div></footer>

    {authOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}><div className="auth-modal" role="dialog" aria-modal="true" aria-label="Account access"><button className="close" onClick={() => setAuthOpen(false)} aria-label="Close">×</button><span className="eyebrow">Kritarth Gyan Ganga family portal</span><h2>{authMode === "login" ? "Welcome back." : "Join Kritarth Gyan Ganga."}</h2><p>{authMode === "login" ? "Log in to view class updates, resources and progress notes." : "Create a family portal account to keep learning details in one place."}</p><div className="tabs"><button className="active" type="button">Admin Login</button></div><form onSubmit={submitAuth}><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" required minLength="6" placeholder="Enter your password" /></label><button className="button full" disabled={authLoading}>{authLoading ? "Signing in…" : "Log in →"}</button></form>{message && <p className="success">{message}</p>}<small className="demo-note">Administrator access is controlled from the protected admin system. Public sign-up is disabled.</small></div></div>}
  </>;
}

function AchievementCarousel() {
  const [achievements, setAchievements] = useState(() =>
    getStudentAchievements()
      .filter(x => x.active)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setAchievements(
        getStudentAchievements()
          .filter(x => x.active)
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      );
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  if (!achievements.length) return <div className="achievement-empty-public">No student achievements are currently published.</div>;

  // Two or more identical sets are required for a seamless marquee. The CSS animation
  // travels exactly one complete set, so the following set is already in the same place
  // when the animation repeats. Four copies also keep the viewport filled with very small lists.
  const copies = [0, 1, 2, 3];

  return (
    <div
      className={`achievement-marquee${paused ? " is-paused" : ""}`}
      aria-label="Student achievements carousel"
      onClick={() => setPaused(value => !value)}
    >
      <div className="achievement-track">
        {copies.map(copy => (
          <div className="achievement-set" key={copy}>
            {achievements.map(achievement => (
              <article
                className="achievement"
                key={`${copy}-${achievement.id || achievement.name}`}
              >
                <div className="achievement-head">
                  {achievement.photo ? <img className="story-photo" src={achievement.photo} alt={achievement.name} /> : <span className="initials">{achievement.name.split(" ").map(x => x[0]).slice(0, 2).join("")}</span>}
                  <span className="tag">{achievement.tag}</span>
                </div>
                <h3>{achievement.name}</h3>
                <p>{achievement.result}</p>
                <blockquote>{achievement.quote}</blockquote>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
function SectionHeading({ eyebrow, title, copy }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><p>{copy}</p></div>; }
function Step({ number, title, copy }) { return <div className="step"><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></div>; }
function FooterColumn({ title, links }) { return <div><h3>{title}</h3>{links.map((link) => <a href="#home" key={link}>{link}</a>)}</div>; }

