// webhook.js webhook route
import express from 'express';

const router = express.Router();

// Route to handle webhook requests
router.post('/', async (req, res) => {
  try {
    console.log('Received webhook payload:', req.body);
    // Extract data from the webhook payload
    const { MessageType, Parameters } = req.body;
    const { Action, 'Contact.Id': contactId, 'Membership.LevelId': levelId, 'Membership.Status': status } = Parameters;

    //----------------------------------------------------------------------------------------------------------------------//
    // Type :- Membership
    // Parameters:- Action: [Enabled | Disabled | StatusChanged | RenewalDateChanged | LevelChanged ],
    // Contact.Id,
    // Membership.LevelId,
    // Membership.Status :[1 = Active, 2 = Lapsed, 3 = PendingRenewal, 20 = PendingNew, 30 = PendingUpgrade]
    //-----------------------------------------------------------------------------------------------------------------------//

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
          await handleMembershipStatusChanged(contactId, levelId, status);
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

// Function to handle membership status changed
async function handleMembershipStatusChanged(contactId, levelId, status) {
  try {
    // Fetch contact details from the third-party service
    const contactDetails = await fetchContactDetails(contactId); // Implement this method to fetch contact details

    // Check if the member already exists in the database
    let existingMember = await Member.findById(contactId);

    if (!existingMember) {
      // Member does not exist, insert into the database
      const newMemberData = {
        _id: contactId, // Set contactId (of wild apricot) as the _id in registry data.
        // Populate other member details from the contactDetails
        firstName: contactDetails.FirstName,
        lastName: contactDetails.LastName,
        email: contactDetails.Email,
        mobile: contactDetails.Phone, // Assuming Phone field contains mobile number
        isActive: status === 1 ? true : false // Set isActive based on Membership Status
      };

      const newMember = new Member(newMemberData);
      await newMember.save();
      console.log(`New member added to registry: ${newMember}`);
    } else {
      console.log('Member already exists in the registry:', existingMember);
    }
  } catch (error) {
    console.error(`Error handling membership status change for contact ${contactId}: ${error.message}`);
    throw error;
  }
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
