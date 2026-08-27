// Central place for the backend URL.
// Locally, Vite falls back to your local FastAPI server.
// In production (Vercel), set VITE_API_BASE in the frontend project's
// Environment Variables to your deployed backend's URL, e.g.
// https://your-backend-project.vercel.app
const productionApi = "https://invoice-generator-liart-three.vercel.app";

export const API_BASE =
	import.meta.env.VITE_API_BASE ||
	(import.meta.env.PROD ? productionApi : "http://127.0.0.1:8000");
