# Recommendation Engine Test Cases

## Setup

Run the seed script first:
```bash
node scripts/seed-recommendation-test-data.js
```

This creates:
- 2 test users with different reading patterns
- 14 books across multiple genres
- Historical transactions and interactions

## Test Case 2: Genre Enthusiast (Science Fiction)

### Test User
- **Email**: `scifi.lover@test.com`
- **Profile**: Has borrowed and completed 5 Science Fiction books
- **Books Read**:
  1. Dune (Frank Herbert)
  2. Foundation (Isaac Asimov)
  3. Neuromancer (William Gibson)
  4. The Left Hand of Darkness (Ursula K. Le Guin)
  5. Ender's Game (Orson Scott Card)

### Expected Results

#### User Profile
```json
{
  "totalInteractions": 25,
  "topCategories": ["Science Fiction", "Adventure", "Cyberpunk"],
  "topAuthors": ["Frank Herbert", "Isaac Asimov", "William Gibson", ...],
  "engagementLevel": "high" or "power",
  "diversityScore": 30-50
}
```

#### Recommendations
- **60-80% Science Fiction books** (6-8 out of 10)
- Available SciFi books should appear:
  - The Martian (Andy Weir)
  - Snow Crash (Neal Stephenson)
- **High relevance scores**: 70-90 for genre matches
- **Match reasons should include**:
  - "You like Science Fiction"
  - "Similar to Space Opera"
  - "Matches your interests"

#### Verification Steps
1. Log in as `scifi.lover@test.com`
2. Navigate to Books page or check recommendations sidebar
3. Count Science Fiction books in recommendations
4. Check relevance scores (should be 70+)
5. Verify match reasons mention Science Fiction
6. Confirm some diversity (not 100% SciFi)

#### API Test
```bash
# Call recommendation API
curl http://localhost:3000/api/student/recommendations?userId=scifi.lover@test.com
```

Expected response structure:
```json
{
  "recommendations": [
    {
      "_id": "...",
      "title": "The Martian",
      "author": "Andy Weir",
      "categories": ["Science Fiction", "Adventure"],
      "relevanceScore": 85,
      "matchReasons": ["You like Science Fiction", "Similar to Adventure"]
    },
    // ... more recommendations
  ],
  "profile": {
    "totalInteractions": 25,
    "topCategories": ["Science Fiction", "Adventure", "Cyberpunk"],
    "topAuthors": ["Frank Herbert", "Isaac Asimov", ...],
    "diversityScore": 35,
    "engagementLevel": "high"
  }
}
```

---

## Test Case 3: Author Loyalty (J.K. Rowling Fan)

### Test User
- **Email**: `rowling.fan@test.com`
- **Profile**: Has borrowed and completed 3 J.K. Rowling books
- **Books Read**:
  1. Harry Potter and the Philosopher's Stone
  2. Harry Potter and the Chamber of Secrets
  3. Harry Potter and the Prisoner of Azkaban

### Expected Results

#### User Profile
```json
{
  "totalInteractions": 24,
  "topCategories": ["Fantasy", "Young Adult"],
  "topAuthors": ["J.K. Rowling"],
  "engagementLevel": "high",
  "diversityScore": 20-40
}
```

#### Recommendations
- **"The Casual Vacancy" by J.K. Rowling should appear** (4th Rowling book)
- **High relevance score**: 80-90+ for Rowling's book
- **Match reasons should include**:
  - "By J.K. Rowling (your favorite)" or "By J.K. Rowling"
- Other Fantasy books should also appear:
  - The Name of the Wind (Patrick Rothfuss)
  - The Hobbit (J.R.R. Tolkien)
- **Fantasy genre dominance**: 60-70% Fantasy books

#### Verification Steps
1. Log in as `rowling.fan@test.com`
2. Navigate to Books page or check recommendations sidebar
3. Verify "The Casual Vacancy" appears in recommendations
4. Check its relevance score (should be 80+)
5. Verify match reason mentions "By J.K. Rowling"
6. Count Fantasy books (should be 6-7 out of 10)
7. Confirm other Fantasy authors appear (Rothfuss, Tolkien)

