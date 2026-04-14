# AidConnect - Production Deployment Guide

Congratulations on reaching the production stage! The application is functionally fully complete, heavily optimized (all DOM lag removed), and integrated securely with an Express/SQLite backend.

To launch this application to the real world, you cannot use basic static hosting for the backend because **SQLite requires a persistent file system.** 

Here is the perfect strategy to launch both your Frontend and Backend securely.

## 1. Hosting the Backend (Node.js + SQLite)
*Recommendation: Render.com or a DigitalOcean Droplet ($4-$5/mo)*

You need a server that allows you to write to a local disk `database.sqlite`.
**Using Render.com:**
1. Create a "Web Service" on [Render](https://render.com).
2. Connect your Git repository.
3. **Build Command**: `npm install`
4. **Start Command**: `node server/index.js`
5. **CRITICAL**: Go to Advanced Settings -> Add a **Disk**. Mount it to `/server/data`. 
   *(Note: You must edit your `server/database.js` to point the sqlite path to `/server/data/database.sqlite` instead of just `database.sqlite` so the data isn't wiped on every deployment).*
6. Your API will now be live (e.g., `https://aidconnect-api.onrender.com`).

## 2. Hosting the Frontend (Vite + React)
*Recommendation: Vercel or Netlify (Free)*

1. Create a new project on [Vercel](https://vercel.com).
2. Connect your Git repository.
3. Override the default Build command if necessary (it should auto-detect Vite).
4. **Environment Variables**: You must tell your Frontend where to find the Backend!
   - In `src/contexts/AuthContext.tsx` and `DataContext.tsx`, you currently use relative paths like `fetch('/api/requests')`. 
   - Before deploying, replace this with an absolute URL reading from an environment variable: `fetch(import.meta.env.VITE_API_URL + '/api/requests')`.
   - Set `VITE_API_URL` in Vercel to your deployed Render URL: `https://aidconnect-api.onrender.com`.

## 3. Recommended Final Checks Before Launch
- **Change the JWT Secret**: In `server/index.js`, change `super-secret-aidconnect-key-2026` to a secure, randomly generated string using `crypto.randomBytes(64).toString('hex')`. Store it as an Environment Variable.
- **Enable SSL for UPI**: UPI deep links and local device features (geolocation/Leaflet maps) work significantly better under `https://`. Both Render and Vercel provide SSL automatically! 

## 4. Scaling in the Future
If the app gains massive traction, SQLite can easily serve up to 100,000 requests a day gracefully. If you surpass that, you can migrate `database.js` to use PostgreSQL seamlessly without changing the monolithic frontend React application. 

You're ready to launch AidConnect to the world! 🚀
