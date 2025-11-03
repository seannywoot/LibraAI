"use client"

import { useState } from "react";
import { Search } from "@/components/icons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("borrowing");

  const categories = [
    { id: "borrowing", label: "Borrowing" },
    { id: "hours", label: "Hours" },
    { id: "facilities", label: "Facilities" },
    { id: "policies", label: "Policies" },
  ];

  const faqData = {
    borrowing: [
      {
        question: "How many books can I borrow at once?",
        answer: "Up to 5 books for 7 days. You can renew your books up to 3 times if no one else has placed a hold on them."
      },
      {
        question: "What happens if I return a book late?",
        answer: "Late returns incur a fine of $0.25 per day per book. After 30 days, the book is considered lost and you will be charged the replacement cost plus a processing fee."
      },
      {
        question: "Can I place holds on books that are checked out?",
        answer: "Yes! You can place holds on any book that is currently checked out. You'll receive an email notification when the book becomes available for pickup."
      },
      {
        question: "How do I renew my library card?",
        answer: "Library cards are valid for one year. You can renew your card online through your profile page or visit the circulation desk with a valid ID."
      },
    ],
    hours: [
      {
        question: "What are the library's operating hours?",
        answer: "Monday-Friday: 8:00 AM - 10:00 PM, Saturday: 10:00 AM - 6:00 PM, Sunday: 12:00 PM - 8:00 PM. Hours may vary during holidays and exam periods."
      },
      {
        question: "Is the library open during holidays?",
        answer: "The library has reduced hours during major holidays. Please check our website or contact us for specific holiday schedules."
      },
    ],
    facilities: [
      {
        question: "Are there printing services available?",
        answer: "Yes, we offer black & white printing at $0.10 per page and color printing at $0.50 per page. You can print from library computers or send documents to our print queue."
      },
      {
        question: "Can I access digital resources from home?",
        answer: "Absolutely! All students can access our digital collection, including e-books, journals, and databases from anywhere using their library credentials."
      },
      {
        question: "Is there WiFi available in the library?",
        answer: "Yes, free high-speed WiFi is available throughout the library. Connect to the 'LibraryWiFi' network using your student credentials."
      },
    ],
    policies: [
      {
        question: "What is the food and drink policy?",
        answer: "Covered beverages are allowed in all areas. Food is permitted in designated areas only. Please help us keep the library clean for everyone."
      },
      {
        question: "Can I reserve study rooms?",
        answer: "Yes, study rooms can be reserved up to 7 days in advance through our online booking system. Reservations are limited to 2 hours per day."
      },
    ],
  };

  const filteredFAQs = faqData[activeCategory].filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="mb-8 flex gap-2 border-b border-zinc-200">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeCategory === category.id
                ? "text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {category.label}
            {activeCategory === category.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
            )}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-8">
        <Accordion type="single" collapsible className="w-full">
          {filteredFAQs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="px-6">
              <AccordionTrigger className="text-zinc-800 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600">
                {faq.answer}
                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                  <span>Was this helpful?</span>
                  <button className="flex items-center gap-1 hover:text-zinc-700 transition-colors">
                    <span>👍</span>
                    <span>Helpful</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-zinc-700 transition-colors">
                    <span>👎</span>
                    <span>Not Helpful</span>
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Contact Section */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-zinc-800 mb-2">
          Can&apos;t find what you&apos;re looking for?
        </h2>
        <p className="text-zinc-600 mb-6">
          Our librarians are here to help you with any questions
        </p>
        <div className="flex items-center justify-center gap-4">
          <button className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800">
            <span>✉️</span>
            <span>Email Us</span>
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
            <span>📞</span>
            <span>Call Us</span>
          </button>
        </div>
      </div>
    </main>
  );
}
