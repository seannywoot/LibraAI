/**
 * Seed Academic Materials (Articles, Journals, Theses)
 * Creates a shared pool of 10 academic materials randomized across 3 types
 * 
 * Usage: node scripts/seed-academic-materials.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

// Helper function to generate slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Shared pool of 10 academic materials
const academicMaterials = [
  {
    title: 'Machine Learning Applications in Healthcare',
    author: 'Dr. Sarah Chen',
    resourceType: 'article',
    categories: ['Computer Science', 'Healthcare', 'Artificial Intelligence'],
    tags: ['Machine Learning', 'Medical Diagnosis', 'AI'],
    publisher: 'IEEE Transactions',
    year: 2023,
    format: 'Digital',
    status: 'available',
    description: 'A comprehensive study on the application of machine learning algorithms in medical diagnosis and patient care.',
    pageCount: 45,
  },
  {
    title: 'Climate Change and Coastal Ecosystems',
    author: 'Prof. Michael Torres',
    resourceType: 'journal',
    categories: ['Environmental Science', 'Marine Biology'],
    tags: ['Climate Change', 'Ecosystems', 'Conservation'],
    publisher: 'Nature Climate Change',
    year: 2024,
    format: 'Digital',
    status: 'available',
    description: 'Research on the impact of rising sea temperatures on coastal marine ecosystems.',
    pageCount: 78,
  },
  {
    title: 'Quantum Computing: A New Paradigm in Cryptography',
    author: 'Dr. Emily Watson',
    resourceType: 'thesis',
    categories: ['Computer Science', 'Cryptography', 'Quantum Physics'],
    tags: ['Quantum Computing', 'Encryption', 'Security'],
    publisher: 'MIT Press',
    year: 2023,
    format: 'Hardcover',
    status: 'available',
    description: 'PhD thesis exploring the implications of quantum computing on modern cryptographic systems.',
    pageCount: 234,
  },
  {
    title: 'Sustainable Urban Development in Developing Nations',
    author: 'Dr. James Okonkwo',
    resourceType: 'article',
    categories: ['Urban Planning', 'Sustainability', 'Economics'],
    tags: ['Urban Development', 'Sustainability', 'Infrastructure'],
    publisher: 'Journal of Urban Studies',
    year: 2024,
    format: 'Digital',
    status: 'available',
    description: 'Analysis of sustainable urban planning strategies in rapidly growing cities.',
    pageCount: 32,
  },
  {
    title: 'Neural Networks and Natural Language Processing',
    author: 'Dr. Priya Sharma',
    resourceType: 'journal',
    categories: ['Computer Science', 'Linguistics', 'Artificial Intelligence'],
    tags: ['Neural Networks', 'NLP', 'Deep Learning'],
    publisher: 'ACM Computing Surveys',
    year: 2023,
    format: 'Digital',
    status: 'available',
    description: 'Comprehensive review of neural network architectures for natural language understanding.',
    pageCount: 92,
  },
  {
    title: 'The Impact of Social Media on Political Discourse',
    author: 'Prof. David Martinez',
    resourceType: 'thesis',
    categories: ['Political Science', 'Communication', 'Sociology'],
    tags: ['Social Media', 'Politics', 'Public Opinion'],
    publisher: 'Oxford University Press',
    year: 2024,
    format: 'Paperback',
    status: 'available',
    description: 'Doctoral dissertation examining how social media platforms shape political conversations.',
    pageCount: 312,
  },
  {
    title: 'Renewable Energy Storage Solutions',
    author: 'Dr. Lisa Anderson',
    resourceType: 'article',
    categories: ['Engineering', 'Energy', 'Environmental Science'],
    tags: ['Renewable Energy', 'Battery Technology', 'Sustainability'],
    publisher: 'Energy Policy Journal',
    year: 2024,
    format: 'Digital',
    status: 'available',
    description: 'Technical analysis of emerging battery technologies for renewable energy storage.',
    pageCount: 28,
  },
  {
    title: 'Behavioral Economics and Consumer Decision Making',
    author: 'Prof. Robert Kim',
    resourceType: 'journal',
    categories: ['Economics', 'Psychology', 'Business'],
    tags: ['Behavioral Economics', 'Consumer Behavior', 'Decision Theory'],
    publisher: 'Quarterly Journal of Economics',
    year: 2023,
    format: 'Digital',
    status: 'available',
    description: 'Research on cognitive biases and their influence on consumer purchasing decisions.',
    pageCount: 64,
  },
  {
    title: 'Gene Therapy Approaches for Rare Diseases',
    author: 'Dr. Maria Rodriguez',
    resourceType: 'thesis',
    categories: ['Medicine', 'Genetics', 'Biotechnology'],
    tags: ['Gene Therapy', 'Rare Diseases', 'CRISPR'],
    publisher: 'Harvard Medical School',
    year: 2024,
    format: 'Hardcover',
    status: 'available',
    description: 'Medical thesis investigating novel gene therapy techniques for treating rare genetic disorders.',
    pageCount: 278,
  },
  {
    title: 'Artificial Intelligence Ethics and Governance',
    author: 'Prof. Thomas Wright',
    resourceType: 'article',
    categories: ['Philosophy', 'Computer Science', 'Law'],
    tags: ['AI Ethics', 'Governance', 'Technology Policy'],
    publisher: 'Ethics and Information Technology',
    year: 2024,
    format: 'Digital',
    status: 'available',
    description: 'Philosophical examination of ethical frameworks for AI development and deployment.',
    pageCount: 38,
  },
];

async function seedAcademicMaterials() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const books = db.collection('books');

    console.log('📚 Seeding Academic Materials...\n');
    console.log('=' .repeat(60));

    // Shuffle the materials to randomize distribution
    const shuffled = [...academicMaterials].sort(() => Math.random() - 0.5);

    // Prepare materials for insertion
    const materialsToInsert = shuffled.map(material => ({
      ...material,
      slug: generateSlug(material.title),
      isbn: null, // Academic materials typically don't have ISBNs
      popularityScore: Math.floor(Math.random() * 50) + 10, // Random score 10-60
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert all materials
    const result = await books.insertMany(materialsToInsert);
    console.log(`✅ Successfully inserted ${result.insertedCount} academic materials\n`);

    // Display summary by type
    const typeCounts = {
      article: materialsToInsert.filter(m => m.resourceType === 'article').length,
      journal: materialsToInsert.filter(m => m.resourceType === 'journal').length,
      thesis: materialsToInsert.filter(m => m.resourceType === 'thesis').length,
    };

    console.log('📊 Summary by Type:');
    console.log('=' .repeat(60));
    console.log(`📄 Articles: ${typeCounts.article}`);
    console.log(`📖 Journals: ${typeCounts.journal}`);
    console.log(`🎓 Theses: ${typeCounts.thesis}`);
    console.log(`📚 Total: ${result.insertedCount}`);
    console.log('=' .repeat(60));

    // Display all inserted materials
    console.log('\n📋 Inserted Materials:\n');
    materialsToInsert.forEach((material, index) => {
      const typeEmoji = material.resourceType === 'article' ? '📄' : 
                       material.resourceType === 'journal' ? '📖' : '🎓';
      console.log(`${index + 1}. ${typeEmoji} ${material.title}`);
      console.log(`   Author: ${material.author}`);
      console.log(`   Type: ${material.resourceType.toUpperCase()}`);
      console.log(`   Categories: ${material.categories.join(', ')}`);
      console.log(`   Year: ${material.year}`);
      console.log('');
    });

    console.log('✅ Academic materials seeding complete!\n');

  } catch (error) {
    console.error('❌ Error seeding academic materials:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
seedAcademicMaterials();
