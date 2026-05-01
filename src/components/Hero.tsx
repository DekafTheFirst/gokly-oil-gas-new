import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Globe, ScanLine } from "lucide-react";
import heroImage from "@/assets/hero-oil-rig.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Oil and gas engineers at refinery"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 lg:px-8 pt-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground font-heading font-medium text-sm mb-6 border border-primary-foreground/20 backdrop-blur-sm">
              Nigeria's Trusted Oil & Gas Partner
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-6 text-primary-foreground"
          >
            Powering the Future of{" "}
            <span className="text-gokly-gold">Energy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-md sm:text-lg text-primary-foreground/85 font-body leading-relaxed mb-10 max-w-2xl"
          >
            Delivering exceptional downstream, midstream and upstream oil and gas solutions and trainings
            with integrity, excellence, and innovation across Nigeria and beyond.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/training/verify"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-full hover:opacity-90 transition-all shadow-elevated group"
            >
              <ScanLine className="h-4 w-4" /> Verify a Certificate

            </Link>
            <Link
              to="/training/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary-foreground/30 text-primary-foreground font-heading font-bold text-sm rounded-full hover:bg-primary-foreground/10 transition-all backdrop-blur-sm"
            >
              Access Training Portal
            </Link>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl"
        >
          {[
            { icon: Shield, label: "Safety First", value: "100% HSE Compliant" },
            { icon: Zap, label: "Excellence", value: "20+ Services" },
            { icon: Globe, label: "Reach", value: "Onshore & Offshore" },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-4 rounded-xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/10"
            >
              <stat.icon size={28} className="text-gokly-gold flex-shrink-0" />
              <div>
                <p className="font-heading font-bold text-primary-foreground text-sm">
                  {stat.value}
                </p>
                <p className="text-primary-foreground/60 text-xs font-body">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
