# QA Test Guide: Recommendation Engine

## Quick Start

### 1. Seed Test Data
```bash
node scripts/seed-recommendation-test-data.js
```

### 2. Verify Data
```bash
node scripts/check-test-data.js
```

### 3. Test in Application
Log in with test user credentials and check recommendations.

---

## Test Users

### Test User 1: Science Fiction Enthusiast
- **Email**: `scifi.lover@test.com`
- **Password**: Set up through your authentication system
- **Reading History**: 
  - Dune (Frank Herbert)
  - Foundation (Isaac Asimov)
  - Neuromancer (William Gibson)
  - The Left Hand of Darkness (Ursula K. Le Guin)
  - Ender's Game (Orson Scott Card)
- **Profile**:
  - 25 interactions (5 borrows, 5 completes, 15 views)
  - Top category: Science Fiction
  - Engagement level: High

### Test User 2: J.K. Rowling Fan
- **Email**: `rowling.fan@test.com`
- **Password**: Set up through your authentication system
- **Reading History**:
  - Harry Potter and the Philosopher's Stone
  - Harry Potter and the Chamber of Secrets
  - Harry Potter and the Prisoner of Azkaban
- **Profile**:
  - 24 interactions (3 borrows, 3 completes, 3 bookmarks, 15 views)
  - Top author: J.K. Rowling
  - Top category: Fantasy
  - Engagement level: High

---

## Test Case 2: Genre Enthusiast (Science Fiction)

### Test Steps
1. Log in as `scifi.lover@test.com`
2. Navigate to any page with recommendations (Books page, Library, etc.)
3. Check the recommendations sidebar or API response

### Expected Results

#### ✅ User Profile
- Total interactions: 25
- Top categories: Science Fiction, Adventure, Cyberpunk
- Top authors: Frank Herbert, Isaac Asimov, William Gibson, etc.
- Engagement level: High or Power
- Diversity score: 30-50%

#### ✅ Recommendations
- **60-80% Science Fiction books** (6-8 out of 10)
- Should include:
  - ✓ The Martian (Andy Weir)
  - ✓ Snow Crash (Neal Stephenson)
- **High relevance scores**: 70-90 for SciFi books
- **Match reasons**:
  - "You like Science Fiction"
  - "Similar to Space Opera"
  - "Matches your interests"
  - "Similar to Adventure"

#### ✅ Diversity Check
- Not 100% Science Fiction (should have 2-4 non-SciFi books)
- No single author appears more than 2-3 times
- Variety in sub-genres (Space Opera, Cyberpunk, etc.)

### Scoring Verification
For "The Martian":
- Category match (Science Fiction): 40-90 points
- Tag match (Space, Survival): 30-70 points
- Popularity (190): ~23 points
- Engagement boost: 15 points
- **Expected total**: 75-85 points

### API Test
```bash
curl http://localhost:3000/api/student/recommendations?userId=scifi.lover@test.com
```

---

## Test Case 3: Author Loyalty (J.K. Rowling)

### Test Steps
1. Log in as `rowling.fan@test.com`
2. Navigate to any page with recommendations
3. Check the recommendations sidebar or API response

### Expected Results

