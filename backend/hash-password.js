/**
 * Utility script to generate a bcrypt hash for a password
 * 
 * Usage: node hash-password.js
 * 
 * This will generate a bcrypt hash for the password 'password123'
 * which can be used in the mock data for testing.
 */

const bcrypt = require('bcryptjs');

const password = 'password123';
const saltRounds = 10;

// Generate salt and hash
bcrypt.genSalt(saltRounds, (err, salt) => {
  if (err) {
    console.error('Error generating salt:', err);
    return;
  }
  
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err);
      return;
    }
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Verify the hash works
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        console.error('Error verifying hash:', err);
        return;
      }
      
      console.log('Verification result:', result); // Should be true
    });
  });
});
