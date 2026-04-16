import { motion } from "framer-motion";
import { CheckCircle2, Target, Eye } from "lucide-react";
import teamImg from "@/assets/team-engineers.jpg";
import engineerImg from "@/assets/engineer-pipeline.jpg";
import drillingImg from "@/assets/drilling-engineers.jpg";
import expertiseImg from "@/assets/about/expertise.jpg";
import nationwideImg from "@/assets/about/nationwide.jpg";
import fullCycleImg from "@/assets/about/full.jpg";
import integrityImg from "@/assets/about/integrity.jpg";
import excellenceImg from "@/assets/about/excellence.jpg";
import innovationImg from "@/assets/about/innovative.jpg";
import collaborationImg from "@/assets/about/collaboration.jpg";
import PartnersSection from "@/components/PartnersSection";

const coreValues = [
  { img: integrityImg, title: "Integrity", desc: "We uphold the highest ethical standards in every operation and relationship, ensuring transparency and accountability at all levels." },
  { img: excellenceImg, title: "Excellence", desc: "We strive for outstanding quality in every service we deliver, continuously raising the bar for industry standards." },
  { img: innovationImg, title: "Innovation", desc: "We embrace cutting-edge technologies and forward-thinking methods to stay ahead of industry needs and deliver smarter solutions." },
  { img: collaborationImg, title: "Collaboration", desc: "We believe in building meaningful, long-term partnerships with all stakeholders—from communities to multinational operators." },
];

const stats = [
  { value: "10+", label: "Years of Excellence" },
  { value: "600+", label: "Projects Delivered" },
  { value: "50+", label: "Expert Professionals" },
  { value: "16+", label: "Service Areas" },
];

const milestones = [
  { img: expertiseImg, title: "Established Expertise", desc: "Over a decade of operational excellence across Nigeria's midstream and upstream oil and gas sectors." },
  { img: nationwideImg, title: "Nationwide Operations", desc: "Active operations spanning onshore and offshore facilities across key oil-producing regions including the Niger Delta." },
  { img: fullCycleImg, title: "Full-Cycle Capabilities", desc: "From drilling and construction to FPSO maintenance and environmental management—we cover the complete value chain." },
];

const About = () => {
  return (
    <main className="pt-20">
      {/* Hero Banner */}
      <section className="relative h-80 flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={drillingImg} alt="Engineers at work" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gokly-dark/70" />
        </div>
        <div className="relative container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase border border-primary-foreground/20">
              About Us
            </span>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary-foreground">
              Who We Are
            </h1>
            <p className="font-body text-primary-foreground/80 mt-4 max-w-2xl text-lg">
              A trusted name in Nigeria's oil and gas industry, delivering comprehensive solutions with integrity, innovation, and excellence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-heading font-extrabold text-3xl sm:text-4xl text-primary-foreground">{stat.value}</p>
                <p className="font-body text-primary-foreground/70 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase">
                Our Story
              </span>
              <h2 className="font-heading font-bold text-3xl text-foreground mb-6">
                A Leading Provider of Comprehensive Oil & Gas Solutions
              </h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-5">
                Gokly Oil and Gas Services Limited is a leading provider of comprehensive solutions to the oil and gas industry. Our mission is to deliver exceptional services that enhance operational efficiency, safety, sustainability, and stakeholders' collaboration.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed mb-5">
                At Gokly Oil and Gas Services Limited, we believe in integrity, excellence, and innovation. Our track record speaks for itself, with a history of successful projects and satisfied clients. We understand the intricacies of the oil and gas industry, and our team is always ready to collaborate with you to achieve your goals.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed mb-5">
                Operating across Nigeria's midstream and upstream sectors, we bring decades of combined experience to every project, ensuring world-class outcomes for our clients and communities. Our portfolio spans over 16 specialized service areas including drilling, well engineering, EPCI pipeline projects, fabrication and maintenance contracts for FPSOs, and comprehensive environmental management.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed">
                We take pride in our commitment to local content development, working closely with host communities and regulatory bodies such as NCDMB and NMDPRA to ensure compliance, capacity building, and sustainable value creation across Nigeria's energy landscape.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <img src={teamImg} alt="Gokly team" className="rounded-2xl shadow-elevated w-full h-[400px] object-cover" />
              <div className="absolute -bottom-5 -left-5 bg-primary text-primary-foreground px-6 py-4 rounded-xl shadow-card">
                <p className="font-heading font-bold text-2xl">10+</p>
                <p className="font-body text-sm opacity-80">Years of Excellence</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Milestones / Why Gokly */}
      <section className="py-20 bg-section-gradient">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase">
              Why Gokly
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">What Sets Us Apart</h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              Our deep industry knowledge, commitment to safety, and comprehensive service portfolio make us the partner of choice for Nigeria's leading operators.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {milestones.map((m, i) => (
              <motion.div key={m.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group rounded-2xl overflow-hidden shadow-card border border-border"
              >
                <div className="relative h-52 overflow-hidden">
                  <img src={m.img} alt={m.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-6 bg-card text-center">
                  <h3 className="font-heading font-bold text-lg text-foreground mb-3">{m.title}</h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="p-8 rounded-2xl bg-card border border-border shadow-card"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Target size={28} className="text-primary" />
              </div>
              <h3 className="font-heading font-bold text-xl text-foreground mb-3">Our Mission</h3>
              <p className="text-muted-foreground font-body leading-relaxed mb-4">
                To deliver exceptional oil and gas services that enhance operational efficiency, safety, sustainability, and stakeholders' collaboration, while maintaining the highest standards of integrity and professionalism.
              </p>
              <ul className="space-y-2">
                {["Drive operational efficiency through innovation", "Maintain zero-incident HSE performance", "Foster sustainable community development", "Build enduring client partnerships"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                    <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="p-8 rounded-2xl bg-card border border-border shadow-card"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Eye size={28} className="text-primary" />
              </div>
              <h3 className="font-heading font-bold text-xl text-foreground mb-3">Our Vision</h3>
              <p className="text-muted-foreground font-body leading-relaxed mb-4">
                To be the foremost oil and gas service company in Nigeria and Africa, recognized for our innovation, reliability, and commitment to sustainable energy solutions that power the future.
              </p>
              <ul className="space-y-2">
                {["Become the #1 indigenous oil & gas service provider", "Lead industry transformation through technology", "Set benchmarks for quality and safety", "Expand across West Africa's energy markets"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                    <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-section-gradient">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase">
              What We Stand For
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">Our Core Values</h2>
            <p className="text-muted-foreground font-body max-w-xl mx-auto">The principles that guide everything we do at Gokly Oil and Gas Services Limited.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((val, i) => (
              <motion.div key={val.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group rounded-2xl overflow-hidden shadow-card border border-border hover:shadow-elevated transition-all"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={val.img} alt={val.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-5 bg-card text-center">
                  <h3 className="font-heading font-bold text-foreground mb-2">{val.title}</h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">{val.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners on About page too */}
      <PartnersSection />

      {/* Team Image */}
      <section className="py-20 bg-section-gradient">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-heading font-bold text-3xl text-foreground mb-4">Our Expert Team</h2>
            <p className="text-muted-foreground font-body max-w-xl mx-auto">Experienced professionals dedicated to delivering world-class oil and gas services across Nigeria's energy landscape.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <img src={engineerImg} alt="Gokly engineer inspecting equipment" className="w-full max-w-4xl mx-auto h-96 object-cover rounded-2xl shadow-elevated" />
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default About;
