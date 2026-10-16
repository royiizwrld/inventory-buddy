import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";

/** Renders a barcode (CODE128) and/or QR code. Values can come from typing now, or a camera scanner later. */
export function CodePreview({ barcode, qr }: { barcode?: string; qr?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [barErr, setBarErr] = useState(false);

  useEffect(() => {
    if (!barcode || !svgRef.current) return;
    let cancelled = false;
    import("jsbarcode").then(({ default: JsBarcode }) => {
      if (cancelled || !svgRef.current) return;
      try {
        JsBarcode(svgRef.current, barcode, { format: "CODE128", height: 60, displayValue: true, margin: 6, fontSize: 14 });
        setBarErr(false);
      } catch {
        setBarErr(true);
      }
    });
    return () => { cancelled = true; };
  }, [barcode]);

  useEffect(() => {
    if (!qr) { setQrUrl(""); return; }
    let cancelled = false;
    import("qrcode").then((QR) => QR.toDataURL(qr, { margin: 1, width: 160 })).then((u) => !cancelled && setQrUrl(u)).catch(() => setQrUrl(""));
    return () => { cancelled = true; };
  }, [qr]);

  const empty = !barcode && !qr;
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/40 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <ScanLine className="h-4 w-4" /> Barcode / QR preview
      </p>
      {empty ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Add a barcode or QR / asset tag value to see a preview.</p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-6">
          {barcode && (
            <div className="rounded-lg bg-card p-2">
              {barErr ? <p className="text-sm text-destructive">Can't render this barcode.</p> : <svg ref={svgRef} />}
            </div>
          )}
          {qr && qrUrl && (
            <div className="rounded-lg bg-card p-2 text-center">
              <img src={qrUrl} alt={`QR code for ${qr}`} className="h-40 w-40" />
              <p className="mt-1 font-mono text-xs">{qr}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
