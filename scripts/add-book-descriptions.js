/**
 * Add comprehensive descriptions to all books in the catalog
 * This improves chatbot awareness and search capabilities
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const BOOK_DESCRIPTIONS = {
  // Fiction
  "9780061120084": "A gripping tale of racial injustice and childhood innocence in the American South. Through the eyes of young Scout Finch, witness her father Atticus defend a Black man falsely accused of rape. A timeless exploration of morality, prejudice, and courage.",
  
  "9780451524935": "A dystopian masterpiece depicting a totalitarian future where Big Brother watches everything. Winston Smith struggles against oppressive surveillance, thought control, and the manipulation of truth. A chilling warning about authoritarianism and loss of freedom.",
  
  "9780141439518": "A witty romantic novel following Elizabeth Bennet as she navigates love, class, and social expectations in Regency England. Misunderstandings and pride complicate her relationship with the wealthy Mr. Darcy in this beloved classic of manners and marriage.",
  
  "9780743273565": "Set in the Jazz Age, this novel explores the American Dream through mysterious millionaire Jay Gatsby's obsession with Daisy Buchanan. A tale of wealth, love, and disillusionment in 1920s New York, revealing the emptiness behind glamorous facades.",
  
  "9780316769174": "Holden Caulfield's rebellious journey through New York City after being expelled from prep school. A raw, honest portrayal of teenage angst, alienation, and the struggle to find authenticity in a world of phonies.",
  
  // Science
  "9780553380163": "Stephen Hawking makes complex cosmology accessible, exploring black holes, the Big Bang, and the nature of time. From quantum mechanics to relativity, discover the universe's deepest mysteries explained for general readers.",
  
  "9780198788607": "Revolutionary perspective on evolution focusing on genes as the primary unit of selection. Dawkins argues that organisms are vehicles for genes seeking to replicate themselves, fundamentally changing how we understand natural selection and behavior.",
  
  "9780345539434": "Carl Sagan's poetic journey through space and time, exploring the universe's wonders and humanity's place within it. Combines astronomy, biology, and philosophy to inspire wonder about the cosmos and our cosmic connections.",
  
  "9780451529060": "Darwin's groundbreaking work introducing natural selection as the mechanism of evolution. Presents evidence from nature showing how species adapt and change over time, revolutionizing biology and our understanding of life on Earth.",
  
  "9780062316097": "A sweeping history of humankind from the Stone Age to the modern era. Harari explores how Homo sapiens came to dominate Earth through cognitive, agricultural, and scientific revolutions, questioning what makes us human.",
  
  // Technology
  "9780132350884": "Essential guide to writing clean, maintainable code that other developers can understand. Martin shares principles, patterns, and practices for crafting professional software, from naming conventions to error handling and testing.",
  
  "9780201616224": "Timeless wisdom for software developers covering everything from career development to technical practices. Hunt and Thomas share pragmatic approaches to becoming a better programmer through continuous learning and adaptation.",
  
  "9780201633610": "The definitive guide to object-oriented design patterns. Gamma and colleagues document 23 classic patterns that solve common software design problems, providing a shared vocabulary for developers worldwide.",
  
  "9780262033848": "Comprehensive textbook covering fundamental algorithms and data structures. From sorting and searching to graph algorithms and dynamic programming, this rigorous text is essential for computer science students and professionals.",
  
  "9780134610993": "The leading textbook on artificial intelligence, covering everything from search algorithms to machine learning and neural networks. Russell and Norvig provide both theoretical foundations and practical applications of AI.",
  
  "9780262035613": "Comprehensive introduction to deep learning covering neural networks, convolutional networks, recurrent networks, and more. Goodfellow and colleagues explain both the mathematics and practical implementation of modern deep learning techniques.",
  
  // History
  "9780393317558": "Jared Diamond explores why some civilizations succeeded while others failed, examining the role of geography, agriculture, and technology. A sweeping analysis of human history showing how environmental factors shaped societies.",
  
  "9780553296983": "Anne Frank's intimate diary documenting her family's two years hiding from the Nazis in Amsterdam. A powerful, personal account of hope, fear, and humanity during the Holocaust, written by a young girl with remarkable insight.",
  
  "9780062397348": "Howard Zinn retells American history from the perspective of marginalized groups: workers, women, Native Americans, and African Americans. Challenges traditional narratives by highlighting voices often excluded from mainstream history.",
  
  "9781451651683": "Comprehensive history of Nazi Germany from Hitler's rise to power through World War II and the regime's collapse. Shirer, who witnessed events firsthand, provides detailed analysis of the Third Reich's ideology and atrocities.",
  
  // Biography
  "9781451648539": "Walter Isaacson's authorized biography of Apple co-founder Steve Jobs, based on extensive interviews. Chronicles Jobs' perfectionism, innovation, and complex personality, revealing the man behind revolutionary products like the iPhone and Mac.",
  
  "9780345350688": "Malcolm X's powerful autobiography, written with Alex Haley, traces his transformation from street hustler to Nation of Islam minister to human rights activist. A profound exploration of race, identity, and social justice in America.",
  
  "9780316548182": "Nelson Mandela's inspiring memoir of his journey from rural childhood to anti-apartheid activist to South Africa's first Black president. A testament to resilience, forgiveness, and the power of fighting for justice.",
  
  "9781524763138": "Michelle Obama's intimate memoir sharing her experiences from Chicago's South Side to the White House. Reflects on motherhood, marriage, public service, and finding her voice as First Lady of the United States.",
  
  // Self-Help
  "9780735211292": "James Clear presents a proven framework for building good habits and breaking bad ones. Learn how tiny changes compound into remarkable results through the four laws of behavior change. Practical strategies backed by science for lasting personal transformation.",
  
  "9781982137274": "Stephen Covey's influential guide to personal and professional effectiveness. The seven habits provide a principle-centered approach to solving problems, building relationships, and achieving goals through character development and proactive living.",
  
  "9780671027032": "Dale Carnegie's timeless classic on interpersonal skills and influence. Learn fundamental techniques for handling people, winning friends, and persuading others through genuine interest, appreciation, and understanding human nature.",
  
  "9780374533557": "Nobel laureate Daniel Kahneman explains the two systems that drive thinking: fast, intuitive System 1 and slow, deliberate System 2. Reveals cognitive biases affecting decisions and offers insights into judgment, choice, and rationality.",
  
  // Business
  "9780307887894": "Eric Ries introduces the lean startup methodology for building successful businesses through validated learning, rapid experimentation, and iterative product releases. Essential reading for entrepreneurs navigating uncertainty.",
  
  "9780066620992": "Jim Collins examines what makes companies transition from good to great, identifying key factors like Level 5 leadership, the Hedgehog Concept, and a culture of discipline. Data-driven insights from extensive research.",
  
  "9780804139298": "Peter Thiel shares contrarian insights on innovation and startups. Argues that true progress comes from creating new things (zero to one) rather than copying what works (one to n). Challenges conventional business wisdom.",
  
  "9781633691780": "Clayton Christensen explains why successful companies fail when faced with disruptive innovations. Shows how established firms can be blindsided by new technologies and business models that initially serve niche markets.",
  
  // Non-Fiction
  "9780399590504": "Tara Westover's memoir of growing up in a survivalist family in rural Idaho without formal education, then earning a PhD from Cambridge. A powerful story of self-invention, education's transformative power, and family loyalty.",
  
  "9781400052189": "Rebecca Skloot tells the story of Henrietta Lacks, whose cancer cells were taken without consent and became one of medicine's most important tools. Explores medical ethics, race, and the human story behind HeLa cells.",
  
  "9780060731328": "Steven Levitt and Stephen Dubner use economic thinking to explore hidden sides of everything from cheating teachers to drug dealers' finances. Reveals surprising connections and challenges conventional wisdom with data.",
  
  "9780307352156": "Susan Cain champions introverts in a world that values extroversion. Explores how society undervalues quiet temperaments and shows how introverts bring extraordinary talents and abilities to the world.",
  
  // Arts
  "9780714832470": "E.H. Gombrich's accessible introduction to art history, from cave paintings to modern art. Explains artistic movements, techniques, and cultural contexts, making art appreciation approachable for all readers.",
  
  "9780140135152": "John Berger's influential essays on visual culture and how we see art. Challenges traditional art criticism by examining how reproduction, advertising, and social context shape our perception of images.",
  
  "9780465002634": "Robert Henri's inspiring philosophy on art and life, compiled from his teachings. Encourages artists to find their unique voice, observe life deeply, and create work that expresses genuine feeling and truth.",
  
  // Education
  "9780826412768": "Paulo Freire's revolutionary pedagogy advocating for education as liberation rather than oppression. Critiques the banking model of education and proposes dialogue-based learning that empowers students as co-creators of knowledge.",
  
  "9780201484045": "John Holt's observations on how children naturally learn through curiosity and play. Challenges traditional schooling methods and advocates for respecting children's innate intelligence and learning processes.",
  
  "9780345472328": "Carol Dweck's research on fixed versus growth mindsets and their impact on achievement. Shows how believing abilities can be developed leads to greater success than believing talents are innate and unchangeable.",
  
  // Children
  "9780590353427": "Harry Potter discovers he's a wizard and begins attending Hogwarts School of Witchcraft and Wizardry. The first book in J.K. Rowling's beloved series about friendship, courage, and the battle between good and evil.",
  
  "9780064400558": "E.B. White's classic tale of friendship between Wilbur the pig and Charlotte the spider. Charlotte uses her web-spinning abilities to save Wilbur from slaughter in this touching story about loyalty and sacrifice.",
  
  "9780060254926": "Maurice Sendak's imaginative picture book about Max, who sails to an island of wild things after being sent to bed without supper. A beloved exploration of childhood emotions, imagination, and the comfort of home.",
  
  // Young Adult
  "9780439023481": "In a dystopian future, Katniss Everdeen volunteers for the Hunger Games, a televised fight to the death. Suzanne Collins' thrilling tale of survival, rebellion, and the cost of war captivates readers with action and social commentary.",
  
  "9780525478812": "John Green's poignant love story between two teenagers with cancer who meet at a support group. Hazel and Augustus navigate life, death, and the search for meaning in this emotional, funny, and deeply moving novel.",
  
  "9780544336261": "Lois Lowry's dystopian novel about Jonas, who lives in a seemingly perfect society without pain, war, or suffering. When chosen as the Receiver of Memory, he discovers the dark truth behind his community's harmony.",
};

async function addDescriptions() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library';
  
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not found, using default: mongodb://localhost:27017/library');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const booksCollection = db.collection('books');

    let updatedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;

    for (const [isbn, description] of Object.entries(BOOK_DESCRIPTIONS)) {
      const book = await booksCollection.findOne({ isbn });

      if (!book) {
        console.log(`⚠️  Book not found: ISBN ${isbn}`);
        notFoundCount++;
        continue;
      }

      if (book.description) {
        console.log(`⏭️  Skipping "${book.title}" - already has description`);
        skippedCount++;
        continue;
      }

      await booksCollection.updateOne(
        { isbn },
        {
          $set: {
            description,
            updatedAt: new Date(),
          },
        }
      );

      console.log(`✅ Added description to "${book.title}"`);
      updatedCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updatedCount} books`);
    console.log(`   Skipped: ${skippedCount} books (already had descriptions)`);
    console.log(`   Not Found: ${notFoundCount} books`);
    console.log(`   Total Processed: ${Object.keys(BOOK_DESCRIPTIONS).length} descriptions`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
addDescriptions();
