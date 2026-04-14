# AidConnect - API Documentation

This application uses a local Express.js API connected to a SQLite database (`server/database.sqlite`).

## Base URL
\`http://localhost:3001/api\`

---

### Authentication

**POST `/auth/login`**
Logs in a user based on their role.
- **Body:** `{ "role": "donor" | "requester" | "eyewitness" }`
- **Response:** `{ "token": "mock-token", "user": { ... } }`

**POST `/auth/register`**
Registers a new user and auto-login.
- **Body:** `{ "email": "", "password": "", "firstName": "", "lastName": "", "phone": "" }`
- **Response:** `{ "token": "...", "user": { ... } }`

---

### Requests & Needs

**GET `/requests`**
Retrieves all charity requests, including fulfilled items.
- **Response:** `[ { "id": "...", "title": "...", "neededItems": [...], "proofUrls": [...] } ]`

**POST `/requests`**
Creates a new charity request.
- **Body:** 
\`\`\`json
{
  "requesterId": "user_id",
  "requesterName": "Name",
  "title": "Title",
  "description": "Desc",
  "category": "Food",
  "targetAmount": 1000,
  "urgency": "High",
  "location": { "lat": 12.0, "lng": 77.0, "address": "Address" },
  "proofUrls": ["url1"],
  "neededItems": [ { "name": "Kit", "total": 10 } ]
}
\`\`\`

---

### Donations & Fulfillment

**POST `/donations`**
Records a monetary donation to a particular request via UPI simulation.
- **Body:** `{ "requestId": "req_1", "donorId": "user_1", "donorName": "Name", "amount": 500, "transactionId": "TXN_123" }`

**POST `/fulfill`**
Fulfils a specific physical item directly (Vendor delivery or self delivery).
- **Body:** `{ "requestId": "req_1", "itemName": "Kit", "amount": 1 }`

**GET `/vendors`**
Gets the list of available local vendors for purchasing needs directly.
- **Response:** `[ { "id": "vendor_1", "items": [...] } ]`
