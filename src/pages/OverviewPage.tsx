import { AppLink } from '../AppLink'

const steps = [
  { title: 'Choose a pastor', text: 'Say who you want to meet and what the conversation is for.' },
  { title: 'Pick an open time', text: 'The calendar shows days that still have a free slot.' },
  { title: 'Send your request', text: 'Leave your name and how the church should reply.' },
]

const features = [
  { title: 'A short request', text: 'Purpose, day, and whether you will meet in person or online.' },
  { title: 'Hours that belong to the pastor', text: 'Open days and times come from that pastor’s own schedule.' },
  { title: 'A clear reply', text: 'You keep a reference number while the pastor confirms or declines.' },
]

export function OverviewPage() {
  return (
    <>
      <section className="hero card">
        <div className="hero-copy">
          <img className="page-logo" src="/logo.png" alt="ETOPADE" width={88} height={88} />
          <p className="eyebrow">ETOPADE</p>
          <h1>Book time with your pastor in under two minutes.</h1>
          <p className="lede">
            Choose a pastor, pick an open time, and send your request. You will get a reference number while the pastor
            replies.
          </p>
          <div className="cta-row">
            <AppLink className="primary-button" to="/booking">
              Book a time
            </AppLink>
            <AppLink className="secondary-button" to="/login">
              Staff log in
            </AppLink>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel">
            <h2>How it works</h2>
            <ol className="steps">
              {steps.map((step) => (
                <li key={step.title}>
                  <span>
                    <strong>{step.title}</strong>
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <div className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="card feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </>
  )
}
