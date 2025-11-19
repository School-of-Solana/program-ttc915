import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import crypto from "crypto";
import { Depress } from "../target/types/depress";

const POST_SEED = "POST_SEED";
const POST_REACTION = "POST_REACTION_SEED";
const COMMENT_SEED = "COMMENT_SEED";
const COMMENT_REACTION = "COMMENT_REACTION_SEED";

describe("DePress", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.depress as Program<Depress>;

  const bob = anchor.web3.Keypair.generate();
  const alice = anchor.web3.Keypair.generate();
  const charlie = anchor.web3.Keypair.generate();

  const topic_bob1 = "Hello There";
  const content_bob1 = "This is my first tweet on this app, I like it here!";

  const topic_bob2 =
    "This Topic is too long bla bla bla bla bla bla bla bla bla bla bla bla";
  const content_bob2 = "This topic is too long , but I wanna try it !!";

  const topic_bob3 = "We have content too long";
  const content = "ten bytes!";
  let content_500_bytes = content.repeat(50);
  const content_bob3 = content_500_bytes + "+1";

  const topic_bob4 = "I don`t like Alice";
  const content_bob4 = "I bet Alice will dislikes this!";

  const comment_tmp = "I don`t like you Bob!";
  const comment_alice1 = comment_tmp.repeat(24);

  const comment_alice2 = "I dont`t like you Bob. It is enough if I say it once";

  const topic_edge_case = "A".repeat(32);
  const content_edge_case = "B".repeat(500);
  const empty_topic = "";
  const empty_content = "";
  const single_char_topic = "X";
  const single_char_content = "Y";
  const unicode_topic = "🚀 Crypto";
  const unicode_content = "Testing with emojis 🎉✨🔥";

  describe("Add Post", async () => {
    it("Should successfully create a post with valid topic and content", async () => {
      await airdrop(provider.connection, bob.publicKey);
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd(topic_bob1, content_bob1)
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob1,
        content_bob1,
        0,
        0,
        post_bump
      );
    });

    it("Should successfully create post with exactly 32-byte topic (boundary test)", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_edge_case,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd(topic_edge_case, content_bob1)
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_edge_case,
        content_bob1,
        0,
        0,
        post_bump
      );
    });

    it("Should successfully create post with exactly 500-byte content (boundary test)", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        "EdgeContent",
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd("EdgeContent", content_edge_case)
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        "EdgeContent",
        content_edge_case,
        0,
        0,
        post_bump
      );
    });

    it("Should successfully create post with empty content", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        "EmptyContent",
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd("EmptyContent", empty_content)
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        "EmptyContent",
        empty_content,
        0,
        0,
        post_bump
      );
    });

    it("Should successfully create post with single character topic and content", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        single_char_topic,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd(single_char_topic, single_char_content)
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        single_char_topic,
        single_char_content,
        0,
        0,
        post_bump
      );
    });

    it("Should successfully add post with unicode characters and emojis", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        unicode_topic,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd(unicode_topic, unicode_content)
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        unicode_topic,
        unicode_content,
        0,
        0,
        post_bump
      );
    });

    it("Should fail to add post when topic exceeds 32 bytes", async () => {
      let should_fail = "This Should Fail";
      try {
        const [post_pkey, post_bump] = getPostAddress(
          topic_bob2,
          bob.publicKey,
          program.programId
        );

        await program.methods
          .postAdd(topic_bob2, content_bob2)
          .accounts({
            postAuthor: bob.publicKey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        assert.strictEqual(
          error.message,
          "Max seed length exceeded",
          "Expected 'Max seed length exceeded' error for topic longer than 32 bytes"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Tweet initialization should have failed with topic longer than 32 bytes"
      );
    });

    it("Should fail to add post when content exceeds 500 bytes", async () => {
      let should_fail = "This Should Fail";
      try {
        const [post_pkey, post_bump] = getPostAddress(
          topic_bob3,
          bob.publicKey,
          program.programId
        );

        await program.methods
          .postAdd(topic_bob3, content_bob3)
          .accounts({
            postAuthor: bob.publicKey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "ContentTooLong",
          "Expected 'ContentTooLong' error for content longer than 500 bytes"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Tweet initialization should have failed with content longer than 500 bytes"
      );
    });

    it("Should fail to add duplicate post with same topic and author", async () => {
      let should_fail = "This Should Fail";
      try {
        const [post_pkey, post_bump] = getPostAddress(
          topic_bob1,
          bob.publicKey,
          program.programId
        );

        await program.methods
          .postAdd(topic_bob1, "Different content")
          .accounts({
            postAuthor: bob.publicKey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error for duplicate tweet with same topic and author"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Tweet initialization should have failed when trying to create duplicate tweet with same topic and author"
      );
    });

    it("Should successfully initialize second post with different topic for same author", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd(topic_bob4, content_bob4)
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob4,
        content_bob4,
        0,
        0,
        post_bump
      );
    });

    it("Should allow different users to create posts with same topic", async () => {
      await airdrop(provider.connection, charlie.publicKey);
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        charlie.publicKey,
        program.programId
      );

      await program.methods
        .postAdd(topic_bob1, "Charlie's version")
        .accounts({
          postAuthor: charlie.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([charlie])
        .rpc({ commitment: "confirmed" });

      await checkPost(
        program,
        post_pkey,
        charlie.publicKey,
        topic_bob1,
        "Charlie's version",
        0,
        0,
        post_bump
      );
    });
  });

  describe("Remove Post", async () => {
    it("Should successfully remove existing post and close its account", async () => {
      const removableTopic = "RemovablePost";
      const [post_pkey, post_bump] = getPostAddress(
        removableTopic,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd(removableTopic, "This post will be removed")
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        removableTopic,
        "This post will be removed",
        0,
        0,
        post_bump
      );

      await program.methods
        .postRemove()
        .accounts({
          post: post_pkey,
          postAuthor: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      let should_fail = "This should fail";
      try {
        let postData = await program.account.post.fetch(post_pkey);
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist or has no data"),
          "Post account should be deleted after removal"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Post account should not exist after being removed"
      );
    });

    it("Should fail when attempting to remove non-existent post", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        "NonExistentPost",
        bob.publicKey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .postRemove()
          .accounts({
            post: post_pkey,
            postAuthor: bob.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when trying to remove non-existent post"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to remove a non-existent post"
      );
    });

    it("Should fail when attempting to remove another user's post", async () => {
      const unauthorizedTopic = "UnauthorizedRemove";
      const [post_pkey, post_bump] = getPostAddress(
        unauthorizedTopic,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .postAdd(unauthorizedTopic, "Only Bob can delete this")
        .accounts({
          postAuthor: bob.publicKey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      let should_fail = "This should fail";
      try {
        await program.methods
          .postRemove()
          .accounts({
            post: post_pkey,
            postAuthor: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("constraint") ||
            error.message.includes("seeds"),
          "Expected constraint or seeds error when trying to remove someone else's post"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to remove someone else's post (authorization check)"
      );
    });
  });

  describe("Add Post Reaction", async () => {
    it("Should successfully add like reaction to post", async () => {
      await airdrop(provider.connection, alice.publicKey);

      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .likePost()
        .accounts({
          reactionAuthor: alice.publicKey,
          postReaction: reaction_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob1,
        content_bob1,
        1,
        0,
        post_bump
      );
      await checkPostReaction(
        program,
        reaction_pkey,
        alice.publicKey,
        post_pkey,
        reaction_bump
      );
    });

    it("Should correctly set reaction type to 'like' enum variant", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let reactionData =
        await program.account.reactionPost.fetch(reaction_pkey);
      assert.deepEqual(
        reactionData.reaction,
        { like: {} },
        "Reaction type should be set to 'like' enum variant"
      );
    });

    it("Should fail when attempting to like the same post twice", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .likePost()
          .accounts({
            reactionAuthor: alice.publicKey,
            postReaction: reaction_pkey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error when trying to like the same tweet twice"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to like the same post twice"
      );
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob1,
        content_bob1,
        1,
        0,
        post_bump
      );
    });

    it("Should fail when attempting to dislike a post that is already liked", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .dislikePost()
          .accounts({
            reactionAuthor: alice.publicKey,
            postReaction: reaction_pkey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error when trying to dislike a tweet that is already liked"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to dislike a post that is already liked (reaction account already exists)"
      );

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob1,
        content_bob1,
        1,
        0,
        post_bump
      );
    });

    it("Should successfully add dislike reaction to different post", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .dislikePost()
        .accounts({
          reactionAuthor: alice.publicKey,
          postReaction: reaction_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob4,
        content_bob4,
        0,
        1,
        post_bump
      );
      await checkPostReaction(
        program,
        reaction_pkey,
        alice.publicKey,
        post_pkey,
        reaction_bump
      );
    });

    it("Should correctly set reaction type to 'dislike' enum variant", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let reactionData =
        await program.account.reactionPost.fetch(reaction_pkey);
      assert.deepEqual(
        reactionData.reaction,
        { dislike: {} },
        "Reaction type should be set to 'dislike' enum variant"
      );
    });

    it("Should fail when attempting to dislike the same post twice", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .dislikePost()
          .accounts({
            reactionAuthor: alice.publicKey,
            postReaction: reaction_pkey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error when trying to dislike the same tweet twice"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to dislike the same post twice"
      );

      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob4,
        content_bob4,
        0,
        1,
        post_bump
      );

      try {
        await program.methods
          .likePost()
          .accounts({
            reactionAuthor: alice.publicKey,
            postReaction: reaction_pkey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error when trying to like a tweet that is already disliked"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to like a tweet that is already disliked (reaction account already exists)"
      );
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob4,
        content_bob4,
        0,
        1,
        post_bump
      );
    });

    it("Should allow multiple users to react to the same tweet", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        charlie.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .likePost()
        .accounts({
          reactionAuthor: charlie.publicKey,
          postReaction: reaction_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([charlie])
        .rpc({ commitment: "confirmed" });

      // Tweet should now have 2 likes (Alice + Charlie)
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob1,
        content_bob1,
        2,
        0,
        post_bump
      );
      await checkPostReaction(
        program,
        reaction_pkey,
        charlie.publicKey,
        post_pkey,
        reaction_bump
      );
    });

    it("Should fail when attempting to react to non-existent tweet", async () => {
      const [fake_post_pkey, fake_post_bump] = getPostAddress(
        "NonExistent",
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        fake_post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .likePost()
          .accounts({
            reactionAuthor: alice.publicKey,
            postReaction: reaction_pkey,
            post: fake_post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when trying to react to non-existent tweet"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to react to a non-existent tweet"
      );
    });
  });

  describe("Remove Post Reaction", async () => {
    it("Should successfully remove existing reaction from tweet", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .reactionRemovePost()
        .accounts({
          reactionAuthor: alice.publicKey,
          postReaction: reaction_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob4,
        content_bob4,
        0,
        0,
        post_bump
      );
    });

    it("Should properly delete reaction account after removal", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        let reactionData =
          await program.account.reactionPost.fetch(reaction_pkey);
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist or has no data"),
          "Reaction account should be deleted after removal"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Reaction account should not exist after being removed"
      );
    });

    it("Should allow adding new reaction after previous reaction was removed", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .likePost()
        .accounts({
          reactionAuthor: alice.publicKey,
          postReaction: reaction_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob4,
        content_bob4,
        1,
        0,
        post_bump
      );
      await checkPostReaction(
        program,
        reaction_pkey,
        alice.publicKey,
        post_pkey,
        reaction_bump
      );
    });

    it("Should fail when attempting to remove non-existent reaction", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        charlie.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        bob.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .reactionRemovePost()
          .accounts({
            reactionAuthor: bob.publicKey,
            postReaction: reaction_pkey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when trying to remove non-existent reaction"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to remove a non-existent reaction"
      );
    });

    it("Should fail when attempting to remove another user's reaction", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        charlie.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .reactionRemovePost()
          .accounts({
            reactionAuthor: alice.publicKey, // Alice trying to remove Charlie's reaction
            postReaction: reaction_pkey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        // This should fail due to account constraint mismatch
        assert.isTrue(
          error.message.includes("constraint") ||
            error.message.includes("seeds"),
          "Expected constraint or seeds error when trying to remove someone else's reaction"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to remove someone else's reaction (authorization check)"
      );
    });
  });

  describe("Add Comment", async () => {
    it("Should fail when attempting to add comment exceeding length limit", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [comment_pkey, comment_bump] = getCommentAddress(
        comment_alice1,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This Should Fail";
      try {
        await program.methods
          .commentAdd(comment_alice1)
          .accounts({
            commentAuthor: alice.publicKey,
            comment: comment_pkey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "CommentTooLong",
          "Expected 'CommentTooLong' error for comment longer than 500 bytes"
        );
        should_fail = "Failed";
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Comment creation should have failed with comment longer than 500 bytes"
      );
    });

    it("Should successfully add comment with valid length to tweet", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [comment_pkey, comment_bump] = getCommentAddress(
        comment_alice2,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .commentAdd(comment_alice2)
        .accounts({
          commentAuthor: alice.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
      await checkComment(
        program,
        comment_pkey,
        alice.publicKey,
        post_pkey,
        comment_alice2,
        comment_bump
      );
    });

    it("Should successfully add comment with exactly 500 characters (boundary test)", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const max_comment = "C".repeat(500);
      const [comment_pkey, comment_bump] = getCommentAddress(
        max_comment,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .commentAdd(max_comment)
        .accounts({
          commentAuthor: alice.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkComment(
        program,
        comment_pkey,
        alice.publicKey,
        post_pkey,
        max_comment,
        comment_bump
      );
    });

    it("Should successfully add empty comment to tweet", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const empty_comment = "";
      const [comment_pkey, comment_bump] = getCommentAddress(
        empty_comment,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .commentAdd(empty_comment)
        .accounts({
          commentAuthor: alice.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkComment(
        program,
        comment_pkey,
        alice.publicKey,
        post_pkey,
        empty_comment,
        comment_bump
      );
    });

    it("Should successfully add comment with unicode characters and emojis", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const unicode_comment = "Great tweet! 🎉✨ Love it! 💯";
      const [comment_pkey, comment_bump] = getCommentAddress(
        unicode_comment,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .commentAdd(unicode_comment)
        .accounts({
          commentAuthor: alice.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkComment(
        program,
        comment_pkey,
        alice.publicKey,
        post_pkey,
        unicode_comment,
        comment_bump
      );
    });

    it("Should allow multiple users to comment on the same tweet", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const charlie_comment = "Charlie's comment here";
      const [comment_pkey, comment_bump] = getCommentAddress(
        charlie_comment,
        charlie.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .commentAdd(charlie_comment)
        .accounts({
          commentAuthor: charlie.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([charlie])
        .rpc({ commitment: "confirmed" });

      await checkComment(
        program,
        comment_pkey,
        charlie.publicKey,
        post_pkey,
        charlie_comment,
        comment_bump
      );
    });

    it("Should fail when attempting to comment on non-existent tweet", async () => {
      const [fake_post_pkey, fake_post_bump] = getPostAddress(
        "FakeTweet",
        bob.publicKey,
        program.programId
      );
      const test_comment = "This should fail";
      const [comment_pkey, comment_bump] = getCommentAddress(
        test_comment,
        alice.publicKey,
        fake_post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .commentAdd(test_comment)
          .accounts({
            commentAuthor: alice.publicKey,
            comment: comment_pkey,
            post: fake_post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when trying to comment on non-existent tweet"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to comment on a non-existent tweet"
      );
    });

    it("Should fail when attempting to create duplicate comment with same content", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [comment_pkey, comment_bump] = getCommentAddress(
        comment_alice2,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .commentAdd(comment_alice2)
          .accounts({
            commentAuthor: alice.publicKey,
            comment: comment_pkey,
            post: post_pkey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error when trying to create duplicate comment"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to create duplicate comment with same content from same user"
      );
    });
  });

  describe("Remove Comment", async () => {
    it("Should successfully remove existing comment from tweet", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [comment_pkey, comment_bump] = getCommentAddress(
        comment_alice2,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .commentRemove()
        .accounts({
          commentAuthor: alice.publicKey,
          comment: comment_pkey,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      let thisShouldFail = "This should fail";
      try {
        let commentData = await program.account.comment.fetch(comment_pkey);
      } catch (error) {
        thisShouldFail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist or has no data"),
          "Comment account should be deleted after removal"
        );
      }
      assert.strictEqual(
        thisShouldFail,
        "Failed",
        "Comment account should not exist after being removed"
      );
    });

    it("Should fail when attempting to remove non-existent comment", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const fake_comment = "This comment doesn't exist";
      const [comment_pkey, comment_bump] = getCommentAddress(
        fake_comment,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .commentRemove()
          .accounts({
            commentAuthor: alice.publicKey,
            comment: comment_pkey,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when trying to remove non-existent comment"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to remove a non-existent comment"
      );
    });

    it("Should fail when attempting to remove another user's comment", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const unicode_comment = "Great tweet! 🎉✨ Love it! 💯";
      const [comment_pkey, comment_bump] = getCommentAddress(
        unicode_comment,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      let should_fail = "This should fail";
      try {
        await program.methods
          .commentRemove()
          .accounts({
            commentAuthor: charlie.publicKey, // Charlie trying to remove Alice's comment
            comment: comment_pkey,
          })
          .signers([charlie])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("constraint") ||
            error.message.includes("seeds"),
          "Expected constraint or seeds error when trying to remove someone else's comment"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to remove someone else's comment (authorization check)"
      );
    });

    it("Should allow recreating comment with same content after deletion", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [comment_pkey, comment_bump] = getCommentAddress(
        comment_alice2,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      // Recreate the same comment that was deleted
      await program.methods
        .commentAdd(comment_alice2)
        .accounts({
          commentAuthor: alice.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkComment(
        program,
        comment_pkey,
        alice.publicKey,
        post_pkey,
        comment_alice2,
        comment_bump
      );
    });
  });

  describe("Add Comment Reaction", async () => {
    it("Should successfully add like reaction to comment", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [comment_pkey, _comment_bump] = getCommentAddress(
        comment_alice2,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      const [comment_reaction_pkey, comment_reaction_bump] =
        getCommentReactionAddress(
          alice.publicKey,
          comment_pkey,
          program.programId
        );

      await program.methods
        .likeComment()
        .accounts({
          commentReaction: comment_reaction_pkey,
          comment: comment_pkey,
          reactionAuthor: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCommentReaction(
        program,
        comment_reaction_pkey,
        alice.publicKey,
        comment_pkey,
        comment_reaction_bump
      );

      let commentData = await program.account.comment.fetch(comment_pkey);
      assert.strictEqual(
        commentData.likes.toString(),
        new anchor.BN(1).toString(),
        "Comment likes should be 1 after like reaction"
      );
      assert.strictEqual(
        commentData.dislikes.toString(),
        new anchor.BN(0).toString(),
        "Comment dislikes should be 0 after like reaction"
      );
    });

    it("Should successfully add dislike reaction to comment", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const another_comment = "Another comment for reactions";
      const [comment_pkey, _comment_bump] = getCommentAddress(
        another_comment,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .commentAdd(another_comment)
        .accounts({
          commentAuthor: alice.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      const [comment_reaction_pkey, comment_reaction_bump] =
        getCommentReactionAddress(
          alice.publicKey,
          comment_pkey,
          program.programId
        );

      await program.methods
        .dislikeComment()
        .accounts({
          commentReaction: comment_reaction_pkey,
          comment: comment_pkey,
          reactionAuthor: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCommentReaction(
        program,
        comment_reaction_pkey,
        alice.publicKey,
        comment_pkey,
        comment_reaction_bump
      );

      let commentData = await program.account.comment.fetch(comment_pkey);
      assert.strictEqual(
        commentData.likes.toString(),
        new anchor.BN(0).toString(),
        "Comment likes should be 0 after dislike reaction"
      );
      assert.strictEqual(
        commentData.dislikes.toString(),
        new anchor.BN(1).toString(),
        "Comment dislikes should be 1 after dislike reaction"
      );
    });

    it("Should fail when attempting to react to the same comment twice", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [comment_pkey, _comment_bump] = getCommentAddress(
        comment_alice2,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      const [comment_reaction_pkey, _comment_reaction_bump] =
        getCommentReactionAddress(
          alice.publicKey,
          comment_pkey,
          program.programId
        );

      let should_fail = "This should fail";
      try {
        await program.methods
          .likeComment()
          .accounts({
            commentReaction: comment_reaction_pkey,
            comment: comment_pkey,
            reactionAuthor: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          SolanaError.contains(error.logs, "already in use"),
          "Expected 'already in use' error when trying to react to the same comment twice"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to react to the same comment twice"
      );
    });

    it("Should fail when attempting to react to non-existent comment", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        "FakePostForCommentReaction",
        bob.publicKey,
        program.programId
      );
      const fake_comment = "This comment does not exist";
      const [comment_pkey, _comment_bump] = getCommentAddress(
        fake_comment,
        alice.publicKey,
        post_pkey,
        program.programId
      );
      const [comment_reaction_pkey, _comment_reaction_bump] =
        getCommentReactionAddress(
          alice.publicKey,
          comment_pkey,
          program.programId
        );

      let should_fail = "This should fail";
      try {
        await program.methods
          .likeComment()
          .accounts({
            commentReaction: comment_reaction_pkey,
            comment: comment_pkey,
            reactionAuthor: alice.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist") ||
            error.message.includes("AccountNotInitialized"),
          "Expected account not found error when trying to react to non-existent comment"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Should not be able to react to a non-existent comment"
      );
    });
  });

  describe("Remove Comment Reaction", async () => {
    it("Should successfully remove existing reaction from comment", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );

      const temp_comment = "Temp comment for remove reaction test";
      const [comment_pkey, _comment_bump] = getCommentAddress(
        temp_comment,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      // Create a fresh comment so its reaction PDA is unused
      await program.methods
        .commentAdd(temp_comment)
        .accounts({
          commentAuthor: alice.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      const [comment_reaction_pkey, _comment_reaction_bump] =
        getCommentReactionAddress(
          alice.publicKey,
          comment_pkey,
          program.programId
        );

      await program.methods
        .likeComment()
        .accounts({
          commentReaction: comment_reaction_pkey,
          comment: comment_pkey,
          reactionAuthor: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await program.methods
        .reactionRemoveComment()
        .accounts({
          commentReaction: comment_reaction_pkey,
          comment: comment_pkey,
          reactionAuthor: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      let should_fail = "This should fail";
      try {
        let reactionData = await program.account.reactionComment.fetch(
          comment_reaction_pkey
        );
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(
          error.message.includes("Account does not exist or has no data"),
          "Comment reaction account should be deleted after removal"
        );
      }
      assert.strictEqual(
        should_fail,
        "Failed",
        "Comment reaction account should not exist after being removed"
      );
    });

    it("Should allow adding new reaction after previous reaction was removed", async () => {
      const [post_pkey, _post_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      const [comment_pkey, _comment_bump] = getCommentAddress(
        comment_alice2,
        alice.publicKey,
        post_pkey,
        program.programId
      );

      const [comment_reaction_pkey, _comment_reaction_bump] =
        getCommentReactionAddress(
          alice.publicKey,
          comment_pkey,
          program.programId
        );

      await program.methods
        .reactionRemoveComment()
        .accounts({
          commentReaction: comment_reaction_pkey,
          comment: comment_pkey,
          reactionAuthor: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await program.methods
        .likeComment()
        .accounts({
          commentReaction: comment_reaction_pkey,
          comment: comment_pkey,
          reactionAuthor: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      await checkCommentReaction(
        program,
        comment_reaction_pkey,
        alice.publicKey,
        comment_pkey,
        undefined
      );
    });
  });

  describe("Edge Cases and Error Handling", async () => {
    it("Should allow post author to react to their own post", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const [reaction_pkey, reaction_bump] = getPostReactionAddress(
        bob.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .dislikePost()
        .accounts({
          reactionAuthor: bob.publicKey,
          postReaction: reaction_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      // Post should now have 2 likes and 1 dislike (Alice+Charlie likes, Bob dislike)
      await checkPost(
        program,
        post_pkey,
        bob.publicKey,
        topic_bob1,
        content_bob1,
        2,
        1,
        post_bump
      );
    });

    it("Should allow post author to comment on their own post", async () => {
      const [post_pkey, post_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      const bob_comment = "Thanks for the likes everyone!";
      const [comment_pkey, comment_bump] = getCommentAddress(
        bob_comment,
        bob.publicKey,
        post_pkey,
        program.programId
      );

      await program.methods
        .commentAdd(bob_comment)
        .accounts({
          commentAuthor: bob.publicKey,
          comment: comment_pkey,
          post: post_pkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkComment(
        program,
        comment_pkey,
        bob.publicKey,
        post_pkey,
        bob_comment,
        comment_bump
      );
    });

    it("Should maintain correct final state across all tweets and reactions", async () => {
      // Bob's first tweet should have: 2 likes, 1 dislike
      const [post1_pkey, post1_bump] = getPostAddress(
        topic_bob1,
        bob.publicKey,
        program.programId
      );
      await checkPost(
        program,
        post1_pkey,
        bob.publicKey,
        topic_bob1,
        content_bob1,
        2,
        1,
        post1_bump
      );

      // Bob's second tweet should have: 1 like, 0 dislikes
      const [post2_pkey, post2_bump] = getPostAddress(
        topic_bob4,
        bob.publicKey,
        program.programId
      );
      await checkPost(
        program,
        post2_pkey,
        bob.publicKey,
        topic_bob4,
        content_bob4,
        1,
        0,
        post2_bump
      );

      // Charlie's tweet should have: 0 likes, 0 dislikes
      const [post3_pkey, post3_bump] = getPostAddress(
        topic_bob1,
        charlie.publicKey,
        program.programId
      );
      await checkPost(
        program,
        post3_pkey,
        charlie.publicKey,
        topic_bob1,
        "Charlie's version",
        0,
        0,
        post3_bump
      );
    });
  });
});

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}

function getCommentAddress(
  comment_content: string,
  author: PublicKey,
  parent_tweet: PublicKey,
  programID: PublicKey
) {
  let hexString = crypto
    .createHash("sha256")
    .update(comment_content, "utf-8")
    .digest("hex");
  let content_seed = Uint8Array.from(Buffer.from(hexString, "hex"));

  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(COMMENT_SEED),
      author.toBuffer(),
      content_seed,
      parent_tweet.toBuffer(),
    ],
    programID
  );
}

function getPostAddress(
  topic: string,
  author: PublicKey,
  programID: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(POST_SEED),
      anchor.utils.bytes.utf8.encode(topic),
      author.toBuffer(),
    ],
    programID
  );
}

function getPostReactionAddress(
  author: PublicKey,
  post: PublicKey,
  programID: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(POST_REACTION),
      author.toBuffer(),
      post.toBuffer(),
    ],
    programID
  );
}

function getCommentReactionAddress(
  author: PublicKey,
  comment: PublicKey,
  programID: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(COMMENT_REACTION),
      author.toBuffer(),
      comment.toBuffer(),
    ],
    programID
  );
}

class SolanaError {
  static contains(logs, error): boolean {
    const match = logs?.filter((s) => s.includes(error));
    return Boolean(match?.length);
  }
}

async function checkPost(
  program: anchor.Program<Depress>,
  tweet: PublicKey,
  tweet_author?: PublicKey,
  topic?: string,
  content?: string,
  likes?: number,
  dislikes?: number,
  bump?: number
) {
  let postData = await program.account.post.fetch(tweet);

  if (tweet_author) {
    assert.strictEqual(
      postData.postAuthor.toString(),
      tweet_author.toString(),
      `Post author should be ${tweet_author.toString()} but was ${postData.postAuthor.toString()}`
    );
  }
  if (topic) {
    assert.strictEqual(
      postData.topic,
      topic,
      `Post topic should be "${topic}" but was "${postData.topic}"`
    );
  }
  if (content) {
    assert.strictEqual(
      postData.content,
      content,
      `Post content should be "${content}" but was "${postData.content}"`
    );
  }
  if (likes || likes == 0) {
    assert.strictEqual(
      postData.likes.toString(),
      new anchor.BN(likes).toString(),
      `Post likes should be ${likes} but was ${postData.likes.toString()}`
    );
  }
  if (dislikes || dislikes == 0) {
    assert.strictEqual(
      postData.dislikes.toString(),
      new anchor.BN(dislikes).toString(),
      `Post dislikes should be ${dislikes} but was ${postData.dislikes.toString()}`
    );
  }
  if (bump) {
    assert.strictEqual(
      postData.bump.toString(),
      bump.toString(),
      `Post bump should be ${bump} but was ${postData.bump}`
    );
  }
}

async function checkPostReaction(
  program: anchor.Program<Depress>,
  reaction: PublicKey,
  reaction_author?: PublicKey,
  parent_post?: PublicKey,
  bump?: number
) {
  let reactionData = await program.account.reactionPost.fetch(reaction);

  if (reaction_author) {
    assert.strictEqual(
      reactionData.reactionAuthor.toString(),
      reaction_author.toString(),
      `Reaction author should be ${reaction_author.toString()} but was ${reactionData.reactionAuthor.toString()}`
    );
  }
  if (parent_post) {
    assert.strictEqual(
      reactionData.parentPost.toString(),
      parent_post.toString(),
      `Reaction parent post should be ${parent_post.toString()} but was ${reactionData.parentPost.toString()}`
    );
  }
  if (bump) {
    assert.strictEqual(
      reactionData.bump.toString(),
      bump.toString(),
      `Reaction bump should be ${bump} but was ${reactionData.bump}`
    );
  }
}

async function checkCommentReaction(
  program: anchor.Program<Depress>,
  reaction: PublicKey,
  reaction_author?: PublicKey,
  parent_comment?: PublicKey,
  bump?: number
) {
  let reactionData = await program.account.reactionComment.fetch(reaction);

  if (reaction_author) {
    assert.strictEqual(
      reactionData.reactionAuthor.toString(),
      reaction_author.toString(),
      `Comment reaction author should be ${reaction_author.toString()} but was ${reactionData.reactionAuthor.toString()}`
    );
  }
  if (parent_comment) {
    assert.strictEqual(
      reactionData.parentComment.toString(),
      parent_comment.toString(),
      `Comment reaction parent comment should be ${parent_comment.toString()} but was ${reactionData.parentComment.toString()}`
    );
  }
  if (bump) {
    assert.strictEqual(
      reactionData.bump.toString(),
      bump.toString(),
      `Comment reaction bump should be ${bump} but was ${reactionData.bump}`
    );
  }
}

async function checkComment(
  program: anchor.Program<Depress>,
  comment: PublicKey,
  comment_author?: PublicKey,
  parent_post?: PublicKey,
  content?: string,
  bump?: number
) {
  let commentData = await program.account.comment.fetch(comment);

  if (comment_author) {
    assert.strictEqual(
      commentData.commentAuthor.toString(),
      comment_author.toString(),
      `Comment author should be ${comment_author.toString()} but was ${commentData.commentAuthor.toString()}`
    );
  }
  if (parent_post) {
    assert.strictEqual(
      commentData.parentPost.toString(),
      parent_post.toString(),
      `Comment parent post should be ${parent_post.toString()} but was ${commentData.parentPost.toString()}`
    );
  }
  if (content) {
    assert.strictEqual(
      commentData.content,
      content,
      `Comment content should be "${content}" but was "${commentData.content}"`
    );
  }
  if (bump) {
    assert.strictEqual(
      commentData.bump.toString(),
      bump.toString(),
      `Comment bump should be ${bump} but was ${commentData.bump}`
    );
  }
}
