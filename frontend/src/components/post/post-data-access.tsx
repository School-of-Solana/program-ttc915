'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Program ID from IDL
const PROGRAM_ID = new PublicKey('5aQmhcFhVmgtmCdGtffRuMYL9R1WsARAtukzxUttPKKN')

// Instruction discriminators from IDL
const POST_ADD_DISCRIMINATOR = Buffer.from([213, 57, 43, 18, 19, 42, 253, 58])
const POST_REMOVE_DISCRIMINATOR = Buffer.from([36, 177, 4, 51, 75, 23, 21, 253])
const LIKE_POST_DISCRIMINATOR = Buffer.from([45, 242, 154, 71, 63, 133, 54, 186])
const DISLIKE_POST_DISCRIMINATOR = Buffer.from([125, 93, 11, 181, 137, 91, 208, 172])
const REACTION_REMOVE_POST_DISCRIMINATOR = Buffer.from([4, 136, 127, 163, 38, 130, 2, 115])

const COMMENT_ADD_DISCRIMINATOR = Buffer.from([215, 10, 22, 221, 120, 68, 190, 200])
const COMMENT_REMOVE_DISCRIMINATOR = Buffer.from([10, 190, 215, 145, 65, 59, 112, 197])
const LIKE_COMMENT_DISCRIMINATOR = Buffer.from([129, 249, 45, 219, 85, 221, 49, 38])
const DISLIKE_COMMENT_DISCRIMINATOR = Buffer.from([252, 185, 13, 225, 160, 175, 162, 52])
const REACTION_REMOVE_COMMENT_DISCRIMINATOR = Buffer.from([144, 102, 112, 23, 197, 17, 99, 254])

// Seeds
const POST_SEED = 'POST_SEED'
const POST_REACTION_SEED = 'POST_REACTION_SEED'
const COMMENT_SEED = 'COMMENT_SEED'
const COMMENT_REACTION_SEED = 'COMMENT_REACTION_SEED'

// Account discriminators
const POST_ACCOUNT_DISCRIMINATOR = Buffer.from([8, 147, 90, 186, 185, 56, 192, 150])
const COMMENT_ACCOUNT_DISCRIMINATOR = Buffer.from([150, 135, 96, 244, 55, 199, 50, 65])

function serializeString(str: string): Buffer {
  const buffer = Buffer.alloc(4 + str.length)
  buffer.writeUInt32LE(str.length, 0)
  buffer.write(str, 4, 'utf8')
  return buffer
}

async function sha256(content: string): Promise<Buffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(new Uint8Array(hash))
}

export function useAddPost() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['add-post', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { topic: string; content: string }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      // Validate lengths
      if (input.topic.length > 32) throw new Error('Topic too long')
      if (input.content.length > 500) throw new Error('Content too long')

      // Find PDA
      const [postPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(POST_SEED), Buffer.from(input.topic), wallet.publicKey.toBuffer()],
        PROGRAM_ID,
      )

      // Create instruction data
      const data = Buffer.concat([POST_ADD_DISCRIMINATOR, serializeString(input.topic), serializeString(input.content)])

      // Create instruction
      const instruction = new TransactionInstruction({
        keys: [
          {
            pubkey: postPda,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: wallet.publicKey,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: PROGRAM_ID,
        data,
      })

      // Create and send transaction
      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      toast.success('Post created successfully!')
      client.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error) => {
      toast.error(`Failed to create post: ${error.message}`)
    },
  })
}

export function useRemovePost() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['remove-post', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { topic: string }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      // Find PDA
      const [postPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(POST_SEED), Buffer.from(input.topic), wallet.publicKey.toBuffer()],
        PROGRAM_ID,
      )

      // Create instruction data
      const data = POST_REMOVE_DISCRIMINATOR

      // Create instruction
      const instruction = new TransactionInstruction({
        keys: [
          {
            pubkey: postPda,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: wallet.publicKey,
            isSigner: true,
            isWritable: true,
          },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: PROGRAM_ID,
        data,
      })

      // Create and send transaction
      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      toast.success('Post removed successfully!')
      client.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error) => {
      toast.error(`Failed to remove post: ${error.message}`)
    },
  })
}