#### ✅ User Profile
- Total interactions: 24
- Top categories: Fantasy, Young Adult
- Top authors: J.K. Rowling (should be #1)
- Engagement level: High
- Diversity score: 20-40%

#### ✅ Recommendations
- **"The Casual Vacancy" by J.K. Rowling MUST appear**
- Relevance score for Casual Vacancy: **80-90+**
- **Match reasons for Casual Vacancy**:
  - "By J.K. Rowling (your favorite)" OR
  - "By J.K. Rowling"
- **60-70% Fantasy books** (6-7 out of 10)
- Should also include:
  - ✓ The Name of the Wind (Patrick Rothfuss)
  - ✓ The Hobbit (J.R.R. Tolkien)

#### ✅ Author Match Verification
- J.K. Rowling books get highest scores
- Other Fantasy authors appear (Rothfuss, Tolkien)
- Match reasons mention authors and Fantasy genre

### Scoring Verification
For "The Casual Vacancy":
- Author match (J.K. Rowling = top author): 50 points
- Year proximity (2012 vs avg 1998): 10-15 points
- Popularity (120): ~21 points
- Engagement boost: 15 points
- **Expected total**: 80-90 points

### API Test
```bash
curl http://localhost:3000/api/student/recommendations?userId=rowling.fan@test.com
```

---

## Common Issues & Troubleshooting

### Issue: No recommendations appear
**Possible causes**:
- Books don't have `status: "available"`
- User interactions are older than 90 days
- MongoDB connection issue

**Fix**: Check database, re-run seed script

### Issue: Wrong genre distribution
**Possible causes**:
- Scoring weights incorrect
- Diversity filter too aggressive
- Not enough candidate books

**Fix**: Check recommendation-engine.js scoring logic

### Issue: Low relevance scores
**Possible causes**:
- Books missing categories/tags
- Popularity scores not set
- Engagement boost not applied

**Fix**: Verify book data has all required fields

### Issue: "The Casual Vacancy" doesn't appear
**Possible causes**:
- Book status is not "available"
- Author name mismatch
- Scoring too low

**Fix**: Check book data, verify author field exactly matches "J.K. Rowling"

---

## Manual Testing Checklist

### Test Case 2: SciFi Lover
- [ ] User profile shows "Science Fiction" as top category
- [ ] 6-8 Science Fiction books in recommendations (60-80%)
- [ ] Relevance scores are 70+ for SciFi books
- [ ] Match reasons mention "Science Fiction"
- [ ] "The Martian" appears in recommendations
- [ ] "Snow Crash" appears in recommendations
- [ ] Some diversity present (2-4 non-SciFi books)
- [ ] No author appears more than 2-3 times
- [ ] Engagement level is "high" or "power"

### Test Case 3: Rowling Fan
- [ ] User profile shows "J.K. Rowling" as top author
- [ ] "The Casual Vacancy" appears in recommendations
- [ ] Relevance score for Casual Vacancy is 80+
- [ ] Match reason mentions "By J.K. Rowling"
- [ ] "The Name of the Wind" appears (Patrick Rothfuss)
- [ ] "The Hobbit" appears (J.R.R. Tolkien)
- [ ] 6-7 Fantasy books in recommendations (60-70%)
- [ ] Engagement level is "high"

---

## Advanced Testing

### Time Decay Testing
1. Create interactions at different times (7, 30, 60 days ago)
2. Verify recent interactions weighted more heavily
3. Check that old interactions (90+ days) are ignored

### Collaborative Filtering Testing
1. Create multiple users with overlapping borrowing patterns
2. Verify "users who borrowed X also borrowed Y" works
3. Check that recommendations include collaborative suggestions

### Availability Testing
1. Borrow a recommended book
2. Verify it disappears from next recommendation call
3. Return the book
4. Verify it reappears (if still relevant)

### Diversity Filter Testing
1. Create user with very narrow interests (all same genre)
2. Verify diversity filter still provides some variety
3. Check max books per author/category limits

---

## Database Queries for Manual Verification

### Check user profile data
```javascript
db.user_interactions.find({ 
  userId: ObjectId("000000000000000000000001") 
}).sort({ timestamp: -1 })
```

### Check available books by category
```javascript
db.books.find({ 
  categories: "Science Fiction",
  status: "available" 
})
```

### Check transactions
```javascript
db.transactions.find({ 
  userId: ObjectId("000000000000000000000001") 
})
```

---

## Success Criteria

### Test Case 2 PASSES if:
- ✅ 6-8 Science Fiction books (60-80%)
- ✅ Average relevance score for SciFi books ≥ 70
- ✅ Match reasons include "Science Fiction"
- ✅ "The Martian" and "Snow Crash" appear
- ✅ Some diversity (not 100% SciFi)

### Test Case 3 PASSES if:
- ✅ "The Casual Vacancy" appears
- ✅ Relevance score ≥ 80 for Casual Vacancy
- ✅ Match reason mentions "J.K. Rowling"
- ✅ 6-7 Fantasy books (60-70%)
- ✅ Other Fantasy authors appear (Rothfuss, Tolkien)

---

## Cleanup

To remove test data:
```javascript
// In MongoDB shell or script
db.users.deleteMany({ 
  email: { $in: ['scifi.lover@test.com', 'rowling.fan@test.com'] } 
});
db.transactions.deleteMany({ 
  userId: { $in: [
    ObjectId("000000000000000000000001"),
    ObjectId("000000000000000000000002")
  ]}
});
db.user_interactions.deleteMany({ 
  userId: { $in: [
    ObjectId("000000000000000000000001"),
    ObjectId("000000000000000000000002")
  ]}
});
```

Or re-run the seed script (it cleans up automatically).
