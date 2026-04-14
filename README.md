<div align="center">
<img width="1200" height="475" alt="AidConnect Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AidConnect - Decentralized Trust Protocol

A fully working, intent-based charity platform with complete backend, database, and API.

## Features Completed ✅
- **Database Schema**: Full SQLite database tracking Users, Requests, Donations, Items, and Vendors.
- **Node.js Express Backend**: Secure API handling authentication, donations, and direct item fulfillment.
- **Clean Architecture Frontend**: Vite + React frontend synchronized locally via Contexts and fetch calls.
- **UPI Payment Flow**: Full modal support and transaction processing logic.
- **Vendor Fulfillment System**: Supply physical goods without handling money.

## Run Locally

**Prerequisites:** Node.js (v18+)

### Step 1: Start the Backend Server
This will initialize the local `database.sqlite` and expose the REST APIs.
Open a terminal and run:
\`\`\`bash
1. npm install
2. node server/index.js
\`\`\`
*The server will start on http://localhost:3001*

### Step 2: Start the Frontend App
Open a **second** terminal and run:
\`\`\`bash
npm run dev
\`\`\`

### API Documentation
To review all endpoints, refer to [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Final Notes
The project is strictly self-contained. The local SQLite database has been seeded with demo users and requests for immediate testing out of the box!
