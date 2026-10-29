import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import trainingImg from "@/assets/gokly-images/training.jpeg";
import trainingImg2 from "@/assets/gokly-images/training-2.jpeg";
import trainingImg3 from "@/assets/gokly-images/certificate-2.jpeg";
import trainingImg4 from "@/assets/gokly-images/grace-certificate.jpeg";
import facilityImg from "@/assets/services/management.png";
import consultingImg from "@/assets/services/consulting.png";
import safetyImg from "@/assets/services/safety.png";
import drillingImg from "@/assets/services/drilling.jpg";
import constructionImg from "@/assets/services/construction.jpg";
import procurementImg from "@/assets/services/procurement.jpg";
import environmentalImg from "@/assets/gokly-images/environmental.jpg";
import environmentalImg2 from "@/assets/gokly-images/environmental-studies-2.jpeg";
import environmentalImg4 from "@/assets/gokly-images/environmental-studies-4.jpeg";
import pipelineImg from "@/assets/services/pipeline.jpg";
import coursepipelineImg from "@/assets/course-pipeline.jpg";
import offshoreImg from "@/assets/services/offshore.jpg";
import wasteImg from "@/assets/services/waste.jpg";
import inspectionImg from "@/assets/gokly-images/inspection.jpeg";
import inspectionImg2 from "@/assets/gokly-images/digital-calibration.jpg";
import inspectionImg3 from "@/assets/gokly-images/calibration-2.jpg";
import inspectionImg4 from "@/assets/gokly-images/calibration-3.jpg";
import inspectionImg5 from "@/assets/gokly-images/1.jpg";
import inspectionImg6 from "@/assets/gokly-images/2.jpg";
import serviceInspectionImg from "@/assets/services/inspection.jpg";
import fabricationImg from "@/assets/gokly-images/pipefittiing-4.jpeg";
import fabricationImg2 from "@/assets/gokly-images/fabrication-2.jpeg";
import fabricationImg3 from "@/assets/gokly-images/fabrication-3.jpeg";
import fabricationImg4 from "@/assets/gokly-images/fabrication.jpeg";
import tankImg from "@/assets/services/tank.jpg";
import auditImg from "@/assets/services/audit.jpg";
import gasPipelineImg from "@/assets/services/project.jpg";
import trainingGalleryImg from "@/assets/services/training.jpg";
import capacityDevelopmentImg from "@/assets/gokly-images/capacity-dev-2.jpeg";
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
    image: facilityImg,
    images: [facilityImg,  ],
    title: "FACILITY MANAGEMENT AND MAINTENANCE",
    desc: "Comprehensive facility management and maintenance services to ensure safe and efficient operation of industrial facilities.",
    details: `Comprehensive facility management and maintenance services to ensure safe and efficient operation of industrial facilities.

• Preventive and corrective maintenance
• Mechanical Installation maintenance and material
• Facility inspections and condition assessments
• Utilities management
• Emergency maintenance services
• Leak Repair
• Sectional Replacement
• Facility Upgrade
`,
  },
  {
    image: gasPipelineImg,
    images: [gasPipelineImg, pipelineImg],
    title: "ENGINEERING, PROCUREMENT, CONSTRUCTION, AND INSTALLATION (EPCI)",
    desc: "Integrated EPCI solutions for oil and gas, energy, and infrastructure projects.",
    details: `Integrated EPCI solutions for oil and gas, energy, and infrastructure projects.

• Engineering design and consultancy
• Project planning and management
• Procurement and supply chain management
• Civil, mechanical, and electrical construction
• Pipeline and flowline installation
• Plant and facility construction
`,
  },
  {
    image: environmentalImg,
    images: [environmentalImg, environmentalImg2, environmentalImg4],
    title: "ENVIRONMENTAL STUDIES",
    desc: "Professional environmental and social impact assessment and compliance services.",
    details: `Professional environmental and social impact assessment and compliance services.

• Environmental and Social Impact Assessment (EIA)
• Preliminary Environmental Risk Assessment (PERA)
• Environmental Site Assessment (ESA)
• Environmental Audit (EA)
• Environmental Evaluation Studies (EES)
• Environmental Compliance Monitoring (ECM)
• Post Impact Assessment (PIA)
• Environmental Monitoring and Reporting
`,
  },
  {
    image: safetyImg,
    images: [safetyImg, ],
    title: "HEALTH, SAFETY, SECURITY AND ENVIRONMENTAL (HSSE) STUDIES",
    desc: "Comprehensive health, safety, and security assessment and management services.",
    details: `Comprehensive health, safety, and security assessment and management services.

• Hazard Identification and Risk Assessment (HIRA)
• Job Hazard Analysis (JHA)
• Health Impact Assessment (HIA)
• Safety Case Development
• Fire Risk Assessment
• Emergency Response Planning
• HSSE Management System Development
• Waste Management Planning
• Pollution Prevention Studies
`,
  },
  {
    image: inspectionImg,
    images: [inspectionImg, inspectionImg2, inspectionImg3, inspectionImg4, inspectionImg5, inspectionImg6],
    title: "INSPECTION, TESTING, AND INTEGRITY SERVICES",
    desc: "Professional inspection and integrity management services for industrial assets.",
    details: `Professional inspection and integrity management services for industrial assets.

• Non-Destructive Testing (NDT)
• Pipeline integrity inspection
• Pressure vessel inspection
• Storage tank inspection
• Welding inspection
• Coating and corrosion inspection
• Mechanical integrity assessment
• Fitness-for-Service (FFS) assessment
• Leak Detection of Underground and Surface Storage Tanks
• Pressure testing of Underground and Surface Storage Tanks
• Calibration Of Underground and Surface Storage Tanks
`,
  },
  {
    image: fabricationImg,
    images: [fabricationImg, fabricationImg2, fabricationImg3, fabricationImg4],
    title: "FABRICATION",
    desc: "High-quality fabrication services for oil and gas, marine, construction, and industrial sectors.",
    details: `High-quality fabrication services for oil and gas, marine, construction, and industrial sectors.

• Structural steel fabrication
• Pipe spool fabrication
• Pressure vessel fabrication
• Skid fabrication
• Tank fabrication
• Platform fabrication
• Pipe supports and brackets
• Metal cutting and profiling
• Welding and metal joining
• Surface preparation and protective coating
• Equipment assembly and installation
`,
  },
  {
    image: coursepipelineImg,
    images: [coursepipelineImg, drillingImg, gasPipelineImg],
    title: "OIL AND GAS CONSULTING AND TECHNICAL ADVISORY",
    desc: "Strategic consulting and technical advisory services for operational excellence and project success.",
    details: `Strategic consulting and technical advisory services for operational excellence and project success.

• Project management
• Technical feasibility studies
• Operations optimization
• HSSE consulting
• Risk management
• Procurement advisory
• Contract management
• Technical manpower support
• Business development support
`,
  },
  {
    image: trainingImg,
    images: [trainingImg, trainingImg2, trainingImg3, trainingImg4, capacityDevelopmentImg],
    title: "TRAINING AND CAPACITY DEVELOPMENT",
    desc: "Industry-focused training programs to enhance technical competence and regulatory compliance.",
    details: `Industry-focused training programs to enhance technical competence and regulatory compliance.

• Health, Safety, Security, and Environment (HSSE)
• Pipe fitting and Fabrication
• Basic and Advanced First Aid
• Fire Fighting and Fire Prevention
• Minimum industry Safety Training For Downstream operations (MISTDO)
`,
  },
  {
    image: consultingImg,
    images: [consultingImg, procurementImg, auditImg],
    title: "REGULATORY COMPLIANCE AND NIGERIAN CONTENT ADVISORY",
    desc: "Expert guidance on Nigerian regulatory frameworks and content development compliance.",
    details: `Expert guidance on Nigerian regulatory frameworks and content development compliance.
• Nigerian Upstream Petroleum Regulatory Commission(NUPRC) Regulations, Guidelines and Permits

• Nigerian Midstream and Downstream Petroleum Regulatory Authority (NMDPRA) Regulations, Guidelines and Permits

• Nigerian Content Development and Monitoring Board (NCDMB) Regulations, Guidelines, Certifications, Expatriate Quota, Temporary Work Permits

• Nigerian Content Development Fund (NCDF) Compliance
`,
  }
];

