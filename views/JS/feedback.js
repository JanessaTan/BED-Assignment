/* Student ID - S10275480F 
Student Name -Nicole Agnes Sim Hui En */

/* assets/js/feedback.js */
(function() {
  // Populate stall dropdown
  const stallSelect = document.getElementById('stallSelect');
  
  if (typeof STALLS !== 'undefined') {
    STALLS.forEach(stall => {
      const option = document.createElement('option');
      option.value = stall.id;
      option.textContent = stall.name;
      stallSelect.appendChild(option);
    });
  } else {
    console.error('STALLS data not loaded!');
  }
  
  // Character counter for feedback message
  const feedbackMessage = document.getElementById('feedbackMessage');
  const charCount = document.getElementById('feedbackCharCount');
  
  if (feedbackMessage && charCount) {
    feedbackMessage.addEventListener('input', function() {
      const length = this.value.length;
      charCount.textContent = `${length}/500 characters`;
      
      // Change color when approaching limit
      if (length > 450) {
        charCount.style.color = 'var(--warn)';
      } else {
        charCount.style.color = 'var(--muted)';
      }
    });
  }
  
  // Form submission handler
  const form = document.getElementById('feedbackForm');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      console.log('Form submitted!'); // Debug
      
      // Get all form values
      const feedbackType = document.querySelector('input[name="feedbackType"]:checked').value;
      const name = document.getElementById('userName').value.trim();
      const email = document.getElementById('userEmail').value.trim();
      const stall = stallSelect.value;
      const message = feedbackMessage.value.trim();
      
      // Validate required message field
      if (!message) {
        alert('Please enter your feedback message.');
        feedbackMessage.focus();
        return;
      }
      
      // Create feedback object (NO RATING)
      const feedback = {
        type: feedbackType,
        name: name || 'Anonymous',
        email: email || 'Not provided',
        stallId: stall || 'General',
        message: message,
        timestamp: new Date().toISOString()
      };
      
      console.log('Feedback object:', feedback); // Debug
      
      // Save to localStorage
      if (typeof store !== 'undefined') {
        const feedbackList = store.get('feedbackList', []);
        feedbackList.push(feedback);
        store.set('feedbackList', feedbackList);
        console.log('Saved to localStorage'); // Debug
      } else {
        console.error('Store not available!');
      }
      
      // Show success message
      alert('✓ Thank you for your feedback! We appreciate your input and will use it to improve our service.');
      
      // Redirect to home page
      location.href = 'home.html';
    });
  }
})();