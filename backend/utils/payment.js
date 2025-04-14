const dotenv = require('dotenv')
dotenv.config()
const axios = require('axios')




// Function to generate a timestamp (format: YYYYMMDDHHmmss)
const generateTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };


// Function to generate an access token
const generateAccessToken = async (consumerKey, consumerSecret) => {
    try {
      const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        auth: {
          username: consumerKey,
          password: consumerSecret,
        },
      });
      return response.data.access_token;
    } catch (error) {
      throw error;
    }
  };
        

// Function to initiate the Lipa Na M-Pesa payment
const initiatePayment = async (phoneNumber, amount,studentID) => {
    try {
        const consumerKey = process.env.CONSUMER_KEY;
        const consumerSecret = process.env.CONSUMER_SECRET;
        const shortcode = process.env.SHORT_CODE;
        const timestamp = generateTimestamp();
        const passkey = process.env.PASS_KEY;
        const password = btoa(shortcode + passkey + timestamp); // Generate this using Daraja documentation
        // Generate an access token for authentication
        const accessToken = await generateAccessToken(consumerKey, consumerSecret);

        // Create the payment request
        const paymentRequest = {
        BusinessShortCode: shortcode,
        Password: password, // Generate this using Daraja documentation
        Timestamp: timestamp, // Format: YYYYMMDDHHmmss
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber, // Customer's phone number
        PartyB: shortcode, // Business short code
        PhoneNumber: phoneNumber,
        CallBackURL: 'https://student-clearance.onrender.com/api/payment/callback', // Your callback URL
        AccountReference: studentID, // Account reference (e.g., student ID)
        TransactionDesc: 'Payment for Order',
        };


      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        paymentRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
}


module.exports = { 
    initiatePayment,
}

