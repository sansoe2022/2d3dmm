# Myanmar 2D/3D Lottery Summarizer - Frontend

A mobile-first web app for managing Myanmar 2D/3D lottery customer betting records.

---

## Features

- **Customer List** — Add, edit, and delete customer betting records per date and session (morning/evening)
- **Winner Search** — Find all customers who bet on a specific winning number
- **Settings** — Dark mode toggle, Myanmar/English language selector
- **Offline-first** — Works entirely with localStorage
- **Dark mode** — Persisted in localStorage
- **Mobile-first** — Optimized for phones

---

## Frontend (Cloudflare Pages)

The frontend is a static React + Vite app designed for deployment on Cloudflare Pages.

### Local Development

To run the frontend locally:

```bash
# Navigate to the project root
cd /path/to/your/project

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

This will start the development server, typically accessible at `http://localhost:5173`.

### Building for Production

To build the frontend for production deployment:

```bash
# Navigate to the project root
cd /path/to/your/project

# Build for production
pnpm run build
```

This command will create a `dist` directory containing the optimized static assets ready for deployment.

### Deployment on Cloudflare Pages

To deploy this frontend to Cloudflare Pages:

1.  **Connect to Git**: In your Cloudflare dashboard, navigate to Workers & Pages and create a new project. Connect it to your GitHub repository (`sansoe2022/2d3dmm`).
2.  **Build Settings**: Configure the build settings as follows:
    *   **Framework preset**: `Vite`
    *   **Build command**: `pnpm run build` (or `npm run build` if you use npm)
    *   **Publish directory**: `dist`
3.  **Environment Variables**: This frontend is designed to work offline. If you decide to integrate with a custom backend later, you would add a `VITE_API_URL` environment variable here, pointing to your backend's URL.
4.  **Save and Deploy**: Save your configuration and Cloudflare Pages will automatically build and deploy your frontend.

---

## Project Structure

```
./
├── client/src/          # React frontend source code
│   ├── pages/           # Main application pages
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Contexts for state management
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions and API client (currently offline-focused)
├── public/              # Static assets
├── package.json         # Project dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

---

## License

MIT
