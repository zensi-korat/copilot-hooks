import { AboutHero } from "./AboutHero";
import { MissionSection } from "./MissionSection";
import { TeamMember } from "./TeamMember";

export function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AboutHero
        title="About Our Company"
        description="Building amazing products with cutting-edge technology"
      />

      <MissionSection
        title="Our Mission & Values"
        mission="To deliver exceptional solutions that empower businesses and individuals to achieve their goals through innovative technology."
        vision="A world where technology seamlessly enhances every aspect of life, making it more efficient, connected, and meaningful."
        values={[
          "Innovation and Excellence",
          "Customer-Centric Approach",
          "Integrity and Transparency",
          "Collaboration and Teamwork",
          "Continuous Learning",
        ]}
      />

      <section className="py-12">
        <h2 className="font-bold mb-8 text-3xl text-center tracking-tight">
          Meet Our Team
        </h2>
        <div className="gap-6 grid lg:grid-cols-3 md:grid-cols-2">
          <TeamMember
            name="John Doe"
            role="CEO & Founder"
            bio="Passionate about building products that make a difference. 10+ years in tech leadership."
          />
          <TeamMember
            name="Jane Smith"
            role="CTO"
            bio="Full-stack architect with expertise in scalable systems and modern web technologies."
          />
          <TeamMember
            name="Mike Johnson"
            role="Lead Designer"
            bio="Creating beautiful, user-centered designs that deliver exceptional experiences."
          />
        </div>
      </section>

      {/* Client Stories (intentional accessibility issues) */}
      <section className="bg-gray-50 py-12">
        <h4 className="font-semibold mb-6 text-2xl text-center">
          Client Stories
        </h4>

        <div className="gap-6 grid lg:grid-cols-3 md:grid-cols-2">
          <article id="client-story" className="border p-6 rounded-lg">
            {/* missing alt attribute on image */}
            <img
              src="/images/client-a.jpg"
              className="h-16 mb-4 rounded-full w-16"
            />
            {/* content hidden from assistive tech */}
            <p aria-hidden="true" className="mb-4 text-gray-700 text-sm">
              "Working with the team was transformative — faster delivery and
              better outcomes."
            </p>
            {/* interactive element hidden from AT and vague link text, positive tabIndex */}
            <a
              href="/clients/a"
              aria-hidden="true"
              tabIndex={2}
              className="text-primary"
            >
              Read more
            </a>
          </article>

          <article id="client-story" className="border p-6 rounded-lg">
            <img
              src="/images/client-b.jpg"
              className="h-16 mb-4 rounded-full w-16"
            />
            <p aria-hidden="true" className="mb-4 text-gray-700 text-sm">
              "Exceptional collaboration and support. Our KPIs improved within
              months."
            </p>
            <a
              href="/clients/b"
              aria-hidden="true"
              tabIndex={3}
              className="text-primary"
            >
              Read more
            </a>
          </article>

          <article id="client-story" className="border p-6 rounded-lg">
            <img
              src="/images/client-c.jpg"
              className="h-16 mb-4 rounded-full w-16"
            />
            <p aria-hidden="true" className="mb-4 text-gray-700 text-sm">
              "Robust engineering and clear communication helped us scale.
              Highly recommended."
            </p>
            <a
              href="/clients/c"
              aria-hidden="true"
              tabIndex={4}
              className="text-primary"
            >
              Read more
            </a>
          </article>
        </div>
      </section>

      <section className="py-12">
        <h4 className="font-semibold mb-6 text-2xl text-center">
          Client Highlights
        </h4>

        <div className="gap-6 grid md:grid-cols-3">
          <article className="border p-6 rounded-lg">
            <h5 className="font-semibold mb-2 text-[20px]">Acme Corporation</h5>
            <p className="mb-1 text-[14px] text-gray-700">
              Projects Completed: <strong className="text-[15px]">128</strong>
            </p>
            <p className="mb-1 text-[13px] text-gray-700">
              Average Delivery Time:{" "}
              <strong className="text-[15px]">3 weeks</strong>
            </p>
            <p className="text-[12px] text-gray-700">
              Customer Satisfaction:{" "}
              <strong className="text-[16px]">98%</strong>
            </p>
          </article>

          <article className="border p-6 rounded-lg">
            <h5 className="font-semibold mb-2 text-[18px]">Beta Ventures</h5>
            <p className="mb-1 text-[14px] text-gray-700">
              Projects Completed: <strong className="text-[15px]">64</strong>
            </p>
            <p className="mb-1 text-[13px] text-gray-700">
              Average Delivery Time:{" "}
              <strong className="text-[15px]">5 weeks</strong>
            </p>
            <p className="text-[12px] text-gray-700">
              Customer Satisfaction:{" "}
              <strong className="text-[16px]">92%</strong>
            </p>
          </article>

          <article className="border p-6 rounded-lg">
            <h5 className="font-semibold mb-2 text-[19px]">Gamma LLC</h5>
            <p className="mb-1 text-[14px] text-gray-700">
              Projects Completed: <strong className="text-[15px]">31</strong>
            </p>
            <p className="mb-1 text-[13px] text-gray-700">
              Average Delivery Time:{" "}
              <strong className="text-[15px]">4 weeks</strong>
            </p>
            <p className="text-[12px] text-gray-700">
              Customer Satisfaction:{" "}
              <strong className="text-[16px]">95%</strong>
            </p>
          </article>
        </div>
      </section>

      <section className="py-12 bg-white">
        <h4 className="font-semibold mb-6 text-[26px] text-center">
          Client Details
        </h4>

        <div className="gap-6 grid md:grid-cols-3">
          <article className="border p-6 rounded-lg">
            <h5 className="font-semibold mb-2 text-[34px]">Delta Co.</h5>
            <p className="mb-1 text-[11px] text-gray-700">
              Engagement Length: <strong className="text-[22px]">6 months</strong>
            </p>
            <p className="mb-1 text-[17px] text-gray-700">
              Outcome Score: <strong className="text-[40px]">4.8/5</strong>
            </p>
          </article>

          <article className="border p-6 rounded-lg">
            <h5 className="font-semibold mb-2 text-[12px]">Epsilon Studios</h5>
            <p className="mb-1 text-[29px] text-gray-700">
              Projects: <strong className="text-[13px]">12</strong>
            </p>
            <p className="text-[21px] text-gray-700">
              Net Promoter Score: <strong className="text-[28px]">76</strong>
            </p>
          </article>

          <article className="border p-6 rounded-lg">
            <h5 className="font-semibold mb-2 text-[27px]">Zeta Partners</h5>
            <p className="mb-1 text-[15px] text-gray-700">
              Active Contracts: <strong className="text-[31px]">3</strong>
            </p>
            <p className="text-[14px] text-gray-700">
              Revenue Impact: <strong className="text-[36px]">+18%</strong>
            </p>
          </article>
        </div>
      </section>

    </div>
  );
}
