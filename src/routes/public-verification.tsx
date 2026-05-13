import { useState, useEffect } from "react";
import { ShieldCheck, QrCode, Download, Share2, Database, Lock, FileCheck2, Award, AlertCircle, Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { verifyCertificate } from "@/lib/certificates";
import { useLocation } from "react-router-dom";

export default function PublicVerification() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [id, setId] = useState(queryParams.get("cert") || "");
  const [certificateData, setCertificateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"valid" | "revoked" | "not_found" | null>(null);
  const user = useAuth().user;

  // Load certificate on component mount or when cert param changes
  useEffect(() => {
    const cert = queryParams.get("cert");
    if (cert) {
      setId(cert);
      handleVerify(cert);
    }
  }, [location.search]);

  const handleVerify = async (certificateNumber: string = id) => {
    if (!certificateNumber.trim()) {
      setError("Please enter a certificate number");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCertificateData(null);
      setVerificationStatus(null);

      const response = await verifyCertificate(certificateNumber);

      if (response.status === "not_found") {
        setVerificationStatus("not_found");
        setError("Certificate not found in our system");
      } else if (response.status === "revoked") {
        setVerificationStatus("revoked");
        setCertificateData(response.certificate);
      } else if (response.status === "valid") {
        setVerificationStatus("valid");
        setCertificateData(response.certificate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify certificate");
      setVerificationStatus(null);
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const shareLink = () => {
    const url = `${window.location.origin}/public-verification?cert=${id}`;
    navigator.clipboard.writeText(url);
    alert("Verification link copied to clipboard!");
  };

  const downloadPDF = async () => {
    if (!certificateData?.pdf_path) {
      alert("PDF not available");
      return;
    }
    window.open(`/api${certificateData.pdf_path}`, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" style={{ backgroundColor: '#f7f8f9' }}>
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <header className="text-center">
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">Verify Official Credentials</h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Instantly validate Gokly oil &amp; gas certifications. Our high-performance compliance system ensures the integrity of field operations through secure, immutable records.
          </p>
        </header>
        
        <div className="mt-10 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }} 
            className="flex flex-wrap items-center gap-3 md:flex-nowrap"
          >
            <div className="relative flex-1">
              <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter Certificate Number (e.g., NCDMB-GOG-26-143)"
                className="h-14 w-full rounded-xl bg-input pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="h-14 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground transition hover:bg-primary-deep md:w-auto w-full disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Now"}
            </button>
            {/* <button type="button" aria-label="Scan QR" className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-input text-primary hover:bg-muted">
              <QrCode className="h-6 w-6" />
            </button> */}
          </form>
        </div>

        <div className="mt-10 grid gap-6">
          {loading && (
            <div className="rounded-2xl bg-card p-8 shadow-[var(--shadow-card)] text-center">
              <Loader className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Verifying certificate...</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-destructive/10 p-8 shadow-[var(--shadow-card)] border border-destructive/20">
              <div className="flex items-start flex-wrap gap-3">
                <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-destructive">Verification Failed</h3>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === "not_found" && !loading && (
            <div className="rounded-2xl bg-muted p-8 shadow-[var(--shadow-card)] text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-semibold">Certificate not found in our system</p>
              <p className="text-sm text-muted-foreground mt-2">Please check the certificate number and try again</p>
            </div>
          )}

          {verificationStatus && certificateData && (
            <article className="rounded-2xl bg-card p-8 shadow-[var(--shadow-card)]">
              <div className="flex items-start flex-wrap justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className={`grid h-14 w-14 place-items-center rounded-full ${verificationStatus === 'revoked' ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'}`}>
                    <Award className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-extrabold">{certificateData.course_title || "Certificate"}</h2>
                    <p className={`mt-1 text-xs font-bold uppercase tracking-wider ${verificationStatus === 'revoked' ? 'text-destructive' : 'text-primary'}`}>
                      Credential {verificationStatus === 'revoked' ? 'Revoked' : 'Valid'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full ${verificationStatus === 'revoked' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} px-4 py-2 text-sm font-semibold`}>
                  <span className={`h-2 w-2 rounded-full ${verificationStatus === 'revoked' ? 'bg-destructive' : 'bg-primary'}`} /> 
                  System {verificationStatus === 'revoked' ? 'Revoked' : 'Verified'}
                </span>
              </div>

              {verificationStatus === 'revoked' && certificateData.revoke_reason && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-semibold">Revocation Reason: {certificateData.revoke_reason}</p>
                  {certificateData.revoked_at && (
                    <p className="text-xs text-destructive/70 mt-1">Revoked on {formatDate(certificateData.revoked_at)}</p>
                  )}
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 border-t border-border pt-6 sm:grid-cols-2">
                <Field label="Holder Name" value={certificateData.recipient_name || "N/A"} />
                <Field label="Certificate Number" value={certificateData.certificate_number || "N/A"} mono />
                <Field label="Email" value={certificateData.recipient_email || "N/A"} />
                <Field label="Phone" value={certificateData.recipient_phone || "N/A"} />
                <Field label="Issue Date" value={formatDate(certificateData.issued_at)} />
                <Field label="Course" value={certificateData.course_title || "N/A"} />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <div className="flex flex-wrap gap-3">
                  {/* <button 
                    onClick={downloadPDF}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </button> */}
                  <button 
                    onClick={shareLink}
                    className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Share2 className="h-4 w-4" /> Share Link
                  </button>
                </div>
                <button className="text-sm font-semibold text-muted-foreground hover:text-destructive">Report Discrepancy</button>
              </div>
            </article>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-2"><FileCheck2 className="h-4 w-4" /> ISO 9001 Certified</span>
          <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> AES-256 Encrypted</span>
          <span className="inline-flex items-center gap-2"><Database className="h-4 w-4" /> Compliant Registry</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="label-eyebrow">{label}</p>
      <p className={`mt-2 text-base font-semibold ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
