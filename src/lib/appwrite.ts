import { Client, Account, OAuthProvider } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69db91100005d8796634');

const account = new Account(client);

export { client, account, OAuthProvider };
