"use client"

import { useState, useEffect } from "react";
import { Search } from "@/components/icons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ThumbsUp, ThumbsDown, Mail } from "lucide-react";

export default function FAQContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");
  const [faqData, setFaqData] = useState({});
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  const categories = [
    { id: "general", label: "General Overview" },
    { id: "student", label: "Student / User" },
    { id: "admin", label: "Librarian / Admin" },
    { id: "ai", label: "AI & Behavior" },
    { id: "support", label: "Troubleshooting" },
    { id: "hours", label: "Hours & Facilities" },
    { id: "facilities", label: "Facilities" },
    { id: "borrowing", label: "Borrowing & Returns" },
    { id: "policies", label: "Library Policies" },
  ];

  useEffect(() => {
    async function fetchFAQs() {
      try {
        const response = await fetch("/api/faq");
        const data = await response.json();
        
        if (data.success) {
          // Group FAQs by category
          const grouped = data.faqs.reduce((acc, faq) => {
            if (!acc[faq.category]) {
              acc[faq.category] = [];
            }
            acc[faq.category].push(faq);
            return acc;
          }, {});
          setFaqData(grouped);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFAQs();
  }, []);

  const filteredFAQs = (faqData[activeCategory] || []).filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFeedback = async (faqId, feedbackType) => {
    try {
      const response = await fetch("/api/faq/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faqId,
          feedback: feedbackType
        })
      });

      const data = await response.json();

      if (data.success) {
        // Mark this FAQ as having feedback given
        setFeedbackGiven(prev => ({
          ...prev,
          [faqId]: feedbackType
        }));
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return (
    <main className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-semibold text-zinc-800 mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-zinc-500">
          Find answers to common questions about our library services
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Type to filter FAQs instantly..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-4 py-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-8 bg-zinc-50 rounded-xl p-1.5 flex flex-wrap gap-1.5">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeCategory === category.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-8">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading FAQs...</div>
        ) : filteredFAQs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No FAQs found matching your search.</div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {filteredFAQs.map((faq, index) => (
              <AccordionItem key={faq._id || index} value={`item-${index}`} className="px-6">
                <AccordionTrigger className="text-zinc-800 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-600">
                  {faq.answer}
                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="text-zinc-500">Was this helpful?</span>
                    {feedbackGiven[faq._id] ? (
                      <span className="text-zinc-600 font-medium">
                        Thanks for your feedback!
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleFeedback(faq._id, "helpful")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Helpful</span>
                        </button>
                        <button
                          onClick={() => handleFeedback(faq._id, "not-helpful")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>Not Helpful</span>
                        </button>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Contact Us Section */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-zinc-100 p-3">
            <Mail className="h-6 w-6 text-zinc-700" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-zinc-800 mb-2">
          Still have questions?
        </h2>
        <p className="text-zinc-600 mb-4">
          Can&apos;t find the answer you&apos;re looking for? Feel free to reach out to us.
        </p>
        <a
          href="mailto:libraaismartlibraryassistant@gmail.com"
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Contact Us
        </a>
        <p className="text-sm text-zinc-500 mt-3">
          libraaismartlibraryassistant@gmail.com
        </p>
      </div>
    </main>
  );
}