interface ServicesSectionProps {
  limit?: number;
  showTitle?: boolean;
  initialService?: string | null;
}

const ServicesSection = ({ limit, showTitle = true, initialService }: ServicesSectionProps) => {
  const [selectedService, setSelectedService] = useState<typeof services[number] | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayedServices = limit ? services.slice(0, limit) : services;
  const serviceImages = selectedService?.images ?? [];
  const displayedImage = selectedImage ?? serviceImages[0];

  useEffect(() => {
    if (!initialService) return;
    const match = services.find((service) => service.title === initialService);
    if (match) {
      setSelectedService(match);
      setSelectedImage(match.images[0] ?? match.image);
      setIsModalOpen(true);
    }
  }, [initialService]);

  useEffect(() => {
    if (!isModalOpen || serviceImages.length < 2) return;

    const intervalId = window.setInterval(() => {
      const currentIndex = serviceImages.indexOf(displayedImage);
      const nextIndex = (currentIndex + 1) % serviceImages.length;
      setSelectedImage(serviceImages[nextIndex]);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [displayedImage, isModalOpen, serviceImages]);

  const openServiceModal = (service: typeof services[number]) => {
    setSelectedService(service);
    setSelectedImage(service.images[0] ?? service.image);
    setIsModalOpen(true);
  };

  const renderDetails = (details?: string | null) => {
    if (!details) return null;
    const lines = details.split(/\r?\n/);
    const blocks: Array<any> = [];
    let paraBuf: string[] = [];
    let listBuf: string[] = [];

    const flushPara = () => {
      if (paraBuf.length) {
        blocks.push({ type: "p", text: paraBuf.join(" ") });
        paraBuf = [];
      }
    };

    const flushList = () => {
      if (listBuf.length) {
        blocks.push({ type: "ul", items: listBuf });
        listBuf = [];
      }
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        flushList();
        flushPara();
        continue;
      }

      if (line.startsWith("•") || line.startsWith("-")) {
        // list item
        const item = line.replace(/^\s*[•\-]\s*/, "");
        listBuf.push(item);
      } else {
        // normal paragraph text
        if (listBuf.length) {
          flushList();
        }
        paraBuf.push(line);
      }
    }

    flushList();
    flushPara();

    return blocks
      .filter((b: any) => b.type === "ul")
      .map((b: any, idx: number) => (
        <ul key={idx} className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {b.items.map((it: string, i: number) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      ));
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
              className="group flex flex-col rounded-xl bg-card-gradient border border-border hover:shadow-card transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
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
              <div className="p-5 flex flex-1 flex-col gap-3 ">
                <div className="">
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-2">
                    {service.title}
                  </h3>
                  {/* <p className="text-muted-foreground font-body text-sm leading-relaxed">
                    {service.desc}
                  </p> */}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    openServiceModal(service);
                  }}
                  className="mt-auto  self-start"
                >
                  See More
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} className="" onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setSelectedService(null);
          setSelectedImage(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedService?.title}</DialogTitle>
              {/* <DialogDescription>{selectedService?.desc}</DialogDescription> */}
            </DialogHeader>
            <div className="mt-4 space-y-6">
              {selectedService && displayedImage && (
                <div className="space-y-3">
                  <div className=" sm:h-[380px] max-h-[500px] overflow-hidden rounded-md">
                    <img
                      src={displayedImage}
                      alt={selectedService.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div role="group" aria-label="Select service image" className="flex gap-3 overflow-x-auto pb-1">
                    {serviceImages.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        aria-label={`Show image ${index + 1} of ${serviceImages.length}`}
                        aria-pressed={displayedImage === image}
                        onClick={() => setSelectedImage(image)}
                        className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          displayedImage === image ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-[50vh] overflow-y-auto space-y-4">
                {renderDetails(selectedService?.details)}
              </div>
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
