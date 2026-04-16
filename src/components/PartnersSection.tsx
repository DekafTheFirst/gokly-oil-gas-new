import { motion } from "framer-motion";
import Shafa from "@/assets/partners/shafa1.png";
import shellLogo from "@/assets/partners/shell.png";
import nnpcLogo from "@/assets/partners/nnpc.png";
import ncdmbLogo from "@/assets/partners/ncdmb.png";
import nmdpraLogo from "@/assets/partners/nmdpra.png";
import nuprcLogo from "@/assets/partners/nuprc.jpeg"; 


const partners = [
  { name: "Shell", logo: shellLogo },
  { name: "Nigeria National Petroleum Company (NNPC Limited)", logo: nnpcLogo },
  { name: "Nigeria Content Development and Monitoring Board (NCDMB)", logo: ncdmbLogo },
  { name: "Shafa", logo: Shafa},
 
  { name: "Nigeria Midstream and Downstream Petroleum Regulatory Authorithy (NMDPRA)", logo: nmdpraLogo },
  { name: "Nigeria Upstream Petroleum Regulatory Commission (NUPRC)", logo: nuprcLogo },
];

const PartnersSection = () => {
  return (
    <section className="py-20 bg-section-gradient">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase">
            Our Partners
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-muted-foreground font-body max-w-2xl mx-auto">
            We collaborate with leading organizations in Nigeria's oil and gas sector to deliver world-class services and solutions.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group flex flex-col items-center justify-center p-6 rounded-xl bg-card border border-border hover:shadow-card hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  // className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
              <p className="font-heading font-semibold text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center">
                {partner.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
