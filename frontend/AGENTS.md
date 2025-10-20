# Project Frontend Agents Guide

## Build/Lint/Test Commands

### Development

- Run development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`

### Testing

- Run tests: `npm test`
- Run tests with coverage: `npm test -- --coverage`

### Linting

- Lint code: `npm run lint`

## Code Style Guidelines

### TypeScript/JavaScript

- Use Next.js 14 with React Server Components
- Use TypeScript for type safety
- Follow ESLint configuration with Next.js core web vitals

### Styling

- Use Tailwind CSS for styling with configured design tokens
- Use shadcn/ui components when available
- Follow established className conventions

### State Management

- Use TanStack Query for data fetching and state management
- Use Zustand for global state management
- Use React hooks for component state

### Component Development

- Use functional components with TypeScript interfaces
- Follow established patterns in components/ui/
- Use Lucide React for icons

## Project-Specific Conventions

### Architecture

- Pages are located in `app/` directory with App Router structure
- Components are organized in `components/` directory
- Shared hooks and utilities in `lib/` directory
- API services defined in `lib/api.ts`

### Data Handling

- API calls use axios with configured base URL
- File uploads use react-dropzone
- Data visualization uses recharts

### Routing

- File-based routing follows Next.js App Router conventions
- Dynamic routes use bracket notation (e.g., `[id]`)
- Route segments are nested appropriately

### Environment Variables

- Public environment variables prefixed with `NEXT_PUBLIC_`
- API URL configured via `NEXT_PUBLIC_API_URL`
