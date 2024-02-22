import axios from 'axios';
import config from '../config/config.js';

const BASE_URL = config.WA_BASE_URL;
const AUTH_URL = config.WA_AUTH_URL;
const CLIENT_ID = config.WA_Client_Id;
const CLIENT_SECRET = config.WA_Client_Secret;

// Function to get authentication token
async function getAuthToken() {
  try {
    const response = await axios.post(
      AUTH_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'auto'
      }),
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`APIKEY:${config.WA_api_key}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching authentication token:', error.message);
    throw error;
  }
}

// Function to get list of accounts available
async function getAccounts() {
  try {
    const authToken = await getAuthToken();
    const response = await axios.get(`${BASE_URL}/accounts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error.message);
    throw error;
  }
}

// Function to get details of a specific account
async function getAccountDetails(accountId) {
  try {
    const authToken = await getAuthToken();
    const response = await axios.get(`${BASE_URL}/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching account details:', error.message);
    throw error;
  }
}

// Function to get contacts list for a specific account
async function getContacts(accountId) {
  try {
    const authToken = await getAuthToken();
    const response = await axios.get(`${BASE_URL}/accounts/${accountId}/contacts?%24async=false`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error.message);
    throw error;
  }
}

// Function to get details of a specific contact for a specific account
async function getContactDetails(accountId, contactId) {
  try {
    const authToken = await getAuthToken();
    const response = await axios.get(`${BASE_URL}/accounts/${accountId}/contacts/${contactId}?getExtendedMembershipInfo=true`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching contact details:', error.message);
    throw error;
  }
}

// Function to get the account ID
const getAccountId = async (token) => {
    try {
      const response = await axios.get(`${BASE_URL}/accounts/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data[0].Id; // Assuming the first account ID is used
    } catch (error) {
      console.error('Error getting account ID:', error);
    //   throw error;
    }
  };

const fetchContactDetails = async (contactId) => {
    try {
      const authToken = await getAuthToken();
      const accountId = await getAccountId(authToken);
      const contactDetails = await getContactDetails(authToken, accountId, contactId);
      console.log('Contact details:', contactDetails);
      return contactDetails;
    } catch (error) {
      console.error('Error fetching contact details:', error);
    //   throw error;
    }
  };

export { getAuthToken, getAccounts, getAccountDetails, getContacts, getContactDetails, fetchContactDetails };