export function useGetPosts() {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['posts', { endpoint: connection.rpcEndpoint }],
    queryFn: async () => {
      const accounts = await connection.getProgramAccounts(PROGRAM_ID)

      const posts = accounts
        .filter((account) => {
          const data = account.account.data
          const discriminator = data.subarray(0, 8)
          return discriminator.equals(POST_ACCOUNT_DISCRIMINATOR)
        })
        .map((account) => {
          const data = account.account.data

          let offset = 8
          const author = new PublicKey(data.subarray(offset, offset + 32))
          offset += 32

          const topicLen = data.readUInt32LE(offset)
          offset += 4
          const topic = data.subarray(offset, offset + topicLen).toString('utf8')
          offset += topicLen

          const contentLen = data.readUInt32LE(offset)
          offset += 4
          const content = data.subarray(offset, offset + contentLen).toString('utf8')
          offset += contentLen

          const likes = Number(data.readBigUInt64LE(offset))
          offset += 8
          const dislikes = Number(data.readBigUInt64LE(offset))
          offset += 8
          const commentCount = data.readUInt32LE(offset)

          return {
            pubkey: account.pubkey,
            author,
            topic,
            content,
            likes,
            dislikes,
            commentCount,
          }
        })

      return posts
    },
  })
}

export function useGetComments(postPubkey: PublicKey) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['comments', { endpoint: connection.rpcEndpoint, post: postPubkey.toBase58() }],
    queryFn: async () => {
      const accounts = await connection.getProgramAccounts(PROGRAM_ID)

      const comments = accounts
        .filter((account) => {
          const data = account.account.data
          const discriminator = data.subarray(0, 8)
          return discriminator.equals(COMMENT_ACCOUNT_DISCRIMINATOR)
        })
        .map((account) => {
          const data = account.account.data

          let offset = 8
          const author = new PublicKey(data.subarray(offset, offset + 32))
          offset += 32

          const parentPost = new PublicKey(data.subarray(offset, offset + 32))
          offset += 32

          const contentLen = data.readUInt32LE(offset)
          offset += 4
          const content = data.subarray(offset, offset + contentLen).toString('utf8')
          offset += contentLen

          const likes = Number(data.readBigUInt64LE(offset))
          offset += 8
          const dislikes = Number(data.readBigUInt64LE(offset))
          offset += 8

          return {
            pubkey: account.pubkey,
            author,
            parentPost,
            content,
            likes,
            dislikes,
          }
        })
        .filter((comment) => comment.parentPost.equals(postPubkey))

      return comments
    },
  })
}

export function useLikePost() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['like-post', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { postPubkey: PublicKey }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const [postReactionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(POST_REACTION_SEED), wallet.publicKey.toBuffer(), input.postPubkey.toBuffer()],
        PROGRAM_ID,
      )

      const data = LIKE_POST_DISCRIMINATOR

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: postReactionPda, isSigner: false, isWritable: true },
          { pubkey: input.postPubkey, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      toast.success('Liked post!')
      client.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error) => {
      toast.error(`Failed to like post: ${error.message}`)
    },
  })
}

export function useDislikePost() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['dislike-post', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { postPubkey: PublicKey }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const [postReactionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(POST_REACTION_SEED), wallet.publicKey.toBuffer(), input.postPubkey.toBuffer()],
        PROGRAM_ID,
      )

      const data = DISLIKE_POST_DISCRIMINATOR

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: postReactionPda, isSigner: false, isWritable: true },
          { pubkey: input.postPubkey, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      toast.success('Disliked post!')
      client.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error) => {
      toast.error(`Failed to dislike post: ${error.message}`)
    },
  })
}

export function useRemovePostReaction() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['remove-post-reaction', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { postPubkey: PublicKey }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const [postReactionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(POST_REACTION_SEED), wallet.publicKey.toBuffer(), input.postPubkey.toBuffer()],
        PROGRAM_ID,
      )

      const data = REACTION_REMOVE_POST_DISCRIMINATOR

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: postReactionPda, isSigner: false, isWritable: true },
          { pubkey: input.postPubkey, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      toast.success('Removed reaction!')
      client.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error) => {
      toast.error(`Failed to remove reaction: ${error.message}`)
    },
  })
}