#### API Test
```bash
# Call recommendation API
curl http://localhost:3000/api/student/recommendations?userId=rowling.fan@test.com
```

Expected response structure:
```json
{
  "recommendations": [
    {
      "_id": "...",
      "title": "The Casual Vacancy",
      "author": "J.K. Rowling",
      "categories": ["Fiction", "Drama"],
      "relevanceScore": 85,
      "matchReasons": ["By J.K. Rowling (your favorite)"]
    },
    {
      "_id": "...",
      "title": "The Name of the Wind",
      "author": "Patrick Rothfuss",
      "categories": ["Fantasy"],
      "relevanceScore": 78,
      "matchReasons": ["You like Fantasy", "Similar to Magic"]
    },
    // ... more recommendations
  ],
  "profile": {
    "totalInteractions": 24,
    "topCategories": ["Fantasy", "Young Adult"],
    "topAuthors": ["J.K. Rowling"],
    "diversityScore": 30,
    "engagementLevel": "high"
  }
}
```

---

## Scoring Verification

### Test Case 2: Science Fiction Book Scoring

For a book like "The Martian" (Science Fiction, Adventure):
- **Category match** (Science Fiction): 40-90 points
- **Tag match** (Space, Survival): 30-70 points
- **Year proximity** (2014 vs avg ~1970s): 5-10 points
- **Popularity** (190): ~23 points
- **Engagement boost** (high user): 15 points
- **Recency bonus**: 10-15 points
- **Total**: ~75-85 points ✅

### Test Case 3: J.K. Rowling Book Scoring

For "The Casual Vacancy" by J.K. Rowling:
- **Author match** (J.K. Rowling = top author): 50 points
- **Category match** (Fiction vs Fantasy): 0 points
- **Publisher match**: 0-20 points
- **Year proximity** (2012 vs avg ~1998): 10-15 points
- **Popularity** (120): ~21 points
- **Engagement boost** (high user): 15 points
- **Total**: ~80-90 points ✅

---

## Additional Checks

### Diversity Filter
- No author should appear more than 2-3 times
- No category should dominate more than 40% (unless user is very focused)

### Availability Filter
- All recommendations must have `status: "available"`
- No books from user's personal library
- No currently borrowed books

### Match Reasons
- Should be specific and accurate
- Max 3 reasons per book
- Should prioritize strongest matches

### Edge Cases
- If user borrows a recommended book, it should disappear from next call
- If a recommended book becomes unavailable, it should be filtered out
- Profile should update after new interactions

---

## Manual Testing Checklist

### For Test Case 2 (SciFi Lover)
- [ ] User profile shows Science Fiction as top category
- [ ] 6-8 Science Fiction books in recommendations
- [ ] Relevance scores are 70+ for SciFi books
- [ ] Match reasons mention "Science Fiction"
- [ ] Some diversity present (not 100% SciFi)
- [ ] "The Martian" and "Snow Crash" appear
- [ ] Engagement level is "high" or "power"

### For Test Case 3 (Rowling Fan)
- [ ] User profile shows J.K. Rowling as top author
- [ ] "The Casual Vacancy" appears in recommendations
- [ ] Relevance score for Casual Vacancy is 80+
- [ ] Match reason mentions "By J.K. Rowling"
- [ ] Other Fantasy books appear (Rothfuss, Tolkien)
- [ ] 6-7 Fantasy books in recommendations
- [ ] Engagement level is "high"

---

## Troubleshooting

### No recommendations appear
- Check that books have `status: "available"`
- Verify user interactions are within 90 days
- Check MongoDB connection

### Wrong recommendations
- Verify user profile is building correctly
- Check scoring logic in recommendation-engine.js
- Ensure time decay is working (recent interactions weighted more)

### Low relevance scores
- Check that books have matching categories/tags
- Verify popularity scores are set
- Ensure engagement boost is applied

### Profile not updating
- Check that interactions are being created
- Verify timestamps are within 90 days
- Ensure userId matches between collections
