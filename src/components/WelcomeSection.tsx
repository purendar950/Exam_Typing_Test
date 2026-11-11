import React, { useMemo } from 'react';
import { Ico, IcoName } from './Ico';
import { getPaymentPlans } from '../services/paymentService';

interface WelcomeSectionProps {
  examCount: number;
  testCount: number;
  onBrowseTests: () => void;
  onOpenPayment: () => void;
  onOpenAuth: () => void;
}

const STEPS: { icon: IcoName; title: string; text: string }[] = [
  { icon: 'search', title: 'Pick your exam', text: 'Each exam uses its own time limit, passage length and backspace rule.' },
  { icon: 'keyboard', title: 'Type the passage', text: 'English, Hindi Mangal (Inscript) or Kruti Dev, on a timed test screen.' },
  { icon: 'target', title: 'See where you stand', text: 'Speed, accuracy, every wrong word, your weak keys and whether you would qualify.' }
];

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ examCount, testCount, onBrowseTests, onOpenPayment, onOpenAuth }) => {
  const plans = useMemo(() => getPaymentPlans(), []);
  const single = plans.filter((p) => p.type === 'single_exam').sort((a, b) => a.discountedPrice - b.discountedPrice)[0];
  const all = plans.filter((p) => p.type === 'all_exams_pass').sort((a, b) => a.discountedPrice - b.discountedPrice)[0];

  const faqs: { q: string; a: string }[] = [
    {
      q: 'What can I use for free?',
      a: 'The first 7 tests of every exam are free, with the full result report. You do not need to pay or add a card.'
    },
    {
      q: 'What does Pro unlock?',
      a: 'Every test from number 8 onwards, for one exam or for all exams depending on the plan you choose.'
    },
    {
      q: 'How do I pay, and when is my plan activated?',
      a: 'You pay by UPI, then enter the transaction ID and upload the payment screenshot. Your plan is switched on after we check the payment.'
    },
    {
      q: 'Can I get a refund?',
      a: 'No. Payments are not refundable, so please try the free tests first.'
    },
    {
      q: 'Is this an official government website?',
      a: 'No. Exam Typing is an independent practice tool and is not connected to any recruitment board.'
    }
  ];

  return (
    <section className="welcome">
      <div className="welcome-hero">
        <h1>Typing practice for government exam skill tests</h1>
        <p>
          Timed Hindi and English typing tests for {examCount} exams, including UP Police Computer Operator, UPSSSC, High Court and SSC.
          Each test follows that exam's rules and tells you if your speed and accuracy would qualify.
        </p>
        <div className="welcome-actions">
          <button type="button" className="btn btn-primary" onClick={onBrowseTests}>
            Start a free test
          </button>
          <button type="button" className="btn btn-secondary" onClick={onOpenPayment}>
            See plans
          </button>
          <button type="button" className="welcome-link" onClick={onOpenAuth}>
            Already have an account? Log in
          </button>
        </div>
        <ul className="welcome-facts">
          <li><Ico n="check" /> {testCount} practice tests</li>
          <li><Ico n="check" /> First 7 tests of every exam free</li>
          <li><Ico n="check" /> Hindi Mangal, Kruti Dev and English</li>
        </ul>
      </div>

      <div className="welcome-steps">
        {STEPS.map((s, i) => (
          <div key={s.title} className="welcome-step">
            <span className="welcome-step-icon"><Ico n={s.icon} size={20} /></span>
            <h3>{i + 1}. {s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>

      <div className="welcome-plans">
        <div className="welcome-plan">
          <h3>Free</h3>
          <div className="welcome-price">₹0</div>
          <p>Tests 1 to 7 of every exam, with the full result report.</p>
          <button type="button" className="btn btn-secondary" onClick={onBrowseTests}>Start practising</button>
        </div>
        {single && (
          <div className="welcome-plan">
            <h3>One exam</h3>
            <div className="welcome-price">from ₹{single.discountedPrice}<span> / {single.durationLabel.toLowerCase()}</span></div>
            <p>All tests for the one exam you are preparing for.</p>
            <button type="button" className="btn btn-secondary" onClick={onOpenPayment}>View plans</button>
          </div>
        )}
        {all && (
          <div className="welcome-plan">
            <h3>All exams</h3>
            <div className="welcome-price">from ₹{all.discountedPrice}<span> / {all.durationLabel.toLowerCase()}</span></div>
            <p>Every test for every exam on the site.</p>
            <button type="button" className="btn btn-primary" onClick={onOpenPayment}>View plans</button>
          </div>
        )}
      </div>

      <div className="welcome-faq">
        <h2>Common questions</h2>
        {faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
};
