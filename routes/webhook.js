// webhook.js webhook route
import express from 'express';

const router = express.Router();

// Route to handle webhook requests
router.post('/', (req, res) => {
  try {
    console.log('Received webhook payload:', req.body);
    // Extract data from the webhook payload
    const { MessageType, Parameters } = req.body;
    const { Action, 'Contact.Id': contactId, 'Membership.LevelId': levelId, 'Membership.Status': status } = Parameters;

    // Process the webhook payload based on the MessageType and Action
    if (MessageType === 'Membership') {
      switch (Action) {
        case 'Enabled':
          handleMembershipEnabled(contactId, levelId, status);
          break;
        case 'Disabled':
          handleMembershipDisabled(contactId, levelId, status);
          break;
        case 'StatusChanged':
          handleMembershipStatusChanged(contactId, levelId, status);
          break;
        case 'RenewalDateChanged':
          handleRenewalDateChanged(contactId, levelId, status);
          break;
        case 'LevelChanged':
          handleMembershipLevelChanged(contactId, levelId, status);
          break;
        default:
          console.log('Unhandled action:', Action);
      }
    } else {
      console.log('Unhandled message type:', MessageType);
    }

    // Send response indicating successful receipt of webhook
    res.status(200).send('Webhook received successfully');
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Error handling webhook');
  }
});

// Function to handle membership disabled
async function handleMembershipDisabled(accountId, contactId) {
  try {
    // Logic to handle membership disabled
    // Set isActive to false
    const updatedMember = await Member.findByIdAndUpdate(contactId, { isActive: false }, { new: true });
    console.log(`Member account ${contactId} deactivated successfully.`);
    return updatedMember;
  } catch (error) {
    console.error(`Error deactivating member account ${contactId}: ${error.message}`);
    throw error;
  }
}

// Function to handle membership enabled
async function handleMembershipEnabled(accountId, contactId, membershipStatus) {
  try {
    // Logic to handle membership enabled
    // For statuses other than "Disabled", set isActive to true
    if (membershipStatus !== 2) { // Assuming 2 represents "Lapsed" status
      const updatedMember = await Member.findByIdAndUpdate(contactId, { isActive: true }, { new: true });
      console.log(`Member account ${contactId} activated successfully.`);
      return updatedMember;
    }
  } catch (error) {
    console.error(`Error activating member account ${contactId}: ${error.message}`);
    throw error;
  }
}

function handleMembershipStatusChanged(contactId, levelId, status) {
  // logic to handle membership status change
  console.log(`Membership status changed for contact ${contactId}: LevelId - ${levelId}, Status - ${status}`);
}

function handleRenewalDateChanged(contactId, levelId, status) {
  // logic to handle renewal date change
  console.log(`Renewal date changed for contact ${contactId}: LevelId - ${levelId}, Status - ${status}`);
}

function handleMembershipLevelChanged(contactId, levelId, status) {
  // logic to handle membership level change
  console.log(`Membership level changed for contact ${contactId}: LevelId - ${levelId}, Status - ${status}`);
}

export default router;
