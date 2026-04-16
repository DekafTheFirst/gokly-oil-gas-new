import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-gokly-dark text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt="Gokly Logo" className="h-16 w-16 object-contain" />
              <div>
                <h3 className="font-heading font-bold text-lg">Gokly Oil and Gas</h3>
                <p className="text-sm opacity-60 font-body">Services Limited</p>
              </div>
            </div>
            <p className="text-sm opacity-70 font-body leading-relaxed">
              A leading provider of comprehensive solutions to the oil and gas industry, delivering exceptional services with integrity and excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-base mb-5">Quick Links</h4>
            <nav className="flex flex-col gap-3">
              {["Home", "About", "Services", "Contact", "Feedbacks"].map((item) => (
                <Link
                  key={item}
                  to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className="text-sm opacity-70 hover:opacity-100 transition-opacity font-body"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-bold text-base mb-5">Our Services</h4>
            <nav className="flex flex-col gap-3">
              {[
                "Oil & Gas Training",
                "Facility Management",
                "Consulting Services",
                "Drilling & Well Engineering",
                "Environmental Management",
              ].map((service) => (
                <span key={service} className="text-sm opacity-70 font-body">
                  {service}
                </span>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-base mb-5">Contact Info</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gokly-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm opacity-70 font-body">
                  Okobabian Plaza by Okaka New Road, Isaac Boro Expressway, Yenagoa, Bayelsa State, Nigeria.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gokly-gold flex-shrink-0" />
                <span className="text-sm opacity-70 font-body">+234(0)9014770978</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gokly-gold flex-shrink-0" />
                <a href="mailto:+goklyoilandgasdesk@gmail.com" className="text-sm opacity-70 hover:opacity-100 font-body transition-opacity">goklyoilandgasdesk@gmail.com</a>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-50 font-body">
            © {new Date().getFullYear()} Gokly Oil and Gas Services Limited. All rights reserved.
          </p>
          <p className="text-sm opacity-50 font-body">
            Integrity • Excellence • Innovation
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
