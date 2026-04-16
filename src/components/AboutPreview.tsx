import { motion } from "framer-motion";
import teamImg from "@/assets/team-engineers.jpg";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const values = [
  "Integrity in all operations",
  "Excellence in service delivery",
  "Innovation-driven approach",
  "Safety & sustainability focus",
  "Stakeholder collaboration",
];

const AboutPreview = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={teamImg}
                alt="Gokly engineering team"
                className="w-full h-[420px] object-cover"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-4 lg:right-6 bg-primary text-primary-foreground px-6 py-4 rounded-xl shadow-elevated">
              <p className="font-heading font-bold text-2xl">10+</p>
              <p className="font-body text-sm opacity-80">Years of Excellence</p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase">
              About Us
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-5">
              Leading Oil & Gas Solutions Provider
            </h2>
            <p className="text-muted-foreground font-body leading-relaxed mb-6">
              Gokly Oil and Gas Services Limited is a leading provider of comprehensive solutions 
              to the oil and gas industry. With over a decade of operational excellence across 
              Nigeria's midstream and upstream sectors, we deliver exceptional services that 
              enhance operational efficiency, safety, sustainability, and stakeholders' collaboration.
            </p>
            <p className="text-muted-foreground font-body leading-relaxed mb-4">
              Our portfolio spans over 16 specialized service areas—from drilling and well engineering 
              to  Engineering Procurement, Construction, and Installation (EPCI) pipeline projects, fabrication and maintenance contracts for Floating Production Storage and Offloading
              (FPSOs), and comprehensive environmental management.Partnering with industry leaders like Shell, NNPC, and NCDMB, our track record of 
              600+ successful projects speaks for itself.
            </p>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              We understand the intricacies of the oil and gas industry, and our team of 50+ 
              expert professionals is always ready to collaborate with you to achieve your goals.
            </p>

            <div className="space-y-3 mb-8">
              {values.map((val, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
                  <span className="font-body text-foreground text-sm">{val}</span>
                </motion.div>
              ))}
            </div>

            <Link
              to="/about"
              className="inline-flex items-center px-7 py-3 bg-primary text-primary-foreground font-heading font-semibold text-sm rounded-full hover:opacity-90 transition-opacity shadow-soft"
            >
              More About Us
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutPreview;