export function useAddComment() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['add-comment', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { postPubkey: PublicKey; content: string }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      if (!input.content.trim()) throw new Error('Comment cannot be empty')
      if (input.content.length > 500) throw new Error('Comment too long')

      const contentHash = await sha256(input.content)

      const [commentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(COMMENT_SEED), wallet.publicKey.toBuffer(), contentHash, input.postPubkey.toBuffer()],
        PROGRAM_ID,
      )

      const data = Buffer.concat([COMMENT_ADD_DISCRIMINATOR, serializeString(input.content)])

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: input.postPubkey, isSigner: false, isWritable: true },
          { pubkey: commentPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return { signature, postPubkey: input.postPubkey }
    },
    onSuccess: (_data, variables) => {
      toast.success('Comment added successfully!')
      client.invalidateQueries({
        queryKey: ['comments', { endpoint: connection.rpcEndpoint, post: variables.postPubkey.toBase58() }],
      })
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`)
    },
  })
}

export function useRemoveComment() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['remove-comment', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { commentPubkey: PublicKey; parentPostPubkey: PublicKey }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const data = COMMENT_REMOVE_DISCRIMINATOR

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: input.commentPubkey, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return { signature, parentPostPubkey: input.parentPostPubkey }
    },
    onSuccess: (_data, variables) => {
      toast.success('Comment removed successfully!')
      client.invalidateQueries({
        queryKey: ['comments', { endpoint: connection.rpcEndpoint, post: variables.parentPostPubkey.toBase58() }],
      })
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove comment: ${error.message}`)
    },
  })
}

export function useLikeComment() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['like-comment', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { commentPubkey: PublicKey; parentPostPubkey: PublicKey }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const [commentReactionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(COMMENT_REACTION_SEED), wallet.publicKey.toBuffer(), input.commentPubkey.toBuffer()],
        PROGRAM_ID,
      )

      const data = LIKE_COMMENT_DISCRIMINATOR

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: commentReactionPda, isSigner: false, isWritable: true },
          { pubkey: input.commentPubkey, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      toast.success('Liked comment!')
      client.invalidateQueries({ queryKey: ['comments'] })
    },
    onError: (error) => {
      toast.error(`Failed to like comment: ${error.message}`)
    },
  })
}

export function useDislikeComment() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['dislike-comment', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { commentPubkey: PublicKey; parentPostPubkey: PublicKey }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const [commentReactionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(COMMENT_REACTION_SEED), wallet.publicKey.toBuffer(), input.commentPubkey.toBuffer()],
        PROGRAM_ID,
      )

      const data = DISLIKE_COMMENT_DISCRIMINATOR

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: commentReactionPda, isSigner: false, isWritable: true },
          { pubkey: input.commentPubkey, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      toast.success('Disliked comment!')
      client.invalidateQueries({ queryKey: ['comments'] })
    },
    onError: (error) => {
      toast.error(`Failed to dislike comment: ${error.message}`)
    },
  })
}

export function useRemoveCommentReaction() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['remove-comment-reaction', { endpoint: connection.rpcEndpoint }],
    mutationFn: async (input: { commentPubkey: PublicKey; parentPostPubkey: PublicKey }) => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const [commentReactionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(COMMENT_REACTION_SEED), wallet.publicKey.toBuffer(), input.commentPubkey.toBuffer()],
        PROGRAM_ID,
      )

      const data = REACTION_REMOVE_COMMENT_DISCRIMINATOR

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: commentReactionPda, isSigner: false, isWritable: true },
          { pubkey: input.commentPubkey, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      const message = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToLegacyMessage()

      const transaction = new VersionedTransaction(message)
      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      return signature
    },
    onSuccess: () => {
      toast.success('Removed reaction!')
      client.invalidateQueries({ queryKey: ['comments'] })
    },
    onError: (error) => {
      toast.error(`Failed to remove reaction: ${error.message}`)
    },
  })
}
