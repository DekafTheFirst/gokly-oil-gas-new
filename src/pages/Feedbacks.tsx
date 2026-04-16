import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, User, Send } from "lucide-react";
import { toast } from "sonner";
import emailjs from '@emailjs/browser';
import refineryImg from "@/assets/refinery-dusk.jpg";

const testimonials = [
  {
    name: "Engr. Adesanya Oluwatobi",
    role: "Operations Manager, Niger Delta Oil Co.",
    text: "Gokly Oil and Gas has been instrumental in enhancing our operational safety and efficiency. Their team is professional, responsive, and deeply knowledgeable.",
    rating: 5,
  },
  {
    name: "Chief Mrs. Ebiere Williams",
    role: "Community Liaison Officer",
    text: "The host community advisory services provided by Gokly have bridged the gap between our community and the oil companies operating in our region. Truly remarkable work.",
    rating: 5,
  },
  {
    name: "Mr. Kingsley Okonkwo",
    role: "Project Director, EnergyFirst Nigeria",
    text: "We have worked with Gokly on multiple EPCI projects and their attention to detail, quality of work, and adherence to timelines is exceptional.",
    rating: 5,
  },
  {
    name: "Dr. Amina Bello",
    role: "Environmental Consultant",
    text: "Their environmental management services are comprehensive and aligned with international standards. A great partner for sustainable energy operations.",
    rating: 4,
  },
];

const Feedbacks = () => {
  const [form, setForm] = useState({ name: "", role: "", text: "", rating: 5 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast.error("Please fill in your name and feedback.");
      return;
    }
    if (form.name.trim().length > 100 || form.role.trim().length > 100 || form.text.trim().length > 1000) {
      toast.error("Input exceeds maximum allowed length.");
      return;
    }
    setLoading(true);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FEEDBACK,
        {
          name: form.name.trim(),
          role: form.role.trim(),
          text: form.text.trim(),
          rating: form.rating,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      toast.success("Thank you for your feedback! It has been sent to our team.");
      setForm({ name: "", role: "", text: "", rating: 5 });
    } catch (err) {
      console.error("Feedback form error:", err);
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-20">
      {/* Hero Banner */}
      <section className="relative h-80 flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={refineryImg} alt="Refinery" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gokly-dark/70" />
        </div>
        <div className="relative container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary-foreground font-heading font-medium text-xs mb-4 tracking-wider uppercase border border-primary-foreground/20">
              Testimonials
            </span>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary-foreground">
              Client Feedbacks
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-xl bg-card-gradient border border-border shadow-card"
              >
                <Quote size={28} className="text-primary/30 mb-4" />
                <p className="text-foreground font-body leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s < t.rating ? "text-gokly-gold fill-gokly-gold" : "text-border"}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leave Feedback */}
      <section className="py-20 bg-section-gradient">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-heading font-bold text-3xl text-foreground mb-3">Share Your Experience</h2>
            <p className="text-muted-foreground font-body">We value your feedback. Let us know about your experience working with Gokly.</p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-5 p-8 rounded-2xl bg-card border border-border shadow-card"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-heading font-medium text-sm text-foreground mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border font-body text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
              <div>
                <label className="block font-heading font-medium text-sm text-foreground mb-1.5">Role / Company</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Project Manager, ABC Oil"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border font-body text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-heading font-medium text-sm text-foreground mb-1.5">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, rating: s })}
                    className="p-1"
                  >
                    <Star
                      size={24}
                      className={`transition-colors ${s <= form.rating ? "text-gokly-gold fill-gokly-gold" : "text-border"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-heading font-medium text-sm text-foreground mb-1.5">Your Feedback</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Share your experience..."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border font-body text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-full hover:opacity-90 transition-opacity shadow-soft disabled:opacity-50"
            >
              {loading ? "Sending..." : "Submit Feedback"}
              <Send size={16} />
            </button>
          </motion.form>
        </div>
      </section>
    </main>
  );
};

export default Feedbacks;
