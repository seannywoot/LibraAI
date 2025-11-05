import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

// Canonical author data with bios
const SEED_AUTHORS = [
  { name: "Harper Lee", bio: "American novelist best known for 'To Kill a Mockingbird' (1960), which won the Pulitzer Prize and became a classic of modern American literature." },
  { name: "George Orwell", bio: "English novelist, essayist, and critic famous for his dystopian novels '1984' and 'Animal Farm', known for his lucid prose and social commentary." },
  { name: "Jane Austen", bio: "English novelist known for her six major novels including 'Pride and Prejudice', which critique the British landed gentry at the end of the 18th century." },
  { name: "F. Scott Fitzgerald", bio: "American novelist and short story writer, widely regarded as one of the greatest American writers of the 20th century, best known for 'The Great Gatsby'." },
  { name: "J.D. Salinger", bio: "American writer known for his 1951 novel 'The Catcher in the Rye', which has become an icon of teenage rebellion and angst." },
  { name: "Stephen Hawking", bio: "English theoretical physicist, cosmologist, and author who made groundbreaking contributions to our understanding of black holes and the universe." },
  { name: "Richard Dawkins", bio: "British evolutionary biologist and author, known for his gene-centered view of evolution and his advocacy for atheism and scientific skepticism." },
  { name: "Carl Sagan", bio: "American astronomer, cosmologist, and science communicator, best known for his work in popularizing science and his TV series 'Cosmos'." },
  { name: "Charles Darwin", bio: "English naturalist and biologist who established that all species of life have descended over time from common ancestors through natural selection." },
  { name: "Yuval Noah Harari", bio: "Israeli historian and professor, author of the international bestseller 'Sapiens', which explores the history of humankind from the Stone Age to the modern age." },
  { name: "Robert C. Martin", bio: "American software engineer and author, also known as 'Uncle Bob', renowned for his work on software design principles and clean code practices." },
  { name: "Andrew Hunt", bio: "American programmer and author, co-author of 'The Pragmatic Programmer', known for his contributions to software development best practices." },
  { name: "Erich Gamma", bio: "Swiss computer scientist and one of the 'Gang of Four' authors of the influential book 'Design Patterns', which revolutionized object-oriented programming." },
  { name: "Thomas H. Cormen", bio: "American computer scientist and professor, co-author of 'Introduction to Algorithms', one of the most widely used textbooks in computer science." },
  { name: "Stuart Russell", bio: "British computer scientist and professor, leading researcher in artificial intelligence and co-author of the standard AI textbook 'Artificial Intelligence: A Modern Approach'." },
  { name: "Ian Goodfellow", bio: "American computer scientist and researcher, inventor of generative adversarial networks (GANs) and co-author of the deep learning textbook." },
  { name: "Jared Diamond", bio: "American geographer, historian, and author, best known for his Pulitzer Prize-winning book 'Guns, Germs, and Steel' about the fates of human societies." },
  { name: "Anne Frank", bio: "German-Dutch diarist who documented her experiences hiding during the Nazi occupation of the Netherlands in her famous diary, published posthumously." },
  { name: "Howard Zinn", bio: "American historian, playwright, and socialist activist, best known for 'A People's History of the United States', which presents American history from the perspective of common people." },
  { name: "William L. Shirer", bio: "American journalist and war correspondent, best known for 'The Rise and Fall of the Third Reich', a comprehensive history of Nazi Germany." },
  { name: "Walter Isaacson", bio: "American author and journalist, known for his biographies of prominent figures including Steve Jobs, Albert Einstein, and Leonardo da Vinci." },
  { name: "Malcolm X", bio: "American Muslim minister and human rights activist, a prominent figure during the civil rights movement who advocated for Black empowerment and Islam." },
  { name: "Nelson Mandela", bio: "South African anti-apartheid revolutionary and political leader who served as President of South Africa, Nobel Peace Prize laureate and global icon of democracy." },
  { name: "Michelle Obama", bio: "American attorney and author who served as First Lady of the United States, known for her advocacy for education, health, and military families." },
  { name: "James Clear", bio: "American author and speaker focused on habits, decision making, and continuous improvement, best known for his book 'Atomic Habits'." },
  { name: "Stephen Covey", bio: "American educator, author, and businessman, best known for 'The 7 Habits of Highly Effective People', one of the most influential business books ever written." },
  { name: "Dale Carnegie", bio: "American writer and lecturer, developer of courses in self-improvement, salesmanship, and interpersonal skills, author of 'How to Win Friends and Influence People'." },
  { name: "Daniel Kahneman", bio: "Israeli-American psychologist and economist, Nobel Prize laureate known for his work on the psychology of judgment and decision-making." },
  { name: "Eric Ries", bio: "American entrepreneur and author, creator of the Lean Startup methodology that has influenced how companies are built and new products are launched." },
  { name: "Jim Collins", bio: "American researcher, author, and business consultant, known for his books on company sustainability and growth including 'Good to Great'." },
  { name: "Peter Thiel", bio: "German-American entrepreneur, venture capitalist, and author, co-founder of PayPal and Palantir, known for his contrarian views on technology and business." },
  { name: "Clayton M. Christensen", bio: "American academic and business consultant, known for his theory of disruptive innovation and his influential book 'The Innovator's Dilemma'." },
  { name: "Tara Westover", bio: "American memoirist and historian, author of 'Educated', a memoir about growing up in a survivalist family and eventually earning a PhD from Cambridge." },
  { name: "Rebecca Skloot", bio: "American science writer, best known for 'The Immortal Life of Henrietta Lacks', which tells the story of the woman behind the HeLa cell line." },
  { name: "Steven D. Levitt", bio: "American economist known for his work in the field of crime and for co-authoring 'Freakonomics', which explores the hidden side of everything." },
  { name: "Susan Cain", bio: "American writer and lecturer, author of 'Quiet: The Power of Introverts', which argues that modern Western culture misunderstands and undervalues introverts." },
  { name: "E.H. Gombrich", bio: "Austrian-born art historian who spent most of his career in Britain, best known for 'The Story of Art', one of the most popular art books ever published." },
  { name: "John Berger", bio: "English art critic, novelist, and painter, best known for his book and BBC series 'Ways of Seeing', which challenged traditional Western cultural aesthetics." },
  { name: "Robert Henri", bio: "American painter and teacher, a leading figure of the Ashcan School of American realism, known for his influential book 'The Art Spirit'." },
  { name: "Paulo Freire", bio: "Brazilian educator and philosopher, best known for his influential work 'Pedagogy of the Oppressed', which advocates for critical pedagogy and education as liberation." },
  { name: "John Holt", bio: "American author and educator, a proponent of homeschooling and unschooling, known for his books on how children learn and educational reform." },
  { name: "Carol S. Dweck", bio: "American psychologist known for her work on mindset, particularly the distinction between fixed and growth mindsets and their impact on achievement." },
  { name: "J.K. Rowling", bio: "British author and philanthropist, best known for writing the Harry Potter fantasy series, which has become the best-selling book series in history." },
  { name: "E.B. White", bio: "American writer, author of beloved children's books including 'Charlotte's Web' and 'Stuart Little', and co-author of 'The Elements of Style'." },
  { name: "Maurice Sendak", bio: "American illustrator and writer of children's books, best known for 'Where the Wild Things Are', which revolutionized children's literature." },
  { name: "Suzanne Collins", bio: "American television writer and author, best known for 'The Hunger Games' trilogy, which became a cultural phenomenon and successful film franchise." },
  { name: "John Green", bio: "American author and YouTube content creator, known for his young adult novels including 'The Fault in Our Stars' and 'Looking for Alaska'." },
  { name: "Lois Lowry", bio: "American writer known for her children's books, particularly 'The Giver', which won the Newbery Medal and explores themes of memory and individuality." },
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
    const authors = db.collection("authors");

    // Ensure index exists
    try {
      await authors.createIndex({ nameLower: 1 }, { unique: true, sparse: true });
    } catch (err) {
      console.log("Index already exists or error creating:", err.message);
    }

    const now = new Date();
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const author of SEED_AUTHORS) {
      const nameLower = author.name.toLowerCase();
      
      // Check if author already exists by name (case-insensitive)
      const existing = await authors.findOne({ nameLower });

      if (existing) {
        // Update existing author with bio if it doesn't have one
        if (!existing.bio && author.bio) {
          await authors.updateOne(
            { nameLower },
            {
              $set: {
                bio: author.bio,
                updatedAt: now,
                updatedBy: session.user?.email || null,
              },
            }
          );
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // Insert new author
        await authors.insertOne({
          name: author.name,
          nameLower,
          bio: author.bio,
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
        message: "Authors seeded successfully",
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: SEED_AUTHORS.length,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Seed authors failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
