import { motion } from "framer-motion";

import trainingImg from "@/assets/services/training.jpg";
import facilityImg from "@/assets/services/management.png";
import consultingImg from "@/assets/services/consulting.png";
import safetyImg from "@/assets/services/safety.png"
import drillingImg from "@/assets/services/drilling.jpg";
import constructionImg from "@/assets/services/construction.jpg";
import procurementImg from "@/assets/services/procurement.jpg";
import environmentalImg from "@/assets/services/environmental.jpg";
import pipelineImg from "@/assets/services/pipeline.jpg";
import offshoreImg from "@/assets/services/offshore.jpg";
import wasteImg from "@/assets/services/waste.jpg";
import inspectionImg from "@/assets/services/inspection.jpg";
import fabricationImg from "@/assets/services/fabrication.jpg";
import tankImg from "@/assets/services/tank.jpg";
import auditImg from "@/assets/services/audit.jpg";
import gasPipelineImg from "@/assets/services/project.jpg";

const services = [
  { image: trainingImg, title: "Specialized Oil & Gas Training", desc: "Comprehensive industry training programs including metal fabrication and pipe fitting." },
  { image: facilityImg, title: "Facility Management", desc: "End-to-end facility management for oil and gas installations." },
  { image: consultingImg, title: "Oil & Gas Consulting", desc: "Strategic consulting services to optimize operations and maximize output." },
  { image: safetyImg, title: "Industrial Safety Management", desc: "General industrial safety management ensuring HSE compliance." },
  { image: drillingImg, title: "Drilling & Well Engineering", desc: "Full lifecycle drilling and well engineering solutions." },
  { image: constructionImg, title: "Construction Services", desc: "Industrial construction services for the energy sector." },
  { image: procurementImg, title: "Procurement & Supplies", desc: "Procurement and supply of oil and gas equipment and materials." },
  { image: environmentalImg, title: "Environmental Management", desc: "Environmental management studies and sustainable solutions." },
  { image: pipelineImg, title: "Pipeline Installation", desc: "Off-site pipe rack steel structure installation, onshore and offshore." },
  { image: offshoreImg, title: "Offshore Maintenance", desc: "Offshore facilities maintenance, painting, and revamp projects." },
  { image: wasteImg, title: "Waste Management", desc: "Comprehensive waste management services for industrial operations." },
  { image: inspectionImg, title: "Inspection & Calibration", desc: "EPCI crude oil pipeline inspection, integrity test, and calibration." },
  { image: fabricationImg, title: "Fabrication & FPSO", desc: "Fabrication and maintenance contract services for FPSO vessels." },
  { image: tankImg, title: "Tank Dewatering", desc: "Crude oil tank dewatering and tank farm revamp projects." },
  { image: auditImg, title: "Audit & Documentation", desc: "Comprehensive audit and documentation services." },
  { image: gasPipelineImg, title: "Gas Pipeline Projects", desc: "Gas pipeline projects for onshore and offshore facilities." },
];

interface ServicesSectionProps {
  limit?: number;
  showTitle?: boolean;
}

const ServicesSection = ({ limit, showTitle = true }: ServicesSectionProps) => {
  const displayedServices = limit ? services.slice(0, limit) : services;

  return (
    <section className="py-20 bg-section-gradient">
      <div className="container mx-auto px-4 lg:px-8">
        {showTitle && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase">
              What We Do
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
              Our Services
            </h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              Comprehensive oil and gas solutions spanning the full value chain, from upstream exploration to midstream operations.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedServices.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl bg-card-gradient border border-border hover:shadow-card transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">
                  {service.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
