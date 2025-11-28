# Firestore Indexes Documentation

This document describes all composite indexes required for the Groovr application to function correctly.

## Why Indexes Are Needed

Firestore requires composite indexes for queries that combine:
- Multiple `where()` clauses
- `where()` + `orderBy()` on different fields
- `collectionGroup()` queries with filters

Without these indexes, queries will fail with errors like:
```
The query requires an index. You can create it here: [link]
```

## Required Indexes by Collection

### 1. Posts Collection

#### Index: userId + createdAt (DESC)
- **Purpose**: Retrieve user's posts sorted by date
- **Used in**: `getUserPosts()` in [src/lib/posts.ts](../src/lib/posts.ts:189-193)
- **Query**:
  ```typescript
  where('userId', '==', userId)
  orderBy('createdAt', 'desc')
  ```

---

### 2. User Albums Collection

#### Index: userId + type + addedAt (DESC)
- **Purpose**: Paginated collection/wishlist sorted by date added
- **Used in**:
  - `getUserCollection()` in [src/lib/user-albums.ts](../src/lib/user-albums.ts:197-202)
  - `getUserWishlist()` in [src/lib/user-albums.ts](../src/lib/user-albums.ts:239-244)
  - `getUserAlbumsPaginated()` in [src/lib/user-albums.ts](../src/lib/user-albums.ts:422-428)
  - `subscribeToUserCollection()` in [src/lib/user-albums.ts](../src/lib/user-albums.ts:316-321)
  - `subscribeToUserWishlist()` in [src/lib/user-albums.ts](../src/lib/user-albums.ts:366-371)
- **Query**:
  ```typescript
  where('userId', '==', userId)
  where('type', '==', 'collection' | 'wishlist')
  orderBy('addedAt', 'desc')
  ```

#### Index: userId + albumId + type
- **Purpose**: Check if specific album is in user's collection/wishlist
- **Used in**: `getUserAlbumByAlbumId()` in [src/lib/user-albums.ts](../src/lib/user-albums.ts:510-516)
- **Query**:
  ```typescript
  where('userId', '==', userId)
  where('albumId', '==', albumId)
  where('type', '==', 'collection' | 'wishlist')
  ```

---

### 3. Comments Collection

#### Index: postId + createdAt (ASC)
- **Purpose**: Retrieve comments for a post in chronological order
- **Used in**:
  - `getPostComments()` in [src/lib/comments.ts](../src/lib/comments.ts:72-76)
  - `subscribeToPostComments()` in [src/lib/comments.ts](../src/lib/comments.ts:138-142)
- **Query**:
  ```typescript
  where('postId', '==', postId)
  orderBy('createdAt', 'asc')
  ```

---

### 4. Follows Collection

#### Index: followingId + status + createdAt (DESC)
- **Purpose**: Get followers of a user (accepted only), sorted by follow date
- **Used in**:
  - `getFollowers()` in [src/lib/follows.ts](../src/lib/follows.ts:175-179)
  - `getPendingRequests()` in [src/lib/follows.ts](../src/lib/follows.ts:244-248)
  - `subscribeToPendingRequests()` in [src/lib/follows.ts](../src/lib/follows.ts:348-352)
- **Query**:
  ```typescript
  where('followingId', '==', userId)
  where('status', '==', 'accepted' | 'pending')
  orderBy('createdAt', 'desc')
  ```

#### Index: followerId + status + createdAt (DESC)
- **Purpose**: Get users followed by a user (accepted only), sorted by follow date
- **Used in**: `getFollowing()` in [src/lib/follows.ts](../src/lib/follows.ts:209-213)
- **Query**:
  ```typescript
  where('followerId', '==', userId)
  where('status', '==', 'accepted')
  orderBy('createdAt', 'desc')
  ```

#### Index: followerId + followingId
- **Purpose**: Check if a specific follow relationship exists
- **Used in**: `getFollowDoc()` in [src/lib/follows.ts](../src/lib/follows.ts:399-403)
- **Query**:
  ```typescript
  where('followerId', '==', followerId)
  where('followingId', '==', followingId)
  ```

#### Index: followingId + status
- **Purpose**: Count followers with specific status
- **Used in**: `getFollowStats()` for followers count in [src/lib/follows.ts](../src/lib/follows.ts:309-313)
- **Query**:
  ```typescript
  where('followingId', '==', userId)
  where('status', '==', 'accepted')
  ```

#### Index: followerId + status
- **Purpose**: Count following with specific status
- **Used in**: `getFollowStats()` for following count in [src/lib/follows.ts](../src/lib/follows.ts:318-322)
- **Query**:
  ```typescript
  where('followerId', '==', userId)
  where('status', '==', 'accepted')
  ```

---

### 5. Likes Collection

#### Index: postId + createdAt (DESC)
- **Purpose**: Get users who liked a post, sorted by like date
- **Used in**: `getPostLikes()` in [src/lib/likes.ts](../src/lib/likes.ts:115-120)
- **Query**:
  ```typescript
  where('postId', '==', postId)
  orderBy('createdAt', 'desc')
  limit(limitCount)
  ```

#### Index: userId + postId
- **Purpose**: Check if a user has liked a specific post
- **Used in**: `getLikeDoc()` in [src/lib/likes.ts](../src/lib/likes.ts:156-160)
- **Query**:
  ```typescript
  where('userId', '==', userId)
  where('postId', '==', postId)
  ```

---

