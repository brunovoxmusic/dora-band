// Seed script for D.O.R.A. — creates admin user, sample gigs, and media items.
// Run with: bun run src/lib/seed.ts
//
// P0 SECURITY: Admin credentials from env vars, password hashed with bcrypt.
// Required env: ADMIN_EMAIL, ADMIN_PASSWORD
import { db } from "./db";
import { hashPassword } from "./password";

async function main() {
  // P0-4: Admin credentials from env, hashed, no plaintext in code
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.\n" +
        "Example: ADMIN_EMAIL=admin@dora.band ADMIN_PASSWORD=your-strong-password bun run seed"
    );
  }

  if (adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const existing = await db.adminUser.findUnique({ where: { email: adminEmail.toLowerCase() } });
  if (!existing) {
    const passwordHash = await hashPassword(adminPassword);
    await db.adminUser.create({
      data: {
        email: adminEmail.toLowerCase(),
        passwordHash,
        name: "D.O.R.A. Admin",
        role: "admin",
      },
    });
    console.log(`✓ Created admin user: ${adminEmail}`);
  } else {
    console.log("• Admin user already exists");
  }

  // Sample upcoming gigs
  const gigCount = await db.gig.count();
  if (gigCount === 0) {
    await db.gig.createMany({
      data: [
        {
          title: "Letný pivný festival 2026",
          date: new Date("2026-07-15T21:00:00"),
          venue: "Hlavné pódium",
          city: "Púchov",
          country: "SK",
          ticketUrl: "#contact",
          ticketPrice: "10 EUR predpredaj / 15 EUR na mieste",
          status: "upcoming",
          notes: "Headlining set — funky-punková jazda.",
        },
        {
          title: "Punk Night Showcase",
          date: new Date("2026-08-22T20:00:00"),
          venue: "Klub Underground",
          city: "Bratislava",
          country: "SK",
          ticketUrl: "#contact",
          ticketPrice: "8 EUR",
          status: "upcoming",
        },
        {
          title: "Crossover Fest",
          date: new Date("2026-09-12T19:30:00"),
          venue: "Areál Zimný štadión",
          city: "Žilina",
          country: "SK",
          ticketUrl: "#contact",
          ticketPrice: "12 EUR",
          status: "upcoming",
        },
      ],
    });
    console.log("✓ Seeded 3 upcoming gigs");
  } else {
    console.log(`• ${gigCount} gigs already exist`);
  }

  // Media items — point to extracted authentic photos
  const mediaCount = await db.mediaItem.count();
  if (mediaCount === 0) {
    const concertPhotos = Array.from({ length: 16 }, (_, i) => ({
      title: `Koncertný záchyt ${i + 1}`,
      url: `/gallery/concert/concert-${String(i + 1).padStart(2, "0")}.jpg`,
      thumbnailUrl: `/gallery/concert/concert-${String(i + 1).padStart(2, "0")}-thumb.jpg`,
      category: "concert",
      caption: "Energické vystúpenie na koncertnom pódiu",
      credits: "Foto: archív D.O.R.A.",
      featured: i === 0,
    }));
    const portraitPhotos = Array.from({ length: 5 }, (_, i) => ({
      title: `Portrétny záchyt ${i + 1}`,
      url: `/gallery/portrait/portrait-${String(i + 1).padStart(2, "0")}.jpg`,
      thumbnailUrl: `/gallery/portrait/portrait-${String(i + 1).padStart(2, "0")}-thumb.jpg`,
      category: "portrait",
      caption: "Portrét / zákulisie",
      credits: "Foto: archív D.O.R.A.",
    }));
    await db.mediaItem.createMany({ data: [...concertPhotos, ...portraitPhotos] });
    console.log("✓ Seeded 21 media items");
  } else {
    console.log(`• ${mediaCount} media items already exist`);
  }

  // Band members — seed if empty
  const memberCount = await db.bandMember.count();
  if (memberCount === 0) {
    await db.bandMember.createMany({
      data: [
        { name: "Majo Agafon", role: "Vokály / Rap", roleEn: "Vocals / Rap", bio: "Prínos crossoverového rapu do zvuku kapely. Prináša hip-hopový element, ktorý D.O.R.A. odlišuje od klasickej punkovej formácie.", initials: "MA", since: "—", photo: "/gallery/portrait/portrait-01.jpg", order: 1, active: true },
        { name: "Branislav Guzma", role: "Gitara", roleEn: "Guitar", bio: "Zakladajúci člen, ktorý prešiel z basgitary na šesťstrunový nástroj, čím priniesol kapelnému zvuku novú dimenziu a hustotu.", initials: "BG", since: "1996", photo: "/gallery/portrait/portrait-02.jpg", order: 2, active: true },
        { name: "Matúš Dobeš", role: "Basgitara", roleEn: "Bass", bio: "Pridal sa v roku 2005 a významne prispel k nahrávke TCHO SME NAHLAVU. Stabilná basová linka je základom funky-punkového groovu.", initials: "MD", since: "2005", photo: "/gallery/portrait/portrait-03.jpg", order: 3, active: true },
        { name: "Július Flimmel", role: "Bicie", roleEn: "Drums", bio: "Zakladajúci bubeník, ktorého energické a presné bicie sú srdcom rytmickej sekcie kapely.", initials: "JF", since: "1996", photo: "/gallery/portrait/portrait-04.jpg", order: 4, active: true },
      ],
    });
    console.log("✓ Seeded 4 band members");
  } else {
    console.log(`• ${memberCount} band members already exist`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
