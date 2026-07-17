/* Student ID - S10275480F 
Student Name -Nicole Agnes Sim Hui En */

// Contact Form Handler - Lets customers send messages to the hawker centre management
(function() {
  // Get references to the contact form and its fields
  const form = document.getElementById('contactForm');
  const messageField = document.getElementById('contactMessage');
  const charCount = document.getElementById('contactCharCount');
  
  // Show character count and warn when getting close to the 1000 character limit
  messageField.addEventListener('input', function() {
    const length = this.value.length;
    charCount.textContent = `${length}/1000 characters`;
    
    // Change color to orange when they're typing too much
    if (length > 900) {
      charCount.style.color = 'var(--warn)';
    } else {
      charCount.style.color = 'var(--muted)';
    }
  });
  
  // Handle when the customer clicks the submit button
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get all the information the customer typed
    const reason = document.getElementById('contactReason').value;
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const message = messageField.value.trim();
    const method = document.querySelector('input[name="contactMethod"]:checked').value;
    
    // Check that all required fields have something in them
    if (!reason || !name || !email || !message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Make sure the email they typed looks like a real email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      document.getElementById('contactEmail').focus();
      return;
    }
    
    // If they chose "contact by phone", make sure they gave us a phone number
    if (method === 'phone' && !phone) {
      alert('Please provide a phone number if you prefer to be contacted by phone.');
      document.getElementById('contactPhone').focus();
      return;
    }
    
    // Bundle all the information into one object
    const contact = {
      reason: reason,
      name: name,
      email: email,
      phone: phone || 'Not provided',
      message: message,
      contactMethod: method,
      timestamp: new Date().toISOString()
    };
    
    // Save the contact message to browser storage so it's not lost
    const contactList = store.get('contactList', []);
    contactList.push(contact);
    store.set('contactList', contactList);

    // Tell the customer we got their message
    alert('✓ Thank you for contacting us! We will get back to you within 1-2 business days.');

    // Go back to home page after 2 seconds
    setTimeout(function() {
        location.href = 'home.html';
    }, 2000);
});
  
  // When customer clears the form, reset the character counter display too
  form.addEventListener('reset', function() {
    charCount.textContent = '0/1000 characters';
    charCount.style.color = 'var(--muted)';
  });
})();