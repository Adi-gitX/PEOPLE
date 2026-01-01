/**
 * Seed script to populate initial data in Firestore
 * Run with: npx tsx scripts/seed.ts
 */

import { db } from '../src/config/firebase.js';

// ─── Skills Data ───
const SKILLS = [
    // Languages
    { name: 'JavaScript', category: 'language' },
    { name: 'TypeScript', category: 'language' },
    { name: 'Python', category: 'language' },
    { name: 'Go', category: 'language' },
    { name: 'Rust', category: 'language' },
    { name: 'Java', category: 'language' },
    { name: 'C++', category: 'language' },
    { name: 'Solidity', category: 'language' },

    // Frontend Frameworks
    { name: 'React', category: 'framework' },
    { name: 'Vue.js', category: 'framework' },
    { name: 'Next.js', category: 'framework' },
    { name: 'Angular', category: 'framework' },
    { name: 'Svelte', category: 'framework' },
    { name: 'React Native', category: 'framework' },
    { name: 'Flutter', category: 'framework' },

    // Backend Frameworks
    { name: 'Node.js', category: 'framework' },
    { name: 'Express.js', category: 'framework' },
    { name: 'FastAPI', category: 'framework' },
    { name: 'Django', category: 'framework' },
    { name: 'Spring Boot', category: 'framework' },
    { name: 'NestJS', category: 'framework' },

    // Databases
    { name: 'PostgreSQL', category: 'database' },
    { name: 'MongoDB', category: 'database' },
    { name: 'MySQL', category: 'database' },
    { name: 'Redis', category: 'database' },
    { name: 'Firestore', category: 'database' },
    { name: 'DynamoDB', category: 'database' },

    // Cloud & DevOps
    { name: 'AWS', category: 'cloud' },
    { name: 'Google Cloud', category: 'cloud' },
    { name: 'Azure', category: 'cloud' },
    { name: 'Docker', category: 'cloud' },
    { name: 'Kubernetes', category: 'cloud' },
    { name: 'Terraform', category: 'cloud' },
    { name: 'CI/CD', category: 'cloud' },

    // Design
    { name: 'Figma', category: 'design' },
    { name: 'UI/UX Design', category: 'design' },
    { name: 'Tailwind CSS', category: 'design' },
    { name: 'Three.js', category: 'design' },
    { name: 'Framer Motion', category: 'design' },

    // Tools & Other
    { name: 'Git', category: 'tool' },
    { name: 'GraphQL', category: 'tool' },
    { name: 'REST API', category: 'tool' },
    { name: 'WebSockets', category: 'tool' },
    { name: 'Machine Learning', category: 'other' },
    { name: 'Blockchain', category: 'other' },
    { name: 'Security', category: 'other' },
    { name: 'System Design', category: 'other' },
];

// ─── Proof Tasks Data ───
const PROOF_TASKS = [
    {
        title: 'The Race Condition',
        scenario: `You are building a high-volume payment processing system. A critical vulnerability has been detected where a user can inadvertently (or maliciously) trigger a double charge by clicking the "Pay" button twice effectively instantly.

System State:
- User initiates Transaction A (t=0ms)
- User initiates Transaction B (t=2ms)
- Database: PostgreSQL (Isolation: Read Committed)
- API: Node.js (Express)
- Result: Double Charge, Single Record ID (Failed State)

Your Task:
Explain two distinct architectural strategies to prevent this race condition. Compare them based on latency and consistency guarantees, and select the one best suited for a system handling 10k TPS.`,
        expectedApproach: 'Idempotency keys, Database constraints, Optimistic locking, Distributed locks',
        difficulty: 'hard',
        timeLimitMinutes: 45,
        category: 'backend',
        isActive: true,
    },
    {
        title: 'Design a URL Shortener',
        scenario: `Design a URL shortening service like bit.ly that can handle the following requirements:

Requirements:
- 100M new URLs per day
- 10:1 read-to-write ratio
- URLs should be as short as possible
- Links should expire after 5 years by default
- Analytics: track click count per URL

Your Task:
1. Design the API endpoints
2. Describe the database schema
3. Explain your approach for generating short, unique IDs
4. How would you handle high availability and scalability?`,
        expectedApproach: 'Base62 encoding, distributed ID generation, caching layer, consistent hashing',
        difficulty: 'medium',
        timeLimitMinutes: 45,
        category: 'system_design',
        isActive: true,
    },
    {
        title: 'React Performance Optimization',
        scenario: `You have a React application with a dashboard that displays a large list of 10,000 items. Users are complaining about slow scrolling and laggy interactions.

Current implementation:
- Single component renders all 10,000 items
- Each item has onClick handlers
- State updates cause full re-renders
- Data fetched on component mount

Your Task:
1. Identify at least 3 performance issues with this approach
2. Propose solutions for each issue
3. Explain how you would measure the performance improvements
4. What tools would you use to debug performance issues in React?`,
        expectedApproach: 'Virtualization, React.memo, useCallback, React DevTools, Lighthouse',
        difficulty: 'medium',
        timeLimitMinutes: 30,
        category: 'frontend',
        isActive: true,
    },
];

async function seedSkills() {
    console.log('🌱 Seeding skills...');

    const batch = db.batch();

    for (const skill of SKILLS) {
        const docRef = db.collection('skills').doc();
        batch.set(docRef, {
            ...skill,
            isActive: true,
            createdAt: new Date(),
        });
    }

    await batch.commit();
    console.log(`   ✅ Added ${SKILLS.length} skills`);
}

async function seedProofTasks() {
    console.log('🌱 Seeding proof tasks...');

    const batch = db.batch();

    for (const task of PROOF_TASKS) {
        const docRef = db.collection('proofTasks').doc();
        batch.set(docRef, {
            ...task,
            createdAt: new Date(),
        });
    }

    await batch.commit();
    console.log(`   ✅ Added ${PROOF_TASKS.length} proof tasks`);
}

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🌱 PEOPLE Platform - Database Seeder');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    try {
        await seedSkills();
        await seedProofTasks();

        console.log('');
        console.log('✅ Seeding complete!');
        console.log('');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

main();
