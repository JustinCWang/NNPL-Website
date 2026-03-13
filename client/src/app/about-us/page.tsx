/*
  Public About Us page ("/about-us").
  - Accessible without authentication
  - Information about NNPL and sections for different stakeholders
*/

import Link from "next/link";

export default function AboutUsPage() {
  return (
    <main className="min-h-dvh text-theme-foreground">
      {/* Simple header for public pages */}
      <header className="py-4 px-6 lg:px-8 border-b">
        <div className="mx-auto w-full max-w-screen-2xl flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">← Back to Home</Link>
        </div>
      </header>
      
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Main About Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">About NNPL</h1>
            <p className="text-xl text-theme-muted leading-relaxed">
              The Northern Nevada Pokémon League (NNPL) is a community-driven organization dedicated to 
              fostering competitive Pokémon TCG play, connecting players, and supporting local game stores 
              throughout Northern Nevada.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="theme-card mb-16 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-center">Our Mission</h2>
            <p className="text-theme-muted text-center leading-relaxed">
              To create an inclusive, competitive environment where Pokémon TCG players of all skill levels 
              can learn, compete, and grow together while supporting the local gaming community.
            </p>
          </div>

          {/* Stakeholder Sections */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            
            {/* Store Owners Section */}
            <div className="theme-card theme-card-hover rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="theme-panel w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Store Owners</h3>
              </div>
              <p className="text-theme-muted mb-4 text-sm">
                Partner with NNPL to host sanctioned tournaments, grow your customer base, 
                and become part of the competitive Pokémon TCG community.
              </p>
              <ul className="text-sm text-theme-muted space-y-2 mb-4">
                <li>• Tournament hosting support</li>
                <li>• Player referral system</li>
                <li>• Event promotion assistance</li>
                <li>• Community building resources</li>
              </ul>
              <button className="theme-button w-full px-4 py-2 rounded-md text-sm">
                Partner With Us
              </button>
            </div>

            {/* Vendors Section */}
            <div className="theme-card theme-card-hover rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="theme-panel w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Vendors</h3>
              </div>
              <p className="text-theme-muted mb-4 text-sm">
                Connect with our player community to showcase your products, 
                sponsor events, and grow your business in the TCG market.
              </p>
              <ul className="text-sm text-theme-muted space-y-2 mb-4">
                <li>• Event sponsorship opportunities</li>
                <li>• Product showcase platforms</li>
                <li>• Direct player engagement</li>
                <li>• Community advertising</li>
              </ul>
              <button className="theme-button w-full px-4 py-2 rounded-md text-sm">
                Become a Vendor
              </button>
            </div>

            {/* Developers Section */}
            <div className="theme-card theme-card-hover rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="theme-panel w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Developers</h3>
              </div>
              <p className="text-theme-muted mb-4 text-sm">
                Contribute to the NNPL platform, build tools for the community, 
                and help shape the future of competitive Pokémon TCG.
              </p>
              <ul className="text-sm text-theme-muted space-y-2 mb-4">
                <li>• Open source contributions</li>
                <li>• API access and documentation</li>
                <li>• Community tool development</li>
                <li>• Technical collaboration</li>
              </ul>
              <button className="theme-button w-full px-4 py-2 rounded-md text-sm">
                Join Development
              </button>
            </div>
          </div>

          {/* Contact Section */}
          <div className="theme-card text-center rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Get In Touch</h2>
            <p className="text-theme-muted mb-6">
              Have questions or want to get involved? We&apos;d love to hear from you!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="theme-button px-6 py-2 rounded-md">
                Contact Us
              </button>
              <Link 
                href="/events" 
                className="theme-button-subtle px-6 py-2 rounded-md"
              >
                View Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
