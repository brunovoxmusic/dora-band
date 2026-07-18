// Seed script for D.O.R.A. — creates default admin user, sample gigs, and media items.
// Run with: bun run src/lib/seed.ts
import { db } from "./db";

async function main() {
  // Default admin user (password: dora2026)
  // NOTE: in production this would be hashed with bcrypt. Kept simple for demo.
  const existing = await db.adminUser.findUnique({ where: { email: "admin@dora.band" } });
  if (!existing) {
    await db.adminUser.create({
      data: {
        email: "admin@dora.band",
        password: "dora2026",
        name: "D.O.R.A. Admin",
        role: "admin",
      },
    });
    console.log("✓ Created default admin: admin@dora.band / dora2026");
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
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
