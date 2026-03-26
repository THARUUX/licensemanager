License Manager Integration Guide
This guide explains how to connect your software systems (LMS, SMS, ERP, etc.) to the central License Manager to validate license keys and fetch metadata.

1. Authentication & Endpoint
Your software should make a GET request to the following endpoint:

http://[YOUR_SERVER_IP]:4000/api/validate?key=[LICENSE_KEY]

2. Response Interpretation
The API returns a JSON object. You should check the valid field first.

Scenario: Key is Valid
If valid: true, your system can use the provided metadata.

json
{
  "valid": true,
  "duration_days": 365,
  "next_payment_date": "2026-12-31",
  "client_name": "ABC Corp",
  "system_name": "LMS",
  "payment_terms": "Yearly"
}
Scenario: Key is Not Valid
If valid: false, check the reason field:

invalid_key: The key does not exist.
revoked: Technical access has been manually disabled.
expired: Subscription has ended (payment required).
json
{ "valid": false, "reason": "expired", "details": "Payment date has passed." }
3. Code Examples
JavaScript (Node.js/Frontend)
javascript
async function checkLicense(key) {
  try {
    const response = await fetch(`http://localhost:4000/api/validate?key=${key}`);
    const data = await response.json();
    
    if (data.valid) {
      console.log(`Success! License for ${data.client_name} is active.`);
    } else {
      console.error(`License check failed: ${data.reason}`);
    }
  } catch (err) {
    console.error("Connection error to License Manager.");
  }
}
Python
python
import requests
def validate_license(key):
    url = f"http://localhost:4000/api/validate?key={key}"
    try:
        response = requests.get(url)
        data = response.json()
        
        if data.get('valid'):
            print(f"Verified for client: {data.get('client_name')}")
            return True
        else:
            print(f"Access Denied: {data.get('reason')}")
            return False
    except requests.exceptions.RequestException:
        print("Could not reach License Manager.")
        return False
