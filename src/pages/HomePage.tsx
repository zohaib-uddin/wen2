import React from "react";
import { useShop } from "../context/ShopContext";
import { HeroSection } from "../components/home/HeroSection";
import { Certifications } from "../components/home/Certifications";
import { BestSellersSection } from "../components/home/BestSellersSection";
import { FeaturedIngredients } from "../components/home/FeaturedIngredients";
import { CategoriesShowcase } from "../components/home/CategoriesShowcase";
import { WenPhilosophy } from "../components/home/WenPhilosophy";
import { HowItWorks } from "../components/home/HowItWorks";
import { TimelineSection } from "../components/shared/TimelineSection";
import { TestimonialSection } from "../components/home/TestimonialSection";
import { FounderStorySection } from "../components/shared/FounderStorySection";
import { InstagramFeed } from "../components/home/InstagramFeed";
import { NewsletterCTASection } from "../components/home/NewsletterCTASection";
import { VideoGuidesSection } from "../components/home/VideoGuidesSection";

export const HomePage: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-[#F4EBDB]/40 to-white min-h-screen font-sans overflow-hidden">
      
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Certifications & Trust */}
      <Certifications />

      {/* 3. Best Sellers */}
      <BestSellersSection />

      {/* 4. Featured Ingredients */}
      {/* <FeaturedIngredients /> */}

      {/* 5. Categories Showcase */}
      <CategoriesShowcase />

      {/* 5.5 Video Guides */}
      <VideoGuidesSection />

      {/* 6. The Wen Philosophy */}
      <WenPhilosophy />

      {/* 7. How It Works */}
      {/* <HowItWorks /> */}

      {/* 8. Before & After Results (Timeline) */}
      <TimelineSection />

      {/* 9. Testimonials */}
      <TestimonialSection />

      {/* 10. Brand Story */}
      <FounderStorySection />

      {/* 11. Instagram Feed */}
      {/* <InstagramFeed /> */}

      {/* 12. Newsletter CTA */}
      {/* <NewsletterCTASection /> */}

    </div>
  );
};

export default HomePage;
