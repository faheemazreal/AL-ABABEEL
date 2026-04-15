import { Client, Account, OAuthProvider, Databases, Storage, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69db91100005d8796634');

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export { client, account, databases, storage, OAuthProvider, ID };