### 6. Collection Group: posts (user_feeds subcollection)

#### Index: postId
- **Purpose**: Find all feed pointers to a specific post (for cascade deletion)
- **Used in**: `deletePost()` in [src/lib/posts.ts](../src/lib/posts.ts:258-261)
- **Query**:
  ```typescript
  collectionGroup('posts')
  where('postId', '==', postId)
  ```
- **Note**: This is a collectionGroup query, not a regular collection query

---

## Deployment Instructions

### Prerequisites

1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

### First-Time Setup

If you haven't initialized Firestore indexes yet:

```bash
firebase init firestore
```

- Select your Firebase project
- Keep default files: `firestore.rules` and `firestore.indexes.json`
- The `firestore.indexes.json` file at the root is already configured

### Deploy Indexes

Deploy only the indexes (doesn't affect rules or data):

```bash
firebase deploy --only firestore:indexes
```

### Monitor Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Check the status of each index:
   - ✅ **Enabled** (green): Index is ready
   - ⏳ **Building** (yellow): Index is being created (5-15 minutes)
   - ❌ **Error** (red): Fix configuration and redeploy

### Build Time

- Small collections (<1000 docs): ~2-5 minutes per index
- Medium collections (1k-10k docs): ~5-10 minutes per index
- Large collections (>10k docs): ~10-15 minutes per index

Indexes build in parallel, so total time ≈ time for largest collection.

---

## Validation & Testing

### 1. Check Browser Console

After deployment, test each feature and check for errors:
```
FIRESTORE (x.x.x) INTERNAL ASSERTION FAILED: The query requires an index
```

If you see this, the index hasn't been created or hasn't finished building.

### 2. Test Each Flow

- ✅ **Feed pagination**: Scroll through feed
- ✅ **User profile**: View user's posts
- ✅ **Collection/Wishlist**: Open and scroll through collections
- ✅ **Comments**: Load comments on posts
- ✅ **Likes**: View who liked a post
- ✅ **Follow system**: Follow/unfollow users, view followers/following
- ✅ **Search**: Search for users (no index needed - client-side filtering)

### 3. Performance Check

All queries should complete in <500ms. Use the Network tab in DevTools to verify:
- Navigate to **Network** tab
- Filter by **Firestore** requests
- Check response times

---

## Multiple Environments

If you have dev, staging, and production environments:

1. Deploy indexes to each environment:
   ```bash
   # Switch to dev project
   firebase use dev
   firebase deploy --only firestore:indexes

   # Switch to production project
   firebase use production
   firebase deploy --only firestore:indexes
   ```

2. Or use project-specific deployment:
   ```bash
   firebase deploy --only firestore:indexes --project your-dev-project
   firebase deploy --only firestore:indexes --project your-prod-project
   ```

---

## Troubleshooting

### Index Creation Failed

**Error**: Index creation shows "Error" status in console

**Solutions**:
1. Check `firestore.indexes.json` syntax (valid JSON)
2. Verify field names match your Firestore documents exactly
3. Delete the failed index in console and redeploy

### Query Still Fails After Index Deployed

**Error**: Query requires index even after deployment

**Solutions**:
1. Wait for index to finish building (check console status)
2. Verify the index matches your query exactly (field order matters!)
3. Clear browser cache and hard reload (Ctrl+Shift+R)

### Too Many Indexes Warning

**Limit**: 200 composite indexes per project (very rare to hit)

**Solutions**:
1. Review queries - can you combine indexes?
2. Simplify queries (filter more client-side)
3. Contact Firebase support for limit increase

---

## Query Optimization Tips

### Prefer Single Indexes When Possible

❌ **Bad** - Requires complex index:
```typescript
collection
  .where('userId', 'in', [1,2,3])
  .where('type', '==', 'post')
  .orderBy('createdAt', 'desc');
```

✅ **Better** - Simpler index + client filtering:
```typescript
// Query
collection
  .where('userId', 'in', [1,2,3])
  .orderBy('createdAt', 'desc');

// Filter client-side
const filtered = results.filter(r => r.type === 'post');
```

### Use Pagination

Always use `limit()` to avoid fetching too much data:

```typescript
query(collection, where(...), orderBy(...), limit(20))
```

---

## Cost Implications

### Storage Costs

Each index consumes storage:
- **Cost**: ~$0.18 per GB/month
- **Impact**: Minimal (indexes are small)
- **Example**: 10,000 documents × 12 indexes ≈ 10 MB ≈ $0.002/month

### Read Costs

Indexes don't increase read costs - they make reads **possible** and **faster**.

---

## Version Control

**Important**: Always commit `firestore.indexes.json` to Git!

```bash
git add firestore.indexes.json
git commit -m "Add Firestore composite indexes"
```

This ensures:
- Team members can deploy the same indexes
- Indexes are consistent across environments
- You have a history of index changes

---

## Summary

**Total Indexes**: 12 composite indexes

**Collections**:
- `posts`: 1 index
- `user_albums`: 2 indexes
- `comments`: 1 index
- `follows`: 5 indexes
- `likes`: 2 indexes
- `posts` (collectionGroup): 1 index

**Next Steps**:
1. ✅ Deploy indexes: `firebase deploy --only firestore:indexes`
2. ✅ Monitor build status in Firebase Console
3. ✅ Test all app features
4. ✅ Verify no console errors

---

## References

- [Firestore Index Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Query Performance Best Practices](https://firebase.google.com/docs/firestore/best-practices)
