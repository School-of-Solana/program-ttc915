# DePress: Decentralized Social Media on Solana

**Deployed Frontend URL:** [https://depress.vercel.app/](https://depress.vercel.app/)

**Solana Program ID:** `5aQmhcFhVmgtmCdGtffRuMYL9R1WsARAtukzxUttPKKN`

## Overview

### Description

DePress is a decentralized social media platform built on Solana. Users can create posts, add comments, and react with likes or dislikes—all on-chain. Every user retains full ownership and control over their content.

The platform showcases advanced Solana development techniques, including multiple account types, complex Program Derived Address (PDA) relationships, and robust state management.

### Key Features

- **Post Creation**: Publish posts with a topic (up to 32 characters) and content (up to 500 characters).
- **Commenting**: Add comments to posts (up to 100 characters each).
- **Reactions**: Like or dislike posts and comments.
- **Content Ownership**: Users can remove their own posts, comments, and reactions anytime.
- **Deterministic Addressing**: PDAs ensure unique content identification and prevent conflicts.

### How to Use the dApp

1. **Connect Wallet**: Link your Solana wallet to start interacting.
2. **Create a Post**: Enter a topic and content, then submit.
3. **Browse Posts**: View all posts on the main feed.
4. **Add Comments**: Click a post to comment on it.
5. **React**: Use like/dislike buttons on posts and comments.
6. **Manage Content**: Remove your posts, comments, or reactions as needed.

## Technical Architecture

### Program Overview

The DePress program uses four main account types: Post, Comment, ReactionPost, and ReactionComment. It implements nine core instructions and leverages multi-layer PDAs for deterministic, conflict-free relationships. Posts serve as root entities, with comments and reactions branching hierarchically while maintaining data integrity and ownership.

### PDA Usage

PDAs create unique, deterministic addresses for all accounts, ensuring reliable content location and preventing collisions.

| PDA Type             | Seeds                                                               | Purpose                                                                                                         |
| -------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Post PDA             | `["POST_SEED", topic, author_pubkey]`                               | Allows multiple posts per user with different topics; prevents duplicates for the same topic-author pair.       |
| Comment PDA          | `["COMMENT_SEED", author_pubkey, content_hash, parent_post_pubkey]` | Uses SHA256 hash of content for uniqueness; enables multiple comments per user per post with different content. |
| Post Reaction PDA    | `["POST_REACTION_SEED", author_pubkey, post_pubkey]`                | Limits each user to one reaction per post.                                                                      |
| Comment Reaction PDA | `["COMMENT_REACTION_SEED", author_pubkey, comment_pubkey]`          | Limits each user to one reaction per comment.                                                                   |

### Program Instructions

| Instruction               | Description                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `post_add`                | Creates a new post account with topic and content; initializes counters to zero.   |
| `post_remove`             | Closes a post account and refunds rent; only callable by the post author.          |
| `like_post`               | Creates a Like reaction on a post; increments the post's like counter.             |
| `dislike_post`            | Creates a Dislike reaction on a post; increments the post's dislike counter.       |
| `reaction_remove_post`    | Closes a post reaction account; decrements the appropriate counter.                |
| `comment_add`             | Creates a comment linked to a post; increments the post's comment count.           |
| `comment_remove`          | Closes a comment account; only callable by the comment author.                     |
| `like_comment`            | Creates a Like reaction on a comment; increments the comment's like counter.       |
| `dislike_comment`         | Creates a Dislike reaction on a comment; increments the comment's dislike counter. |
| `reaction_remove_comment` | Closes a comment reaction account; decrements the appropriate counter.             |

### Account Structure

```rust
#[account]
#[derive(InitSpace)]
pub struct Post {
    pub post_author: Pubkey,        // The wallet that created this post
    #[max_len(32)]
    pub topic: String,              // Post topic (max 32 chars)
    #[max_len(500)]
    pub content: String,            // Post content (max 500 chars)
    pub likes: u64,                 // Number of likes
    pub dislikes: u64,              // Number of dislikes
    pub comment_count: u32,         // Number of comments on this post
    pub bump: u8,                   // PDA bump for validation
}

#[account]
#[derive(InitSpace)]
pub struct Comment {
    pub comment_author: Pubkey,     // The wallet that created this comment
    pub parent_post: Pubkey,        // Reference to the post this comments on
    #[max_len(100)]
    pub content: String,            // Comment content (max 100 chars)
    pub likes: u64,                 // Number of likes on this comment
    pub dislikes: u64,              // Number of dislikes on this comment
    pub bump: u8,                   // PDA bump for validation
}

#[account]
#[derive(InitSpace)]
pub struct ReactionPost {
    pub reaction_author: Pubkey,    // The wallet that created this reaction
    pub parent_post: Pubkey,        // Reference to the post being reacted to
    pub reaction: ReactionType,     // Like or Dislike enum
    pub bump: u8,                   // PDA bump for validation
}

#[account]
#[derive(InitSpace)]
pub struct ReactionComment {
    pub reaction_author: Pubkey,    // The wallet that created this reaction
    pub parent_comment: Pubkey,     // Reference to the comment being reacted to
    pub reaction: ReactionType,     // Like or Dislike enum
    pub bump: u8,                   // PDA bump for validation
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, InitSpace)]
pub enum ReactionType {
    Like,
    Dislike,
}
```

## Testing

### Test Coverage

The test suite covers all 10 instructions, including success cases and error conditions. It includes boundary testing for content lengths, authorization checks, and edge cases with Unicode characters and emojis.

#### Happy Path Tests

- **Post Creation**: Creates posts with various content lengths, topics, and Unicode.
- **Comment Creation**: Adds comments with proper linking and counter updates.
- **Reaction Management**: Adds and removes reactions on posts and comments.
- **Content Removal**: Removes posts, comments, and reactions with account closure.
- **Multi-User Interactions**: Handles interactions between different users on shared content.

#### Unhappy Path Tests

- **Content Limits**: Fails on exceeding 500 chars for posts, 32 for topics, or 100 for comments.
- **Duplicates**: Prevents duplicate posts (same topic/author) or reactions.
- **Authorization**: Blocks non-owners from removing content.
- **Invalid References**: Fails on reacting to or commenting on non-existent content.
- **PDA Validation**: Ensures proper constraint errors for mismatched seeds.

### Running Tests

```bash
# Install dependencies (if needed)
pnpm install

# Run tests
pnpm test
```

### Additional Notes for Evaluators

This project demonstrates advanced Solana concepts like complex multi-account relationships, hierarchical PDAs, and comprehensive error handling.

Key challenges included managing interdependencies between posts, comments, and reactions while ensuring authorization and state consistency.

The SHA256 hashing for comment PDAs ensures uniqueness while allowing multiple comments per user per post.

The project includes a full Solana program and a Next.js frontend with wallet integration.
