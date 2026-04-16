import Hero from "@/components/Hero";
import AboutPreview from "@/components/AboutPreview";
import ServicesSection from "@/components/ServicesSection";
import PartnersSection from "@/components/PartnersSection";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import offshoreImg from "@/assets/offshore-platform.jpg";
import refineryImg from "@/assets/refinery-dusk.jpg";

const Index = () => {
  return (
    <main>
      <Hero />
      <AboutPreview />
      <ServicesSection limit={8} />

      {/* CTA to see all services */}
      <div className="text-center pb-16 bg-section-gradient">
        <Link
          to="/services"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-full hover:opacity-90 transition-opacity shadow-soft group"
        >
          View All Services
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase">
              Why Choose Us
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
              Trusted Across the Industry
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden group h-72"
            >
              <img src={offshoreImg} alt="Offshore platform" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gokly-dark/60 flex items-end p-8">
                <div>
                  <h3 className="font-heading font-bold text-xl text-primary-foreground mb-2">Offshore & Onshore Excellence</h3>
                  <p className="font-body text-primary-foreground/80 text-sm">Operating across Nigeria's oil-rich regions with proven expertise.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden group h-72"
            >
              <img src={refineryImg} alt="Refinery at dusk" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gokly-dark/60 flex items-end p-8">
                <div>
                  <h3 className="font-heading font-bold text-xl text-primary-foreground mb-2">World-Class Infrastructure</h3>
                  <p className="font-body text-primary-foreground/80 text-sm">Supporting Nigeria's energy infrastructure with modern solutions.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <PartnersSection />

      {/* CTA Banner */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-primary-foreground mb-4">
              Ready to Partner With Us?
            </h2>
            <p className="font-body text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Let us help you achieve your oil and gas operational goals with our proven expertise.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-foreground text-primary font-heading font-bold text-sm rounded-full hover:opacity-90 transition-opacity shadow-elevated"
            >
              Contact Us Today
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Index;
