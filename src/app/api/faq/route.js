import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const db = await getDb();
    const faqCollection = db.collection("faqs");

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const includeInactive = searchParams.get("includeInactive") === "true";

    let query = includeInactive ? {} : { isActive: true };

    if (category) {
      query.category = category;
    }

    let faqs;
    if (search) {
      // Regex search across question, answer, and keywords
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { question: searchRegex },
        { answer: searchRegex },
        { keywords: searchRegex },
      ];
      faqs = await faqCollection
        .find(query)
        .sort({ category: 1, createdAt: 1 })
        .toArray();
    } else {
      faqs = await faqCollection
        .find(query)
        .sort({ category: 1, createdAt: 1 })
        .toArray();
    }

    // Convert ObjectId to string for client-side usage
    const faqsWithStringId = faqs.map(faq => ({
      ...faq,
      _id: faq._id.toString()
    }));

    return NextResponse.json({ success: true, faqs: faqsWithStringId });
  } catch (error) {
    console.error("FAQ fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const db = await getDb();
    const faqCollection = db.collection("faqs");

    const { question, answer, category, keywords } = await request.json();

    if (!question || !answer || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const faq = {
      question,
      answer,
      category,
      keywords: keywords || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await faqCollection.insertOne(faq);
    faq._id = result.insertedId;

    return NextResponse.json({ success: true, faq }, { status: 201 });
  } catch (error) {
    console.error("FAQ creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}
