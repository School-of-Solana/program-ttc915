'use client'

import { PostCreate, PostList } from './post-ui'

export function PostFeature() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <PostCreate />
      <PostList />
    </div>
  )
}
