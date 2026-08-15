import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "D.O.R.A. — Dnes Od Rána Abstinujem | Funky-Punk z Púchova";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0A",
          backgroundImage:
            "linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(10,10,10,1) 50%, rgba(244,163,0,0.08) 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top: barcode strip + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px", alignItems: "flex-end" }}>
            <div style={{ width: "8px", height: "60px", backgroundColor: "#E63946" }} />
            <div style={{ width: "4px", height: "44px", backgroundColor: "#F4A300" }} />
            <div style={{ width: "3px", height: "68px", backgroundColor: "#E63946" }} />
            <div style={{ width: "2px", height: "32px", backgroundColor: "#C0C0C0" }} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid #2D2D2D",
              backgroundColor: "rgba(26,26,26,0.8)",
              padding: "8px 16px",
              borderRadius: "0px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#E63946",
              }}
            />
            <span
              style={{
                color: "#C0C0C0",
                fontSize: "16px",
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              Booking 2026 — otvorený
            </span>
          </div>
        </div>

        {/* Middle: main title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              color: "#F4A300",
              fontSize: "20px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Funky-Punk · Crossover · Púchov SK
          </div>
          <div
            style={{
              color: "#E63946",
              fontSize: "140px",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-4px",
              textShadow: "0 0 40px rgba(230,57,70,0.5)",
            }}
          >
            D.O.R.A.
          </div>
          <div
            style={{
              color: "#E8E8E8",
              fontSize: "38px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Dnes Od Rána Abstinujem
          </div>
          <div style={{ color: "#C0C0C0", fontSize: "22px", maxWidth: "780px", marginTop: "8px" }}>
            Legendárna funky-punková formácia z Púchova. Na scéne od roku 1996 — tri desaťročia
            autentickej, energickej a spoločensky angažovanej hudby.
          </div>
        </div>

        {/* Bottom: stats strip */}
        <div style={{ display: "flex", gap: "0px", border: "1px solid #2D2D2D" }}>
          {[
            // Hodnoty podľa _audit_copy_content.docx časť 2.1
            { k: "1996", v: "ZALOŽENÁ" },
            { k: "30+", v: "ROKOV NA SCÉNE" },
            { k: "5", v: "NAHRÁVKY" },
            { k: "4", v: "ŽÁNROV" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "20px 24px",
                backgroundColor: "rgba(26,26,26,0.6)",
                borderRight: i < 3 ? "1px solid #2D2D2D" : "none",
              }}
            >
              <div style={{ color: "#E63946", fontSize: "36px", fontWeight: 900 }}>{s.k}</div>
              <div
                style={{
                  color: "#C0C0C0",
                  fontSize: "13px",
                  letterSpacing: "2px",
                  marginTop: "4px",
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
