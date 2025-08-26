# Smart Web - Frontend Application

A modern, responsive web application built with React, TypeScript, Vite, and Tailwind CSS.

## 🚀 Features

- **React 18** - Latest React features and hooks
- **TypeScript** - Type-safe development experience
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Responsive Design** - Mobile-first approach
- **Modern UI Components** - Reusable component library
- **Custom Hooks** - Shared logic and state management

## 📁 Project Structure

```
src/
├── assets/          # Static assets (images, icons, etc.)
├── components/      # Reusable UI components
├── hooks/          # Custom React hooks
├── images/         # Image assets
├── pages/          # Page components
├── services/       # API services and utilities
└── styles/         # Global styles and Tailwind config
```

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Hooks
- **HTTP Client**: Fetch API
- **Font**: Inter (Google Fonts)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FE_Smart_Web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Customization

### Colors

The project uses a custom color palette defined in `tailwind.config.js`:

- **Primary**: Blue shades (primary-50 to primary-900)
- **Secondary**: Gray shades (secondary-50 to secondary-900)

### Components

Reusable components are available in `src/components/`:

- `Button` - Various button styles and states
- `Card` - Card containers with different variants
- `Input` - Form input with validation support
- `Layout` - Main layout with header and navigation

### Styling

Global styles and utility classes are defined in `src/styles/index.css`:

- Custom button styles (`.btn`, `.btn-primary`, `.btn-secondary`)
- Card styles (`.card`)
- Input styles (`.input`)
- Custom animations and keyframes

## 📱 Responsive Design

The application is built with a mobile-first approach using Tailwind CSS responsive utilities:

- **Mobile**: Default styles (no prefix)
- **Tablet**: `md:` prefix (768px+)
- **Desktop**: `lg:` prefix (1024px+)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### TypeScript

TypeScript configuration is in `tsconfig.json` with path mapping for clean imports:

```json
{
  "paths": {
    "@/*": ["src/*"],
    "@/components/*": ["src/components/*"],
    "@/pages/*": ["src/pages/*"]
  }
}
```

## 📦 Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## 🚀 Deployment

The application can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repository
- **Netlify**: Drag and drop the `dist/` folder
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **AWS S3**: Upload the `dist/` folder to an S3 bucket

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
