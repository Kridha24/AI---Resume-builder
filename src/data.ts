import { ResumeData, LayoutSettings } from "./types";

export const SAMPLE_RESUMES: { [key: string]: { name: string; data: ResumeData; layout: LayoutSettings } } = {
  software_engineer: {
    name: "Software Engineer",
    layout: {
      template: "split",
      colorTheme: "#0284c7", // Sky blue
      fontSize: "base",
      fontFamily: "sans",
      spacing: "comfortable",
      sectionOrder: ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "customSection"]
    },
    data: {
      personalInfo: {
        fullName: "Alex Rivera",
        jobTitle: "Senior Full-Stack Engineer",
        email: "alex.rivera@email.com",
        phone: "+1 (555) 019-2834",
        location: "San Francisco, CA",
        website: "alexrivera.dev",
        linkedin: "linkedin.com/in/alexriveradevs",
        github: "github.com/alexrivera"
      },
      summary: "Dynamic Full-Stack Software Engineer with over 6 years of experience designing, building, and deploying highly scalable web applications. Expert in TypeScript, React, and Node.js, with a strong focus on frontend performance optimization and distributed systems architecture. Passionate about crafting pixel-perfect, accessible user interfaces and leading cross-functional engineering teams.",
      workExperience: [
        {
          id: "exp-1",
          company: "Vortex Technologies",
          position: "Lead Full-Stack Engineer",
          location: "San Francisco, CA",
          startDate: "2023-03",
          endDate: "",
          current: true,
          description: [
            "Architected and engineered a real-time analytics dashboard with React, TypeScript, and Tailwind, boosting user engagement by [24%].",
            "Led a team of 4 engineers in migrating a legacy monolithic application to a micro-services architecture, decreasing server response time by [35%].",
            "Designed and implemented high-volume REST APIs in Node.js, securely processing over [1.2M] daily transactions.",
            "Established automated CI/CD deployment pipelines using GitHub Actions, cutting manual deployment overhead by [80%]."
          ]
        },
        {
          id: "exp-2",
          company: "ByteCraft Studio",
          position: "Senior Software Engineer",
          location: "Austin, TX",
          startDate: "2020-08",
          endDate: "2023-02",
          current: false,
          description: [
            "Built and scaled a collaborative visual project board utilizing WebSockets and canvas rendering, accommodating [50K] active monthly users.",
            "Engineered reusable UI component library used across [3] core products, reducing frontend engineering design-to-code cycles by [40%].",
            "Optimized client-side rendering pathways and image compressions, lifting the Google Lighthouse Performance Score from [65 to 98]."
          ]
        }
      ],
      education: [
        {
          id: "edu-1",
          institution: "University of California, Berkeley",
          degree: "Bachelor of Science",
          fieldOfStudy: "Computer Science",
          location: "Berkeley, CA",
          startDate: "2016-09",
          endDate: "2020-05",
          current: false,
          gpa: "3.85 / 4.00"
        }
      ],
      projects: [
        {
          id: "proj-1",
          title: "DevFlow Collaborative IDE",
          role: "Solo Creator",
          technologies: ["React", "TypeScript", "Node.js", "Express", "WebSockets"],
          link: "github.com/alex/devflow",
          description: [
            "Conceived and deployed an in-browser code editor with real-time peer collaboration and syntax highlight.",
            "Utilized operational transformation algorithms to handle text sync conflicts gracefully under high latency."
          ]
        },
        {
          id: "proj-2",
          title: "Lumina Productivity Dashboard",
          role: "Core Developer",
          technologies: ["TailwindCSS", "Recharts", "Framer Motion", "SQLite"],
          link: "lumina.alexrivera.dev",
          description: [
            "Designed a highly custom, keyboard-shortcut-driven personal task board integrated with Google Calendar APIs.",
            "Visualized habit streaks and task metrics with custom Recharts graphs, increasing user daily retention by [18%]."
          ]
        }
      ],
      skills: [
        {
          id: "skill-cat-1",
          name: "Languages",
          skills: ["TypeScript", "JavaScript (ES6+)", "Python", "SQL", "HTML5/CSS3"]
        },
        {
          id: "skill-cat-2",
          name: "Frameworks & Libraries",
          skills: ["React.js", "Next.js", "Node.js", "Express.js", "Tailwind CSS", "Redux Toolkit"]
        },
        {
          id: "skill-cat-3",
          name: "Tools & Clouds",
          skills: ["Git & GitHub", "Docker", "AWS (S3/EC2)", "Firebase", "PostgreSQL", "Jest"]
        }
      ],
      languages: ["English (Native)", "Spanish (Conversational)"],
      certifications: [
        "AWS Certified Solutions Architect – Associate",
        "Scrum Alliance Certified ScrumMaster (CSM)"
      ],
      customSection: {
        title: "Interests & Focus Areas",
        content: "Deeply interested in Web Accessibility (a11y) standards, Developer Experience (DX) tools, and contributing to open-source software libraries. Outside of code, I enjoy wilderness photography, long-distance cycling, and roasting specialty coffee beans.",
        show: true
      }
    }
  },
  product_manager: {
    name: "Product Manager",
    layout: {
      template: "modern",
      colorTheme: "#0f766e", // Teal
      fontSize: "base",
      fontFamily: "serif", // Playfair display feel
      spacing: "comfortable",
      sectionOrder: ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "customSection"]
    },
    data: {
      personalInfo: {
        fullName: "Sarah Chen",
        jobTitle: "Senior Technical Product Manager",
        email: "sarah.chen@email.com",
        phone: "+1 (555) 438-9210",
        location: "Seattle, WA",
        website: "sarahchenpm.com",
        linkedin: "linkedin.com/in/sarahchenpm",
        github: ""
      },
      summary: "Results-driven Technical Product Manager with over 7 years of experience directing product strategy and cross-functional teams in SaaS and Cloud systems. Expert at converting complex developer requirements into clear, prioritize roadmaps and highly engaging user journeys. Proven track record of launching multiple API-first products scaling to millions of active users.",
      workExperience: [
        {
          id: "exp-1",
          company: "CloudVibe Infrastructure",
          position: "Lead Technical Product Manager",
          location: "Seattle, WA",
          startDate: "2022-01",
          endDate: "",
          current: true,
          description: [
            "Spearheaded the developer platform overhaul, resulting in a [50%] reduction in API onboarding time and a [30%] increase in active integrations.",
            "Collaborated with [12] engineers and designers to launch a serverless database service, securing [$2.4M] in ARR within the first [6 months].",
            "Synthesized user research, usage logs, and competitive intelligence to establish a 3-year API product roadmap."
          ]
        },
        {
          id: "exp-2",
          company: "Aura Commerce",
          position: "Product Manager – Growth",
          location: "Boston, MA",
          startDate: "2019-06",
          endDate: "2021-12",
          current: false,
          description: [
            "Designed and ran [18] A/B conversion experiments on the checkout funnel, boosting checkout conversion rate by [12.4%].",
            "Defined and tracked product-led growth (PLG) telemetry, establishing KPIs that enabled the executive team to target high-value clients."
          ]
        }
      ],
      education: [
        {
          id: "edu-1",
          institution: "University of Washington",
          degree: "MBA",
          fieldOfStudy: "Technology Management",
          location: "Seattle, WA",
          startDate: "2017-09",
          endDate: "2019-05",
          current: false,
          gpa: "3.90 / 4.00"
        }
      ],
      projects: [
        {
          id: "proj-1",
          title: "Aura One-Click Pay",
          role: "Product Owner",
          technologies: ["Stripe API", "Mobile Web", "Biometric Auth"],
          link: "aura.com/one-click",
          description: [
            "Led product conceptualization and execution of a localized frictionless checkout system across North American retail clients.",
            "Oversaw legal, engineering, and support launches, guaranteeing compliance with strict PCI-DSS policies."
          ]
        }
      ],
      skills: [
        {
          id: "skill-cat-1",
          name: "Product & Strategy",
          skills: ["Product Roadmap", "Market Research", "Competitive Analysis", "A/B Testing", "Agile/Scrum", "SaaS Pricing Models"]
        },
        {
          id: "skill-cat-2",
          name: "Technical & Analytics",
          skills: ["SQL Data Analysis", "REST APIs", "Google Analytics", "Mixpanel", "Jira & Confluence", "System Architecture Concepts"]
        }
      ],
      languages: ["English (Native)", "Mandarin (Fluent)"],
      certifications: [
        "Pragmatic Institute Certified (Level VI)",
        "Certified Product Owner (CSPO) – Scrum Alliance"
      ],
      customSection: {
        title: "Publications & Speaking",
        content: "Frequent writer on Medium's 'Serious Product' publication, sharing lessons on technical roadmaps and API-first developer products. Panel speaker at the 2024 ProductWorld Seattle Conference on 'The intersection of Engineering and Growth PM'.",
        show: true
      }
    }
  },
  creative_designer: {
    name: "Brand & UI/UX Designer",
    layout: {
      template: "executive",
      colorTheme: "#b91c1c", // Crimson red
      fontSize: "base",
      fontFamily: "mono", // Cool typewriter vibe
      spacing: "comfortable",
      sectionOrder: ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "customSection"]
    },
    data: {
      personalInfo: {
        fullName: "Marcus Thorne",
        jobTitle: "Senior Brand & UI Designer",
        email: "marcus.thorne@design.co",
        phone: "+1 (555) 782-1928",
        location: "New York, NY",
        website: "marcusthornedsn.com",
        linkedin: "linkedin.com/in/marcusthorne",
        github: ""
      },
      summary: "Award-winning Senior Brand & UI Designer with 8 years of agency and in-house experience. Expert in building cohesive visual identity systems, modern digital products, and high-converting marketing campaigns. Focused on combining structural typography, creative color schemes, and empathetic research to craft memorable user interfaces.",
      workExperience: [
        {
          id: "exp-1",
          company: "Studio Bold Creative",
          position: "Senior Visual Designer",
          location: "New York, NY",
          startDate: "2021-02",
          endDate: "",
          current: true,
          description: [
            "Conceived brand guidelines and UI patterns for [5] Fortune 500 tech clients, boosting visual consistency scores by [45%].",
            "Directed digital design assets for national marketing campaigns, yielding over [$3.2M] in direct consumer sales.",
            "Mentored [3] junior designers, improving deliverable turn-around speeds by [20%] through updated Figma component workflows."
          ]
        },
        {
          id: "exp-2",
          company: "Prism Digital Group",
          position: "UI/UX Designer",
          location: "Los Angeles, CA",
          startDate: "2018-05",
          endDate: "2021-01",
          current: false,
          description: [
            "Redesigned the primary mobile banking app onboarding flows, which reduced client churn rates by [21.5%].",
            "Produced high-fidelity responsive wireframes, interactive user prototypes, and visual design assets in Figma."
          ]
        }
      ],
      education: [
        {
          id: "edu-1",
          institution: "Rhode Island School of Design (RISD)",
          degree: "Bachelor of Fine Arts",
          fieldOfStudy: "Graphic Design",
          location: "Providence, RI",
          startDate: "2014-09",
          endDate: "2018-05",
          current: false,
          gpa: "3.92 / 4.00"
        }
      ],
      projects: [
        {
          id: "proj-1",
          title: "Krypton Crypto Redesign",
          role: "Creative Director",
          technologies: ["Figma", "Adobe Illustrator", "Prototyping", "WebGL Coordination"],
          link: "behance.net/marcus/krypton",
          description: [
            "Designed a highly interactive, accessible Web3 user dashboard that improved transaction completion by [34%].",
            "Created comprehensive custom icon sets and an illustrative library used globally across physical and online assets."
          ]
        }
      ],
      skills: [
        {
          id: "skill-cat-1",
          name: "Design Craft",
          skills: ["UI/UX Design", "Brand Identity", "Design Systems", "Typography Pairing", "Wireframing", "Vector Illustration", "Color Theory"]
        },
        {
          id: "skill-cat-2",
          name: "Software & Prototyping",
          skills: ["Figma", "Adobe Creative Suite", "After Effects", "Webflow Development", "HTML/CSS Basics", "Prototyping in Principle"]
        }
      ],
      languages: ["English (Native)", "French (Conversational)"],
      certifications: [
        "NN/g UX Master Certified (#94382)",
        "Figma Professional Designer Certification"
      ],
      customSection: {
        title: "Awards & Recognitions",
        content: "Winner of the 2023 Awwwards Site of the Day for Krypton Web Experience. Featured in Communication Arts Design Annual 2022. Finalist in the Society of Typographic Arts (STA) student show.",
        show: true
      }
    }
  }
};
