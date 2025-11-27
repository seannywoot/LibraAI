"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import { useRouter } from "next/navigation";
import UnsavedChangesDialog from "@/components/unsaved-changes-dialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

export default function AdminAddBookPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [shelf, setShelf] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [format, setFormat] = useState("");
  const [ebookUrl, setEbookUrl] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("available");
  const [loanPolicy, setLoanPolicy] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [shelves, setShelves] = useState([]);
  const [loadingShelves, setLoadingShelves] = useState(true);
  const [authors, setAuthors] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractingMetadata, setExtractingMetadata] = useState(false);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [fetchingFromGoogle, setFetchingFromGoogle] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const { showDialog, cancelNavigation, confirmNavigation, navigateTo, handleNavigation } = useUnsavedChanges(hasUnsavedChanges);

  // Track any form field change
  const handleFieldChange = (setter) => (value) => {
    setter(value);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [shelvesRes, authorsRes] = await Promise.all([
          fetch("/api/admin/shelves?pageSize=100", { cache: "no-store" }),
          fetch("/api/admin/authors?pageSize=100", { cache: "no-store" })
        ]);

        const shelvesData = await shelvesRes.json().catch(() => ({}));
        if (shelvesRes.ok && shelvesData?.ok) {
          setShelves(shelvesData.items || []);
        }

        const authorsData = await authorsRes.json().catch(() => ({}));
        if (authorsRes.ok && authorsData?.ok) {
          setAuthors(authorsData.items || []);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoadingShelves(false);
        setLoadingAuthors(false);
      }
    }
    loadData();
  }, []);

  const ALLOWED_STATUS = ["available", "reserved"];
  const ALLOWED_POLICIES = ["standard", "short-loan", "reference-only", "staff-only"];

  // Comprehensive category list based on Google Books API
  const PREDEFINED_CATEGORIES = [
    "Fiction",
    "Non-Fiction",
    "Science",
    "Technology",
    "Mathematics",
    "Computer Science",
    "Engineering",
    "History",
    "Biography",
    "Autobiography",
    "Self-Help",
    "Business",
    "Economics",
    "Finance",
    "Arts",
    "Music",
    "Photography",
    "Education",
    "Children",
    "Young Adult",
    "Philosophy",
    "Religion",
    "Psychology",
    "Social Science",
    "Political Science",
    "Law",
    "Medical",
    "Health & Fitness",
    "Cooking",
    "Travel",
    "Nature",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Thriller",
    "Romance",
    "Horror",
    "Poetry",
    "Drama",
    "Comics",
    "Graphic Novels",
    "Reference",
    "Study Aids",
    "Language Arts",
    "Literary Criticism",
    "Architecture",
    "Design",
    "Crafts & Hobbies",
    "Sports & Recreation",
    "Games",
    "Gardening",
    "Pets",
    "Family & Relationships",
    "House & Home",
    "Transportation",
    "True Crime",
    "Humor",
  ].sort();

  // Comprehensive tag list based on common Google Books subjects
  const PREDEFINED_TAGS = [
    "Programming",
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "Artificial Intelligence",
    "Algorithms",
    "Database",
    "Networking",
    "Security",
    "Cloud Computing",
    "DevOps",
    "Software Engineering",
    "Physics",
    "Chemistry",
    "Biology",
    "Astronomy",
    "Geology",
    "Environmental Science",
    "World War I",
    "World War II",
    "Ancient History",
    "Medieval History",
    "Modern History",
    "American History",
    "European History",
    "Asian History",
    "Leadership",
    "Management",
    "Marketing",
    "Entrepreneurship",
    "Investing",
    "Personal Finance",
    "Productivity",
    "Motivation",
    "Mindfulness",
    "Mental Health",
    "Nutrition",
    "Exercise",
    "Meditation",
    "Parenting",
    "Education Theory",
    "Teaching Methods",
    "Curriculum",
    "Early Childhood",
    "Higher Education",
    "Adventure",
    "Coming of Age",
    "Dystopian",
    "Historical Fiction",
    "Literary Fiction",
    "Magical Realism",
    "Suspense",
    "Crime",
    "Detective",
    "Espionage",
    "Contemporary Romance",
    "Historical Romance",
    "Paranormal",
    "Gothic",
    "Epic Poetry",
    "Modern Poetry",
    "Classical Poetry",
    "Manga",
    "Superhero",
    "Memoir",
    "Essays",
    "Journalism",
    "Philosophy of Mind",
    "Ethics",
    "Logic",
    "Metaphysics",
    "Christianity",
    "Islam",
    "Buddhism",
    "Hinduism",
    "Judaism",
    "Spirituality",
    "Cognitive Psychology",
    "Developmental Psychology",
    "Social Psychology",
    "Clinical Psychology",
    "Sociology",
    "Anthropology",
    "Economics Theory",
    "Microeconomics",
    "Macroeconomics",
    "International Relations",
    "Public Policy",
    "Constitutional Law",
    "Criminal Law",
    "Civil Law",
    "Anatomy",
    "Physiology",
    "Pharmacology",
    "Surgery",
    "Pediatrics",
    "Psychiatry",
    "Painting",
    "Sculpture",
    "Drawing",
    "Digital Art",
    "Classical Music",
    "Jazz",
    "Rock Music",
    "Pop Music",
    "World Music",
    "Portrait Photography",
    "Landscape Photography",
    "Street Photography",
    "Baking",
    "International Cuisine",
    "Vegetarian",
    "Vegan",
    "Quick & Easy",
    "Europe Travel",
    "Asia Travel",
    "America Travel",
    "Adventure Travel",
    "Wildlife",
    "Ecology",
    "Conservation",
    "Botany",
    "Zoology",
    "Space Opera",
    "Cyberpunk",
    "Time Travel",
    "Urban Fantasy",
    "High Fantasy",
    "Cozy Mystery",
    "Legal Thriller",
    "Medical Thriller",
    "Psychological Thriller",
    "Dictionary",
    "Encyclopedia",
    "Handbook",
    "Guide",
    "Textbook",
    "Workbook",
    "Test Preparation",
    "Grammar",
    "Vocabulary",
    "Writing",
    "Reading",
    "Speaking",
    "Listening",
    "English Language",
    "Spanish Language",
    "French Language",
    "German Language",
    "Chinese Language",
    "Japanese Language",
    "Interior Design",
    "Landscape Architecture",
    "Urban Planning",
    "Graphic Design",
    "Fashion Design",
    "Knitting",
    "Sewing",
    "Woodworking",
    "DIY",
    "Football",
    "Basketball",
    "Baseball",
    "Soccer",
    "Tennis",
    "Golf",
    "Running",
    "Cycling",
    "Swimming",
    "Yoga",
    "Board Games",
    "Card Games",
    "Video Games",
    "Puzzles",
    "Flowers",
    "Vegetables",
    "Organic Gardening",
    "Dogs",
    "Cats",
    "Birds",
    "Fish",
    "Marriage",
    "Divorce",
    "Dating",
    "Friendship",
    "Decorating",
    "Organizing",
    "Cleaning",
    "Automotive",
    "Aviation",
    "Railways",
    "Ships",
    "Serial Killers",
    "Organized Crime",
    "Forensics",
    "Satire",
    "Parody",
    "Stand-up Comedy",
  ].sort();

  function validateForm() {
    const e = {};
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedShelf = shelf.trim();
    const trimmedIsbn = isbn.trim();
    const trimmedPublisher = publisher.trim();
    const trimmedBarcode = barcode.trim();
    const currentYear = new Date().getFullYear();
    const OLDEST_YEAR = 1450; // Gutenberg printing press era

    // Title validation
    if (!trimmedTitle) e.title = "Title is required";

    // Author validation - must not contain numbers or excessive symbols
    if (!trimmedAuthor) {
      e.author = "Author is required";
    } else if (/\d/.test(trimmedAuthor)) {
      e.author = "Author name cannot contain numbers";
    } else if (/[^a-zA-Z\s\-'.&,]/.test(trimmedAuthor)) {
      e.author = "Author name contains invalid characters";
    }

    // Year validation - must be numeric and within valid range
    if (year === "") {
      e.year = "Year is required";
    } else if (!/^\d+$/.test(year)) {
      e.year = "Year must be numeric only";
    } else {
      const yearNum = Number(year);
      if (yearNum < OLDEST_YEAR || yearNum > currentYear) {
        e.year = `Year must be between ${OLDEST_YEAR} and ${currentYear}`;
      }
    }

    // ISBN validation - either empty or exactly 13 digits
    if (trimmedIsbn !== "") {
      if (!/^\d{13}$/.test(trimmedIsbn)) {
        e.isbn = "ISBN must be either empty or exactly 13 digits";
      }
    }

    // Publisher validation - optional, but if provided must not be just numbers
    if (trimmedPublisher !== "" && /^\d+$/.test(trimmedPublisher)) {
      e.publisher = "Publisher cannot be only numbers";
    }

    // Barcode validation - optional, but if provided must have value
    if (trimmedBarcode !== "" && trimmedBarcode.length < 3) {
      e.barcode = "Item ID must be at least 3 characters if provided";
    }

    // Format validation - required for book data integrity
    if (!format) {
      e.format = "Book format/type is required";
    }

    // Category validation - at least one category required
    if (!categories || categories.length === 0) {
      e.categories = "At least one category is required";
    }

    // Shelf is only required for non-eBook formats
    if (format !== "eBook" && !trimmedShelf) {
      e.shelf = "Shelf is required";
    }

    // eBook file is required for eBook format
    if (format === "eBook" && !ebookUrl) {
      e.format = "Please upload a PDF file for eBook format";
    }

    if (!ALLOWED_STATUS.includes(status)) e.status = "Invalid status";
    if (!ALLOWED_POLICIES.includes(loanPolicy)) e.loanPolicy = "Invalid loan policy";

    setErrors(e);
    return { valid: Object.keys(e).length === 0, firstKey: Object.keys(e)[0] };
  }

  function fieldError(name) {
    return errors?.[name] ? (
      <p className="text-xs text-rose-600" role="alert">{errors[name]}</p>
    ) : null;
  }

  const navigationLinks = getAdminLinks();

  async function handleFetchFromGoogleBooks() {
    // Get current values from the form inputs directly
    const currentIsbn = isbn.trim();
    const currentTitle = title.trim();

    if (!currentIsbn && !currentTitle) {
      showToast("Please enter ISBN or Title to fetch book details", "error");
      return;
    }

    setFetchingFromGoogle(true);
    try {
      // Build search query - prefer ISBN for accuracy
      const searchQuery = currentIsbn
        ? `isbn:${currentIsbn}`
        : encodeURIComponent(currentTitle);

      console.log('Fetching from Google Books with query:', searchQuery);

      const googleRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=1`,
        {
          cache: 'no-store', // Prevent caching
          headers: {
            'Cache-Control': 'no-cache',
          }
        }
      );
      const googleData = await googleRes.json();

      if (!googleData.items || googleData.items.length === 0) {
        showToast("No book found on Google Books. Try a different ISBN or title.", "info");
        return;
      }

      const volumeInfo = googleData.items[0].volumeInfo;

      // Extract and process categories from Google Books
      let googleCategories = [];
      if (volumeInfo.categories && Array.isArray(volumeInfo.categories)) {
        googleCategories = volumeInfo.categories.flatMap(cat =>
          cat.split('/').map(c => c.trim())
        ).filter(c => c.length > 0);
        googleCategories = [...new Set(googleCategories)];
      }

      // Auto-fill form fields (always overwrite with fetched data)
      if (volumeInfo.title) {
        setTitle(volumeInfo.title);
        setHasUnsavedChanges(true);
      }
      if (volumeInfo.authors?.[0]) {
        setAuthor(volumeInfo.authors[0]);
        setHasUnsavedChanges(true);
      }
      if (volumeInfo.publishedDate) {
        const extractedYear = volumeInfo.publishedDate.substring(0, 4);
        setYear(extractedYear);
        setHasUnsavedChanges(true);
      }
      if (volumeInfo.publisher) {
        setPublisher(volumeInfo.publisher);
        setHasUnsavedChanges(true);
      }
      if (volumeInfo.industryIdentifiers?.[0]?.identifier) {
        const extractedIsbn = volumeInfo.industryIdentifiers[0].identifier.replace(/[^\d]/g, "");
        if (extractedIsbn.length === 13) {
          setIsbn(extractedIsbn);
          setHasUnsavedChanges(true);
        }
      }
      if (volumeInfo.description) {
        setDescription(volumeInfo.description);
        setHasUnsavedChanges(true);
      }

      // Map Google Books categories to our categories (always update if found)
      if (googleCategories.length > 0) {
        const mappedCategories = [];
        const extractedTags = [];

        for (const cat of googleCategories) {
          // Check if it matches our predefined categories
          const matchedCategory = PREDEFINED_CATEGORIES.find(
            predef => cat.toLowerCase().includes(predef.toLowerCase()) ||
              predef.toLowerCase().includes(cat.toLowerCase())
          );

          if (matchedCategory && !mappedCategories.includes(matchedCategory)) {
            mappedCategories.push(matchedCategory);
          }

          // Also add as potential tag if it's more specific
          if (cat.length > 3 && !extractedTags.includes(cat)) {
            extractedTags.push(cat);
          }
        }

        // Set categories (always overwrite when fetching from Google)
        if (mappedCategories.length > 0) {
          setCategories(mappedCategories);
          setHasUnsavedChanges(true);
        } else {
          // Default to Non-Fiction if no match
          setCategories(['Non-Fiction']);
          setHasUnsavedChanges(true);
        }

        // Set tags from Google Books categories
        if (extractedTags.length > 0) {
          setTags(extractedTags.slice(0, 10)); // Limit to 10 tags
          setHasUnsavedChanges(true);
        }
      }

      // Store cover image URL
      if (volumeInfo.imageLinks?.thumbnail) {
        setCoverImage(volumeInfo.imageLinks.thumbnail);
      }

      showToast("Book details fetched from Google Books!", "success");
    } catch (err) {
      console.error("Failed to fetch from Google Books:", err);
      showToast("Failed to fetch book details from Google Books", "error");
    } finally {
      setFetchingFromGoogle(false);
    }
  }

  async function handlePDFUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setExtractingMetadata(true);

    try {
      // First, upload the PDF file
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadRes = await fetch("/api/admin/books/upload-pdf", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok || !uploadData?.ok) {
        throw new Error(uploadData?.error || "Failed to upload PDF");
      }

      // Store the PDF ID as the ebookUrl
      setEbookUrl(uploadData.pdfId);

      // Then extract metadata
      const metadataFormData = new FormData();
      metadataFormData.append("file", file);

      const metadataRes = await fetch("/api/admin/books/extract-pdf-metadata", {
        method: "POST",
        body: metadataFormData,
      });

      const metadataData = await metadataRes.json().catch(() => ({}));

      let extractedTitle = "";

      if (metadataRes.ok && metadataData?.ok && metadataData?.metadata) {
        const { metadata } = metadataData;

        // Fill form fields with extracted metadata (only if fields are empty)
        if (metadata.title && !title) {
          setTitle(metadata.title);
          extractedTitle = metadata.title;
          setHasUnsavedChanges(true);
        }
        if (metadata.author && !author) {
          setAuthor(metadata.author);
          setHasUnsavedChanges(true);
        }
        if (metadata.year && !year) {
          setYear(metadata.year.toString());
          setHasUnsavedChanges(true);
        }
        if (metadata.publisher && !publisher) {
          setPublisher(metadata.publisher);
          setHasUnsavedChanges(true);
        }
      } else {
        // If no metadata extracted, use filename as title
        extractedTitle = file.name.replace(/\.pdf$/i, "").replace(/_/g, " ");
        if (!title) {
          setTitle(extractedTitle);
          setHasUnsavedChanges(true);
        }
      }

      // Try to enrich metadata from Google Books API using title search
      if (extractedTitle) {
        try {
          console.log(`Searching Google Books for: "${extractedTitle}"`);
          const googleRes = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(extractedTitle)}&maxResults=1`
          );
          const googleData = await googleRes.json();

          if (googleData.items && googleData.items.length > 0) {
            const volumeInfo = googleData.items[0].volumeInfo;

            // Extract and process categories from Google Books
            let googleCategories = [];
            if (volumeInfo.categories && Array.isArray(volumeInfo.categories)) {
              googleCategories = volumeInfo.categories.flatMap(cat =>
                cat.split('/').map(c => c.trim())
              ).filter(c => c.length > 0);
              googleCategories = [...new Set(googleCategories)];
            }

            // Fill form fields with Google Books data (only if fields are empty)
            if (volumeInfo.title && !title) {
              setTitle(volumeInfo.title);
              setHasUnsavedChanges(true);
            }
            if (volumeInfo.authors?.[0] && !author) {
              setAuthor(volumeInfo.authors[0]);
              setHasUnsavedChanges(true);
            }
            if (volumeInfo.publishedDate && !year) {
              const extractedYear = volumeInfo.publishedDate.substring(0, 4);
              setYear(extractedYear);
              setHasUnsavedChanges(true);
            }
            if (volumeInfo.publisher && !publisher) {
              setPublisher(volumeInfo.publisher);
              setHasUnsavedChanges(true);
            }
            if (volumeInfo.industryIdentifiers?.[0]?.identifier && !isbn) {
              const extractedIsbn = volumeInfo.industryIdentifiers[0].identifier.replace(/[^\d]/g, "");
              if (extractedIsbn.length === 13) {
                setIsbn(extractedIsbn);
                setHasUnsavedChanges(true);
              }
            }
            if (volumeInfo.description && !description) {
              setDescription(volumeInfo.description);
              setHasUnsavedChanges(true);
            }

            // Map Google Books categories to our categories (only if our categories state is empty)
            if (googleCategories.length > 0 && categories.length === 0) {
              const mappedCategories = [];
              const extractedTags = [];

              for (const cat of googleCategories) {
                // Check if it matches our predefined categories
                const matchedCategory = PREDEFINED_CATEGORIES.find(
                  predef => cat.toLowerCase().includes(predef.toLowerCase()) ||
                    predef.toLowerCase().includes(cat.toLowerCase())
                );

                if (matchedCategory && !mappedCategories.includes(matchedCategory)) {
                  mappedCategories.push(matchedCategory);
                }

                // Also add as potential tag if it's more specific
                if (cat.length > 3 && !extractedTags.includes(cat)) {
                  extractedTags.push(cat);
                }
              }

              // Set categories (only if empty)
              if (mappedCategories.length > 0) {
                setCategories(mappedCategories);
                setHasUnsavedChanges(true);
              } else {
                // Default to Non-Fiction if no match
                setCategories(['Non-Fiction']);
                setHasUnsavedChanges(true);
              }

              // Set tags from Google Books categories (only if empty)
              if (extractedTags.length > 0 && tags.length === 0) {
                setTags(extractedTags.slice(0, 10)); // Limit to 10 tags
                setHasUnsavedChanges(true);
              }
            }

            // Store cover image URL
            if (volumeInfo.imageLinks?.thumbnail && !coverImage) {
              setCoverImage(volumeInfo.imageLinks.thumbnail);
            }

            console.log(`Found book: "${volumeInfo.title}" by ${volumeInfo.authors?.[0] || 'Unknown'}`);
            showToast("PDF uploaded and enriched with Google Books data!", "success");
          } else {
            console.log(`No Google Books results found for: "${extractedTitle}"`);
            showToast("PDF uploaded and metadata extracted successfully!", "success");
          }
        } catch (apiError) {
          console.error("Error fetching book info from Google Books:", apiError);
          showToast("PDF uploaded and metadata extracted successfully!", "success");
        }
      } else {
        showToast("PDF uploaded. Please fill in details manually.", "info");
      }
    } catch (err) {
      console.error("Failed to process PDF:", err);
      showToast(err?.message || "Failed to process PDF", "error");
      setEbookUrl("");
      setPdfFile(null);
    } finally {
      setExtractingMetadata(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const { valid, firstKey } = validateForm();
    if (!valid) {
      // Focus first invalid field
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      if (el?.focus) el.focus();
      showToast("Please fix errors in the form", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/books/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          year: Number(year),
          shelf,
          isbn,
          publisher,
          format,
          ebookUrl: format === "eBook" ? ebookUrl : undefined,
          barcode,
          categories,
          tags,
          description,
          status,
          loanPolicy,
          coverImage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to add book");
      }
      showToast(`Book "${data.book?.title || title}" added successfully!`, "success");
      setHasUnsavedChanges(false);
      // Reset form after success
      setTitle("");
      setAuthor("");
      setYear("");
      setShelf("");
      setIsbn("");
      setPublisher("");
      setFormat("");
      setEbookUrl("");
      setBarcode("");
      setCategories([]);
      setTags([]);
      setDescription("");
      setStatus("available");
      setLoanPolicy("standard");
      setCoverImage("");
      setErrors({});
      // Optionally navigate to dashboard or a list page later
    } catch (err) {
      showToast(err?.message || "Failed to add book", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--bg-1) px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px] text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} onNavigate={handleNavigation} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-4 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-3 border-b border-(--stroke) pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Add a Book</h1>
            <p className="text-sm text-zinc-600">Enter basic bibliographic details to add a title to the catalog.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-8">
          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Book details</h2>
              <button
                type="button"
                onClick={handleFetchFromGoogleBooks}
                disabled={fetchingFromGoogle || (!isbn && !title)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--btn-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {fetchingFromGoogle ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Fetch from Google Books
                  </>
                )}
              </button>
            </div>

            {coverImage && (
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-zinc-200">
                <img
                  src={coverImage}
                  alt="Book cover preview"
                  className="w-20 h-28 object-cover rounded shadow-sm"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Cover Image Found</p>
                  <p className="text-xs text-zinc-500 mt-1">This cover will be saved with the book</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">
                  Format / Type <span className="text-rose-600">*</span>
                </span>
                <select
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.format ? "border-rose-400" : "border-zinc-200"}`}
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  aria-invalid={!!errors.format}
                  data-field="format"
                >
                  <option value="">Select format (required)</option>
                  <option value="Physical Book">Physical Book</option>
                  <option value="eBook">eBook</option>
                  <option value="Journal">Journal</option>
                  <option value="Reference">Reference</option>
                  <option value="Thesis">Thesis</option>
                </select>
                {fieldError("format")}
                <p className="text-xs text-zinc-500">
                  💡 Select eBook to upload a PDF and auto-fill book details from Google Books
                </p>
              </label>
              {format === "eBook" && (
                <label className="grid gap-2 text-sm sm:col-span-2">
                  <span className="text-zinc-700">
                    eBook File (PDF only) <span className="text-rose-600">*</span>
                  </span>
                  <input
                    className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200 ${errors.format ? "border-rose-400" : "border-zinc-200"}`}
                    type="file"
                    accept=".pdf,application/pdf"
                    disabled={extractingMetadata}
                    onChange={handlePDFUpload}
                    required
                  />
                  {extractingMetadata && (
                    <p className="text-xs text-blue-600">Uploading PDF and extracting metadata from Google Books...</p>
                  )}
                  {ebookUrl && (
                    <p className="text-xs text-emerald-600">✓ PDF uploaded successfully - form fields below have been auto-filled</p>
                  )}
                  {!ebookUrl && (
                    <p className="text-xs text-zinc-500">Upload a PDF file - metadata will be extracted and enriched with Google Books data automatically</p>
                  )}
                </label>
              )}

              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">
                  Title <span className="text-rose-600">*</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.title ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={title}
                  onChange={(e) => handleFieldChange(setTitle)(e.target.value)}
                  placeholder="e.g., Deep Learning with Python"
                  aria-invalid={!!errors.title}
                  data-field="title"
                  required
                />
                {fieldError("title")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Author <span className="text-rose-600">*</span>
                </span>
                <div className="relative">
                  <input
                    className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.author ? "border-rose-400" : "border-zinc-200"} w-full`}
                    type="text"
                    value={author}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      setShowAuthorSuggestions(true);
                    }}
                    onFocus={() => setShowAuthorSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 200)}
                    placeholder="e.g., François Chollet"
                    aria-invalid={!!errors.author}
                    data-field="author"
                    required
                  />
                  {showAuthorSuggestions && author && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {authors
                        .filter(a => a.name.toLowerCase().includes(author.toLowerCase()) && a.name !== author)
                        .slice(0, 10)
                        .map((a) => (
                          <button
                            key={a._id}
                            type="button"
                            onClick={() => {
                              setAuthor(a.name);
                              setShowAuthorSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-sm text-zinc-900 transition-colors"
                          >
                            {a.name}
                          </button>
                        ))}
                      {authors.filter(a => a.name.toLowerCase().includes(author.toLowerCase()) && a.name !== author).length === 0 && (
                        <div className="px-4 py-2 text-sm text-zinc-500 italic">
                          No matching authors found. Using custom name.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {fieldError("author")}
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Year <span className="text-rose-600">*</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.year ? "border-rose-400" : "border-zinc-200"} w-full`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={year}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d{0,4}$/.test(value)) {
                      setYear(value);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const yearNum = parseInt(value, 10);
                      const currentYear = new Date().getFullYear();
                      if (yearNum > currentYear) {
                        setErrors(prev => ({ ...prev, year: `Year cannot be in the future (max: ${currentYear})` }));
                      } else if (yearNum < 1450) {
                        setErrors(prev => ({ ...prev, year: 'Year must be 1450 or later' }));
                      } else {
                        setErrors(prev => {
                          const { year, ...rest } = prev;
                          return rest;
                        });
                      }
                    }
                  }}
                  placeholder={String(new Date().getFullYear())}
                  aria-invalid={!!errors.year}
                  data-field="year"
                  required
                />
                {fieldError("year")}
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Shelf {format !== "eBook" && <span className="text-rose-600">*</span>}
                  {format === "eBook" && <span className="text-zinc-500"> (not applicable for eBooks)</span>}
                </span>
                {loadingShelves ? (
                  <input
                    className="rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500"
                    type="text"
                    value="Loading shelves..."
                    disabled
                  />
                ) : shelves.length > 0 ? (
                  <select
                    className={`rounded-xl border px-4 py-3 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.shelf ? "border-rose-400" : "border-zinc-200"}`}
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    aria-invalid={!!errors.shelf}
                    data-field="shelf"
                    disabled={format === "eBook"}
                  >
                    <option value="">Select a shelf{format === "eBook" ? " (N/A)" : ""}</option>
                    {shelves.map((s) => (
                      <option key={s._id} value={s.code}>
                        {s.code}{s.name ? ` - ${s.name}` : ""}{s.location ? ` (${s.location})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`rounded-xl border px-4 py-3 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.shelf ? "border-rose-400" : "border-zinc-200"}`}
                    type="text"
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder={format === "eBook" ? "N/A for eBooks" : "e.g., A3"}
                    aria-invalid={!!errors.shelf}
                    data-field="shelf"
                    disabled={format === "eBook"}
                  />
                )}
                {fieldError("shelf")}
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  ISBN / Identifier <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.isbn ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  inputMode="numeric"
                  value={isbn}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 13);
                    setIsbn(value);
                  }}
                  placeholder="e.g., 9781492032649 (13 digits)"
                  aria-invalid={!!errors.isbn}
                  data-field="isbn"
                  maxLength={13}
                />
                {fieldError("isbn")}
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Publisher <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.publisher ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g., O'Reilly Media"
                  aria-invalid={!!errors.publisher}
                  data-field="publisher"
                />
                {fieldError("publisher")}
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Barcode / Item ID <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.barcode ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g., BC-000123"
                  aria-invalid={!!errors.barcode}
                  data-field="barcode"
                />
                {fieldError("barcode")}
              </label>

              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">
                  Categories <span className="text-rose-600">*</span>
                </span>
                <div className={`rounded-xl border bg-white px-4 py-3 outline-none transition focus-within:border-[var(--btn-primary)] focus-within:ring-2 focus-within:ring-zinc-900/10 ${errors.categories ? "border-rose-400" : "border-zinc-200"}`}>
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                        >
                          {cat}
                          <button
                            type="button"
                            onClick={() => {
                              setCategories(categories.filter(c => c !== cat));
                              setHasUnsavedChanges(true);
                            }}
                            className="hover:text-blue-900"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="Search categories... (e.g., Science, Fiction, Technology)"
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setShowCategorySuggestions(true);
                      }}
                      onFocus={() => setShowCategorySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                      aria-invalid={!!errors.categories}
                      data-field="categories"
                    />
                    {showCategorySuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {PREDEFINED_CATEGORIES
                          .filter(cat =>
                            !categories.includes(cat) &&
                            cat.toLowerCase().includes(categorySearch.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setCategories([...categories, cat]);
                                setCategorySearch("");
                                setShowCategorySuggestions(false);
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-zinc-900 transition-colors"
                            >
                              {cat}
                            </button>
                          ))}
                        {PREDEFINED_CATEGORIES.filter(cat =>
                          !categories.includes(cat) &&
                          cat.toLowerCase().includes(categorySearch.toLowerCase())
                        ).length === 0 && (
                            <div className="px-4 py-2 text-sm text-zinc-500">
                              No categories found
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
                {fieldError("categories")}
              </label>

              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">
                  Tags
                </span>
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus-within:border-[var(--btn-primary)] focus-within:ring-2 focus-within:ring-zinc-900/10">
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              setTags(tags.filter(t => t !== tag));
                              setHasUnsavedChanges(true);
                            }}
                            className="hover:text-emerald-900"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400"
                      placeholder="Search tags... (e.g., Programming, Machine Learning, History)"
                      value={tagSearch}
                      onChange={(e) => {
                        setTagSearch(e.target.value);
                        setShowTagSuggestions(true);
                      }}
                      onFocus={() => setShowTagSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    />
                    {showTagSuggestions && tagSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {PREDEFINED_TAGS
                          .filter(tag =>
                            !tags.includes(tag) &&
                            tag.toLowerCase().includes(tagSearch.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setTags([...tags, tag]);
                                setTagSearch("");
                                setShowTagSuggestions(false);
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm text-zinc-900 transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        {PREDEFINED_TAGS.filter(tag =>
                          !tags.includes(tag) &&
                          tag.toLowerCase().includes(tagSearch.toLowerCase())
                        ).length === 0 && (
                            <div className="px-4 py-2 text-sm text-zinc-500">
                              No tags found
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </label>

              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">
                  Description
                </span>
                <textarea
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 min-h-[120px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description of the book's content, themes, and key topics. This helps students discover books through the chatbot and improves search results."
                  rows={4}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Status <span className="text-rose-600">*</span>
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.status ? "border-rose-400" : "border-zinc-200"}`}
                  aria-invalid={!!errors.status}
                  data-field="status"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                </select>
                {fieldError("status")}
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Loan Policy {format !== "eBook" && <span className="text-rose-600">*</span>}
                  {format === "eBook" && <span className="text-zinc-500"> (not applicable for eBooks)</span>}
                </span>
                <select
                  value={format === "eBook" ? "n/a" : loanPolicy}
                  onChange={(e) => setLoanPolicy(e.target.value)}
                  className={`rounded-xl border px-4 py-3 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.loanPolicy ? "border-rose-400" : "border-zinc-200"}`}
                  aria-invalid={!!errors.loanPolicy}
                  data-field="loanPolicy"
                  disabled={format === "eBook"}
                >
                  {format === "eBook" ? (
                    <option value="n/a">N/A - Digital Access Only</option>
                  ) : (
                    <>
                      <option value="standard">Standard</option>
                      <option value="short-loan">Short loan</option>
                      <option value="reference-only">Reference only</option>
                      <option value="staff-only">Staff only</option>
                    </>
                  )}
                </select>
                {fieldError("loanPolicy")}
              </label>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigateTo("/admin/dashboard")}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl border border-[var(--btn-primary)] bg-[var(--btn-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--btn-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add book"}
            </button>
          </div>
        </form>
      </main>

      <ToastContainer position="top-right" />

      <UnsavedChangesDialog
        hasUnsavedChanges={hasUnsavedChanges}
        showDialog={showDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </div>
  );
}
