# Sports Event Analyzer

A comprehensive platform designed to provide detailed analysis and insights for various sports events. This application aims to empower users with interactive tools and visualizations to better understand sports performance and event outcomes.

## Table of Contents

- [Project Name](#project-name)
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Name

**Sports Event Analyzer**

## Project Description

The Sports Event Analyzer is developed to analyze and visualize data from sports events. The platform provides detailed metrics, reports, and interactive dashboards to help users understand team performance, player statistics, and game dynamics. Designed with modern web technologies, it emphasizes responsiveness and user-friendly interfaces.

## Tech Stack

- **Astro 5**: For building fast, content-focused websites.
- **TypeScript 5**: Enabling type safety and modern JavaScript features.
- **React 19**: For dynamic and interactive user interfaces.
- **Tailwind CSS 4**: For rapid UI development with utility-first classes.
- **Shadcn/ui**: A set of high-quality UI components for React.

## Testing

- **Unit tests**:
  - Vitest (test runner)
  - @testing-library/react, @testing-library/dom (component and DOM testing)
  - astro/test (Astro component testing)
- **End-to-End (E2E)**:
  - Playwright (UI + API flows)

Additional (used across tests):
- MSW (mocks for API/AI integrations)
- ESLint, Prettier, TypeScript (`tsc --noEmit`) for quality gates

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started Locally

1. **Clone the repository**

   ```sh
   git clone https://github.com/your-username/sports-event-analyzer.git
   cd sports-event-analyzer
   ```

2. **Install dependencies**

   Ensure you have the correct version of Node installed as specified in `.nvmrc`.

   ```sh
   npm install
   ```

3. **Start the development server**

   ```sh
   npm run dev
   ```

4. **Open your browser**

   Visit [http://localhost:3000](http://localhost:3000) to view the project.

## Available Scripts

- **`npm run dev`**: Starts the development server.
- **`npm run build`**: Builds the project for production.
- **`npm run start`**: Runs the compiled project in production mode.
- **`npm run preview`**: Preview production build.
- **`npm run lint`**: Run ESLint.
- **`npm run lint:fix`**: Fix ESLint issues.

## Project Structure

```md
.
├── src/
│   ├── layouts/    # Astro layouts
│   ├── pages/      # Astro pages
│   │   └── api/    # API endpoints
│   ├── components/ # UI components (Astro & React)
│   ├── docs/       # API documentation
│   └── assets/     # Static assets
├── public/         # Public assets
```

## API Documentation

The API documentation is available in OpenAPI/Swagger format in the `src/docs/openapi.yaml` file. 
It contains detailed information about:
- Available endpoints
- Input and output data structures
- Response codes
- Authorization requirements
- Usage examples

To view the API documentation:
1. Install the Swagger Viewer extension in your IDE or
2. Use an online tool like [Swagger Editor](https://editor.swagger.io/)

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Project Scope

The project is designed to:

- Analyze sports event data and generate performance reports.
- Provide interactive dashboards for data visualization.
- Enable users to explore detailed statistics for teams and players.
- Serve as a platform for further development of sports analytics features.

## Project Status

The project is currently under active development. New features are being added regularly with ongoing improvements to performance and user experience.

## License

This project is licensed under the [MIT License](LICENSE).
