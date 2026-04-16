import { motion } from "framer-motion";
import ServicesSection from "@/components/ServicesSection";
import offshoreImg from "@/assets/offshore-platform.jpg";

const Services = () => {
  return (
    <main className="pt-20">
      {/* Hero Banner */}
      <section className="relative h-80 flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={offshoreImg} alt="Offshore platform" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gokly-dark/70" />
        </div>
        <div className="relative container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase border border-primary-foreground/20">
              Our Services
            </span>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary-foreground">
              What We Offer
            </h1>
            <p className="text-primary-foreground/80 font-body mt-3 max-w-xl">
              Comprehensive solutions across the entire oil and gas value chain.
            </p>
          </motion.div>
        </div>
      </section>

      <ServicesSection showTitle={false} />

      {/* Host Community */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-3xl mx-auto p-10 rounded-2xl bg-primary text-primary-foreground"
          >
            <h3 className="font-heading font-bold text-2xl mb-4">Host Community Advisory Services</h3>
            <p className="font-body opacity-85 leading-relaxed">
              We provide advisory services that foster strong relationships between oil and gas companies and their host communities, ensuring sustainable development and mutual benefit for all stakeholders.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Services;
