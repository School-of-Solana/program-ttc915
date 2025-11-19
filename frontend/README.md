# DePress Frontend

A decentralized social publishing platform built on Solana, where users can create posts, engage with content through comments and reactions, all secured by blockchain technology.

## 🚀 Live Demo

[https://depress.vercel.app/](https://depress.vercel.app/)

## 📋 Features

- **Decentralized Posts**: Create and publish content directly on the Solana blockchain
- **Interactive Comments**: Add comments to posts with full reaction support
- **Like/Dislike System**: React to posts and comments with likes and dislikes
- **User Accounts**: View posts by specific users and manage your own content
- **Wallet Integration**: Connect your Solana wallet to interact with the platform
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix UI components
- **Real-time Updates**: Live data fetching with React Query

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Blockchain**: Solana Web3.js
- **Wallet**: Solana Wallet Adapter
- **State Management**: Jotai
- **Data Fetching**: TanStack React Query
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Theme**: next-themes (Dark/Light mode support)

## 📦 Installation

### Prerequisites

- Node.js 18+ and pnpm
- A Solana wallet (Phantom, Solflare, etc.)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd depress/frontend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**
   The app uses the Solana Devnet by default. For production, update the cluster configuration in the components.

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm ci` - Run build, lint, and format check

## 📖 Usage

### Getting Started

1. **Connect Wallet**: Click "Connect Wallet" and select your Solana wallet
2. **Create Post**: Fill in topic (max 32 chars) and content (max 500 chars), then submit
3. **Interact**: Like/dislike posts, add comments, and explore user content

### Key Features Guide

#### Creating Posts

- Topics must be unique across all posts
- Content supports up to 500 characters
- Posts are permanently stored on Solana blockchain

#### Comments

- Add comments to any post (max 100 characters)
- Like/dislike comments
- Only comment authors can delete their comments

#### Reactions

- Like or dislike posts and comments
- Clear reactions if you change your mind
- Reaction counts update in real-time

#### User Accounts

- View posts by specific users via `/account/[address]`
- Individual posts via `/post/[id]`

## 🏗 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── account/         # User account pages
│   │   ├── post/            # Individual post pages
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   ├── account/         # Account-related components
│   │   ├── cluster/         # Solana cluster management
│   │   ├── post/            # Post creation and display
│   │   ├── solana/          # Solana provider
│   │   ├── ui/              # Reusable UI components
│   │   └── app-*.tsx        # App-level components
│   └── lib/
│       └── utils.ts         # Utility functions
├── public/                  # Static assets
├── lib/                     # Generated IDL and types
└── package.json
```

## 🔗 Integration with Solana Program

This frontend interacts with the DePress Solana program:

- **Program ID**: `5aQmhcFhVmgtmCdGtffRuMYL9R1WsARAtukzxUttPKKN`
- **Network**: Solana Devnet (configurable)
- **IDL**: Located in `lib/idl.json`

The program handles:

- Post creation and management
- Comment system
- Reaction (like/dislike) functionality
- User account associations

## 🎨 UI/UX Features

- **Dark/Light Theme**: Toggle between themes in the header
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Clear feedback during blockchain transactions
- **Error Handling**: User-friendly error messages and toast notifications
- **Accessibility**: Built with Radix UI for screen reader support

## 🔧 Development

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting and error detection
- **Prettier**: Consistent code formatting
- **Pre-commit hooks**: Automatic formatting and linting

### Building for Production

```bash
pnpm build
pnpm start
```

The build output will be in the `dist/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `pnpm ci`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋 Support

For questions or issues:

- Check the [Issues](https://github.com/your-repo/issues) page
- Join our Discord community
- Read the [Solana Documentation](https://docs.solana.com/)

---

Built with ❤️ using Next.js and Solana
