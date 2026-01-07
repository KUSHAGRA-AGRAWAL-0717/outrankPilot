import React from 'react';
import { ArrowLeft, Code, Zap, Globe, FileText } from 'lucide-react';

const PublicServicesPage: React.FC = () => {
  const services = [
    { icon: Code, title: 'SaaS MVP Development', desc: 'React+Vite+Supabase deployments.' },
    { icon: Zap, title: 'Workflow Automation', desc: 'Edge functions, pg_cron queues.' },
    { icon: Globe, title: 'SEO & Ranking Tools', desc: 'Blog posting, keyword tracking.' },
    { icon: FileText, title: 'Freelance Gigs', desc: 'Fiverr/Upwork optimization.' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      {/* Hero */}
      <section className="gradient-hero text-black py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Public Services</h1>
          <p className="text-xl text-[#000000] mb-8">Core offerings for developers and freelancers.</p>
          <a href="/services" className="btn-primary px-8 py-4 text-lg font-semibold">View Full Catalog</a>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-lg text-center card-hover">
              <div className="icon-circle mx-auto mb-6 text-[#FFD84D]">
                <service.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[#0B1F3B] mb-4">{service.title}</h3>
              <p className="text-[#5B6B8A] mb-6">{service.desc}</p>
              <a href={`/${service.title.toLowerCase().replace(/\s+/g, '-')}`} className="text-[#1B64F2] font-semibold hover:underline">Learn More</a>
            </div>
          ))}
        </div>
        <div className="text-center mt-16">
          <p className="text-[#5B6B8A] text-lg">Sitemap: /sitemap.xml | Robots: /robots.txt | Contact: outrankpilot.com</p>
        </div>
      </section>
    </div>
  );
};

export default PublicServicesPage;
