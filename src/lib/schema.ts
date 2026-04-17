export const organization = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "lkmedia",
  url: "https://lkmedia.net",
  logo: "https://lkmedia.net/logo.svg",
  founder: { "@type": "Person", name: "Lucas Kleipoedszus" },
  email: "lk@lucaskleipoedszus.com",
  sameAs: ["https://github.com/livvux"],
});

export const professionalService = () => ({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "lkmedia — Premium Web Development & SEO",
  areaServed: "DE",
  priceRange: "€€€€",
  url: "https://lkmedia.net",
});

export const blogPosting = (post: {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  author: string;
  image?: string;
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.description,
  datePublished: post.pubDate.toISOString(),
  dateModified: (post.updatedDate ?? post.pubDate).toISOString(),
  author: { "@type": "Person", name: post.author },
  image: post.image,
  mainEntityOfPage: post.url,
});

export const faqPage = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({
    "@type": "Question",
    name: i.q,
    acceptedAnswer: { "@type": "Answer", text: i.a },
  })),
});

export const breadcrumbs = (crumbs: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
});
