'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import {
  useAddComment,
  useAddPost,
  useDislikeComment,
  useDislikePost,
  useGetComments,
  useGetPosts,
  useLikeComment,
  useLikePost,
  useRemoveComment,
  useRemoveCommentReaction,
  useRemovePost,
  useRemovePostReaction,
} from './post-data-access'

export function PostCreate() {
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const addPost = useAddPost()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !content.trim()) return

    try {
      await addPost.mutateAsync({ topic: topic.trim(), content: content.trim() })
      setTopic('')
      setContent('')
    } catch (error) {
      console.error('Failed to add post:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg border shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Create New Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic (max 32 chars)"
            maxLength={32}
            required
          />
        </div>
        <div>
          <Label htmlFor="content">Content</Label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter post content (max 500 chars)"
            maxLength={500}
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            required
          />
        </div>
        <Button type="submit" disabled={addPost.isPending || !topic.trim() || !content.trim()} className="w-full">
          {addPost.isPending ? 'Creating...' : 'Create Post'}
        </Button>
      </form>
    </div>
  )
}

export function PostList() {
  const removePost = useRemovePost()
  const likePost = useLikePost()
  const dislikePost = useDislikePost()
  const removeReaction = useRemovePostReaction()
  const { data: posts, isLoading, isError } = useGetPosts()
  const [removingTopic, setRemovingTopic] = useState<string | null>(null)
  const [reactingPubkey, setReactingPubkey] = useState<string | null>(null)

  const handleRemove = async (topic: string) => {
    try {
      setRemovingTopic(topic)
      await removePost.mutateAsync({ topic })
    } catch (error) {
      console.error('Failed to remove post:', error)
    } finally {
      setRemovingTopic(null)
    }
  }

  const handleLike = async (postPubkey: string) => {
    try {
      setReactingPubkey(postPubkey)
      await likePost.mutateAsync({ postPubkey: posts!.find((p) => p.pubkey.toBase58() === postPubkey)!.pubkey })
    } catch (error) {
      console.error('Failed to like post:', error)
    } finally {
      setReactingPubkey(null)
    }
  }

  const handleDislike = async (postPubkey: string) => {
    try {
      setReactingPubkey(postPubkey)
      await dislikePost.mutateAsync({ postPubkey: posts!.find((p) => p.pubkey.toBase58() === postPubkey)!.pubkey })
    } catch (error) {
      console.error('Failed to dislike post:', error)
    } finally {
      setReactingPubkey(null)
    }
  }

  const handleRemoveReaction = async (postPubkey: string) => {
    try {
      setReactingPubkey(postPubkey)
      await removeReaction.mutateAsync({ postPubkey: posts!.find((p) => p.pubkey.toBase58() === postPubkey)!.pubkey })
    } catch (error) {
      console.error('Failed to remove reaction:', error)
    } finally {
      setReactingPubkey(null)
    }
  }

  const isEmpty = !posts || posts.length === 0

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-lg font-semibold mb-4">Posts</h2>
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : isError || isEmpty ? (
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-muted-foreground">No posts yet. Create your first post above!</p>
          </div>
        ) : (
          posts.map((post) => {
            const postKey = post.pubkey.toBase58()
            const isReacting = reactingPubkey === postKey

            return (
              <div key={postKey} className="p-4 bg-card rounded-lg border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{post.topic}</h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(post.topic)}
                    disabled={removingTopic === post.topic}
                  >
                    {removingTopic === post.topic ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">By: {post.author.toBase58()}</p>
                <p className="text-sm mb-2">{post.content}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>👍 {post.likes}</span>
                  <span>👎 {post.dislikes}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleLike(postKey)} disabled={isReacting}>
                    {isReacting && likePost.isPending ? 'Liking...' : 'Like'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDislike(postKey)} disabled={isReacting}>
                    {isReacting && dislikePost.isPending ? 'Disliking...' : 'Dislike'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveReaction(postKey)}
                    disabled={isReacting}
                  >
                    {isReacting && removeReaction.isPending ? 'Clearing...' : 'Clear Reaction'}
                  </Button>
                </div>
                <CommentsSection postPubkey={post.pubkey} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function CommentsSection({ postPubkey }: { postPubkey: import('@solana/web3.js').PublicKey }) {
  const { publicKey } = useWallet()
  const { data: comments, isLoading, isError } = useGetComments(postPubkey)
  const addComment = useAddComment()
  const removeComment = useRemoveComment()
  const likeComment = useLikeComment()
  const dislikeComment = useDislikeComment()
  const removeCommentReaction = useRemoveCommentReaction()
  const [content, setContent] = useState('')
  const [removingCommentPubkey, setRemovingCommentPubkey] = useState<string | null>(null)
  const [reactingCommentPubkey, setReactingCommentPubkey] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await addComment.mutateAsync({ postPubkey, content: content.trim() })
      setContent('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleRemoveComment = async (commentPubkey: import('@solana/web3.js').PublicKey) => {
    try {
      setRemovingCommentPubkey(commentPubkey.toBase58())
      await removeComment.mutateAsync({ commentPubkey, parentPostPubkey: postPubkey })
    } catch (error) {
      console.error('Failed to remove comment:', error)
    } finally {
      setRemovingCommentPubkey(null)
    }
  }

  const handleLikeComment = async (commentPubkey: string) => {
    try {
      setReactingCommentPubkey(commentPubkey)
      await likeComment.mutateAsync({
        commentPubkey: comments!.find((c) => c.pubkey.toBase58() === commentPubkey)!.pubkey,
        parentPostPubkey: postPubkey,
      })
    } catch (error) {
      console.error('Failed to like comment:', error)
    } finally {
      setReactingCommentPubkey(null)
    }
  }

  const handleDislikeComment = async (commentPubkey: string) => {
    try {
      setReactingCommentPubkey(commentPubkey)
      await dislikeComment.mutateAsync({
        commentPubkey: comments!.find((c) => c.pubkey.toBase58() === commentPubkey)!.pubkey,
        parentPostPubkey: postPubkey,
      })
    } catch (error) {
      console.error('Failed to dislike comment:', error)
    } finally {
      setReactingCommentPubkey(null)
    }
  }

  const handleRemoveCommentReaction = async (commentPubkey: string) => {
    try {
      setReactingCommentPubkey(commentPubkey)
      await removeCommentReaction.mutateAsync({
        commentPubkey: comments!.find((c) => c.pubkey.toBase58() === commentPubkey)!.pubkey,
        parentPostPubkey: postPubkey,
      })
    } catch (error) {
      console.error('Failed to remove comment reaction:', error)
    } finally {
      setReactingCommentPubkey(null)
    }
  }

  return (
    <div className="mt-4 border-t pt-3 space-y-3">
      <h4 className="font-medium text-sm">Comments</h4>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      ) : isError || !comments || comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => {
            const commentKey = comment.pubkey.toBase58()
            const isReacting = reactingCommentPubkey === commentKey

            return (
              <div key={commentKey} className="text-xs border rounded p-2 bg-muted/50">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex-1">
                    <p className="text-muted-foreground mb-0.5">By: {comment.author.toBase58()}</p>
                    <p>{comment.content}</p>
                  </div>
                  {publicKey && publicKey.equals(comment.author) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleRemoveComment(comment.pubkey)}
                      disabled={removingCommentPubkey !== null}
                    >
                      {removingCommentPubkey === comment.pubkey.toBase58() ? 'Removing...' : 'Delete'}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span>👍 {comment.likes}</span>
                  <span>👎 {comment.dislikes}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleLikeComment(commentKey)}
                    disabled={isReacting}
                  >
                    {isReacting && likeComment.isPending ? '...' : '👍'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleDislikeComment(commentKey)}
                    disabled={isReacting}
                  >
                    {isReacting && dislikeComment.isPending ? '...' : '👎'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleRemoveCommentReaction(commentKey)}
                    disabled={isReacting}
                  >
                    {isReacting && removeCommentReaction.isPending ? '...' : 'Clear'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment (max 500 chars)"
          maxLength={500}
        />
        <Button type="submit" size="sm" disabled={addComment.isPending || !content.trim()}>
          {addComment.isPending ? 'Posting...' : 'Comment'}
        </Button>
      </form>
    </div>
  )
}
