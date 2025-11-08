import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

const SEED_BOOKS = [
  // Fiction
  { title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960, shelf: "A1", isbn: "9780061120084", publisher: "Harper Perennial", format: "Physical Book", category: "Fiction", status: "available", loanPolicy: "standard", description: "A gripping tale of racial injustice and childhood innocence in the American South. Through the eyes of young Scout Finch, witness her father Atticus defend a Black man falsely accused of rape. A timeless exploration of morality, prejudice, and courage." },
  { title: "1984", author: "George Orwell", year: 1949, shelf: "A1", isbn: "9780451524935", publisher: "Signet Classic", format: "Physical Book", category: "Fiction", status: "available", loanPolicy: "standard", description: "A dystopian masterpiece depicting a totalitarian future where Big Brother watches everything. Winston Smith struggles against oppressive surveillance, thought control, and the manipulation of truth. A chilling warning about authoritarianism and loss of freedom." },
  { title: "Pride and Prejudice", author: "Jane Austen", year: 1813, shelf: "A2", isbn: "9780141439518", publisher: "Penguin Classics", format: "Physical Book", category: "Fiction", status: "available", loanPolicy: "standard", description: "A witty romantic novel following Elizabeth Bennet as she navigates love, class, and social expectations in Regency England. Misunderstandings and pride complicate her relationship with the wealthy Mr. Darcy in this beloved classic of manners and marriage." },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925, shelf: "A2", isbn: "9780743273565", publisher: "Scribner", format: "Physical Book", category: "Fiction", status: "checked-out", loanPolicy: "standard", description: "Set in the Jazz Age, this novel explores the American Dream through mysterious millionaire Jay Gatsby's obsession with Daisy Buchanan. A tale of wealth, love, and disillusionment in 1920s New York, revealing the emptiness behind glamorous facades." },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", year: 1951, shelf: "A3", isbn: "9780316769174", publisher: "Little, Brown", format: "Physical Book", category: "Fiction", status: "available", loanPolicy: "standard", description: "Holden Caulfield's rebellious journey through New York City after being expelled from prep school. A raw, honest portrayal of teenage angst, alienation, and the struggle to find authenticity in a world of phonies." },
  
  // Science
  { title: "A Brief History of Time", author: "Stephen Hawking", year: 1988, shelf: "B1", isbn: "9780553380163", publisher: "Bantam", format: "Physical Book", category: "Science", status: "available", loanPolicy: "standard", description: "Stephen Hawking makes complex cosmology accessible, exploring black holes, the Big Bang, and the nature of time. From quantum mechanics to relativity, discover the universe's deepest mysteries explained for general readers." },
  { title: "The Selfish Gene", author: "Richard Dawkins", year: 1976, shelf: "B1", isbn: "9780198788607", publisher: "Oxford University Press", format: "Physical Book", category: "Science", status: "available", loanPolicy: "standard", description: "Revolutionary perspective on evolution focusing on genes as the primary unit of selection. Dawkins argues that organisms are vehicles for genes seeking to replicate themselves, fundamentally changing how we understand natural selection and behavior." },
  { title: "Cosmos", author: "Carl Sagan", year: 1980, shelf: "B2", isbn: "9780345539434", publisher: "Ballantine Books", format: "Physical Book", category: "Science", status: "available", loanPolicy: "standard", description: "Carl Sagan's poetic journey through space and time, exploring the universe's wonders and humanity's place within it. Combines astronomy, biology, and philosophy to inspire wonder about the cosmos and our cosmic connections." },
  { title: "The Origin of Species", author: "Charles Darwin", year: 1859, shelf: "B2", isbn: "9780451529060", publisher: "Signet Classic", format: "Physical Book", category: "Science", status: "reserved", loanPolicy: "reference-only", description: "Darwin's groundbreaking work introducing natural selection as the mechanism of evolution. Presents evidence from nature showing how species adapt and change over time, revolutionizing biology and our understanding of life on Earth." },
  { title: "Sapiens", author: "Yuval Noah Harari", year: 2011, shelf: "B3", isbn: "9780062316097", publisher: "Harper", format: "Physical Book", category: "Science", status: "available", loanPolicy: "standard", description: "A sweeping history of humankind from the Stone Age to the modern era. Harari explores how Homo sapiens came to dominate Earth through cognitive, agricultural, and scientific revolutions, questioning what makes us human." },
  
  // Technology
  { title: "Clean Code", author: "Robert C. Martin", year: 2008, shelf: "C1", isbn: "9780132350884", publisher: "Prentice Hall", format: "Physical Book", category: "Technology", status: "available", loanPolicy: "standard", description: "Essential guide to writing clean, maintainable code that other developers can understand. Martin shares principles, patterns, and practices for crafting professional software, from naming conventions to error handling and testing." },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", year: 1999, shelf: "C1", isbn: "9780201616224", publisher: "Addison-Wesley", format: "Physical Book", category: "Technology", status: "available", loanPolicy: "standard", description: "Timeless wisdom for software developers covering everything from career development to technical practices. Hunt and Thomas share pragmatic approaches to becoming a better programmer through continuous learning and adaptation." },
  { title: "Design Patterns", author: "Erich Gamma", year: 1994, shelf: "C2", isbn: "9780201633610", publisher: "Addison-Wesley", format: "Physical Book", category: "Technology", status: "available", loanPolicy: "standard", description: "The definitive guide to object-oriented design patterns. Gamma and colleagues document 23 classic patterns that solve common software design problems, providing a shared vocabulary for developers worldwide." },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", year: 2009, shelf: "C2", isbn: "9780262033848", publisher: "MIT Press", format: "Physical Book", category: "Technology", status: "checked-out", loanPolicy: "standard", description: "Comprehensive textbook covering fundamental algorithms and data structures. From sorting and searching to graph algorithms and dynamic programming, this rigorous text is essential for computer science students and professionals." },
  { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", year: 2020, shelf: "C3", isbn: "9780134610993", publisher: "Pearson", format: "Physical Book", category: "Technology", status: "available", loanPolicy: "standard", description: "The leading textbook on artificial intelligence, covering everything from search algorithms to machine learning and neural networks. Russell and Norvig provide both theoretical foundations and practical applications of AI." },
  { title: "Deep Learning", author: "Ian Goodfellow", year: 2016, shelf: null, isbn: "9780262035613", publisher: "MIT Press", format: "eBook", category: "Technology", status: "available", loanPolicy: null, ebookUrl: "https://www.deeplearningbook.org/", description: "Comprehensive introduction to deep learning covering neural networks, convolutional networks, recurrent networks, and more. Goodfellow and colleagues explain both the mathematics and practical implementation of modern deep learning techniques." },
  
  // History
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", year: 1997, shelf: "D1", isbn: "9780393317558", publisher: "W. W. Norton", format: "Physical Book", category: "History", status: "available", loanPolicy: "standard", description: "Jared Diamond explores why some civilizations succeeded while others failed, examining the role of geography, agriculture, and technology. A sweeping analysis of human history showing how environmental factors shaped societies." },
  { title: "The Diary of a Young Girl", author: "Anne Frank", year: 1947, shelf: "D1", isbn: "9780553296983", publisher: "Bantam", format: "Physical Book", category: "History", status: "available", loanPolicy: "standard", description: "Anne Frank's intimate diary documenting her family's two years hiding from the Nazis in Amsterdam. A powerful, personal account of hope, fear, and humanity during the Holocaust, written by a young girl with remarkable insight." },
  { title: "A People's History of the United States", author: "Howard Zinn", year: 1980, shelf: "D2", isbn: "9780062397348", publisher: "Harper Perennial", format: "Physical Book", category: "History", status: "available", loanPolicy: "standard", description: "Howard Zinn retells American history from the perspective of marginalized groups: workers, women, Native Americans, and African Americans. Challenges traditional narratives by highlighting voices often excluded from mainstream history." },
  { title: "The Rise and Fall of the Third Reich", author: "William L. Shirer", year: 1960, shelf: "D2", isbn: "9781451651683", publisher: "Simon & Schuster", format: "Physical Book", category: "History", status: "available", loanPolicy: "standard", description: "Comprehensive history of Nazi Germany from Hitler's rise to power through World War II and the regime's collapse. Shirer, who witnessed events firsthand, provides detailed analysis of the Third Reich's ideology and atrocities." },
  
  // Biography
  { title: "Steve Jobs", author: "Walter Isaacson", year: 2011, shelf: "E1", isbn: "9781451648539", publisher: "Simon & Schuster", format: "Physical Book", category: "Biography", status: "available", loanPolicy: "standard", description: "Walter Isaacson's authorized biography of Apple co-founder Steve Jobs, based on extensive interviews. Chronicles Jobs' perfectionism, innovation, and complex personality, revealing the man behind revolutionary products like the iPhone and Mac." },
  { title: "The Autobiography of Malcolm X", author: "Malcolm X", year: 1965, shelf: "E1", isbn: "9780345350688", publisher: "Ballantine Books", format: "Physical Book", category: "Biography", status: "available", loanPolicy: "standard", description: "Malcolm X's powerful autobiography, written with Alex Haley, traces his transformation from street hustler to Nation of Islam minister to human rights activist. A profound exploration of race, identity, and social justice in America." },
  { title: "Long Walk to Freedom", author: "Nelson Mandela", year: 1994, shelf: "E2", isbn: "9780316548182", publisher: "Little, Brown", format: "Physical Book", category: "Biography", status: "available", loanPolicy: "standard", description: "Nelson Mandela's inspiring memoir of his journey from rural childhood to anti-apartheid activist to South Africa's first Black president. A testament to resilience, forgiveness, and the power of fighting for justice." },
  { title: "Becoming", author: "Michelle Obama", year: 2018, shelf: "E2", isbn: "9781524763138", publisher: "Crown", format: "Physical Book", category: "Biography", status: "checked-out", loanPolicy: "standard", description: "Michelle Obama's intimate memoir sharing her experiences from Chicago's South Side to the White House. Reflects on motherhood, marriage, public service, and finding her voice as First Lady of the United States." },
  
  // Self-Help
  { title: "Atomic Habits", author: "James Clear", year: 2018, shelf: "F1", isbn: "9780735211292", publisher: "Avery", format: "Physical Book", category: "Self-Help", status: "available", loanPolicy: "standard", description: "James Clear presents a proven framework for building good habits and breaking bad ones. Learn how tiny changes compound into remarkable results through the four laws of behavior change. Practical strategies backed by science for lasting personal transformation." },
  { title: "The 7 Habits of Highly Effective People", author: "Stephen Covey", year: 1989, shelf: "F1", isbn: "9781982137274", publisher: "Simon & Schuster", format: "Physical Book", category: "Self-Help", status: "available", loanPolicy: "standard", description: "Stephen Covey's influential guide to personal and professional effectiveness. The seven habits provide a principle-centered approach to solving problems, building relationships, and achieving goals through character development and proactive living." },
  { title: "How to Win Friends and Influence People", author: "Dale Carnegie", year: 1936, shelf: "F2", isbn: "9780671027032", publisher: "Pocket Books", format: "Physical Book", category: "Self-Help", status: "available", loanPolicy: "standard", description: "Dale Carnegie's timeless classic on interpersonal skills and influence. Learn fundamental techniques for handling people, winning friends, and persuading others through genuine interest, appreciation, and understanding human nature." },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", year: 2011, shelf: "F2", isbn: "9780374533557", publisher: "Farrar, Straus and Giroux", format: "Physical Book", category: "Self-Help", status: "available", loanPolicy: "standard", description: "Nobel laureate Daniel Kahneman explains the two systems that drive thinking: fast, intuitive System 1 and slow, deliberate System 2. Reveals cognitive biases affecting decisions and offers insights into judgment, choice, and rationality." },
  
  // Business
  { title: "The Lean Startup", author: "Eric Ries", year: 2011, shelf: "G1", isbn: "9780307887894", publisher: "Crown Business", format: "Physical Book", category: "Business", status: "available", loanPolicy: "standard", description: "Eric Ries introduces the lean startup methodology for building successful businesses through validated learning, rapid experimentation, and iterative product releases. Essential reading for entrepreneurs navigating uncertainty." },
  { title: "Good to Great", author: "Jim Collins", year: 2001, shelf: "G1", isbn: "9780066620992", publisher: "HarperBusiness", format: "Physical Book", category: "Business", status: "available", loanPolicy: "standard", description: "Jim Collins examines what makes companies transition from good to great, identifying key factors like Level 5 leadership, the Hedgehog Concept, and a culture of discipline. Data-driven insights from extensive research." },
  { title: "Zero to One", author: "Peter Thiel", year: 2014, shelf: "G2", isbn: "9780804139298", publisher: "Crown Business", format: "Physical Book", category: "Business", status: "available", loanPolicy: "standard", description: "Peter Thiel shares contrarian insights on innovation and startups. Argues that true progress comes from creating new things (zero to one) rather than copying what works (one to n). Challenges conventional business wisdom." },
  { title: "The Innovator's Dilemma", author: "Clayton M. Christensen", year: 1997, shelf: "G2", isbn: "9781633691780", publisher: "Harvard Business Review Press", format: "Physical Book", category: "Business", status: "reserved", loanPolicy: "standard", description: "Clayton Christensen explains why successful companies fail when faced with disruptive innovations. Shows how established firms can be blindsided by new technologies and business models that initially serve niche markets." },
  
  // Non-Fiction
  { title: "Educated", author: "Tara Westover", year: 2018, shelf: "H1", isbn: "9780399590504", publisher: "Random House", format: "Physical Book", category: "Non-Fiction", status: "available", loanPolicy: "standard", description: "Tara Westover's memoir of growing up in a survivalist family in rural Idaho without formal education, then earning a PhD from Cambridge. A powerful story of self-invention, education's transformative power, and family loyalty." },
  { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", year: 2010, shelf: "H1", isbn: "9781400052189", publisher: "Broadway Books", format: "Physical Book", category: "Non-Fiction", status: "available", loanPolicy: "standard", description: "Rebecca Skloot tells the story of Henrietta Lacks, whose cancer cells were taken without consent and became one of medicine's most important tools. Explores medical ethics, race, and the human story behind HeLa cells." },
  { title: "Freakonomics", author: "Steven D. Levitt", year: 2005, shelf: "H2", isbn: "9780060731328", publisher: "William Morrow", format: "Physical Book", category: "Non-Fiction", status: "available", loanPolicy: "standard", description: "Steven Levitt and Stephen Dubner use economic thinking to explore hidden sides of everything from cheating teachers to drug dealers' finances. Reveals surprising connections and challenges conventional wisdom with data." },
  { title: "Quiet: The Power of Introverts", author: "Susan Cain", year: 2012, shelf: "H2", isbn: "9780307352156", publisher: "Crown", format: "Physical Book", category: "Non-Fiction", status: "available", loanPolicy: "standard", description: "Susan Cain champions introverts in a world that values extroversion. Explores how society undervalues quiet temperaments and shows how introverts bring extraordinary talents and abilities to the world." },
  
  // Arts
  { title: "The Story of Art", author: "E.H. Gombrich", year: 1950, shelf: "I1", isbn: "9780714832470", publisher: "Phaidon Press", format: "Physical Book", category: "Arts", status: "available", loanPolicy: "standard", description: "E.H. Gombrich's accessible introduction to art history, from cave paintings to modern art. Explains artistic movements, techniques, and cultural contexts, making art appreciation approachable for all readers." },
  { title: "Ways of Seeing", author: "John Berger", year: 1972, shelf: "I1", isbn: "9780140135152", publisher: "Penguin Books", format: "Physical Book", category: "Arts", status: "available", loanPolicy: "reference-only", description: "John Berger's influential essays on visual culture and how we see art. Challenges traditional art criticism by examining how reproduction, advertising, and social context shape our perception of images." },
  { title: "The Art Spirit", author: "Robert Henri", year: 1923, shelf: "I2", isbn: "9780465002634", publisher: "Basic Books", format: "Physical Book", category: "Arts", status: "available", loanPolicy: "standard", description: "Robert Henri's inspiring philosophy on art and life, compiled from his teachings. Encourages artists to find their unique voice, observe life deeply, and create work that expresses genuine feeling and truth." },
  
  // Education
  { title: "Pedagogy of the Oppressed", author: "Paulo Freire", year: 1970, shelf: "J1", isbn: "9780826412768", publisher: "Continuum", format: "Physical Book", category: "Education", status: "available", loanPolicy: "standard", description: "Paulo Freire's revolutionary pedagogy advocating for education as liberation rather than oppression. Critiques the banking model of education and proposes dialogue-based learning that empowers students as co-creators of knowledge." },
  { title: "How Children Learn", author: "John Holt", year: 1967, shelf: "J1", isbn: "9780201484045", publisher: "Da Capo Press", format: "Physical Book", category: "Education", status: "available", loanPolicy: "standard", description: "John Holt's observations on how children naturally learn through curiosity and play. Challenges traditional schooling methods and advocates for respecting children's innate intelligence and learning processes." },
  { title: "Mindset: The New Psychology of Success", author: "Carol S. Dweck", year: 2006, shelf: "J2", isbn: "9780345472328", publisher: "Ballantine Books", format: "Physical Book", category: "Education", status: "available", loanPolicy: "standard", description: "Carol Dweck's research on fixed versus growth mindsets and their impact on achievement. Shows how believing abilities can be developed leads to greater success than believing talents are innate and unchangeable." },
  
  // Children
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", year: 1997, shelf: "K1", isbn: "9780590353427", publisher: "Scholastic", format: "Physical Book", category: "Children", status: "available", loanPolicy: "standard", description: "Harry Potter discovers he's a wizard and begins attending Hogwarts School of Witchcraft and Wizardry. The first book in J.K. Rowling's beloved series about friendship, courage, and the battle between good and evil." },
  { title: "Charlotte's Web", author: "E.B. White", year: 1952, shelf: "K1", isbn: "9780064400558", publisher: "Harper Collins", format: "Physical Book", category: "Children", status: "available", loanPolicy: "standard", description: "E.B. White's classic tale of friendship between Wilbur the pig and Charlotte the spider. Charlotte uses her web-spinning abilities to save Wilbur from slaughter in this touching story about loyalty and sacrifice." },
  { title: "Where the Wild Things Are", author: "Maurice Sendak", year: 1963, shelf: "K2", isbn: "9780060254926", publisher: "Harper Collins", format: "Physical Book", category: "Children", status: "available", loanPolicy: "standard", description: "Maurice Sendak's imaginative picture book about Max, who sails to an island of wild things after being sent to bed without supper. A beloved exploration of childhood emotions, imagination, and the comfort of home." },
  
  // Young Adult
  { title: "The Hunger Games", author: "Suzanne Collins", year: 2008, shelf: "L1", isbn: "9780439023481", publisher: "Scholastic", format: "Physical Book", category: "Young Adult", status: "available", loanPolicy: "standard", description: "In a dystopian future, Katniss Everdeen volunteers for the Hunger Games, a televised fight to the death. Suzanne Collins' thrilling tale of survival, rebellion, and the cost of war captivates readers with action and social commentary." },
  { title: "The Fault in Our Stars", author: "John Green", year: 2012, shelf: "L1", isbn: "9780525478812", publisher: "Dutton Books", format: "Physical Book", category: "Young Adult", status: "checked-out", loanPolicy: "standard", description: "John Green's poignant love story between two teenagers with cancer who meet at a support group. Hazel and Augustus navigate life, death, and the search for meaning in this emotional, funny, and deeply moving novel." },
  { title: "The Giver", author: "Lois Lowry", year: 1993, shelf: "L2", isbn: "9780544336261", publisher: "Houghton Mifflin", format: "Physical Book", category: "Young Adult", status: "available", loanPolicy: "standard", description: "Lois Lowry's dystopian novel about Jonas, who lives in a seemingly perfect society without pain, war, or suffering. When chosen as the Receiver of Memory, he discovers the dark truth behind his community's harmony." },
];

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    if (session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");
    const shelves = db.collection("shelves");

    const now = new Date();
    let insertedCount = 0;
    let updatedCount = 0;
    let shelvesCreated = 0;

    // First, ensure all shelves exist (filter out null/undefined shelf codes)
    const uniqueShelves = [...new Set(SEED_BOOKS.map(b => b.shelf).filter(s => s && s.trim()))];
    
    // Define shelf locations for better organization
    const shelfLocations = {
      A1: "Main Floor - Fiction Section", A2: "Main Floor - Fiction Section", A3: "Main Floor - Fiction Section",
      B1: "Main Floor - Science Section", B2: "Main Floor - Science Section", B3: "Main Floor - Science Section",
      C1: "Second Floor - Technology Section", C2: "Second Floor - Technology Section", C3: "Second Floor - Technology Section",
      D1: "Second Floor - History Section", D2: "Second Floor - History Section",
      E1: "Second Floor - Biography Section", E2: "Second Floor - Biography Section",
      F1: "Third Floor - Self-Help Section", F2: "Third Floor - Self-Help Section",
      G1: "Third Floor - Business Section", G2: "Third Floor - Business Section",
      H1: "Third Floor - Non-Fiction Section", H2: "Third Floor - Non-Fiction Section",
      I1: "Fourth Floor - Arts Section", I2: "Fourth Floor - Arts Section",
      J1: "Fourth Floor - Education Section", J2: "Fourth Floor - Education Section",
      K1: "Children's Wing - Ground Floor", K2: "Children's Wing - Ground Floor",
      L1: "Young Adult Wing - Ground Floor", L2: "Young Adult Wing - Ground Floor",
    };

    for (const shelfCode of uniqueShelves) {
      if (!shelfCode) continue; // Extra safety check
      
      const existingShelf = await shelves.findOne({ code: shelfCode });
      if (!existingShelf) {
        const shelfName = `Shelf ${shelfCode}`;
        const shelfLocation = shelfLocations[shelfCode] || "Library";
        
        await shelves.insertOne({
          code: shelfCode,
          codeLower: shelfCode.toLowerCase(),
          name: shelfName,
          nameLower: shelfName.toLowerCase(),
          location: shelfLocation,
          locationLower: shelfLocation.toLowerCase(),
          createdAt: now,
          updatedAt: now,
          createdBy: session.user?.email || null,
        });
        shelvesCreated++;
      }
    }

    // Now seed the books
    for (const book of SEED_BOOKS) {
      // Check if book already exists by ISBN
      const existing = await books.findOne({ isbn: book.isbn });

      if (existing) {
        // Update existing book
        await books.updateOne(
          { isbn: book.isbn },
          {
            $set: {
              ...book,
              updatedAt: now,
              updatedBy: session.user?.email || null,
            },
          }
        );
        updatedCount++;
      } else {
        // Insert new book
        await books.insertOne({
          ...book,
          barcode: `BC-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
          createdAt: now,
          updatedAt: now,
          createdBy: session.user?.email || null,
        });
        insertedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Books and shelves seeded successfully",
        books: {
          inserted: insertedCount,
          updated: updatedCount,
          total: SEED_BOOKS.length,
        },
        shelves: {
          created: shelvesCreated,
          total: uniqueShelves.length,
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Seed books failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
