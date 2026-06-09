import { motion } from "framer-motion";
import { useState } from "react";

import trainingImg from "@/assets/services/training.jpg";
import facilityImg from "@/assets/services/management.png";
import consultingImg from "@/assets/services/consulting.png";
import safetyImg from "@/assets/services/safety.png";
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
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const services = [
  {
    image: trainingImg,
    title: "Specialized Oil & Gas Training",
    desc: "Comprehensive industry training programs including metal fabrication and pipe fitting.",
    details:
      "Specialized Oil and Gas Training involves the design and delivery of professional development programs tailored to the needs of personnel working within the oil and gas industry. These training programs cover technical, operational, safety, environmental, and management disciplines required for efficient and safe industry operations. Areas of focus may include drilling operations, well intervention, process plant operations, HSE management, pipeline integrity, offshore safety, emergency response, and regulatory compliance. The objective is to equip employees and contractors with the knowledge, skills, and competencies necessary to perform their duties effectively while minimizing operational risks. Training can be delivered through classroom instruction, practical workshops, simulations, on-the-job coaching, and certification programs.",
  },
  {
    image: facilityImg,
    title: "Facility Management",
    desc: "End-to-end facility management for oil and gas installations.",
    details:
      "Facility Management encompasses the coordinated management, operation, maintenance, and improvement of physical assets and infrastructure within oil and gas facilities. This includes office buildings, production facilities, warehouses, workshops, accommodation camps, and utility systems. The service aims to ensure that all facilities remain functional, safe, reliable, and cost-effective throughout their lifecycle. Activities may include preventive and corrective maintenance, asset management, utility monitoring, security coordination, housekeeping, environmental control, and emergency preparedness. Effective facility management helps reduce operational downtime, extend equipment lifespan, optimize resource utilization, and maintain compliance with health, safety, and environmental regulations.",
  },
  {
    image: consultingImg,
    title: "Oil & Gas Consulting",
    desc: "Strategic consulting services to optimize operations and maximize output.",
    details:
      "Oil and Gas Consulting provides specialized advisory services to support clients in making informed technical, operational, financial, and strategic decisions. Consultants assist organizations in areas such as project planning, field development, asset management, operational optimization, regulatory compliance, risk management, and business process improvement. The service involves conducting feasibility studies, technical assessments, performance evaluations, market analyses, and project reviews to identify opportunities and challenges. Consultants work closely with clients to develop practical solutions that improve efficiency, reduce costs, enhance safety performance, and maximize asset value.",
  },
  {
    image: safetyImg,
    title: "Industrial Safety Management",
    desc: "General industrial safety management ensuring HSE compliance.",
    details:
      "Industrial Safety Management focuses on identifying, assessing, and controlling workplace hazards to ensure the health and safety of personnel, assets, and the environment. The service includes the development and implementation of safety policies, risk assessments, permit-to-work systems, emergency response plans, safety audits, incident investigations, and workforce safety training. It aims to foster a strong safety culture where all employees understand their responsibilities and actively contribute to accident prevention. Industrial Safety Management ensures compliance with local and international safety regulations and industry standards.",
  },
  {
    image: drillingImg,
    title: "Drilling & Well Engineering",
    desc: "Full lifecycle drilling and well engineering solutions.",
    details:
      "Drilling and Well Engineering involves the planning, design, execution, and optimization of drilling operations and well construction activities. This service covers all stages of the well lifecycle, including well design, drilling program preparation, casing and cementing design, drilling fluid management, directional drilling, completion engineering, and well intervention. The primary objective is to ensure that wells are drilled safely, efficiently, and economically while maximizing hydrocarbon recovery.",
  },
  {
    image: constructionImg,
    title: "Construction Services",
    desc: "Industrial construction services for the energy sector.",
    details:
      "Construction Services involve the planning, management, and execution of infrastructure and facility development projects within the oil and gas industry. These services include civil works, structural fabrication, mechanical installation, electrical works, pipeline construction, facility upgrades, and commissioning activities. Construction projects are carried out in accordance with engineering specifications, safety standards, quality requirements, and project schedules.",
  },
  {
    image: procurementImg,
    title: "Procurement & Supplies",
    desc: "Procurement and supply of oil and gas equipment and materials.",
    details:
      "Procurement and Supplies services involve the sourcing, purchasing, expediting, storage, and delivery of equipment, materials, spare parts, and consumables required for oil and gas operations. The service ensures that clients receive quality products from reliable suppliers at competitive prices while maintaining compliance with technical specifications and industry standards. Procurement activities include supplier evaluation, contract management, inventory control, logistics coordination, and quality inspections.",
  },
  {
    image: environmentalImg,
    title: "Environmental Management",
    desc: "Environmental management studies and sustainable solutions.",
    details:
      "Environmental Management focuses on minimizing the environmental impact of oil and gas operations while ensuring compliance with environmental regulations and sustainability objectives. The service includes environmental impact assessments, monitoring programs, pollution prevention measures, waste management planning, remediation activities, and environmental audits. Through proactive environmental stewardship, companies can reduce liabilities, maintain regulatory compliance, and contribute to the protection of ecosystems and local communities.",
  },
  {
    image: pipelineImg,
    title: "Pipeline Installation",
    desc: "Off-site pipe rack steel structure installation, onshore and offshore.",
    details:
      "Pipeline Installation involves the engineering, construction, testing, and commissioning of pipelines used for transporting oil, gas, water, and related products. The process includes route surveys, trenching, pipe laying, welding, coating, hydrostatic testing, and commissioning. Proper installation practices help ensure long-term reliability, minimize leaks, and maintain the integrity of pipeline systems.",
  },
  {
    image: offshoreImg,
    title: "Offshore Maintenance",
    desc: "Offshore facilities maintenance, painting, and revamp projects.",
    details:
      "Offshore Maintenance involves the inspection, repair, servicing, and upkeep of offshore platforms, vessels, subsea systems, and associated facilities. Maintenance activities include structural inspections, mechanical repairs, corrosion control, electrical maintenance, instrumentation servicing, and asset integrity management. The objective is to ensure continuous production, maintain safety standards, and extend the operational lifespan of offshore assets.",
  },
  {
    image: wasteImg,
    title: "Waste Management",
    desc: "Comprehensive waste management services for industrial operations.",
    details:
      "Waste Management involves the systematic collection, segregation, handling, treatment, transportation, recycling, and disposal of waste generated from oil and gas operations. The service covers both hazardous and non-hazardous waste streams, including drilling cuttings, sludge, contaminated soil, wastewater, chemicals, scrap metals, and domestic waste from operational sites. Effective waste management practices are essential for protecting the environment and ensuring regulatory compliance.",
  },
  {
    image: inspectionImg,
    title: "Inspection & Calibration",
    desc: "EPCI crude oil pipeline inspection, integrity test, and calibration.",
    details:
      "Inspection and Calibration services are critical for ensuring the accuracy, reliability, safety, and compliance of equipment, instruments, and operational systems used in the oil and gas industry. Inspection activities involve the examination and testing of assets such as pressure vessels, pipelines, storage tanks, lifting equipment, valves, and structural components. Calibration ensures measuring instruments provide accurate readings within specified tolerances.",
  },
  {
    image: fabricationImg,
    title: "Fabrication & FPSO",
    desc: "Fabrication and maintenance contract services for FPSO vessels.",
    details:
      "Fabrication and FPSO Services involve the design, manufacturing, assembly, installation, maintenance, and modification of structures and equipment used in oil and gas operations, particularly offshore facilities. Fabrication activities include the construction of process skids, pressure vessels, pipe spools, platforms, structural steel works, and specialized production equipment. These services support efficient hydrocarbon production and asset longevity.",
  },
  {
    image: tankImg,
    title: "Tank Dewatering",
    desc: "Crude oil tank dewatering and tank farm revamp projects.",
    details:
      "Tank Dewatering involves the removal of accumulated water, sludge, sediments, and contaminants from storage tanks used for crude oil, refined petroleum products, chemicals, and other industrial fluids. The process may also include tank cleaning, sludge treatment, waste disposal, and condition assessments to ensure optimal tank performance. Regular tank dewatering helps maintain asset integrity and improve product quality.",
  },
  {
    image: auditImg,
    title: "Audit & Documentation",
    desc: "Comprehensive audit and documentation services.",
    details:
      "Audit and Documentation services provide organizations with structured processes for evaluating operational performance, regulatory compliance, management systems, and project execution activities. Documentation services involve the preparation, review, control, and maintenance of technical reports, policies, procedures, manuals, project records, engineering documents, and compliance submissions. These practices strengthen governance and support continuous improvement.",
  },
  {
    image: gasPipelineImg,
    title: "Gas Pipeline Projects",
    desc: "Gas pipeline projects for onshore and offshore facilities.",
    details:
      "Gas Pipeline Services encompass the design, construction, installation, inspection, maintenance, repair, and integrity management of natural gas transmission and distribution systems. Activities may include route surveys, engineering design, welding, coating, hydrostatic testing, leak detection, cathodic protection, pipeline rehabilitation, and emergency response support. These services ensure safe and efficient gas transportation while maintaining regulatory compliance.",
  },
];

interface ServicesSectionProps {
  limit?: number;
  showTitle?: boolean;
}

const ServicesSection = ({ limit, showTitle = true }: ServicesSectionProps) => {
  const [selectedService, setSelectedService] = useState<typeof services[number] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayedServices = limit ? services.slice(0, limit) : services;

  const openServiceModal = (service: typeof services[number]) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

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
              className="group rounded-xl bg-card-gradient border border-border hover:shadow-card transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
              onClick={() => openServiceModal(service)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  openServiceModal(service);
                }
              }}
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
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-2">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">
                    {service.desc}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    openServiceModal(service);
                  }}
                  className="mt-auto self-start"
                >
                  View details
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) setSelectedService(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedService?.title}</DialogTitle>
            <DialogDescription>{selectedService?.desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4 text-sm text-muted-foreground">
            <p>{selectedService?.details}</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showTitle && <div className="text-center pt-16">
        <Link to="/services"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-full hover:opacity-90 transition-opacity shadow-soft group"
        >
          View All Services
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>}
    </section>
  );
};

export default ServicesSection;
