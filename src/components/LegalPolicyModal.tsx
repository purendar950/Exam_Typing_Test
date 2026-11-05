import React, { useState } from 'react';

export type LegalTab = 'terms' | 'privacy' | 'refund' | 'copyright' | 'disclaimer' | 'contact';

interface LegalPolicyModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalPolicyModal: React.FC<LegalPolicyModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚖️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Legal Policies & Trust Center
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Exam Typing Mentor &bull; Transparency, Privacy & Terms of Service
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            overflowX: 'auto',
            padding: '4px 12px',
            gap: '6px'
          }}
        >
          {[
            { id: 'terms', label: '📜 Terms of Service', short: 'Terms' },
            { id: 'privacy', label: '🔒 Privacy Policy', short: 'Privacy' },
            { id: 'refund', label: '🚫 Strict No-Refund Policy', short: 'No Refunds' },
            { id: 'copyright', label: '©️ Copyright & IP', short: 'Copyright' },
            { id: 'disclaimer', label: '🛡️ Disclaimer', short: 'Disclaimer' },
            { id: 'contact', label: '📞 Contact & Support', short: 'Contact' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LegalTab)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            flex: 1,
            color: '#334155',
            fontSize: '0.9rem',
            lineHeight: 1.7
          }}
        >
          {/* 1. TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Terms and Conditions of Service
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
                Last Updated: November 2026 &bull; Effective Date: Immediate
              </p>

              <div style={{ background: '#f0f9ff', borderLeft: '4px solid #0284c7', padding: '12px 16px', borderRadius: '4px', marginBottom: '18px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#0369a1' }}>
                  Please read these Terms and Conditions carefully before using the <strong>Exam Typing Mentor</strong> online portal. By registering, accessing, or practicing on this website, you agree to be legally bound by these terms.
                </p>
              </div>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>1. Platform Purpose & Scope</h4>
              <p>
                Exam Typing Mentor is an educational web simulator designed to assist aspirants in preparing for competitive government typing examinations, including but not limited to <strong>UP Police Computer Operator</strong>, <strong>UP Police ASI (Clerk/Accounts)</strong>, <strong>UPSSSC Junior Assistant</strong>, <strong>Allahabad High Court</strong>, and <strong>SSC CGL / CHSL</strong>.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>2. User Account & Security</h4>
              <ul>
                <li>Each student is granted an individual, non-transferable account. Sharing account credentials, passwords, or active sessions is strictly prohibited.</li>
                <li>Users are responsible for maintaining the confidentiality of their login credentials and are responsible for all test attempts under their account.</li>
                <li>Accounts detected engaging in automated bot typing, script injection, or unauthorized credential sharing may be suspended without refund.</li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>3. Typing Evaluation Algorithm</h4>
              <p>
                Our typing test evaluation engine closely simulates the official government exam formulas (such as UPPRPB formula: Gross WPM, Net WPM, 85% Accuracy benchmark, and Backspace rules). While we strive for 100% fidelity to official exam standards, Exam Typing Mentor operates as a practice tool and does not issue official government certifications or guarantee selection in government recruitment.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>4. Free Demo Tests & Pro Subscriptions</h4>
              <ul>
                <li><strong>7 Free Demo Tests:</strong> Every candidate is entitled to take the first 7 mock tests of every exam category completely free of charge to evaluate our system, software interface, keyboard responsiveness, and timer accuracy.</li>
                <li><strong>Pro Subscription:</strong> Access to Test #08 and beyond requires an active Pro subscription (Single Exam Pass, Category Combo Pass, or All Exams Mega Pass). Subscriptions are valid for the designated validity period (1 Month, 3 Months, 6 Months, or 12 Months) from the approval date.</li>
                <li><strong>Strict No-Refund Clause:</strong> Once an order is placed and subscription is activated, payments are <strong>strictly non-refundable under any circumstances whatsoever</strong>. All purchases are final.</li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>5. User Conduct & Prohibited Activities</h4>
              <ul>
                <li>You agree not to copy, reverse-engineer, decompile, scrape, or mass-download passage banks or exam software assets.</li>
                <li>You agree not to post vulgar, abusive, or fraudulent content or spam within our Telegram community channels or discussion forums.</li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>6. Modifications to Service</h4>
              <p>
                We reserve the right to update typing passages, improve UI algorithms, adjust subscription pricing, or introduce new exams at any time to reflect the latest government exam patterns.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>7. Governing Law</h4>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of the use of this website shall be subject to the exclusive jurisdiction of the competent courts in Uttar Pradesh, India.
              </p>
            </div>
          )}

          {/* 2. PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Privacy Policy
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
                Your Privacy Matters &bull; Strict Non-Commercial Data Protection
              </p>

              <div style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '12px 16px', borderRadius: '4px', marginBottom: '18px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857' }}>
                  <strong>Our Privacy Guarantee:</strong> We never sell, rent, or trade your personal information, phone number, or test performance history to third-party telemarketers or advertisers.
                </p>
              </div>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>1. Information We Collect</h4>
              <p>To provide personalized typing training and maintain candidate progress, we collect:</p>
              <ul>
                <li><strong>Account Data:</strong> Name, Email Address, and encrypted authentication tokens via Google Firebase.</li>
                <li><strong>Typing Performance Analytics:</strong> Gross speed (WPM), Net speed, Accuracy percentage, Backspace count, Key mistake history, and test timestamps.</li>
                <li><strong>Payment Verification Data:</strong> UPI Reference Number (UTR), payment screenshot, and chosen subscription tier for manually verified orders.</li>
                <li><strong>Local Device Preferences:</strong> Sound effects state (ON/OFF), font size, auto-scroll choice, and dark/light mode saved locally on your device via browser LocalStorage.</li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>2. How We Use Your Information</h4>
              <ul>
                <li>To calculate your typing speed, accuracy percentage, and exam qualification status.</li>
                <li>To generate detailed Weak Keys & Mistakes drills tailored to your typing habits.</li>
                <li>To verify candidate subscription payments via our automated Telegram Admin alert bot.</li>
                <li>To send important exam updates, admit card alerts, or score reports to your registered email or Telegram account.</li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>3. Data Storage & Security</h4>
              <p>
                All sensitive candidate credentials and test histories are stored on Google Cloud Firebase infrastructure with enterprise-grade SSL/TLS 256-bit encryption. Payment verification screenshots are only accessible to authorized platform administrators for subscription activation.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>4. Cookies & Local Storage</h4>
              <p>
                We use browser <code>localStorage</code> and <code>sessionStorage</code> exclusively to save your active test progress, display settings, and login session so your experience remains seamless across page refreshes. We do not use intrusive third-party cross-site tracking cookies.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>5. User Rights & Data Deletion</h4>
              <p>
                Candidates may request complete deletion of their account and test attempt history at any time by contacting our administrator via Telegram (<code>@purendare</code>).
              </p>
            </div>
          )}

          {/* 3. STRICT NO-REFUND POLICY */}
          {activeTab === 'refund' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', marginBottom: '8px' }}>
                Strict No-Refund & Cancellation Policy
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
                Effective Date: Immediate &bull; Mandatory Terms for All Candidates
              </p>

              <div style={{ background: '#fef2f2', borderLeft: '4px solid #dc2626', padding: '14px 18px', borderRadius: '6px', marginBottom: '18px' }}>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#991b1b', fontWeight: 800 }}>
                  🚨 MANDATORY NOTICE: PAYMENTS ARE STRICTLY NON-REFUNDABLE UNDER ANY CIRCUMSTANCES
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#b91c1c', lineHeight: 1.5 }}>
                  Once a candidate completes payment and access to the Pro exam test series is granted, <strong>no refunds, cancellations, chargebacks, or reversals will be provided under any circumstances whatsoever</strong>. All sales and subscription fees are final and non-negotiable.
                </p>
              </div>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>1. Try Before You Buy: 7 Free Demo Tests Guarantee</h4>
              <p>
                To ensure 100% transparency, fairness, and student confidence, <strong>Exam Typing Mentor provides the first 7 full-length typing tests of every single exam completely free of charge</strong>.
              </p>
              <ul>
                <li>Candidates have full, unrestricted access to test keyboard compatibility, font rendering (KrutiDev 010, Mangal Inscript, Remington GAIL), auto-scroll behavior, backspace restrictions, and real-time accuracy scoring on their specific device before making any payment.</li>
                <li>By initiating payment or submitting a transaction UTR, the candidate explicitly certifies that they have attempted the 7 free demo tests, evaluated the platform thoroughly, and found the software completely satisfactory.</li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>2. Absolute No-Refund Scenarios</h4>
              <p>
                Refund requests will <strong>NOT</strong> be entertained or granted under any of the following circumstances:
              </p>
              <ul>
                <li><strong>Change of Mind:</strong> Deciding not to practice, lack of personal study time, or changing preparation to a different exam.</li>
                <li><strong>Exam Rescheduling or Cancellation:</strong> Postponement, delay, cancellation, or pattern changes made by government recruitment boards (UPPRPB, UPSSSC, SSC, High Court, etc.).</li>
                <li><strong>Accidental Plan Purchase:</strong> Selecting the wrong exam category or pass duration (e.g. buying Single Pass instead of Combo Pass).</li>
                <li><strong>Hardware or Device Issues:</strong> Third-party hardware faults, broken keyboards, slow personal internet connectivity, or mobile device limitations.</li>
                <li><strong>Exam Results:</strong> Failure to clear the official typing exam, as our platform is a practice simulator and cannot control candidate performance under exam hall conditions.</li>
                <li><strong>Account Sharing Violations:</strong> Account suspension or termination resulting from sharing credentials, multiple concurrent IP logins, or scraping.</li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>3. Digital Goods & Instant Delivery</h4>
              <p>
                The subscription provides immediate, intangible digital access to our proprietary question banks, passage archives, and AI performance reports. In accordance with digital commerce standards, digital goods cannot be returned or revoked once delivered.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>4. Accidental Duplicate Payment Exception</h4>
              <p>
                The sole technical exception is an <strong>accidental duplicate deduction</strong> where a candidate's bank debits twice for the exact same transaction within a few minutes due to a UPI network glitch. In such cases, upon verification of the identical duplicate UTR with our bank, the extra amount will be refunded within 3 to 5 business days. This does not apply to active, intended subscriptions.
              </p>
            </div>
          )}

          {/* 4. COPYRIGHT & INTELLECTUAL PROPERTY */}
          {activeTab === 'copyright' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Copyright & Intellectual Property Notice
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
                &copy; 2026 Exam Typing Mentor. All Rights Reserved.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>1. Proprietary Software & Design</h4>
              <p>
                All software code, visual layouts, styling, custom typewriter sound synthesizer, real-time diff evaluation algorithms, and proprietary passage arrangements available on <strong>Exam Typing Mentor</strong> are protected under the Indian Copyright Act, 1957, and international intellectual property laws.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>2. Permitted Use</h4>
              <p>
                Subscribers and candidates are granted a limited, personal, non-exclusive, revocable license to practice and test their typing skills on this website for their individual exam preparation.
              </p>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>3. Prohibited Exploitation</h4>
              <ul>
                <li>You may not reproduce, copy, duplicate, sell, scrape, mirror, or republish our typing passages, test series, or software interfaces onto any other portal, mobile application, or offline institute material without written consent.</li>
                <li>Unauthorized distribution of our premium passage banks via Telegram channels, WhatsApp groups, or YouTube links will result in account termination and legal action under copyright infringement provisions.</li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>4. Fonts & Third-Party Trademarks</h4>
              <p>
                <strong>KrutiDev 010</strong>, <strong>Mangal (Inscript / Remington GAIL)</strong>, and government exam acronyms (UPPRPB, UPSSSC, SSC, HSSC, BSSC) are acknowledged as the property and trademarks of their respective creators and government commissions. They are referenced strictly for educational compatibility and candidate guidance.
              </p>
            </div>
          )}

          {/* 5. DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Non-Affiliation & Educational Disclaimer
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
                Important Notice for All Candidates
              </p>

              <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '14px 18px', borderRadius: '4px', marginBottom: '18px' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', fontWeight: 700 }}>
                  NON-GOVERNMENT AFFILIATION DISCLAIMER:
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#b91c1c' }}>
                  Exam Typing Mentor is an independent educational training platform. We are <strong>NOT affiliated, associated, authorized, endorsed by, or in any way officially connected</strong> with the Uttar Pradesh Police Recruitment and Promotion Board (UPPRPB), UPSSSC, Staff Selection Commission (SSC), Allahabad High Court, or any Central or State Government department.
                </p>
              </div>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>1. Information Accuracy</h4>
              <p>
                Exam benchmarks, speeds (e.g. 25 WPM Hindi, 30 WPM English), accuracy criteria, and test durations mentioned on this portal are compiled from publicly available recruitment notifications and previous years' exam patterns for student guidance. Candidates are strongly advised to verify official guidelines, dates, and admit cards directly from official government recruiting websites:
              </p>
              <ul>
                <li>UPPRPB Official: <code>uppbpb.gov.in</code></li>
                <li>UPSSSC Official: <code>upsssc.gov.in</code></li>
                <li>Staff Selection Commission: <code>ssc.gov.in</code></li>
                <li>Allahabad High Court: <code>allahabadhighcourt.in</code></li>
              </ul>

              <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '6px' }}>2. No Guarantee of Selection</h4>
              <p>
                While regular practice on our simulator will dramatically improve your speed, key accuracy, and exam temperament, achieving qualifying marks on our platform does not guarantee selection in official government recruitment exams, as official evaluations are conducted under distinct physical conditions and administrative supervision.
              </p>
            </div>
          )}

          {/* 6. CONTACT & SUPPORT */}
          {activeTab === 'contact' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Contact & Grievance Redressal
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
                We are Here to Help You 24x7
              </p>

              <p>
                If you have any questions, payment verification requests, feedback on typing passages, or grievance regarding platform policies, please reach out through our official channels:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>💬</div>
                  <strong style={{ display: 'block', color: '#0f172a', marginBottom: '4px' }}>Direct 1-on-1 Admin Helpdesk</strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Fastest response for payment activations & login help:</span>
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href="https://t.me/purendare"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                    >
                      @purendare ↗
                    </a>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>📢</div>
                  <strong style={{ display: 'block', color: '#0f172a', marginBottom: '4px' }}>Official Broadcast Channel</strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>For exam dates, cutoff alerts, and daily tests:</span>
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href="https://t.me/Exam_Typing_Mentor"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                    >
                      t.me/Exam_Typing_Mentor ↗
                    </a>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>👥</div>
                  <strong style={{ display: 'block', color: '#0f172a', marginBottom: '4px' }}>Aspirants Community</strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Chat with thousands of fellow aspirants & share tips:</span>
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href="https://t.me/+Lw-tPbRqOOc2ZTA1"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Join Discussion Group ↗
                    </a>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>🛡️</div>
                  <strong style={{ display: 'block', color: '#0f172a', marginBottom: '4px' }}>Admin & Grievance Officer</strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Direct escalation for account or payment disputes:</span>
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    Purendar Chauhan (@purendare)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            &copy; 2026 Exam Typing Mentor. All rights reserved.
          </span>
          <button
            onClick={onClose}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700, padding: '8px 20px', borderRadius: '8px' }}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
